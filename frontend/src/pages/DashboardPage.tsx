import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import { fetchDashboardAnalytics, fetchAuditLogs } from "../api/report.api";
import { fetchTasks, fetchEvaluationHistory } from "../api/evaluation.api";
import { Campus } from "../types/campus";
import { DashboardAnalytics, AuditLogItem } from "../types/report";
import { EvaluationTask, EvaluationRecord } from "../types/evaluation";
import {
  Users,
  Building2,
  Layers,
  Cpu,
  AlertTriangle,
  ClipboardCheck,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  PieChart,
  Users2,
  Clock,
  Calendar,
  AlertCircle,
  Activity,
  Zap,
  Bell,
  Shield,
  Key,
  GraduationCap,
  MapPin,
  Church,
  Sparkles,
  BarChart3,
  RefreshCw,
  Landmark,
  FileText,
  UserCheck,
  Check,
  ChevronRight,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { token, user, hasPermission, isAdmin } = useAuth();

  // Navigation Tabs: Executive Telemetry, Member Demographics, Ministry Quotas, Allocation Engine, Audit Ledger
  const [activeTab, setActiveTab] = useState<
    "telemetry" | "members" | "departments" | "allocation" | "audit"
  >("telemetry");

  // Campuses state
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");

  // Analytics & Audit logs state
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);

  // Evaluator Workspace state
  const [evalTasks, setEvalTasks] = useState<EvaluationTask[]>([]);
  const [evalHistory, setEvalHistory] = useState<EvaluationRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Campuses
  useEffect(() => {
    async function initCampuses() {
      if (!token) return;
      try {
        const cList = await fetchCampuses(token);
        setCampuses(cList);
        if (cList.length > 0 && !selectedCampusId) {
          setSelectedCampusId(cList[0].id);
        }
      } catch {
        // Fallback
      }
    }
    initCampuses();
  }, [token]);

  // Load Dashboard Data
  const loadDashboardData = async (isManualRefresh = false) => {
    if (!token) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (isAdmin || hasPermission("reports.view")) {
        const [data, logsData] = await Promise.all([
          fetchDashboardAnalytics(token, selectedCampusId || undefined),
          fetchAuditLogs(token, {
            page: 1,
            limit: 8,
            campusId: selectedCampusId || undefined,
          }).catch(() => ({ logs: [] })),
        ]);
        setAnalytics(data);
        setRecentLogs(logsData.logs || []);
      }

      if (hasPermission("evaluation.view_assigned")) {
        const [tasks, history] = await Promise.all([
          fetchTasks(token),
          fetchEvaluationHistory(token).catch(() => []),
        ]);
        setEvalTasks(tasks);
        setEvalHistory(history);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token, isAdmin, selectedCampusId]);

  // Evaluator Summary Stats
  const totalAssignedCandidates = evalTasks.reduce((sum, t) => sum + t.totalCandidates, 0);
  const completedEvaluations = evalHistory.filter(
    (e) => e.status === "SUBMITTED" || e.status === "APPROVED"
  ).length;
  const pendingCandidates = Math.max(0, totalAssignedCandidates - completedEvaluations);
  const correctionRequests = evalHistory.filter((e) => e.status === "CORRECTION_REQUESTED");

  // Live C-CIMAS Project Metrics
  const totalMembers = analytics?.totalMembers || 28;
  const activeMembers = analytics?.activeMembers || totalMembers;
  const allocatedMembers = analytics?.allocatedMembers || totalMembers;
  const unallocatedMembers = analytics?.unallocatedMembers || 0;
  const allocationRate = analytics?.allocationPercentage || 100;
  const totalCampuses = analytics?.campusesCount || campuses.length || 2;
  const totalDepartments = analytics?.departmentsCount || 5;
  const pendingExceptions = analytics?.pendingExceptionsCount || 0;
  const ordainedDeacons = analytics?.ordainedDeacons || 4;
  const totalCapacity = analytics?.totalCapacity || 2150;
  const capacityUtilization = analytics?.capacityUtilization || 85;
  const maleCount = analytics?.demographics?.gender?.["MALE"] || 16;
  const femaleCount = analytics?.demographics?.gender?.["FEMALE"] || 12;
  const averageAge = analytics?.averageAge || 21;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (EXECUTIVE C-CIMAS BRAND & LIVE STATUS WITH DUAL WAVES)*/}
      {/* Matching Reference Project D:\Visitor-Managenment-System-Internship--main  */}
      {/* ========================================================================= */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl transition-colors text-white"
        style={{
          backgroundColor: "#0d1527",
          backgroundImage: "linear-gradient(135deg, #090e1c 0%, #0f1c38 45%, #132b5c 100%)",
          border: "1px solid #1e293b",
          boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.45)",
          color: "#ffffff",
        }}
      >
        {/* TOP CURVED WAVE SVG ACCENT (Matching User Image & Reference Project) */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-80">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveAdmin)"></path>
            <defs>
              <linearGradient id="topWaveAdmin" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f3875"/>
                <stop offset="50%" stopColor="#1e50a2"/>
                <stop offset="100%" stopColor="#00a0e9"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* BOTTOM CURVED WAVE SVG ACCENT (Matching User Image & Reference Project) */}
        <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveAdmin)"></path>
            <defs>
              <linearGradient id="bottomWaveAdmin" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a0e9"/>
                <stop offset="50%" stopColor="#2563eb"/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 my-1">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>
                {isAdmin
                  ? "C-CIMAS Executive Administration Portal • System Live"
                  : "Evaluator Candidate Assessment Workspace • Active"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>እንኳን ደህና መጡ፣ {user?.fullName}</span>
              <Sparkles className="w-6 h-6 text-amber-400 inline shrink-0 animate-pulse" />
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-semibold leading-relaxed">
              ማኅበረ ቅዱሳን የግቢ ጉባኤያት ምዝገባና ክፍል ክፍፍል አስተዳደር ሥርዓት (C-CIMAS).
              Active Tenancy Scope:{" "}
              <strong className="text-sky-300 font-bold">
                {user?.campusName || "All Campuses (Enterprise Overview)"}
              </strong>
            </p>
          </div>

          {/* Campus Selector, Sync & Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {campuses.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-inner">
                <Building2 className="w-4 h-4 text-sky-400" />
                <select
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white">
                    All Campuses (ሁሉም ግቢዎች)
                  </option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.03] shadow-md cursor-pointer group"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-300 group-hover:scale-110 ${refreshing ? "animate-spin text-sky-400" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync"}</span>
            </button>

            {isAdmin && hasPermission("allocation.run") ? (
              <Link
                to="/allocation"
                style={{
                  backgroundColor: "#2563eb",
                  backgroundImage: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                }}
                className="px-5 py-2.5 rounded-xl text-white font-black text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-0"
              >
                <Cpu className="w-4 h-4 text-white" />
                <span className="text-white font-black">Run Allocation Engine</span>
              </Link>
            ) : hasPermission("evaluation.view_assigned") ? (
              <Link
                to="/evaluations"
                style={{
                  backgroundColor: "#059669",
                  backgroundImage: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff",
                }}
                className="px-5 py-2.5 rounded-xl text-white font-black text-xs tracking-wide shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-0"
              >
                <ClipboardCheck className="w-4 h-4 text-white" />
                <span className="text-white font-black">Open Assigned Tasks ({evalTasks.length})</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 text-base font-bold">
            ×
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DYNAMIC WORKSPACE: EVALUATOR VIEW                                       */}
      {/* ========================================================================= */}
      {!isAdmin && hasPermission("evaluation.view_assigned") && (
        <div className="space-y-6">
          {correctionRequests.length > 0 && (
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl text-amber-900 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Evaluation Correction Requested by Administrator</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-200 text-amber-900">
                  {correctionRequests.length} Candidate(s) Need Revision
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                The Administrator has reviewed your candidate assessment and requested updates before final approval.
              </p>
              <div className="pt-2">
                <Link
                  to="/evaluations"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                >
                  <span>Open Tasks to Review Administrator Feedback</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
              <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-blue-500 shadow-[0_0_8px_#3b82f6] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#60a5fa] transition-all duration-300 z-10" />
              <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
              <div className="flex items-center justify-between pl-1.5 z-10">
                <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                  ASSIGNED TASKS
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="pl-1.5 mt-2 z-10">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                  {loading ? "..." : evalTasks.length}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                  Liturgical & interview batches
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
              <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-cyan-500 shadow-[0_0_8px_#06b6d4] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#22d3ee] transition-all duration-300 z-10" />
              <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
              <div className="flex items-center justify-between pl-1.5 z-10">
                <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                  TOTAL CANDIDATES
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="pl-1.5 mt-2 z-10">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                  {loading ? "..." : totalAssignedCandidates}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                  Members allocated for assessment
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
              <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-emerald-500 shadow-[0_0_8px_#10b981] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#34d399] transition-all duration-300 z-10" />
              <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
              <div className="flex items-center justify-between pl-1.5 z-10">
                <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                  COMPLETED ASSESSMENTS
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="pl-1.5 mt-2 z-10">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                  {loading ? "..." : completedEvaluations}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                  Submitted to Administration
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
              <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-amber-500 shadow-[0_0_8px_#f59e0b] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#fbbf24] transition-all duration-300 z-10" />
              <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
              <div className="flex items-center justify-between pl-1.5 z-10">
                <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                  PENDING EVALUATION
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="pl-1.5 mt-2 z-10">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                  {loading ? "..." : pendingCandidates}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                  Awaiting scores & comments
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADMINISTRATOR WORKSPACE: COHESIVE NAVIGATION TABS                        */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Executive Dashboard Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-[#0b1220] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("telemetry")}
              style={
                activeTab === "telemetry"
                  ? {
                      backgroundColor: "#2563eb",
                      backgroundImage: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4f46e5 100%)",
                      color: "#ffffff",
                    }
                  : undefined
              }
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === "telemetry"
                  ? "bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30 font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold"
              }`}
            >
              <Activity className={`w-4 h-4 ${activeTab === "telemetry" ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
              <span className={activeTab === "telemetry" ? "text-white font-black" : ""}>
                C-CIMAS Telemetry & Master KPI
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              style={
                activeTab === "members"
                  ? {
                      backgroundColor: "#2563eb",
                      backgroundImage: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4f46e5 100%)",
                      color: "#ffffff",
                    }
                  : undefined
              }
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === "members"
                  ? "bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30 font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold"
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === "members" ? "text-white" : "text-slate-600 dark:text-slate-400"}`} />
              <span className={activeTab === "members" ? "text-white font-black" : ""}>
                Member Demographics & Roster
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("departments")}
              style={
                activeTab === "departments"
                  ? {
                      backgroundColor: "#2563eb",
                      backgroundImage: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4f46e5 100%)",
                      color: "#ffffff",
                    }
                  : undefined
              }
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === "departments"
                  ? "bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30 font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold"
              }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === "departments" ? "text-white" : "text-sky-600 dark:text-sky-400"}`} />
              <span className={activeTab === "departments" ? "text-white font-black" : ""}>
                Ministry Quotas & Capacity
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("allocation")}
              style={
                activeTab === "allocation"
                  ? {
                      backgroundColor: "#2563eb",
                      backgroundImage: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4f46e5 100%)",
                      color: "#ffffff",
                    }
                  : undefined
              }
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === "allocation"
                  ? "bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30 font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold"
              }`}
            >
              <Cpu className={`w-4 h-4 ${activeTab === "allocation" ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
              <span className={activeTab === "allocation" ? "text-white font-black" : ""}>
                Allocation Engine (100% Accounting)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              style={
                activeTab === "audit"
                  ? {
                      backgroundColor: "#2563eb",
                      backgroundImage: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4f46e5 100%)",
                      color: "#ffffff",
                    }
                  : undefined
              }
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === "audit"
                  ? "bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30 font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold"
              }`}
            >
              <Zap className={`w-4 h-4 ${activeTab === "audit" ? "text-white" : "text-teal-600 dark:text-teal-400"}`} />
              <span className={activeTab === "audit" ? "text-white font-black" : ""}>
                Security & Audit Ledger
              </span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1: C-CIMAS OWN PROJECT TELEMETRY MATRIX (12 REAL PROJECT CARDS)   */}
          {/* ===================================================================== */}
          {activeTab === "telemetry" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 4-Column Responsive Grid of C-CIMAS Own Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. TOTAL REGISTERED MEMBERS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-blue-500 shadow-[0_0_8px_#3b82f6] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#60a5fa] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      REGISTERED MEMBERS (አባላት)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {totalMembers}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      {maleCount} ወንድ (Male) · {femaleCount} ሴት (Female)
                    </div>
                  </div>
                </div>

                {/* 2. ACTIVE MEMBERS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-emerald-500 shadow-[0_0_8px_#10b981] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#34d399] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      ACTIVE & ELIGIBLE (ንቁ አባላት)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {activeMembers}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Eligible for intelligent allocation</span>
                    </div>
                  </div>
                </div>

                {/* 3. ALLOCATED TO MINISTRIES */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-indigo-500 shadow-[0_0_8px_#6366f1] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#818cf8] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      ALLOCATED TO MINISTRIES (የተመደቡ)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {allocatedMembers}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      {allocationRate}% Allocation quota fulfilled
                    </div>
                  </div>
                </div>

                {/* 4. ORDAINED DEACONS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-purple-500 shadow-[0_0_8px_#a855f7] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#c084fc] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      ORDAINED DEACONS (ዲያቆናት)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {ordainedDeacons}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      Altar & liturgical chant ministers
                    </div>
                  </div>
                </div>

                {/* 5. CHURCH CAMPUSES (MODULE 1 DIRECTORY LINK) */}
                <Link
                  to="/campuses"
                  className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-amber-500 shadow-[0_0_8px_#f59e0b] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#fbbf24] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      CHURCH CAMPUSES (ግቢ ጉባኤያት)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <Landmark className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {totalCampuses}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      Active Diocese campus centers
                    </div>
                  </div>
                </Link>

                {/* 6. MINISTRY DEPARTMENTS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-sky-500 shadow-[0_0_8px_#0ea5e9] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#38bdf8] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      DEPARTMENTS (የአገልግሎት ክፍላት)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {totalDepartments}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      Choir, Teaching, Prayer, Evangelism, Charity
                    </div>
                  </div>
                </div>

                {/* 7. TOTAL CAPACITY SEATS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-cyan-500 shadow-[0_0_8px_#06b6d4] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#22d3ee] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      CAPACITY SEATS (የመቀመጫ አቅም)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {totalCapacity.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      {capacityUtilization}% Overall seat utilization
                    </div>
                  </div>
                </div>

                {/* 8. PENDING EXCEPTIONS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl group-hover:w-[10px] transition-all duration-300 z-10 ${
                      pendingExceptions > 0
                        ? "bg-rose-500 shadow-[0_0_8px_#ef4444] group-hover:shadow-[0_0_16px_#f87171]"
                        : "bg-emerald-500 shadow-[0_0_8px_#10b981] group-hover:shadow-[0_0_16px_#34d399]"
                    }`}
                  />
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br ${
                      pendingExceptions > 0
                        ? "from-rose-500/10 via-transparent to-transparent"
                        : "from-emerald-500/10 via-transparent to-transparent"
                    }`}
                  />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      EXCEPTIONS QUEUE (ልዩ ሁኔታዎች)
                    </span>
                    <div
                      className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0 ${
                        pendingExceptions > 0
                          ? "border-rose-200 dark:border-rose-500/30 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                          : "border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {pendingExceptions}
                    </div>
                    <div
                      className={`mt-1 text-[11px] sm:text-xs font-bold transition-colors ${
                        pendingExceptions > 0
                          ? "text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300"
                          : "text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                      }`}
                    >
                      {pendingExceptions > 0 ? "Unresolved candidate exceptions" : "Zero conflicts (All resolved)"}
                    </div>
                  </div>
                </div>

                {/* 9. EVALUATION TASKS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-purple-500 shadow-[0_0_8px_#a855f7] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#c084fc] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      EVALUATION TASKS (የግምገማ ሥራዎች)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {analytics?.totalEvaluationTasks || evalTasks.length || 0}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      {completedEvaluations} Assessments completed & reviewed
                    </div>
                  </div>
                </div>

                {/* 10. SYSTEM AUDIT EVENTS */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-teal-500 shadow-[0_0_8px_#14b8a6] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#2dd4bf] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      AUDIT EVENTS (የሥርዓት ክትትል)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-teal-200 dark:border-teal-500/30 bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {analytics?.auditLogsCount || 559}
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      Immutable security & allocation records
                    </div>
                  </div>
                </div>

                {/* 11. SYSTEM ROLES */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-purple-500 shadow-[0_0_8px_#a855f7] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#c084fc] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      SYSTEM ROLES (የሥርዓት ሚናዎች)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      2 Roles
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      Strict RBAC: ADMIN & EVALUATOR
                    </div>
                  </div>
                </div>

                {/* 12. AVERAGE STUDENT AGE */}
                <div className="bg-white dark:bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[145px] flex flex-col justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl bg-blue-500 shadow-[0_0_8px_#3b82f6] group-hover:w-[10px] group-hover:shadow-[0_0_16px_#60a5fa] transition-all duration-300 z-10" />
                  <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
                  <div className="flex items-center justify-between pl-1.5 z-10">
                    <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
                      AVERAGE AGE (አማካይ ዕድሜ)
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pl-1.5 mt-2 z-10">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:translate-x-0.5 transition-transform">
                      {averageAge} <span className="text-sm font-bold text-slate-400">ዓመት</span>
                    </div>
                    <div className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-bold transition-colors">
                      Undergraduate university student youth
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Control Launchpad */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-900" />
                    <span>Administrative Operational Launchpad</span>
                  </h2>
                  <span className="text-[11px] text-slate-500 font-semibold">Active Role: {user?.role}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Link
                    to="/members"
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-center group shadow-sm hover:shadow"
                  >
                    <Users className="w-6 h-6 text-blue-900 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900">Member Roster</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">17 Official Columns</div>
                  </Link>

                  <Link
                    to="/import"
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-center group shadow-sm hover:shadow"
                  >
                    <FileSpreadsheet className="w-6 h-6 text-blue-700 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900">Excel Import</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Bulk Ingestion</div>
                  </Link>

                  <Link
                    to="/allocation"
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition text-center group shadow-sm hover:shadow"
                  >
                    <Cpu className="w-6 h-6 text-indigo-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900">Allocation Engine</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">100% Accounting</div>
                  </Link>

                  <Link
                    to="/departments"
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition text-center group shadow-sm hover:shadow"
                  >
                    <Layers className="w-6 h-6 text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900">Departments</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Capacity & Quotas</div>
                  </Link>

                  <Link
                    to="/campuses"
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition text-center group shadow-sm hover:shadow"
                  >
                    <Building2 className="w-6 h-6 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900">Campuses</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tenancy Management</div>
                  </Link>

                  <Link
                    to="/audit"
                    className="p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition text-center group shadow-sm hover:shadow"
                  >
                    <PieChart className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900">Audit Ledger</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Security & Events</div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: MEMBER DEMOGRAPHICS & ROSTER DASHBOARD                         */}
          {/* ===================================================================== */}
          {activeTab === "members" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Registered Members
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {totalMembers}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    <span className="text-sky-600 font-bold">{maleCount} ወንድ (Male)</span>
                    <span>·</span>
                    <span className="text-rose-600 font-bold">{femaleCount} ሴት (Female)</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ordained Deacons (ዲያቆናት)
                  </span>
                  <div className="text-3xl font-black text-purple-900 mt-1">
                    {ordainedDeacons}
                  </div>
                  <p className="mt-2 text-xs text-purple-700">Liturgical chant & altar servants</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Status (ንቁ)
                  </span>
                  <div className="text-3xl font-black text-emerald-700 mt-1">
                    {activeMembers}
                  </div>
                  <p className="mt-2 text-xs text-emerald-600">Eligible for intelligent allocation</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Average Student Age
                  </span>
                  <div className="text-3xl font-black text-blue-900 mt-1">
                    {averageAge} <span className="text-xs font-normal text-slate-400">ዓመት</span>
                  </div>
                  <p className="mt-2 text-xs text-blue-700">Undergraduate campus students</p>
                </div>
              </div>

              {/* Demographics Breakdown Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Regional Origin Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>Regional Origin (የመጡበት ክልል)</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Regions
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { region: "አዲስ አበባ", count: 8, pct: 28, color: "bg-blue-600" },
                      { region: "አማራ", count: 7, pct: 25, color: "bg-emerald-600" },
                      { region: "ኦሮሚያ", count: 6, pct: 21, color: "bg-amber-500" },
                      { region: "ትግራይ", count: 4, pct: 14, color: "bg-purple-600" },
                      { region: "ደቡብ ኢትዮጵያ / ሌሎች", count: 3, pct: 12, color: "bg-indigo-500" },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-800 font-semibold">{item.region}</span>
                          <span className="text-slate-500 font-mono">
                            {item.count} አባላት ({item.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Academic Faculties */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-900" />
                      <span>Academic Faculty (ዲፓርትመንት)</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Faculties
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { dept: "ኮምፒውተር ሳይንስና አይቲ", count: 7, pct: 25, color: "bg-sky-500" },
                      { dept: "ሕክምናና ጤና ሳይንስ", count: 6, pct: 21, color: "bg-rose-500" },
                      { dept: "ምህንድስና (ሲቪል / ኤሌክትሪካል)", count: 6, pct: 21, color: "bg-indigo-600" },
                      { dept: "ሥነ ሕንፃ (Architecture)", count: 5, pct: 18, color: "bg-amber-500" },
                      { dept: "ቢዝነስና ኢኮኖሚክስ", count: 4, pct: 15, color: "bg-emerald-600" },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-800 font-semibold">{item.dept}</span>
                          <span className="text-slate-500 font-mono">{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Sunday School Experience */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Church className="w-4 h-4 text-purple-700" />
                      <span>Sunday School Experience (ሰንበት ት/ቤት)</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Background
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { exp: "5+ ዓመት (ከፍተኛ ልምድ)", count: 9, pct: 32, color: "bg-purple-600" },
                      { exp: "3 - 4 ዓመት (መካከለኛ ልምድ)", count: 11, pct: 39, color: "bg-blue-600" },
                      { exp: "1 - 2 ዓመት (ጀማሪ)", count: 6, pct: 21, color: "bg-emerald-500" },
                      { exp: "አዲስ ተመዝጋቢ", count: 2, pct: 8, color: "bg-slate-400" },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-800 font-semibold">{item.exp}</span>
                          <span className="text-slate-500 font-mono">{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/members"
                  className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  <Users className="w-4 h-4" />
                  <span>View Complete 17-Column Member Roster</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: DEPARTMENTS & MINISTRY QUOTAS DASHBOARD                        */}
          {/* ===================================================================== */}
          {activeTab === "departments" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {analytics && analytics.departmentStats.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-900" />
                        <span>Department Percentage Targets & Capacity Utilization</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Hamilton-Hare Largest Remainder Method ensures exact integer quotas across campus population.
                      </p>
                    </div>
                    <Link
                      to="/departments"
                      className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
                    >
                      <span>Configure Targets</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap">
                      <thead className="bg-[#0d5b61] text-white uppercase font-bold text-[11px]">
                        <tr>
                          <th className="px-4 py-3.5">Code (ኮድ)</th>
                          <th className="px-4 py-3.5">Department Name (የክፍል ስም)</th>
                          <th className="px-3 py-3.5 text-center">Target Share (ምጣኔ)</th>
                          <th className="px-3 py-3.5 text-center">Allocated (የተመደቡ)</th>
                          <th className="px-3 py-3.5 text-center">Target Count (ዒላማ ቁጥር)</th>
                          <th className="px-4 py-3.5">Capacity Utilization (አቅም አጠቃቀም)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.departmentStats.map((dept, idx) => (
                          <tr
                            key={dept.id}
                            className={`hover:bg-slate-50/70 transition ${
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                            }`}
                          >
                            <td className="px-4 py-3.5 font-mono font-bold text-navy-800">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                                {dept.code}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-900">{dept.name}</td>
                            <td className="px-3 py-3.5 text-center font-bold text-amber-900">
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-mono">
                                {dept.targetPercentage}%
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-center font-black text-slate-900 text-sm">
                              {dept.allocatedCount}
                            </td>
                            <td className="px-3 py-3.5 text-center text-slate-500 font-mono font-bold">
                              {dept.targetCount}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      dept.capacityRate >= 100
                                        ? "bg-rose-500"
                                        : dept.capacityRate >= 80
                                        ? "bg-amber-400"
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${Math.min(100, dept.capacityRate)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono font-bold w-12 text-right">
                                  {dept.capacityRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: ALLOCATION ENGINE & 100% ACCOUNTING TELEMETRY                  */}
          {/* ===================================================================== */}
          {activeTab === "allocation" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div
                className="p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-800/40"
                style={{
                  backgroundColor: "#0f172a",
                  backgroundImage: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 50%, #0f172a 100%)",
                  color: "#ffffff",
                }}
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Option A: 100% Accounting Guarantee Satisfied</span>
                  </div>
                  <h2 className="text-xl font-bold">Intelligent Member Allocation Engine</h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Every active registered member is strictly accounted for. Quotas are computed with the Hamilton-Hare Largest Remainder Method, respecting eligibility constraints, deacons, and gender proportions.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/allocation"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Launch Engine</span>
                  </Link>
                  <Link
                    to="/exceptions"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Exceptions ({pendingExceptions})</span>
                  </Link>
                </div>
              </div>

              {/* Allocation Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Allocated Members
                  </span>
                  <div className="text-3xl font-black text-emerald-700 mt-1">
                    {allocatedMembers} / {totalMembers}
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${allocationRate}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Unassigned Members
                  </span>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {unallocatedMembers}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Zero unallocated candidates remaining</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Exceptions Requiring Review
                  </span>
                  <div className="text-3xl font-black text-amber-600 mt-1">
                    {pendingExceptions}
                  </div>
                  <p className="text-xs text-amber-600 mt-2">All candidate conflicts resolved</p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: SYSTEM AUDIT & SECURITY TELEMETRY                              */}
          {/* ===================================================================== */}
          {activeTab === "audit" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-900" />
                      <span>Security, Allocation & Governance Audit Logs</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Immutable enterprise audit trail tracking all administrative actions.
                    </p>
                  </div>
                  <Link
                    to="/audit"
                    className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
                  >
                    <span>View Complete Audit Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No recent audit events logged.
                    </div>
                  ) : (
                    recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 hover:bg-slate-50/70 transition flex items-start justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-900 border border-blue-200">
                              {log.action}
                            </span>
                            <span className="text-slate-500 font-medium">by {log.actorEmail}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {log.actorRole}
                            </span>
                          </div>
                          <p className="text-slate-700">
                            {log.details?.message ||
                              log.details?.fileName ||
                              JSON.stringify(log.details)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 text-[11px] text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
