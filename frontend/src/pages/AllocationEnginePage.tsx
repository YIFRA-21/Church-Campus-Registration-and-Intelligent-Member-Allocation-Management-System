import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import {
  runAllocation,
  fetchAllocationBatches,
  fetchBatchAllocations,
  fetchBatchExceptions,
  approveAllocationBatch,
} from "../api/allocation.api";
import { Campus } from "../types/campus";
import {
  AllocationBatch,
  MemberAllocation,
  AllocationException,
} from "../types/allocation";
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

export const AllocationEnginePage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [cycleName, setCycleName] = useState("2026/2027 Main Campus Annual Allocation");

  const [batches, setBatches] = useState<AllocationBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<AllocationBatch | null>(null);
  const [allocations, setAllocations] = useState<MemberAllocation[]>([]);
  const [pendingExceptionsCount, setPendingExceptionsCount] = useState<number>(0);

  const [running, setRunning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Load batches for campus
  const loadBatches = async () => {
    if (!token || !selectedCampusId) return;
    setLoading(true);
    try {
      const list = await fetchAllocationBatches(token, selectedCampusId);
      setBatches(list);
      if (list.length > 0) {
        setSelectedBatch(list[0]);
      } else {
        setSelectedBatch(null);
        setAllocations([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [token, selectedCampusId]);

  // Load allocations & exceptions when selectedBatch changes
  useEffect(() => {
    async function loadBatchDetails() {
      if (!token || !selectedBatch) return;
      try {
        const [allocs, exceptions] = await Promise.all([
          fetchBatchAllocations(selectedBatch.id, token),
          fetchBatchExceptions(selectedBatch.id, "PENDING", token),
        ]);
        setAllocations(allocs);
        setPendingExceptionsCount(exceptions.length);
      } catch (err: unknown) {
        console.error("Error loading batch details:", err);
      }
    }
    loadBatchDetails();
  }, [token, selectedBatch]);

  // Execute allocation
  const handleRunAllocation = async () => {
    if (!token || !selectedCampusId) return;
    setRunning(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const batch = await runAllocation({ campusId: selectedCampusId, cycleName }, token);
      setSuccessMsg(
        `Allocation completed! ${batch.allocatedCount} members proposed, ${batch.exceptionCount} routed to review queue.`
      );
      await loadBatches();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Allocation engine execution failed");
    } finally {
      setRunning(false);
    }
  };

  // Final approval
  const handleApprove = async () => {
    if (!token || !selectedBatch) return;
    setApproving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const approved = await approveAllocationBatch(selectedBatch.id, token);
      setSelectedBatch(approved);
      setSuccessMsg(
        `Allocation batch officially approved! ${approved.allocatedCount} members successfully committed to departments.`
      );
      await loadBatches();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Final approval rejected");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner with Plexus Wave Texture */}
      <div
        className="rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden bg-cover bg-center flex flex-col md:flex-row md:items-center justify-between gap-5"
        style={{
          backgroundColor: "#020617",
          backgroundImage:
            "linear-gradient(135deg, rgba(2, 6, 23, 0.92) 0%, rgba(15, 23, 42, 0.88) 50%, rgba(30, 58, 138, 0.82) 100%), url('/assets/c-cimas-plexus-wave.jpg')",
          border: "1px solid rgba(59, 130, 246, 0.35)",
          boxShadow: "0 20px 25px -5px rgba(2, 6, 23, 0.5)",
        }}
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Option A: 100% Member Accounting Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Intelligent Member Allocation Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Multi-criteria deterministic allocation balancing department percentage targets, eligibility requirements, and capacity constraints.
          </p>
        </div>

        {/* Campus & Cycle Control */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-2 rounded-xl shadow backdrop-blur-md text-xs">
            <Building2 className="w-4 h-4 text-blue-400" />
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="font-bold text-white bg-transparent focus:outline-none cursor-pointer"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {hasPermission("allocation.run") && (
            <button
              onClick={handleRunAllocation}
              disabled={running}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition hover:scale-105 disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              <span>{running ? "Processing Engine..." : "Run Allocation"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </span>
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

      {/* Batch Selector Bar */}
      {batches.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-500">Allocation Cycle Batch:</span>
            <select
              value={selectedBatch?.id || ""}
              onChange={(e) => {
                const b = batches.find((item) => item.id === e.target.value);
                if (b) setSelectedBatch(b);
              }}
              className="font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.cycleName} ({b.status}) · {new Date(b.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedBatch?.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  : "bg-blue-100 text-blue-900 border border-blue-200"
              }`}
            >
              {selectedBatch?.status}
            </span>
            {selectedBatch?.approvedBy && (
              <span className="text-slate-400 text-[11px]">
                Approved by {selectedBatch.approvedBy} on {new Date(selectedBatch.approvedAt!).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {selectedBatch && (
        <>
          {/* Summary Cards: 100% Accounting (Option A) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pool Population</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{selectedBatch.totalMembers}</div>
              <p className="text-xs text-slate-500 mt-1">100% accounting: zero silent exclusions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">Allocated to Departments</span>
              <div className="text-2xl font-bold text-blue-900 mt-1">{selectedBatch.allocatedCount}</div>
              <p className="text-xs text-blue-700 mt-1">
                {Math.round((selectedBatch.allocatedCount / selectedBatch.totalMembers) * 100)}% distribution achieved
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Review Exceptions Queue</span>
                <div className="text-2xl font-bold text-amber-800 mt-1">{selectedBatch.exceptionCount}</div>
                <p className="text-xs text-amber-700 mt-1">Requires individual Admin decision</p>
              </div>

              {selectedBatch.exceptionCount > 0 && (
                <Link
                  to={`/exceptions?batchId=${selectedBatch.id}`}
                  className="mt-3 text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Resolve Exceptions ({pendingExceptionsCount} pending)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Target vs Actual Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Target Distribution vs Actual Placements</h3>
                <p className="text-xs text-slate-500">
                  Target calculation basis: CAMPUS_SHARE using Largest Remainder integer rounding.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Target %</th>
                    <th className="px-4 py-3">Target Quota</th>
                    <th className="px-4 py-3">Allocated Seats</th>
                    <th className="px-4 py-3">Fulfillment</th>
                    <th className="px-4 py-3">Capacity ($M_d$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBatch.targets.map((t) => {
                    const pctAchieved = t.targetCount > 0 ? Math.round((t.allocatedCount / t.targetCount) * 100) : 0;
                    return (
                      <tr key={t.departmentId} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-bold mr-2 border border-blue-200">
                            {t.departmentCode}
                          </span>
                          {t.departmentName}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{t.targetPercentage}%</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{t.targetCount}</td>
                        <td className="px-4 py-3 font-bold text-blue-900">{t.allocatedCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-900 rounded-full"
                                style={{ width: `${Math.min(pctAchieved, 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-slate-700">{pctAchieved}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{t.capacity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Exceptions Blocking Banner (Rule 13) */}
          {selectedBatch.status === "PREVIEW_READY" && pendingExceptionsCount > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="text-amber-900 block font-bold">
                    Approval Blocked by Business Rule 13: {pendingExceptionsCount} Unresolved Exceptions
                  </strong>
                  <span className="text-amber-800">
                    Final allocation cannot be committed while unresolved members remain in the review queue.
                  </span>
                </div>
              </div>

              <Link
                to={`/exceptions?batchId=${selectedBatch.id}`}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 transition"
              >
                Review Exceptions Dashboard
              </Link>
            </div>
          )}

          {/* Approval Action Bar */}
          {selectedBatch.status === "PREVIEW_READY" && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Final Allocation Approval</h4>
                <p className="text-xs text-slate-500">
                  Authoritative commit: assigning approved members to active department rosters.
                </p>
              </div>

              <button
                onClick={handleApprove}
                disabled={pendingExceptionsCount > 0 || approving}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md shadow-emerald-700/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{approving ? "Committing Final Allocation..." : "Approve Final Allocation"}</span>
              </button>
            </div>
          )}

          {/* Allocation Proposal Roster Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Proposed Member Department Allocations ({allocations.length})
              </h3>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Member ID</th>
                    <th className="px-4 py-2.5">Full Name</th>
                    <th className="px-4 py-2.5">Gender</th>
                    <th className="px-4 py-2.5">Assigned Department</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Explainability Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5 font-mono font-bold text-blue-900">{a.memberCode}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{a.memberName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.gender}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-900">{a.departmentName}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({a.departmentCode})</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.allocationMethod === "MANUAL_OVERRIDE"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {a.allocationMethod}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[10px]">
                        {a.overrideReason ? `Override: ${a.overrideReason}` : a.reasonCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

