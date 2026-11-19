import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import { fetchCampuses } from "../api/campus.api";
import { fetchDepartments } from "../api/department.api";
import {
  fetchAllocationBatches,
  fetchBatchExceptions,
  resolveException,
} from "../api/allocation.api";
import { Campus } from "../types/campus";
import { Department } from "../types/department";
import {
  AllocationBatch,
  AllocationException,
  ResolveExceptionPayload,
} from "../types/allocation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  X,
  ShieldAlert,
  ArrowLeft,
  Filter,
  Check,
  PauseCircle,
  HelpCircle,
} from "lucide-react";

export const AllocationExceptionsPage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const initialBatchId = searchParams.get("batchId") || "";

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [batches, setBatches] = useState<AllocationBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [exceptions, setExceptions] = useState<AllocationException[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Resolution Modal
  const [selectedException, setSelectedException] = useState<AllocationException | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"ASSIGN" | "OVERRIDE" | "HOLD">("ASSIGN");
  const [targetDeptId, setTargetDeptId] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load campuses
  useEffect(() => {
    async function init() {
      if (!token) return;
      try {
        const cList = await fetchCampuses(token);
        setCampuses(cList);
        if (cList.length > 0) {
          setSelectedCampusId(cList[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading campuses");
      }
    }
    init();
  }, [token]);

  // Load batches and departments
  useEffect(() => {
    async function loadBatchesAndDepts() {
      if (!token || !selectedCampusId) return;
      try {
        const [batchList, deptList] = await Promise.all([
          fetchAllocationBatches(token, selectedCampusId),
          fetchDepartments(token, selectedCampusId),
        ]);
        setBatches(batchList);
        setDepartments(deptList);

        if (!selectedBatchId && batchList.length > 0) {
          setSelectedBatchId(batchList[0].id);
        }
      } catch (err: unknown) {
        console.error("Error loading batches:", err);
      }
    }
    loadBatchesAndDepts();
  }, [token, selectedCampusId]);

  // Load exceptions
  const loadExceptions = async () => {
    if (!token || !selectedBatchId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchBatchExceptions(
        selectedBatchId,
        statusFilter === "ALL" ? undefined : statusFilter,
        token
      );
      setExceptions(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading exceptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExceptions();
  }, [token, selectedBatchId, statusFilter]);

  // Handle Resolution Submit
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedException) return;
    setResolving(true);
    setError(null);

    try {
      await resolveException(
        selectedException.id,
        {
          action: resolutionAction,
          departmentId: resolutionAction !== "HOLD" ? targetDeptId : undefined,
          justification,
        },
        token
      );

      setSelectedException(null);
      setJustification("");
      setSuccessMsg("Exception successfully resolved with recorded audit justification.");
      await loadExceptions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resolve exception");
    } finally {
      setResolving(false);
    }
  };

  const pendingCount = exceptions.filter((e) => e.resolutionStatus === "PENDING").length;
  const resolvedCount = exceptions.filter((e) => e.resolutionStatus === "RESOLVED").length;
  const holdCount = exceptions.filter((e) => e.resolutionStatus === "ON_HOLD").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/allocation"
              className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Allocation Engine</span>
            </Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Allocation Exception Management Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated Admin review queue: review unresolved member placements, grant overrides, and record audited decisions.
          </p>
        </div>

        {/* Batch / Campus Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Building2 className="w-4 h-4 text-blue-900" />
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="font-bold text-blue-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <span className="font-semibold text-slate-500">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.cycleName} ({b.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Exception Counter Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "PENDING"
              ? "bg-amber-50 border-amber-300 shadow-sm"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-700">Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</div>
          <p className="text-[11px] text-amber-700 mt-1">Blocks final approval until resolved</p>
        </button>

        <button
          onClick={() => setStatusFilter("RESOLVED")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "RESOLVED"
              ? "bg-emerald-50 border-emerald-300 shadow-sm"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Resolved Placements</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{resolvedCount}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Manual assignments or overrides committed</p>
        </button>

        <button
          onClick={() => setStatusFilter("ON_HOLD")}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === "ON_HOLD"
              ? "bg-purple-50 border-purple-300 shadow-sm"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-purple-700">Administrative Hold</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-1">{holdCount}</div>
          <p className="text-[11px] text-purple-700 mt-1">Documented hold justifications</p>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900"
          >
            <option value="ALL">All Exceptions</option>
            <option value="PENDING">Pending Review Only</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="ON_HOLD">On Hold Only</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Showing {exceptions.length} exception records
        </span>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading exceptions...</div>
        ) : exceptions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No exceptions found under the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-5 py-3 w-12 text-center text-cyan-600 font-bold">ተ.ቁ</th>
                  <th className="px-5 py-3">Member Details</th>
                  <th className="px-5 py-3">Exception Type</th>
                  <th className="px-5 py-3">System Reason</th>
                  <th className="px-5 py-3">Eligible Departments</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map((ex, idx) => (
                  <tr key={ex.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{ex.memberName}</div>
                      <div className="font-mono text-[11px] text-blue-900">{ex.memberCode}</div>
                      <div className="text-[10px] text-slate-400">{ex.gender}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ex.exceptionType === "NO_ELIGIBLE_DEPARTMENT"
                            ? "bg-rose-100 text-rose-800"
                            : ex.exceptionType === "CAPACITY_EXCEEDED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {ex.exceptionType}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 max-w-xs text-[11px]">
                      {ex.reason}
                    </td>

                    <td className="px-5 py-3.5">
                      {ex.eligibleDepartments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ex.eligibleDepartments.map((d) => (
                            <span
                              key={d.id}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-mono text-[10px] font-bold border border-blue-200"
                            >
                              {d.code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None eligible</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          ex.resolutionStatus === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : ex.resolutionStatus === "ON_HOLD"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800 animate-pulse"
                        }`}
                      >
                        {ex.resolutionStatus === "RESOLVED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : ex.resolutionStatus === "ON_HOLD" ? (
                          <PauseCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {ex.resolutionStatus}
                      </span>

                      {ex.resolvedDepartmentName && (
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          Assigned to: {ex.resolvedDepartmentName}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {hasPermission("allocation.override") && (
                        <button
                          onClick={() => {
                            setSelectedException(ex);
                            setTargetDeptId(ex.eligibleDepartments[0]?.id || departments[0]?.id || "");
                            setResolutionAction(ex.eligibleDepartments.length > 0 ? "ASSIGN" : "OVERRIDE");
                            setJustification("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-[11px] shadow-sm transition"
                        >
                          {ex.resolutionStatus === "PENDING" ? "Resolve Exception" : "Re-evaluate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exception Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">Resolve Member Exception</h3>
                <p className="text-xs text-slate-500">
                  Member: <strong className="text-slate-900">{selectedException.memberName}</strong> (
                  <span className="font-mono">{selectedException.memberCode}</span>)
                </p>
              </div>
              <button
                onClick={() => setSelectedException(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="p-6 space-y-4 text-xs">
              {/* Exception Detail Box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Exception Type: {selectedException.exceptionType}
                </span>
                <p className="text-amber-900">{selectedException.reason}</p>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Select Administrative Action *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionAction("ASSIGN")}
                    className={`p-2.5 rounded-xl border font-semibold text-xs text-center transition ${
                      resolutionAction === "ASSIGN"
                        ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Assign Eligible
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("OVERRIDE")}
                    className={`p-2.5 rounded-xl border font-semibold text-xs text-center transition ${
                      resolutionAction === "OVERRIDE"
                        ? "bg-purple-900 text-white border-purple-900 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Grant Override
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("HOLD")}
                    className={`p-2.5 rounded-xl border font-semibold text-xs text-center transition ${
                      resolutionAction === "HOLD"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Place On Hold
                  </button>
                </div>
              </div>

              {/* Department Choice (If not HOLD) */}
              {resolutionAction !== "HOLD" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                    Target Department *
                  </label>
                  <select
                    value={targetDeptId}
                    onChange={(e) => setTargetDeptId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) · Capacity: {d.capacity}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mandatory Justification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Documented Justification Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the exact administrative rationale for this decision (audited for compliance)..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Mandatory under Business Rule 12: Manual overrides require documented justification.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedException(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || !justification.trim()}
                  className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {resolving ? "Recording Decision..." : "Commit Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

