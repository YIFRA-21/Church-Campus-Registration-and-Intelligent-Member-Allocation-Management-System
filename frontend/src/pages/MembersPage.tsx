import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import {
  fetchMembers,
  createMember,
  updateMember,
  deleteMember,
  batchUpdateMemberStatus,
  batchDeleteMembers,
  fetchMemberDashboardSummary,
  changeMemberStatus,
  fetchMemberHistory,
  archiveMember,
} from "../api/member.api";
import { Campus } from "../types/campus";
import {
  Member,
  CreateMemberPayload,
  MemberStatusHistory,
  MemberDashboardSummary,
  Gender,
  MemberCategory,
  SpiritualStatus,
  MemberStatus,
} from "../types/member";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  Phone,
  Mail,
  MapPin,
  Church,
  GraduationCap,
  Sparkles,
  Download,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  X,
  Eye,
  Edit3,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Activity,
  FileText,
  Layers,
  Award,
  History,
  UserCheck,
  UserX,
  Building2,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const ETHIOPIAN_REGIONS = [
  "አዲስ አበባ",
  "ኦሮሚያ",
  "አማራ",
  "ትግራይ",
  "ደቡብ ኢትዮጵያ",
  "ሲዳማ",
  "ሶማሌ",
  "አፋር",
  "ቤንሻንጉል ጉሙዝ",
  "ጋምቤላ",
  "ሐረሪ",
  "ድሬዳዋ",
];

const ETHIOPIAN_LANGUAGES = [
  "አማርኛ",
  "Afaan Oromoo",
  "ትግርኛ",
  "Somali",
  "Sidama",
  "Wolaytta",
  "English",
];

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1"];

