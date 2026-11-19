import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAuditLogs } from "../api/report.api";
import { AuditLogItem } from "../types/report";
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";

export const AuditLogPage: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs(token, {
        search: search.trim() || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        page,
        limit,
      });
      setLogs(data.logs);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [token, page, limit, search, action, entityType]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-navy-800" />
            Audit Trail & Security Event Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable system logs documenting logins, target percentage configurations, Excel imports, allocation runs, and Admin overrides.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action, or metadata..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-navy-500 focus:border-navy-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-lg border-slate-300 py-2 px-3 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="">All Actions</option>
              <option value="PERCENTAGE_TARGETS_CONFIGURED">Targets Configured</option>
              <option value="EXCEL_IMPORT_BATCH_COMPLETED">Import Completed</option>
              <option value="ALLOCATION_RUN">Allocation Run</option>
              <option value="ALLOCATION_OVERRIDE">Manual Override</option>
              <option value="SYSTEM_INITIALIZED">System Initialized</option>
            </select>

            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-lg border-slate-300 py-2 px-3 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="">All Entity Types</option>
              <option value="TARGET_CONFIGURATION">Target Config</option>
              <option value="IMPORT_BATCH">Import Batch</option>
              <option value="ALLOCATION_BATCH">Allocation Batch</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-3 py-3">Entity Type</th>
                <th className="px-4 py-3">Audit Details & Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading security ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-navy-50 text-navy-800 border border-navy-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{log.actorEmail}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Role: {log.actorRole}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] font-medium text-slate-700">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <pre className="text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700 max-w-md overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">{Math.min(page * limit, total)}</span> of{" "}
              <span className="font-semibold text-slate-800">{total}</span> events
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded border bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

