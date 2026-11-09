"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Building2,
  AlertCircle,
  CheckCircle2,
  User,
  ShieldCheck,
  History,
  Send,
} from "lucide-react";

interface MemberWithAlloc {
  id: string;
  fullName: string;
  registrationNo: string;
  category: string;
  gender: string;
  isDeacon: boolean;
  currentDepartment: { id: string; name: string; code: string } | null;
}

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  maxCapacity: number;
  currentActiveAllocationsCount: number;
}

interface TransferRecord {
  id: string;
  member: { fullName: string; registrationNo: string };
  fromDept: { name: string; code: string };
  toDept: { name: string; code: string };
  requester: { fullName: string };
  reason: string;
  status: string;
  createdAt: string;
}

export default function TransfersPage() {
  const [allocatedMembers, setAllocatedMembers] = useState<MemberWithAlloc[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedToDeptId, setSelectedToDeptId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [membersRes, deptsRes, transfersRes] = await Promise.all([
        fetch("/api/members?allocationFilter=ALLOCATED&limit=100"),
        fetch("/api/departments"),
        fetch("/api/transfers"),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setAllocatedMembers(data.members);
      }
      if (deptsRes.ok) {
        const data = await deptsRes.json();
        setDepartments(data.departments);
      }
      if (transfersRes.ok) {
        const data = await transfersRes.json();
        setTransfers(data.transfers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedMember = allocatedMembers.find((m) => m.id === selectedMemberId);
  const destinationDept = departments.find((d) => d.id === selectedToDeptId);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMemberId || !selectedToDeptId || !reason) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          toDepartmentId: selectedToDeptId,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process department transfer");
      }

      setMessage({ type: "success", text: data.message });
      setSelectedMemberId("");
      setSelectedToDeptId("");
      setReason("");
      loadData();
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Transfer error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Department Reassignment</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Controlled member transfer workflow with automatic source deactivation, destination capacity validation,
          and permanent audit logging (BRS Section 5).
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Transfer Request Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          <span>Execute Controlled Reassignment</span>
        </h3>

        <form onSubmit={handleTransfer} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Source Member */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Member to Transfer *
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose an Allocated Member --</option>
                {allocatedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.registrationNo}) — Current: {m.currentDepartment?.name}
                  </option>
                ))}
              </select>

              {selectedMember && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div>
                    Current Department:{" "}
                    <strong className="text-slate-900">{selectedMember.currentDepartment?.name}</strong>
                  </div>
                  <div>
                    Gender: <strong>{selectedMember.gender}</strong> · Category:{" "}
                    <strong>{selectedMember.category}</strong>
                    {selectedMember.isDeacon && (
                      <span className="ml-1 text-violet-700 font-bold">· Ordained Deacon</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Destination Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination Department *
              </label>
              <select
                value={selectedToDeptId}
                onChange={(e) => setSelectedToDeptId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Destination Department --</option>
                {departments
                  .filter((d) => !selectedMember || d.id !== selectedMember.currentDepartment?.id)
                  .map((d) => {
                    const isFull = d.currentActiveAllocationsCount >= d.maxCapacity;
                    return (
                      <option key={d.id} value={d.id} disabled={isFull}>
                        {d.name} ({d.currentActiveAllocationsCount}/{d.maxCapacity} members)
                        {isFull ? " — FULL" : ""}
                      </option>
                    );
                  })}
              </select>

              {destinationDept && (
                <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                  <div>
                    Capacity:{" "}
                    <strong>
                      {destinationDept.currentActiveAllocationsCount} / {destinationDept.maxCapacity}
                    </strong>{" "}
                    ({Math.max(0, destinationDept.maxCapacity - destinationDept.currentActiveAllocationsCount)} slots available)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Department Reassignment *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Member relocation to media production, liturgical schedule adjustment, pastoral recommendation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !selectedMemberId || !selectedToDeptId}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Processing Transfer..." : "Authorize Department Reassignment"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Transfer History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Reassignment History & Audit Trail</span>
          </h3>
          <span className="text-xs text-slate-400">{transfers.length} recorded transfers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">From Department</th>
                <th className="px-5 py-3">To Department</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No department transfers have been performed yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{t.member.fullName}</td>
                    <td className="px-5 py-3">
                      <span className="text-slate-600 font-medium">{t.fromDept.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-indigo-700">{t.toDept.name}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-sm">{t.reason}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{t.requester.fullName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

