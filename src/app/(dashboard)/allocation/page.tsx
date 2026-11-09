"use client";

import React, { useState, useEffect } from "react";
import {
  GitMerge,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
  Info,
  History,
  ShieldCheck,
} from "lucide-react";

interface Proposal {
  id: string;
  memberId: string;
  departmentId: string;
  reasonCode: string;
  reasonDetail: string;
  status: string;
  member: {
    id: string;
    registrationNo: string;
    fullName: string;
    gender: string;
    category: string;
    isDeacon: boolean;
    phoneNumber: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
    targetPercent: number;
    maxCapacity: number;
  };
}

interface ExceptionItem {
  id: string;
  memberId: string;
  reasonCode: string;
  reasonDetail: string;
  reviewed: boolean;
  member: {
    id: string;
    registrationNo: string;
    fullName: string;
    gender: string;
    category: string;
    isDeacon: boolean;
    phoneNumber: string;
  };
}

interface BatchDetail {
  id: string;
  batchNumber: string;
  status: string;
  calculationMeta: Record<
    string,
    {
      departmentName: string;
      eligibleCount: number;
      targetPercent: number;
      calculatedTarget: number;
      maxCapacity: number;
      allocatedInProposal: number;
      targetStatus: string;
    }
  > | null;
  createdAt: string;
  creator: { fullName: string; email: string };
  approver?: { fullName: string; email: string } | null;
  approvalNotes?: string | null;
  committedAt?: string | null;
  proposals: Proposal[];
  exceptions: ExceptionItem[];
}

