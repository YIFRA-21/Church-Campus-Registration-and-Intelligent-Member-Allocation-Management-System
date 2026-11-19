import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchCampusDashboardSummary,
  fetchCampuses,
  fetchCampusById,
  createCampus,
  updateCampus,
  changeCampusStatus,
  fetchCampusStatusHistory,
} from "../api/campus.api";
import {
  Campus,
  CreateCampusPayload,
  CampusStatus,
  CampusDashboardSummary,
  CampusStatusHistory,
} from "../types/campus";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Phone,
  Mail,
  Eye,
  Pencil,
  Users,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  History,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Archive,
  RefreshCw,
  Clock,
  UserCheck,
  Check,
  Download,
  Landmark,
} from "lucide-react";

export const CampusesPage: React.FC = () => {
  const { token, hasPermission, user } = useAuth();

  // Data States
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [summary, setSummary] = useState<CampusDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ARCHIVED">("ALL");
  const [regionFilter, setRegionFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "code" | "createdAt" | "city">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingCampus, setViewingCampus] = useState<Campus | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "contacts" | "stats" | "history">("overview");
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [statusModalCampus, setStatusModalCampus] = useState<Campus | null>(null);
  const [statusTarget, setStatusTarget] = useState<CampusStatus>("ACTIVE");
  const [statusReason, setStatusReason] = useState("");
  const [campusHistory, setCampusHistory] = useState<CampusStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState<CreateCampusPayload>({
    code: "",
    name: "",
    description: "",
    region: "Addis Ababa",
    city: "Addis Ababa",
    subCity: "",
    woreda: "",
    address: "",
    phoneNumber: "",
    email: "",
    status: "ACTIVE",
    primaryContactName: "",
    primaryContactPhone: "",
    primaryContactPosition: "Campus Coordinator",
    primaryContactEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load Dashboard Summary & Campus List
  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [sumData, campusData] = await Promise.all([
        fetchCampusDashboardSummary(token).catch(() => null),
        fetchCampuses(token, {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: statusFilter,
          region: regionFilter,
          sortBy,
          sortOrder,
        }),
      ]);

      if (sumData) setSummary(sumData);
      setCampuses(campusData);
      setTotalRecords(campusData.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading campus data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token, currentPage, itemsPerPage, statusFilter, regionFilter, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadDashboardData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle Create Campus
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);

    try {
      const created = await createCampus(createForm, token);
      setSuccessMsg(`Campus "${created.name}" (${created.code}) successfully created!`);
      setShowCreateModal(false);
      setCreateForm({
        code: "",
        name: "",
        description: "",
        region: "Addis Ababa",
        city: "Addis Ababa",
        subCity: "",
        woreda: "",
        address: "",
        phoneNumber: "",
        email: "",
        status: "ACTIVE",
        primaryContactName: "",
        primaryContactPhone: "",
        primaryContactPosition: "Campus Coordinator",
        primaryContactEmail: "",
      });
      await loadDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register campus");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Campus
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingCampus) return;
    setSubmitting(true);
    setError(null);

    try {
      await updateCampus(editingCampus.id, editingCampus, token);
      setSuccessMsg(`Campus "${editingCampus.name}" updated successfully!`);
      setEditingCampus(null);
      await loadDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update campus");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Change Status with Reason
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !statusModalCampus) return;
    if (statusReason.trim().length < 5) {
      setError("Please provide a meaningful reason (at least 5 characters) for the status change.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await changeCampusStatus(statusModalCampus.id, statusTarget, statusReason.trim(), token);
      setSuccessMsg(`Campus "${updated.name}" status changed to ${updated.status}.`);
      setStatusModalCampus(null);
      setStatusReason("");
      await loadDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to transition campus status");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Details Modal and fetch status history
  const handleOpenDetails = async (campus: Campus) => {
    setViewingCampus(campus);
    setActiveDetailTab("overview");
    if (!token) return;
    setHistoryLoading(true);
    try {
      const fullCampus = await fetchCampusById(campus.id, token);
      setViewingCampus(fullCampus);
      if (fullCampus.statusHistory) {
        setCampusHistory(fullCampus.statusHistory);
      } else {
        const hist = await fetchCampusStatusHistory(campus.id, token);
        setCampusHistory(hist);
      }
    } catch {
      // Fallback to existing campus model
    } finally {
      setHistoryLoading(false);
    }
  };

  // Regions for filter & creation
  const ETHIOPIAN_REGIONS = [
    "Addis Ababa",
    "Amhara",
    "Oromia",
    "Tigray",
    "Sidama",
    "Dire Dawa",
    "South Ethiopia",
    "Central Ethiopia",
    "South West Ethiopia",
    "Afar",
    "Benishangul-Gumuz",
    "Gambela",
    "Harari",
    "Somali",
  ];

  // Helper for status badge styling
  const getStatusBadge = (status: CampusStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Inactive
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
            <Archive className="w-3 h-3 text-purple-500 dark:text-purple-300" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;

  return (
    <div className="space-y-6 font-sans antialiased text-slate-900 dark:text-slate-100 pb-12 transition-colors">
      {/* ========================================================================= */}
      {/* 1. CANVA-INSPIRED HERO BANNER & QUICK ACTIONS                             */}
      {/* Dual wave SVG matching Dashboard & D:\Visitor-Managenment-System-Internship*/}
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
        {/* TOP CURVED WAVE SVG ACCENT */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-80">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z" fill="url(#topWaveCampus)"></path>
            <defs>
              <linearGradient id="topWaveCampus" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f3875" />
                <stop offset="50%" stopColor="#1e50a2" />
                <stop offset="100%" stopColor="#00a0e9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* BOTTOM CURVED WAVE SVG ACCENT */}
        <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-80">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z" fill="url(#bottomWaveCampus)"></path>
            <defs>
              <linearGradient id="bottomWaveCampus" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a0e9" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-300 tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Module 1 • Multi-Tenant Campus Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-9 h-9 text-blue-400 shrink-0" />
              <span>Church Campuses Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              ማኅበረ ቅዱሳን የግቢ ጉባኤያት መዋቅርና አስተዳደር (C-CIMAS).
              Manage multi-campus tenancies, diocesan contact nodes, and departmental quotas with
              transactional status governance and full audit tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => loadDashboardData()}
              className="px-4 py-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.03] shadow-md cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>

            {(hasPermission("campus.manage") || user?.role === "ADMIN") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Register New Campus</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS (MATCHING IT PARK PORTAL & C-CIMAS DESIGN SYSTEM)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Campuses */}
        <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl bg-blue-500 shadow-[0_0_8px_#3b82f6] group-hover:w-[8px] transition-all" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 pl-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Tenancies</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white pl-1.5">
            {summary?.totalCampuses ?? campuses.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-1.5 font-medium">Campus Centers</div>
        </div>

        {/* Active Campuses */}
        <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl bg-emerald-500 shadow-[0_0_8px_#10b981] group-hover:w-[8px] transition-all" />
          <div className="flex items-center justify-between mb-1 pl-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 pl-1.5">
            {summary?.activeCampuses ?? campuses.filter((c) => c.status === "ACTIVE").length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-1.5 font-medium">Operating units</div>
        </div>

        {/* Inactive Campuses */}
        <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl bg-amber-500 shadow-[0_0_8px_#f59e0b] group-hover:w-[8px] transition-all" />
          <div className="flex items-center justify-between mb-1 pl-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Inactive</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 pl-1.5">
            {summary?.inactiveCampuses ?? campuses.filter((c) => c.status === "INACTIVE").length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-1.5 font-medium">Recess / Standby</div>
        </div>

        {/* Archived Campuses */}
        <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl bg-purple-500 shadow-[0_0_8px_#a855f7] group-hover:w-[8px] transition-all" />
          <div className="flex items-center justify-between mb-1 pl-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Archived</span>
            <Archive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-300 pl-1.5">
            {summary?.archivedCampuses ?? campuses.filter((c) => c.status === "ARCHIVED").length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-1.5 font-medium">Decommissioned</div>
        </div>

        {/* Enrolled Members */}
        <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl bg-indigo-500 shadow-[0_0_8px_#6366f1] group-hover:w-[8px] transition-all" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 pl-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Members</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white pl-1.5">
            {summary?.totalEnrolledMembers ?? campuses.reduce((acc, c) => acc + (c.memberCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-1.5 font-medium">Enrolled fellowship</div>
        </div>

        {/* Total Ministries */}
        <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-2xl bg-cyan-500 shadow-[0_0_8px_#06b6d4] group-hover:w-[8px] transition-all" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 pl-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Departments</span>
            <Layers className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white pl-1.5">
            {summary?.totalAssignedMinistries ?? campuses.reduce((acc, c) => acc + (c.departmentCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-1.5 font-medium">Active ministries</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ALERTS & FEEDBACK                                                      */}
      {/* ========================================================================= */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 dark:hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SEARCH, FILTER & TOOLBAR                                               */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by campus name, code (e.g. ADD-01), city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#060a12]/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#060a12]/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            {(["ALL", "ACTIVE", "INACTIVE", "ARCHIVED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Region & Sort Dropdowns */}
        <div className="flex items-center gap-3">
          <select
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-slate-50 dark:bg-[#060a12]/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="">All Regions</option>
            {ETHIOPIAN_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-[#060a12]/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="createdAt">Date Registered</option>
            <option value="name">Campus Name</option>
            <option value="code">Campus Code</option>
            <option value="city">City Location</option>
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#060a12]/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CAMPUS DIRECTORY TABLE                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0b1220] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/90 dark:bg-[#060a12]/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center text-cyan-500 font-bold">ተ.ቁ</th>
                <th className="py-3.5 px-4">Campus Identity</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Location / Diocese</th>
                <th className="py-3.5 px-4">Primary Contact</th>
                <th className="py-3.5 px-4 text-center">Allocations</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && campuses.length === 0 ? (
                // Skeleton Rows
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-1.5" />
                      <div className="h-3 bg-slate-200/60 dark:bg-slate-800/60 rounded w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : campuses.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No campuses found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm || statusFilter !== "ALL"
                        ? "Try adjusting your search query or status filter."
                        : "Click 'Register New Campus' to configure the first church campus."}
                    </p>
                  </td>
                </tr>
              ) : (
                campuses.map((campus, idx) => {
                  const primaryContact = campus.contacts?.find((c) => c.isPrimary);
                  return (
                    <tr
                      key={campus.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* ተ.ቁ */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>{campus.name}</span>
                        </div>
                        {campus.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-xs font-normal">
                            {campus.description}
                          </p>
                        )}
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 px-2.5 py-1 rounded-md">
                          {campus.code}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{campus.city}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{campus.region}</span>
                      </td>

                      {/* Primary Contact */}
                      <td className="py-3.5 px-4">
                        {primaryContact ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{primaryContact.contactName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{primaryContact.phone}</span>
                            </div>
                          </div>
                        ) : campus.phoneNumber ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{campus.phoneNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Allocations & Departments */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                            <Users className="w-3 h-3 text-indigo-500" />
                            {campus.memberCount}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                            <Layers className="w-3 h-3 text-cyan-500" />
                            {campus.departmentCount}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(campus.status)}
                      </td>

                      {/* Actions with theme tokens */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => handleOpenDetails(campus)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                            title="View Campus Profile & History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          {(hasPermission("campus.manage") || user?.role === "ADMIN") && (
                            <button
                              onClick={() => setEditingCampus(campus)}
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
                              title="Edit Campus Details"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {/* Change Operational Status */}
                          {(hasPermission("campus.manage") || user?.role === "ADMIN") && (
                            <button
                              onClick={() => {
                                setStatusModalCampus(campus);
                                setStatusTarget(campus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
                                setStatusReason("");
                              }}
                              className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition"
                              title="Change Status & Record History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="py-3.5 px-4 bg-slate-50/90 dark:bg-[#060a12]/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 transition-colors">
          <div>
            Showing <span className="font-bold text-slate-900 dark:text-white">{campuses.length}</span> of{" "}
            <span className="font-bold text-slate-900 dark:text-white">{totalRecords}</span> campuses
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL 1: REGISTER NEW CAMPUS                                           */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-950 to-indigo-950 border-b border-blue-900/40 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Register Church Campus</h3>
                  <p className="text-xs text-blue-300/80">Configure identity, diocese node, and primary coordinator</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
              {/* SECTION A: BASIC IDENTITY */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Section A: Campus Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Campus Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Campus (Addis Ababa)"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Campus Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="e.g. ADD-01"
                      value={createForm.code}
                      onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-blue-400 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Description & Ministry Scope
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Diocesan cathedral center, university outreach fellowship..."
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: GEOGRAPHICAL LOCATION */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Section B: Diocese & Geographical Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Region / Diocese <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createForm.region}
                      onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                    >
                      {ETHIOPIAN_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Addis Ababa"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Sub-City / Zone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arada Sub-City"
                      value={createForm.subCity}
                      onChange={(e) => setCreateForm({ ...createForm, subCity: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Physical Cathedral / Compound Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Holy Trinity Cathedral Diocesan Building, Arat Kilo"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: CONTACT & PRIMARY NODE */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Section C: Official Contacts & Primary Lead
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Official Campus Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+251 11 122 3344"
                      value={createForm.phoneNumber}
                      onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Official Campus Email
                    </label>
                    <input
                      type="email"
                      placeholder="campus@c-cimas.org"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Primary Contact Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rev. Solomon Tadesse"
                      value={createForm.primaryContactName}
                      onChange={(e) => setCreateForm({ ...createForm, primaryContactName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Primary Contact Mobile Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+251 911 22 33 44"
                      value={createForm.primaryContactPhone}
                      onChange={(e) => setCreateForm({ ...createForm, primaryContactPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Confirm Campus Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL 2: CAMPUS DETAILS PROFILE & TABS                                  */}
      {/* ========================================================================= */}
      {viewingCampus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-r from-blue-950 via-[#0B1E40] to-indigo-950 border-b border-blue-900/40 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-black text-white">{viewingCampus.name}</h3>
                    <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                      {viewingCampus.code}
                    </span>
                    {getStatusBadge(viewingCampus.status)}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingCampus.city}, {viewingCampus.region}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCampus(null)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950/50">
              {[
                { id: "overview", label: "Overview & Tenancy", icon: Info },
                { id: "contacts", label: "Contact Directory", icon: Phone },
                { id: "stats", label: "Operational Statistics", icon: Layers },
                { id: "history", label: "Status Audit Trail", icon: History },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition ${
                      activeDetailTab === tab.id
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800 dark:text-slate-200">
              {/* TAB 1: OVERVIEW */}
              {activeDetailTab === "overview" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-[#060a12] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ministry Mission & Description</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                      {viewingCampus.description || "No specific description recorded."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-[#060a12] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Region</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{viewingCampus.region}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#060a12] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">City Location</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{viewingCampus.city}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#060a12] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sub-City / Zone</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{viewingCampus.subCity || "—"}</p>
                    </div>

                    <div className="sm:col-span-3 bg-slate-50 dark:bg-[#060a12] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Physical Cathedral Address</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{viewingCampus.address || "—"}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#060a12] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Campus Phone</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{viewingCampus.phoneNumber || "—"}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#060a12] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Official Email</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{viewingCampus.email || "—"}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#060a12] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Charter Date</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {new Date(viewingCampus.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACTS */}
              {activeDetailTab === "contacts" && (
                <div className="space-y-3">
                  {viewingCampus.contacts && viewingCampus.contacts.length > 0 ? (
                    viewingCampus.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          contact.isPrimary
                            ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60"
                            : "bg-slate-50 dark:bg-[#060a12] border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{contact.contactName}</h4>
                            {contact.isPrimary && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                                Primary Lead
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{contact.position}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-blue-500" />
                              {contact.phone}
                            </span>
                            {contact.email && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                {contact.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                      <Phone className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                      <p className="text-xs">No contact directory entries recorded for this campus.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: OPERATIONAL STATISTICS */}
              {activeDetailTab === "stats" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-[#060a12] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{viewingCampus.memberCount}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enrolled Church Members</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#060a12] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <Layers className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{viewingCampus.departmentCount}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active Ministry Departments</p>
                  </div>
                </div>
              )}

              {/* TAB 4: STATUS AUDIT HISTORY */}
              {activeDetailTab === "history" && (
                <div className="space-y-3">
                  {historyLoading ? (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading audit timeline...</div>
                  ) : campusHistory.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                      <History className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                      <p className="text-xs">No status transitions recorded yet.</p>
                    </div>
                  ) : (
                    campusHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-500 dark:text-slate-400">{h.oldStatus}</span>
                            <span className="text-slate-400">➔</span>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{h.newStatus}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(h.changedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">"{h.reason}"</p>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Recorded by {h.changedByName}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL 3: EDIT CAMPUS DETAILS                                           */}
      {/* ========================================================================= */}
      {editingCampus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-colors">
            <div className="p-6 bg-gradient-to-r from-blue-950 to-indigo-950 border-b border-blue-900/40 flex items-center justify-between text-white">
              <h3 className="text-lg font-black text-white">Edit Campus Details</h3>
              <button onClick={() => setEditingCampus(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Campus Name
                </label>
                <input
                  type="text"
                  required
                  value={editingCampus.name}
                  onChange={(e) => setEditingCampus({ ...editingCampus, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Campus Code (Immutable Identifier)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingCampus.code}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-400 dark:text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Region
                  </label>
                  <select
                    value={editingCampus.region}
                    onChange={(e) => setEditingCampus({ ...editingCampus, region: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    {ETHIOPIAN_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCampus.city}
                    onChange={(e) => setEditingCampus({ ...editingCampus, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Physical Cathedral Address
                </label>
                <input
                  type="text"
                  value={editingCampus.address || ""}
                  onChange={(e) => setEditingCampus({ ...editingCampus, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCampus(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL 4: CHANGE CAMPUS STATUS WITH MANDATORY REASON                     */}
      {/* ========================================================================= */}
      {statusModalCampus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-colors">
            <div className="p-6 bg-gradient-to-r from-indigo-950 to-blue-950 border-b border-indigo-900/40 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Transition Campus Status</h3>
                  <p className="text-xs text-indigo-300/80">{statusModalCampus.name} ({statusModalCampus.code})</p>
                </div>
              </div>
              <button
                onClick={() => setStatusModalCampus(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Target Operational Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ACTIVE", "INACTIVE", "ARCHIVED"] as CampusStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusTarget(st)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        statusTarget === st
                          ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30"
                          : "bg-slate-50 dark:bg-[#060a12] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {statusTarget !== "ACTIVE" && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rule Notice:</strong> Inactive or Archived campuses cannot accept new CSV member imports
                    or execute new allocation runs. Existing member records and allocations are strictly preserved.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Reason for Transition <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Document reason for administrative audit record (minimum 5 characters)..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStatusModalCampus(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {submitting ? "Transitioning..." : "Confirm Status Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusesPage;