export const MembersPage: React.FC = () => {
  const { token, hasPermission, user } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<MemberDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [spiritualFilter, setSpiritualFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null); // For Detail Drawer
  const [editingMember, setEditingMember] = useState<Member | null>(null); // For Edit Modal
  const [statusTargetMember, setStatusTargetMember] = useState<Member | null>(null); // For Status Transition Modal
  const [historyTargetMember, setHistoryTargetMember] = useState<Member | null>(null); // For Audit Modal
  const [historyList, setHistoryList] = useState<MemberStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Form State for Registration
  const [formData, setFormData] = useState<CreateMemberPayload>({
    campusId: "",
    firstName: "",
    lastName: "",
    christianName: "",
    gender: "MALE",
    phoneNumber: "",
    email: "",
    academicDepartment: "",
    originRegion: "አዲስ አበባ",
    zone: "",
    woreda: "",
    kebele: "",
    dormBlock: "",
    dormRoom: "",
    language: "አማርኛ",
    emergencyContactName: "",
    emergencyContactPhone: "",
    sundaySchoolDuration: "3 ዓመት",
    age: 21,
    category: "STUDENT",
    spiritualStatus: "REGULAR",
    educationLevel: "Undergraduate Degree",
    address: "",
    emergencyContact: "",
    status: "ACTIVE",
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<CreateMemberPayload>>({});

  // Status Change State (Rule 9)
  const [targetStatus, setTargetStatus] = useState<MemberStatus>("ACTIVE");
  const [statusReason, setStatusReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Campuses
  useEffect(() => {
    async function loadCampuses() {
      if (!token) return;
      try {
        const cList = await fetchCampuses(token);
        setCampuses(cList);
        if (cList.length > 0 && !selectedCampusId) {
          setSelectedCampusId(cList[0].id);
          setFormData((prev) => ({ ...prev, campusId: cList[0].id }));
        }
      } catch (err: any) {
        console.error("Failed to load campuses:", err);
      }
    }
    loadCampuses();
  }, [token]);

  // Load Executive Dashboard Summary
  const loadSummary = useCallback(async () => {
    if (!token) return;
    setSummaryLoading(true);
    try {
      const data = await fetchMemberDashboardSummary(token, selectedCampusId || undefined);
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to load dashboard summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [token, selectedCampusId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Load Members List
  const loadMembers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMembers(token, {
        campusId: selectedCampusId || undefined,
        search: search.trim() || undefined,
        gender: (genderFilter as Gender) || undefined,
        category: (categoryFilter as MemberCategory) || undefined,
        spiritualStatus: (spiritualFilter as SpiritualStatus) || undefined,
        status: (statusFilter as MemberStatus) || undefined,
        page,
        limit: 10,
      });
      setMembers(res.members);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || "Failed to load members directory");
    } finally {
      setLoading(false);
    }
  }, [token, selectedCampusId, search, genderFilter, categoryFilter, spiritualFilter, statusFilter, page]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Handle Create Member
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateMemberPayload = {
        ...formData,
        campusId: selectedCampusId || formData.campusId,
      };
      await createMember(payload, token);
      setSuccessMsg("Member registered successfully with auto-generated code!");
      setShowCreateModal(false);
      // Reset form
      setFormData({
        campusId: selectedCampusId || "",
        firstName: "",
        lastName: "",
        christianName: "",
        gender: "MALE",
        phoneNumber: "",
        email: "",
        academicDepartment: "",
        originRegion: "አዲስ አበባ",
        zone: "",
        woreda: "",
        kebele: "",
        dormBlock: "",
        dormRoom: "",
        language: "አማርኛ",
        emergencyContactName: "",
        emergencyContactPhone: "",
        sundaySchoolDuration: "3 ዓመት",
        age: 21,
        category: "STUDENT",
        spiritualStatus: "REGULAR",
        educationLevel: "Undergraduate Degree",
        address: "",
        emergencyContact: "",
        status: "ACTIVE",
      });
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Failed to register member");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setEditFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      christianName: member.christianName || "",
      gender: member.gender,
      phoneNumber: member.phoneNumber || "",
      email: member.email || "",
      academicDepartment: member.academicDepartment || "",
      originRegion: member.originRegion || "አዲስ አበባ",
      zone: member.zone || "",
      woreda: member.woreda || "",
      kebele: member.kebele || "",
      dormBlock: member.dormBlock || "",
      dormRoom: member.dormRoom || "",
      language: member.language || "አማርኛ",
      emergencyContactName: member.emergencyContactName || "",
      emergencyContactPhone: member.emergencyContactPhone || "",
      sundaySchoolDuration: member.sundaySchoolDuration || "3 ዓመት",
      age: member.age || 21,
      category: member.category,
      spiritualStatus: member.spiritualStatus,
      educationLevel: member.educationLevel,
      address: member.address || "",
    });
  };

  // Handle Update Member (Rule 6: Member Code Immutable)
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingMember) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateMember(editingMember.id, editFormData, token);
      setSuccessMsg(`Member ${editingMember.memberId} updated successfully!`);
      setEditingMember(null);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Failed to update member");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Status Transition Modal (Rule 9)
  const openStatusModal = (member: Member) => {
    setStatusTargetMember(member);
    setTargetStatus(member.status);
    setStatusReason("");
  };

  // Handle Status Transition with Mandatory Reason
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !statusTargetMember) return;
    if (!statusReason.trim()) {
      setError("Official justification reason is required for status transition.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await changeMemberStatus(statusTargetMember.id, targetStatus, statusReason.trim(), token);
      setSuccessMsg(`Member status transitioned to ${targetStatus}!`);
      setStatusTargetMember(null);
      setStatusReason("");
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Failed to change member status");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Audit History Modal
  const openHistoryModal = async (member: Member) => {
    if (!token) return;
    setHistoryTargetMember(member);
    setHistoryLoading(true);
    try {
      const history = await fetchMemberHistory(member.id, token);
      setHistoryList(history);
    } catch (err: any) {
      console.error("Failed to load member history:", err);
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle Single Soft Delete / Archive
  const handleDeleteConfirm = async () => {
    if (!token || !deletingMember) return;
    setSubmitting(true);
    try {
      await deleteMember(deletingMember.id, token);
      setSuccessMsg(`Member ${deletingMember.memberId} archived successfully.`);
      setDeletingMember(null);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Failed to delete member");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Batch Status Update
  const handleBatchStatus = async (status: MemberStatus) => {
    if (!token || selectedIds.length === 0) return;
    try {
      await batchUpdateMemberStatus(selectedIds, status, token);
      setSuccessMsg(`Updated status for ${selectedIds.length} members to ${status}!`);
      setSelectedIds([]);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Batch status update failed");
    }
  };

  // Handle Batch Delete
  const handleBatchDeleteConfirm = async () => {
    if (!token || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await batchDeleteMembers(selectedIds, token);
      setSuccessMsg(`Archived ${selectedIds.length} selected members.`);
      setSelectedIds([]);
      setShowBatchDeleteModal(false);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Batch deletion failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = [
      "Member ID",
      "Full Name",
      "Christian Name",
      "Gender",
      "Status",
      "Phone",
      "Email",
      "Academic Department",
      "Category",
      "Spiritual Status",
      "Origin Region",
      "Dorm Room",
    ];
    const rows = members.map((m) => [
      m.memberId,
      `"${m.fullName}"`,
      `"${m.christianName || ""}"`,
      m.gender,
      m.status,
      m.phoneNumber || "",
      m.email || "",
      `"${m.academicDepartment || ""}"`,
      m.category,
      m.spiritualStatus,
      `"${m.originRegion || ""}"`,
      `"${m.dormRoom || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CCIMAS_Members_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Helper
  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="cimas-badge cimas-badge--active">
            <span className="badge-ping-wrap">
              <span className="badge-ping"></span>
              <span className="badge-dot"></span>
            </span>
            ACTIVE
          </span>
        );
      case "INACTIVE":
        return (
          <span className="cimas-badge cimas-badge--inactive">
            <span className="badge-ping-wrap">
              <span className="badge-ping"></span>
              <span className="badge-dot"></span>
            </span>
            INACTIVE
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="cimas-badge cimas-badge--suspended">
            <span className="badge-ping-wrap">
              <span className="badge-ping"></span>
              <span className="badge-dot"></span>
            </span>
            SUSPENDED
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="cimas-badge cimas-badge--on-hold">
            <span className="badge-ping-wrap">
              <span className="badge-ping"></span>
              <span className="badge-dot"></span>
            </span>
            ON HOLD
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="cimas-badge cimas-badge--archived">
            <span className="badge-dot"></span>
            ARCHIVED
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  // Category Pie Data for Recharts
  const categoryPieData = useMemo(() => {
    if (!summary?.categoryDistribution) return [];
    return Object.entries(summary.categoryDistribution).map(([name, value], idx) => ({
      name,
      value,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [summary]);

  // Gender Bar Data for Recharts
  const genderBarData = useMemo(() => {
    if (!summary?.genderDistribution) return [];
    return summary.genderDistribution.map((item) => ({
      name: item.gender,
      count: item.count,
    }));
  }, [summary]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 pb-16 cimas-mesh-bg transition-colors">
      {/* 1. CANVA-INSPIRED EXECUTIVE HERO BANNER WITH SCSS DYNAMICS */}
      <div className="cimas-hero-banner relative mb-8">
        <div className="ambient-orb ambient-orb--blue" />
        <div className="ambient-orb ambient-orb--purple" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="hero-badge">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse-glow" />
              <span>Module 3: Enterprise Member Management</span>
            </div>
            <h1 className="hero-title flex items-center gap-3">
              <Users className="w-9 h-9 text-indigo-400" />
              Member CRM & Fellowship Directory
            </h1>
            <p className="hero-subtitle">
              Centralized registry enforcing single-campus membership, concurrency-safe member code
              generation (<span className="text-amber-300 font-mono font-bold">MEM-YYYY-XXXX</span>), status audit trails, and Ethiopian Orthodox fellowship criteria.
            </p>
          </div>

          {/* Quick Actions & Campus Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Campus Selector */}
            <div className="relative">
              <select
                value={selectedCampusId}
                onChange={(e) => {
                  setSelectedCampusId(e.target.value);
                  setPage(1);
                }}
                className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-none backdrop-blur-md"
              >
                <option value="" className="text-slate-900">
                  All Campuses (Enterprise View)
                </option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="cimas-btn-dynamic px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-medium shadow-sm backdrop-blur-md"
              title="Export filtered records to CSV"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              Export
            </button>

            {/* Refresh */}
            <button
              onClick={() => {
                loadMembers();
                loadSummary();
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition backdrop-blur-md"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* New Member Registration Button */}
            {hasPermission("members:write") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="cimas-btn-dynamic cimas-btn-dynamic--primary px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                Register Member
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Flash Notifications */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 text-red-800 dark:text-red-300 text-sm flex items-center justify-between shadow-sm animate-scale-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm animate-scale-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. SIX EXECUTIVE KPI METRIC CARDS WITH SCSS HOVER LIFTS & GLOW */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Total Members */}
          <div className="cimas-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Total Enrolled</span>
              <div className="kpi-icon-wrap">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="kpi-value">
              {summaryLoading ? "..." : summary?.totalMembers ?? 0}
            </div>
            <div className="kpi-footer">
              <span className="kpi-trend-positive">100%</span> Single campus rule
            </div>
          </div>

          {/* Card 2: Active Fellowship */}
          <div className="cimas-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Active Fellowship</span>
              <div className="kpi-icon-wrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="kpi-value text-emerald-600 dark:text-emerald-400">
              {summaryLoading ? "..." : summary?.activeMembers ?? 0}
            </div>
            <div className="kpi-footer">
              <span className="kpi-trend-positive">Ready for allocation</span>
            </div>
          </div>

          {/* Card 3: Inactive & On Hold */}
          <div className="cimas-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">On Hold / Inactive</span>
              <div className="kpi-icon-wrap">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="kpi-value text-amber-600 dark:text-amber-400">
              {summaryLoading ? "..." : (summary?.inactiveMembers ?? 0) + (summary?.onHoldMembers ?? 0)}
            </div>
            <div className="kpi-footer">
              <span className="kpi-trend-warning">Requires review</span>
            </div>
          </div>

          {/* Card 4: Suspended & Archived */}
          <div className="cimas-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Archived / Flagged</span>
              <div className="kpi-icon-wrap">
                <Archive className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className="kpi-value text-rose-600 dark:text-rose-400">
              {summaryLoading ? "..." : (summary?.archivedMembers ?? 0) + (summary?.suspendedMembers ?? 0)}
            </div>
            <div className="kpi-footer">
              <span>Preserved in DB</span>
            </div>
          </div>

          {/* Card 5: Data Completeness */}
          <div className="cimas-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Data Quality</span>
              <div className="kpi-icon-wrap">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="kpi-value text-blue-600 dark:text-blue-400">
              {summaryLoading ? "..." : `${summary?.completenessRate ?? 95}%`}
            </div>
            <div className="kpi-footer">
              <span>Profile completeness</span>
            </div>
          </div>

          {/* Card 6: Students vs Non-Students */}
          <div className="cimas-kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Campus Students</span>
              <div className="kpi-icon-wrap">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="kpi-value text-purple-600 dark:text-purple-400">
              {summaryLoading ? "..." : summary?.categoryDistribution?.STUDENT ?? 0}
            </div>
            <div className="kpi-footer">
              <span>Academic fellowship</span>
            </div>
          </div>
        </div>

        {/* 3. RECHARTS DEMOGRAPHIC VISUALIZATIONS WITH DYNAMIC GLASS CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Category Distribution */}
          <div className="cimas-card cimas-card--primary p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Fellowship Demographic Breakdown
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">By Member Category</span>
            </div>
            <div className="h-48 flex items-center justify-center">
              {categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={35}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">No demographic data available</span>
              )}
            </div>
          </div>

          {/* Chart 2: Gender Distribution */}
          <div className="cimas-card cimas-card--emerald p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Gender Ratio & Spiritual Ministry
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Active Membership</span>
            </div>
            <div className="h-48 flex items-center justify-center">
              {genderBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderBarData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">No gender data available</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. ADVANCED FILTERING & SEARCH TOOLBAR */}
        <div className="cimas-filter-toolbar space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by code, full name, phone, dept..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="STUDENT">STUDENT</option>
                <option value="YOUTH">YOUTH</option>
                <option value="YOUNG_ADULT">YOUNG ADULT</option>
                <option value="ADULT">ADULT</option>
                <option value="ELDER">ELDER</option>
              </select>
            </div>

            {/* Spiritual Status Filter */}
            <div>
              <select
                value={spiritualFilter}
                onChange={(e) => {
                  setSpiritualFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Spiritual Roles</option>
                <option value="REGULAR">REGULAR</option>
                <option value="SERVANT">SERVANT</option>
                <option value="DEACON">DEACON</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Genders</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {(search || statusFilter || categoryFilter || spiritualFilter || genderFilter) && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Filtering active results ({totalCount} found)</span>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setCategoryFilter("");
                  setSpiritualFilter("");
                  setGenderFilter("");
                  setPage(1);
                }}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* 5. BATCH ACTIONS TOOLBAR (Appears when items are selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-900 text-white rounded-xl p-3 px-5 flex flex-wrap items-center justify-between gap-4 shadow-md animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-indigo-300" />
              <span className="font-semibold text-sm">
                {selectedIds.length} member{selectedIds.length > 1 ? "s" : ""} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchStatus("ACTIVE")}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold transition"
              >
                Set Active
              </button>
              <button
                onClick={() => handleBatchStatus("INACTIVE")}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold transition"
              >
                Set Inactive
              </button>
              <button
                onClick={() => handleBatchStatus("ARCHIVED")}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-xs font-semibold transition"
              >
                Archive Selected
              </button>
              <button
                onClick={() => setShowBatchDeleteModal(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold transition"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-xs text-indigo-200 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 6. PRIMARY DATA TABLE WITH DYNAMIC SCSS GLASS CONTAINER */}
        <div className="cimas-table-container">
          <div className="table-responsive">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-200">
                      {selectedIds.length > 0 && selectedIds.length === members.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th>Member ID & Code</th>
                  <th>Full & Christian Name</th>
                  <th>Gender & Age</th>
                  <th>Academic Dept / Category</th>
                  <th>Spiritual Status</th>
                  <th>Contact</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading member directory...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-400 animate-float" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No members found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search term.</p>
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const isSelected = selectedIds.includes(m.id);
                    return (
                      <tr
                        key={m.id}
                        className={isSelected ? "row-selected" : ""}
                      >
                        {/* Checkbox */}
                        <td className="text-center">
                          <button
                            onClick={() => toggleSelectOne(m.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Member ID Code */}
                        <td>
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            {m.memberId}
                          </span>
                        </td>

                        {/* Full & Christian Name */}
                        <td>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{m.fullName}</div>
                          {m.christianName && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <Church className="w-3 h-3 text-amber-500" />
                              {m.christianName}
                            </div>
                          )}
                        </td>

                        {/* Gender & Age */}
                        <td className="text-slate-600 dark:text-slate-300">
                          <div>{m.gender}</div>
                          <div className="text-xs text-slate-400">{m.age ? `${m.age} yrs` : "N/A"}</div>
                        </td>

                        {/* Academic Dept / Category */}
                        <td>
                          <div className="text-slate-800 dark:text-slate-200 font-medium">
                            {m.academicDepartment || "Undeclared"}
                          </div>
                          <span className="inline-block text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                            {m.category}
                          </span>
                        </td>

                        {/* Spiritual Status */}
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              m.spiritualStatus === "DEACON"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                : m.spiritualStatus === "SERVANT"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {m.spiritualStatus}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                          {m.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {m.phoneNumber}
                            </div>
                          )}
                          {m.dormRoom && (
                            <div className="text-[11px] text-slate-400">Dorm: {m.dormRoom}</div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="text-center">{getStatusBadge(m.status)}</td>

                        {/* Actions */}
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Profile Drawer */}
                            <button
                              onClick={() => setSelectedMember(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="View Full Profile (360°)"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit (Rule 6: Member Code Immutable) */}
                            {hasPermission("members:write") && (
                              <button
                                onClick={() => openEditModal(m)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Edit Member Profile"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Status Change (Rule 9: Mandatory Justification) */}
                            {hasPermission("members:write") && (
                              <button
                                onClick={() => openStatusModal(m)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Transition Member Status"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            {/* Audit Trail Timeline */}
                            <button
                              onClick={() => openHistoryModal(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Audit History Timeline"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Soft Archive / Delete */}
                            {hasPermission("members:delete") && (
                              <button
                                onClick={() => setDeletingMember(m)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Archive Member Record"
                              >
                                <Trash2 className="w-4 h-4" />
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

          {/* Pagination Footer */}
          <div className="table-pagination">
            <div>
              Showing {members.length} of {totalCount} total members (Page {page} of {totalPages || 1})
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-200 px-2">{page}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 font-medium"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. FIVE-SECTION REGISTRATION MODAL WITH DYNAMIC SCSS GLASS
         ========================================================================= */}
      {showCreateModal && (
        <div className="cimas-modal-overlay">
          <div className="modal-dialog max-w-4xl">
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  Official Member Registration
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  5-Section Fellowship Profile (Automatic sequence code generation: MEM-YYYY-XXXX)
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SECTION 1: Campus & Academic Identity */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Section 1: Campus & Academic Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Church Campus *
                    </label>
                    <select
                      required
                      value={formData.campusId}
                      onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select Campus</option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Department *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science, Medicine"
                      value={formData.academicDepartment}
                      onChange={(e) => setFormData({ ...formData, academicDepartment: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Education Level
                    </label>
                    <select
                      value={formData.educationLevel}
                      onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Undergraduate Degree">Undergraduate Degree</option>
                      <option value="Postgraduate Masters">Postgraduate Masters</option>
                      <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                      <option value="Diploma / TVET">Diploma / TVET</option>
                      <option value="High School">High School</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Personal Identity */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Section 2: Personal Profile & Baptism
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name (ስም) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yohannes"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name (የአባት ስም) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Haile"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Christian Name (የክርስትና ስም)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ወልደ ማርያም"
                      value={formData.christianName}
                      onChange={(e) => setFormData({ ...formData, christianName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fellowship Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as MemberCategory })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="YOUTH">YOUTH</option>
                      <option value="YOUNG_ADULT">YOUNG ADULT</option>
                      <option value="ADULT">ADULT</option>
                      <option value="ELDER">ELDER</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Contact & Campus Residence */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Section 3: Contact & Campus Residence
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+251911223344"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="member@c-cimas.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dorm Block
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Block 42"
                      value={formData.dormBlock}
                      onChange={(e) => setFormData({ ...formData, dormBlock: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dorm Room
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 204"
                      value={formData.dormRoom}
                      onChange={(e) => setFormData({ ...formData, dormRoom: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {ETHIOPIAN_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Origin & Spiritual Heritage */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Church className="w-4 h-4" /> Section 4: Origin & Spiritual Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Origin Region (ክልል)
                    </label>
                    <select
                      value={formData.originRegion}
                      onChange={(e) => setFormData({ ...formData, originRegion: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {ETHIOPIAN_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Spiritual Status *
                    </label>
                    <select
                      value={formData.spiritualStatus}
                      onChange={(e) => setFormData({ ...formData, spiritualStatus: e.target.value as SpiritualStatus })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="REGULAR">REGULAR (ምእመን)</option>
                      <option value="SERVANT">SERVANT (አገልጋይ)</option>
                      <option value="DEACON">DEACON (ዲያቆን)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sunday School Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4 ዓመት"
                      value={formData.sundaySchoolDuration}
                      onChange={(e) => setFormData({ ...formData, sundaySchoolDuration: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Emergency Contact */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Section 5: Emergency & Guardian Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      placeholder="Guardian / Family Name"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+251911..."
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Concurrency-safe automatic code note */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  Member Code will be automatically generated atomically on submission (e.g.{" "}
                  <code className="font-mono font-bold">MEM-2026-XXXX</code>) guaranteeing concurrency safety.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. EDIT MODAL (Rule 6: Member Code Immutable)
         ========================================================================= */}
      {editingMember && (
        <div className="cimas-modal-overlay">
          <div className="modal-dialog max-w-3xl">
            <div className="modal-header">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-400" />
                  Edit Member Profile
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Member ID: <span className="font-mono text-amber-300">{editingMember.memberId}</span> (Strictly Immutable per Rule 6)
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.lastName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Christian Name</label>
                  <input
                    type="text"
                    value={editFormData.christianName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, christianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editFormData.phoneNumber || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Department</label>
                  <input
                    type="text"
                    value={editFormData.academicDepartment || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, academicDepartment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Spiritual Status</label>
                  <select
                    value={editFormData.spiritualStatus || "REGULAR"}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, spiritualStatus: e.target.value as SpiritualStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="REGULAR">REGULAR</option>
                    <option value="SERVANT">SERVANT</option>
                    <option value="DEACON">DEACON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dorm Block & Room</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Block"
                      value={editFormData.dormBlock || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, dormBlock: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Room"
                      value={editFormData.dormRoom || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, dormRoom: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editFormData.category || "STUDENT"}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, category: e.target.value as MemberCategory })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="YOUTH">YOUTH</option>
                    <option value="YOUNG_ADULT">YOUNG ADULT</option>
                    <option value="ADULT">ADULT</option>
                    <option value="ELDER">ELDER</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. STATUS TRANSITION MODAL (Rule 9: Mandatory Justification)
         ========================================================================= */}
      {statusTargetMember && (
        <div className="cimas-modal-overlay">
          <div className="modal-dialog max-w-md p-6">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <UserCheck className="w-6 h-6 animate-pulse-glow" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Member Status Transition</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Updating status for <span className="font-semibold text-slate-900 dark:text-slate-100">{statusTargetMember.fullName}</span> ({statusTargetMember.memberId}). Current status:{" "}
              <span className="font-bold">{statusTargetMember.status}</span>.
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as MemberStatus)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Justification Reason * (Rule 9 Audit Requirement)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter detailed reason for status change (stored in member_status_history audit log)..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStatusTargetMember(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !statusReason.trim()}
                  className="cimas-btn-dynamic cimas-btn-dynamic--gold px-5 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Confirm Status Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          10. STATUS HISTORY AUDIT TIMELINE MODAL
         ========================================================================= */}
      {historyTargetMember && (
        <div className="cimas-modal-overlay">
          <div className="modal-dialog max-w-lg">
            <div className="modal-header">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Status Audit History Trail
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {historyTargetMember.fullName} ({historyTargetMember.memberId})
                </p>
              </div>
              <button
                onClick={() => setHistoryTargetMember(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {historyLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading audit logs...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No status transition history recorded for this member.
                </div>
              ) : (
                <div className="page-audit">
                  <div className="audit-timeline">
                    {historyList.map((item) => (
                      <div key={item.id} className="timeline-node">
                        <div className="node-marker">
                          <Clock className="w-3 h-3 text-indigo-400" />
                        </div>
                        <div className="node-card">
                          <div className="text-xs text-slate-400 mb-1">
                            {new Date(item.changedAt).toLocaleString()}
                          </div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                              {item.oldStatus}
                            </span>
                            <span>→</span>
                            <span className="font-mono text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 rounded text-indigo-700 dark:text-indigo-300 font-bold">
                              {item.newStatus}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800 italic">
                            "{item.reason}"
                          </p>
                          <div className="mt-1 text-[11px] text-slate-400">
                            Authorized by: <span className="font-medium text-slate-600 dark:text-slate-300">{item.changedByName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          11. 360-DEGREE MEMBER DETAIL DRAWER
         ========================================================================= */}
      {selectedMember && (
        <div className="cimas-drawer-overlay">
          <div className="drawer-panel">
            {/* Drawer Header */}
            <div className="modal-header">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/30 rounded text-indigo-200">
                  {selectedMember.memberId}
                </span>
                <h3 className="text-xl font-bold mt-1 text-white">{selectedMember.fullName}</h3>
                {selectedMember.christianName && (
                  <p className="text-xs text-amber-300 flex items-center gap-1 mt-0.5">
                    <Church className="w-3.5 h-3.5" /> ክርስትና ስም: {selectedMember.christianName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-white/70 hover:text-white p-2 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body space-y-6 text-sm">
              {/* Status & Category Pills */}
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedMember.status)}
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  {selectedMember.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {selectedMember.spiritualStatus}
                </span>
              </div>

              {/* Grid Attributes */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400 block">Gender & Age</span>
                  <span className="font-semibold text-slate-800">
                    {selectedMember.gender}, {selectedMember.age || "N/A"} years
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Academic Department</span>
                  <span className="font-semibold text-slate-800">
                    {selectedMember.academicDepartment || "Undeclared"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Education Level</span>
                  <span className="font-semibold text-slate-800">{selectedMember.educationLevel}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Primary Language</span>
                  <span className="font-semibold text-slate-800">{selectedMember.language || "አማርኛ"}</span>
                </div>
              </div>

              {/* Contact & Campus Residence */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contact & Residence
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedMember.phoneNumber || "No phone registered"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{selectedMember.email || "No email registered"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>
                      Dorm: {selectedMember.dormBlock || "N/A"} - {selectedMember.dormRoom || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spiritual & Origin Heritage */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Spiritual Heritage & Origin
                </h4>
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400">Origin Region:</span>{" "}
                    <span className="font-semibold">{selectedMember.originRegion || "አዲስ አበባ"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Sunday School Experience:</span>{" "}
                    <span className="font-semibold">{selectedMember.sundaySchoolDuration || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Emergency Guardian
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">
                    {selectedMember.emergencyContactName || "Not Provided"}
                  </div>
                  <div className="text-slate-500">{selectedMember.emergencyContactPhone || ""}</div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const m = selectedMember;
                  setSelectedMember(null);
                  openEditModal(m);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          12. DELETE / ARCHIVE CONFIRMATION MODALS
         ========================================================================= */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Archive Member Record</h3>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to archive{" "}
              <span className="font-semibold text-slate-900">{deletingMember.fullName}</span> (
              {deletingMember.memberId})? Per Rule 5, this record will be safely soft-archived rather
              than permanently erased from historical registers.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {submitting ? "Archiving..." : "Confirm Soft Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Batch Archive Members</h3>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to soft-archive{" "}
              <span className="font-semibold text-slate-900">{selectedIds.length}</span> selected
              members? Records remain retained in historical audit tables.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDeleteConfirm}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {submitting ? "Archiving..." : "Archive Selected"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
