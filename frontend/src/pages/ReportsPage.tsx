import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import {
  fetchDashboardAnalytics,
  fetchDepartmentDistributionReport,
  fetchEvaluatorPerformanceReport,
  exportReportExcel,
} from "../api/report.api";
import { Campus } from "../types/campus";
import {
  DashboardAnalytics,
  DepartmentDistributionReport,
  EvaluatorPerformanceItem,
} from "../types/report";
import {
  PieChart,
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  Users,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export const ReportsPage: React.FC = () => {
  const { token, isAdmin } = useAuth();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [distReport, setDistReport] = useState<DepartmentDistributionReport | null>(null);
  const [evaluatorReport, setEvaluatorReport] = useState<EvaluatorPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load campuses
  useEffect(() => {
    async function loadCampuses() {
      if (!token) return;
      try {
        const campusList = await fetchCampuses(token);
        setCampuses(campusList);
        if (campusList.length > 0) {
          setSelectedCampusId(campusList[0].id);
        }
      } catch (err: unknown) {
        setError("Failed to load campuses");
      }
    }
    loadCampuses();
  }, [token]);

  // Load report data
  useEffect(() => {
    async function loadReports() {
      if (!token || !selectedCampusId) return;
      setLoading(true);
      setError(null);
      try {
        const [analyticsData, distData, evalData] = await Promise.all([
          fetchDashboardAnalytics(token, selectedCampusId),
          fetchDepartmentDistributionReport(selectedCampusId, token),
          fetchEvaluatorPerformanceReport(token),
        ]);
        setAnalytics(analyticsData);
        setDistReport(distData);
        setEvaluatorReport(evalData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [token, selectedCampusId]);

  const handleExport = async (type: "department_distribution" | "evaluator_performance") => {
    if (!token) return;
    setExporting(type);
    try {
      await exportReportExcel(type, token, selectedCampusId);
    } catch (err: unknown) {
      alert("Failed to export report workbook");
    } finally {
      setExporting(null);
    }
  };

  const selectedCampus = campuses.find((c) => c.id === selectedCampusId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-7 h-7 text-navy-800" />
            Executive Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Department percentage distribution, demographic breakdowns, and evaluator performance reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("department_distribution")}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting === "department_distribution" ? "Exporting..." : "Export Dept Targets (.xlsx)"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Campus Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 print:hidden">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
          <Building2 className="w-4 h-4 text-slate-400" />
          Selected Campus Scope:
        </label>
        <select
          value={selectedCampusId}
          onChange={(e) => setSelectedCampusId(e.target.value)}
          className="text-sm rounded-lg border-slate-300 py-2 px-3 bg-slate-50 font-medium text-slate-800 max-w-sm w-full"
        >
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Department Allocation vs. Percentage Targets Report */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-navy-800" />
              Department Allocation Share vs. Targets (Campus: {selectedCampus?.name})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Target counts calculated using Largest Remainder Method (Hare-Niemeyer integer rounding)
            </p>
          </div>

          <span className="text-xs font-bold text-slate-700">
            Total Population: {distReport?.totalCampusMembers || 0} Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center text-cyan-600 font-bold">ተ.ቁ</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-3 py-3 text-center">Target %</th>
                <th className="px-3 py-3 text-center">Target Count</th>
                <th className="px-3 py-3 text-center">Allocated</th>
                <th className="px-3 py-3 text-center">Variance</th>
                <th className="px-3 py-3 text-center">Achievement</th>
                <th className="px-3 py-3 text-center">Capacity</th>
                <th className="px-3 py-3 text-center">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading report...
                  </td>
                </tr>
              ) : !distReport || distReport.departments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No departments found for this campus.
                  </td>
                </tr>
              ) : (
                distReport.departments.map((dept, idx) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-navy-800">{dept.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{dept.name}</td>
                    <td className="px-3 py-3 text-center font-bold text-blue-700">
                      {dept.targetPercentage}%
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-700">
                      {dept.targetCount}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-black text-slate-900">
                      {dept.allocatedCount}
                    </td>
                    <td className="px-3 py-3 text-center font-mono">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dept.variance === 0
                            ? "bg-emerald-50 text-emerald-700"
                            : dept.variance > 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {dept.variance > 0 ? `+${dept.variance}` : dept.variance}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          dept.achievementPct >= 100
                            ? "bg-emerald-100 text-emerald-800"
                            : dept.achievementPct >= 80
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {dept.achievementPct}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-600">
                      {dept.capacity}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-semibold text-emerald-600">
                      {dept.remainingCapacity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Demographics Distribution Grid */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Gender Demographics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-navy-800" />
              Gender Breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.gender).map(([gender, count]) => {
                const pct =
                  analytics.totalMembers > 0
                    ? Math.round((count / analytics.totalMembers) * 100)
                    : 0;
                return (
                  <div key={gender} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{gender}</span>
                      <span className="font-mono text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Demographics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-navy-800" />
              Category Breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.category).map(([cat, count]) => {
                const pct =
                  analytics.totalMembers > 0
                    ? Math.round((count / analytics.totalMembers) * 100)
                    : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <span className="font-mono text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spiritual Status Demographics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-navy-800" />
              Spiritual Status
            </h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.spiritualStatus).map(([status, count]) => {
                const pct =
                  analytics.totalMembers > 0
                    ? Math.round((count / analytics.totalMembers) * 100)
                    : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{status}</span>
                      <span className="font-mono text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Evaluator Performance & Progress Report */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Evaluator Performance & Assessment Progress
          </h2>

          <button
            onClick={() => handleExport("evaluator_performance")}
            disabled={exporting !== null}
            className="text-xs font-semibold text-navy-800 hover:underline flex items-center gap-1 print:hidden"
          >
            <Download className="w-3.5 h-3.5" />
            Export Evaluator Report (.xlsx)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center text-cyan-600 font-bold">ተ.ቁ</th>
                <th className="px-4 py-3">Evaluator</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-3 py-3 text-center">Assigned Tasks</th>
                <th className="px-3 py-3 text-center">Total Candidates</th>
                <th className="px-3 py-3 text-center">Completed</th>
                <th className="px-3 py-3 text-center">Pending</th>
                <th className="px-3 py-3 text-center">Completion Rate</th>
                <th className="px-3 py-3 text-center">Average Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluatorReport.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    No active evaluators found.
                  </td>
                </tr>
              ) : (
                evaluatorReport.map((ev, idx) => (
                  <tr key={ev.evaluatorId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{ev.fullName}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{ev.email}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                      {ev.assignedTasksCount}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      {ev.totalCandidates}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700">
                      {ev.completedAssessments}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-amber-700">
                      {ev.pendingAssessments}
                    </td>
                    <td className="px-3 py-3 text-center font-bold">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-extrabold">
                        {ev.completionRate}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-extrabold text-navy-900">
                      {ev.averageScore}/100
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