export default function AllocationSuitePage() {
  const [batches, setBatches] = useState<{ id: string; batchNumber: string; status: string; createdAt: string }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningEngine, setRunningEngine] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"proposals" | "exceptions">("proposals");
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadBatches() {
    try {
      const res = await fetch("/api/allocation/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
        if (data.batches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(data.batches[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadBatchDetail(batchId: string) {
    try {
      const res = await fetch(`/api/allocation/batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setBatchData(data.batch);
        setExcludedIds([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadBatchDetail(selectedBatchId);
    }
  }, [selectedBatchId]);

  async function handleRunNewAllocation() {
    setRunningEngine(true);
    setNotification(null);
    try {
      const res = await fetch("/api/allocation/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to run allocation engine");
      }

      setNotification({
        type: "success",
        text: `New allocation batch ${data.batchNumber} generated! Proposals are ready for your review.`,
      });

      await loadBatches();
      setSelectedBatchId(data.batchId);
    } catch (err: unknown) {
      setNotification({
        type: "error",
        text: err instanceof Error ? err.message : "Error executing allocation engine",
      });
    } finally {
      setRunningEngine(false);
    }
  }

  async function handleApproveBatch() {
    if (!batchData) return;
    if (!confirm(`Are you sure you want to approve and commit ${batchData.proposals.length - excludedIds.length} allocations to active assignments?`)) {
      return;
    }

    setActionLoading(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/allocation/batches/${batchData.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalNotes: "Batch authorized and committed by campus administrator.",
          excludedProposalIds: excludedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit batch");
      }

      setNotification({
        type: "success",
        text: data.message || "Batch successfully committed!",
      });

      await loadBatches();
      loadBatchDetail(batchData.id);
    } catch (err: unknown) {
      setNotification({
        type: "error",
        text: err instanceof Error ? err.message : "Approval error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectBatch() {
    if (!batchData) return;
    const reason = prompt("Enter a reason for rejecting this allocation proposal:");
    if (reason === null) return; // user cancelled prompt

    setActionLoading(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/allocation/batches/${batchData.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason || "Proposal rejected by administrator." }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject batch");
      }

      setNotification({
        type: "success",
        text: data.message || "Proposal rejected. Active member assignments were preserved.",
      });

      await loadBatches();
      loadBatchDetail(batchData.id);
    } catch (err: unknown) {
      setNotification({
        type: "error",
        text: err instanceof Error ? err.message : "Rejection error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function toggleExclude(id: string) {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Run Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Intelligent Allocation Engine</h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
              BRS Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Autonomous rule evaluation across department targets, capacity ceilings, and member attributes.
            <strong> Proposals do not become active until approved by an administrator.</strong>
          </p>
        </div>

        <button
          onClick={handleRunNewAllocation}
          disabled={runningEngine}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0"
        >
          {runningEngine ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executing 9-Step Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Allocation Batch</span>
            </>
          )}
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Batch History Selector Bar */}
      {batches.length > 0 && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Select Batch:</span>
            <select
              value={selectedBatchId || ""}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-medium text-slate-800 focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} ({b.status}) - {new Date(b.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {batchData && (
            <div className="flex items-center gap-3">
              <span className="text-slate-500">
                Status:{" "}
                <strong
                  className={`px-2 py-0.5 rounded-full uppercase text-[10px] font-bold ${
                    batchData.status === "COMMITTED"
                      ? "bg-emerald-100 text-emerald-800"
                      : batchData.status === "PREVIEW_READY"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {batchData.status}
                </strong>
              </span>

              {batchData.status === "PREVIEW_READY" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApproveBatch}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Commit ({batchData.proposals.length - excludedIds.length})</span>
                  </button>

                  <button
                    onClick={handleRejectBatch}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {batchData.status === "COMMITTED" && batchData.approver && (
                <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Committed by {batchData.approver.fullName} on{" "}
                  {batchData.committedAt ? new Date(batchData.committedAt).toLocaleDateString() : ""}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Department Target Calculations Breakdown */}
      {batchData?.calculationMeta && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Target Calculation Breakdown (E_d, p_d, T_d, M_d)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Formula: Target T_d = round(E_d × p_d) capped at fixed max capacity M_d.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(batchData.calculationMeta).map(([deptId, calc]) => (
              <div key={deptId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-xs text-slate-900">{calc.departmentName}</div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      calc.targetStatus === "TARGET_ACHIEVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : calc.targetStatus === "MAX_CAPACITY_REACHED"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {calc.targetStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Eligible Pool (E_d)</span>
                    <strong className="text-slate-800">{calc.eligibleCount}</strong> members
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Target % (p_d)</span>
                    <strong className="text-slate-800">{Math.round(calc.targetPercent * 100)}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Calculated Target (T_d)</span>
                    <strong className="text-slate-800">{calc.calculatedTarget}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Proposed (A_d)</span>
                    <strong className="text-indigo-600">{calc.allocatedInProposal}</strong> / {calc.maxCapacity} max
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Proposed Assignments vs Review Queue */}
      {batchData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("proposals")}
              className={`px-6 py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === "proposals"
                  ? "border-indigo-600 text-indigo-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Proposed Member Assignments</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
                {batchData.proposals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("exceptions")}
              className={`px-6 py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === "exceptions"
                  ? "border-amber-600 text-amber-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Administrator Review Queue</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px]">
                {batchData.exceptions.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Proposals */}
          {activeTab === "proposals" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    {batchData.status === "PREVIEW_READY" && (
                      <th className="px-4 py-3 text-center">Include</th>
                    )}
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Attributes</th>
                    <th className="px-4 py-3">Proposed Department</th>
                    <th className="px-4 py-3">Decision Explanation Trail (Reason)</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchData.proposals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No proposals generated in this batch.
                      </td>
                    </tr>
                  ) : (
                    batchData.proposals.map((p) => {
                      const isExcluded = excludedIds.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/60 transition ${isExcluded ? "opacity-40 bg-slate-50" : ""}`}
                        >
                          {batchData.status === "PREVIEW_READY" && (
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={!isExcluded}
                                onChange={() => toggleExclude(p.id)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{p.member.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {p.member.registrationNo} · {p.member.phoneNumber}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-700">{p.member.gender}</span> ·{" "}
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                              {p.member.category}
                            </span>
                            {p.member.isDeacon && (
                              <span className="ml-1 text-violet-700 font-bold text-[10px]">· Deacon</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{p.department.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{p.department.code}</span>
                          </td>
                          <td className="px-4 py-3 max-w-md">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold mb-0.5">
                              {p.reasonCode}
                            </span>
                            <p className="text-[11px] text-slate-600">{p.reasonDetail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === "COMMITTED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isExcluded
                                  ? "bg-slate-200 text-slate-600"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {isExcluded ? "EXCLUDED" : p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Review Queue (Exceptions) */}
          {activeTab === "exceptions" && (
            <div className="overflow-x-auto">
              <div className="p-4 bg-amber-50/60 border-b border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Per BRS Section 4.5: Members qualifying for no department or caught by capacity limits are never silently allocated. They are routed here for authorized administrator review.
                </span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Attributes</th>
                    <th className="px-5 py-3">Exception Reason Code</th>
                    <th className="px-5 py-3">Detailed Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchData.exceptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                        No exceptions or unassigned members in this batch.
                      </td>
                    </tr>
                  ) : (
                    batchData.exceptions.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900">{e.member.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {e.member.registrationNo} · {e.member.phoneNumber}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span>{e.member.gender}</span> ·{" "}
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {e.member.category}
                          </span>
                          {e.member.isDeacon && (
                            <span className="ml-1 text-violet-700 font-bold text-[10px]">· Deacon</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                            {e.reasonCode}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 max-w-lg">{e.reasonDetail}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
