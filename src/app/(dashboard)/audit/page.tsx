"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, History, User, Building2, Calendar, FileText } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: string | null;
  newValues: string | null;
  reason: string | null;
  createdAt: string;
  user: { fullName: string; email: string; role: string };
  campus?: { name: string; code: string } | null;
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Governance & Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Immutable historical records capturing user attribution, operational diffs, and justifications for every
          critical system action (BRS Section 10).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Chronological Event Ledger</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{logs.length} events logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Actor / User</th>
                <th className="px-5 py-3">Reason / Details</th>
                <th className="px-5 py-3 text-center">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700 font-medium">
                          {log.entityType} <span className="text-slate-400 text-[10px] font-mono">({log.entityId.slice(0, 8)}...)</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900">{log.user?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.user?.role}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                          {log.reason || "—"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {(log.oldValues || log.newValues) ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                            >
                              {isExpanded ? "Hide" : "Inspect"}
                            </button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-4 border-y border-slate-200">
                            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                              {log.oldValues && (
                                <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
                                  <span className="text-[10px] font-bold text-red-800 uppercase block mb-1">
                                    Previous State (Old)
                                  </span>
                                  <pre className="text-[11px] text-red-900 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(JSON.parse(log.oldValues), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValues && (
                                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                                    New State (Updated)
                                  </span>
                                  <pre className="text-[11px] text-emerald-900 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(JSON.parse(log.newValues), null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

