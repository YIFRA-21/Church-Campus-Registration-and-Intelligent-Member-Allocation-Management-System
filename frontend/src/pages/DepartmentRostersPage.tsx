import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import { fetchDepartments, fetchDepartmentRoster, exportDepartmentRosterExcel } from "../api/department.api";
import { updateMember, deleteMember, batchUpdateMemberStatus } from "../api/member.api";
import { Campus } from "../types/campus";
import { Department, DepartmentRosterResponse } from "../types/department";
import { Member, Gender, MemberCategory, SpiritualStatus, MemberStatus, CreateMemberPayload } from "../types/member";
import {
  Users,
  Building2,
  Layers,
  Search,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Eye,
  Edit,
  Lock,
  UserMinus,
  Trash2,
  X,
  CheckCircle2,
  RefreshCw,
  Percent,
  BookOpen,
  UserCheck,
  GraduationCap,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  UserX,
} from "lucide-react";

export const DepartmentRostersPage: React.FC = () => {
  const { token, hasPermission, user } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  const [rosterData, setRosterData] = useState<DepartmentRosterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [spiritualStatus, setSpiritualStatus] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Row selection for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action Modals State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<Member | null>(null);
  const [showBatchUnassignModal, setShowBatchUnassignModal] = useState(false);

  // Edit Form Data
  const [editFormData, setEditFormData] = useState<Partial<CreateMemberPayload>>({});
  const [submitting, setSubmitting] = useState(false);

  // 1. Load campuses on mount
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
        setError(err instanceof Error ? err.message : "Failed to load campuses");
      }
    }
    loadCampuses();
  }, [token]);

  // 2. Load departments when campus changes
  useEffect(() => {
    async function loadDepts() {
      if (!token || !selectedCampusId) return;
      try {
        const deptList = await fetchDepartments(token, selectedCampusId);
        setDepartments(deptList);
        if (deptList.length > 0) {
          // If previously selected dept is in new list, keep it; otherwise select first
          const exists = deptList.some((d) => d.id === selectedDeptId);
          if (!exists) {
            setSelectedDeptId(deptList[0].id);
          }
        } else {
          setSelectedDeptId("");
          setRosterData(null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load departments");
      }
    }
    loadDepts();
  }, [token, selectedCampusId]);

  // 3. Fetch roster when selected department or filters change
  const loadRoster = async () => {
    if (!token || !selectedDeptId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDepartmentRoster(
        selectedDeptId,
        {
          page,
          limit,
          search: search.trim() || undefined,
          gender: gender || undefined,
          category: category || undefined,
          spiritualStatus: spiritualStatus || undefined,
        },
        token
      );
      setRosterData(res);
      setSelectedIds([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load department roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [token, selectedDeptId, page, limit, search, gender, category, spiritualStatus]);

  // Clear toast notifications after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Selected Department and Campus Objects
  const selectedCampus = campuses.find((c) => c.id === selectedCampusId);
  const selectedDepartment = departments.find((d) => d.id === selectedDeptId);

  // Filtered members list on current page
  const displayedMembers = useMemo(() => {
    if (!rosterData) return [];
    if (!statusFilter) return rosterData.members;
    return rosterData.members.filter((m) => m.status === statusFilter);
  }, [rosterData, statusFilter]);

  // Selected Department's Live Telemetry Dashboard Metrics
  const deptAnalytics = useMemo(() => {
    if (rosterData?.analytics) {
      return rosterData.analytics;
    }

    // Fallback calculation from members array
    const members = rosterData?.members || [];
    const totalAllocated = rosterData?.department?.allocatedMembersCount || members.length;
    const menCount = members.filter((m) => m.gender === "MALE").length;
    const womenCount = members.filter((m) => m.gender === "FEMALE").length;
    const deaconsCount = members.filter((m) => m.spiritualStatus === "DEACON").length;
    const servantsCount = members.filter((m) => m.spiritualStatus === "SERVANT").length;
    const regularCount = members.filter((m) => m.spiritualStatus === "REGULAR").length;
    const activeCount = members.filter((m) => m.status === "ACTIVE").length;

    let ssSenior = 0; // 5+ years
    let ssMid = 0;    // 3-4 years
    let ssJunior = 0; // 1-2 years
    let ssTotal = 0;

    for (const m of members) {
      const d = m.sundaySchoolDuration || "";
      if (d && d !== "—" && d.trim() !== "") {
        ssTotal++;
        const match = d.match(/(\d+)/);
        const years = match ? parseInt(match[1], 10) : 0;
        if (years >= 5 || d.includes("5") || d.includes("6") || d.includes("7") || d.includes("8") || d.includes("9")) {
          ssSenior++;
        } else if (years >= 3 || d.includes("3") || d.includes("4")) {
          ssMid++;
        } else {
          ssJunior++;
        }
      }
    }

    const totalAge = members.reduce((sum, m) => sum + (m.age || 21), 0);
    const averageAge = members.length > 0 ? Math.round(totalAge / members.length) : 21;

    return {
      totalAllocated,
      menCount,
      womenCount,
      menPercentage: totalAllocated > 0 ? Math.round((menCount / totalAllocated) * 100) : 0,
      womenPercentage: totalAllocated > 0 ? Math.round((womenCount / totalAllocated) * 100) : 0,
      deaconsCount,
      servantsCount,
      regularCount,
      activeCount,
      sundaySchoolTotal: ssTotal,
      sundaySchoolSenior: ssSenior,
      sundaySchoolMid: ssMid,
      sundaySchoolJunior: ssJunior,
      averageAge,
    };
  }, [rosterData]);

  // Export handlers
  const handleExportExcel = async () => {
    if (!token || !selectedDeptId || !rosterData) return;
    setExporting(true);
    try {
      await exportDepartmentRosterExcel(selectedDeptId, rosterData.department.code, token);
      setSuccessMsg(`Exported official roster for ${rosterData.department.name} (.xlsx)`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to export roster");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Row selection logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayedMembers.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    displayedMembers.length > 0 && selectedIds.length === displayedMembers.length;

  // Batch Export to CSV
  const handleExportSelectedCSV = () => {
    const listToExport =
      selectedIds.length > 0
        ? displayedMembers.filter((m) => selectedIds.includes(m.id))
        : displayedMembers;

    if (listToExport.length === 0) return;

    const headers = [
      "ተ.ቁ (Member ID)",
      "ሙሉ ስም (Full Name)",
      "ክርስትና ስም (Baptismal Name)",
      "ጾታ (Gender)",
      "ስልክ ቁጥር (Phone)",
      "ዲፓርትመንት (Academic Dept)",
      "የመጡበት ክልል (Origin Region)",
      "ዞን (Zone)",
      "ወረዳ (Woreda)",
      "ቀበሌ (Kebele)",
      "ብሎክ (Block)",
      "ዶርም (Dorm)",
      "ቋንቋ (Language)",
      "የተጠሪ ስም (Emergency Contact)",
      "የተጠሪ ስልክ (Emergency Phone)",
      "የሰንበት ት/ቤት ቆይታ (Sunday School Duration)",
      "ዕድሜ (Age)",
      "ሁኔታ (Status)",
    ];

    const rows = listToExport.map((m) => [
      m.memberId,
      m.fullName,
      m.christianName || "—",
      m.gender === "MALE" ? "ወንድ" : "ሴት",
      m.phoneNumber || "—",
      m.academicDepartment || m.educationLevel || "—",
      m.originRegion || "—",
      m.zone || "—",
      m.woreda || "—",
      m.kebele || "—",
      m.dormBlock || "—",
      m.dormRoom || "—",
      m.language || "አማርኛ",
      m.emergencyContactName || m.emergencyContact || "—",
      m.emergencyContactPhone || "—",
      m.sundaySchoolDuration || "—",
      m.age || 21,
      m.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `C-CIMAS-${selectedDepartment?.code || "DEPT"}-Roster-${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`Exported ${listToExport.length} members to CSV roster.`);
  };

  // Quick Action Handlers (Admin Only)
  const handleToggleSuspend = async (member: Member) => {
    if (!token || !hasPermission("member.manage")) return;
    const nextStatus: MemberStatus = member.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await updateMember(member.id, { status: nextStatus }, token);
      setSuccessMsg(
        `Status updated for ${member.fullName} to ${
          nextStatus === "ACTIVE" ? "ንቁ (Active)" : "የታገደ (Suspended)"
        }.`
      );
      await loadRoster();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update member status");
    }
  };

  const handleOpenEdit = (member: Member) => {
    if (!hasPermission("member.manage")) return;
    setEditingMember(member);
    setEditFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      christianName: member.christianName,
      gender: member.gender,
      phoneNumber: member.phoneNumber,
      email: member.email,
      academicDepartment: member.academicDepartment,
      originRegion: member.originRegion,
      zone: member.zone,
      woreda: member.woreda,
      kebele: member.kebele,
      dormBlock: member.dormBlock,
      dormRoom: member.dormRoom,
      language: member.language,
      emergencyContactName: member.emergencyContactName,
      emergencyContactPhone: member.emergencyContactPhone,
      sundaySchoolDuration: member.sundaySchoolDuration,
      age: member.age,
      category: member.category,
      spiritualStatus: member.spiritualStatus,
      status: member.status,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingMember || !hasPermission("member.manage")) return;
    setSubmitting(true);
    try {
      await updateMember(editingMember.id, editFormData, token);
      setSuccessMsg(`Successfully updated member profile for ${editingMember.fullName}.`);
      setEditingMember(null);
      await loadRoster();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile changes");
    } finally {
      setSubmitting(false);
    }
  };

  // Unassign member from this department (Admin Only - returns to unallocated pool)
  const handleConfirmUnassign = async () => {
    if (!token || !unassignTarget || !hasPermission("member.manage")) return;
    setSubmitting(true);
    try {
      await updateMember(unassignTarget.id, { currentDepartmentId: null } as any, token);
      setSuccessMsg(
        `Unassigned ${unassignTarget.fullName} from ${selectedDepartment?.name}. Returned to pool.`
      );
      setUnassignTarget(null);
      await loadRoster();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unassign member");
    } finally {
      setSubmitting(false);
    }
  };

  // Batch Unassign selected members (Admin Only)
  const handleBatchUnassign = async () => {
    if (!token || selectedIds.length === 0 || !hasPermission("member.manage")) return;
    setSubmitting(true);
    try {
      for (const id of selectedIds) {
        await updateMember(id, { currentDepartmentId: null } as any, token);
      }
      setSuccessMsg(`Successfully unassigned ${selectedIds.length} members from department roster.`);
      setSelectedIds([]);
      setShowBatchUnassignModal(false);
      await loadRoster();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to batch unassign members");
    } finally {
      setSubmitting(false);
    }
  };

  // Batch Suspend selected members (Admin Only)
  const handleBatchSuspend = async () => {
    if (!token || selectedIds.length === 0 || !hasPermission("member.manage")) return;
    try {
      await batchUpdateMemberStatus(selectedIds, "SUSPENDED", token);
      setSuccessMsg(`Placed ${selectedIds.length} members on administrative suspension.`);
      setSelectedIds([]);
      await loadRoster();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to suspend members");
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMB BAR                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#0d5b61]" />
            <span>የዲፓርትመንት አባላት ማውጫ (Department Member Rosters)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time department quota accounting, gender & spiritual analytics, and official member roster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exporting || !rosterData || rosterData.members.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
            title="Export complete department roster to Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? "Generating..." : "Export Excel (.xlsx)"}</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!rosterData || rosterData.members.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
            title="Print or save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-950 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Evaluator Read-Only Oversight Notice */}
      {!hasPermission("member.manage") && (
        <div className="p-4 bg-sky-50 border border-sky-200 text-sky-950 text-xs rounded-2xl flex items-center gap-3 shadow-sm print:hidden">
          <Eye className="w-5 h-5 text-sky-700 shrink-0" />
          <div>
            <span className="font-bold">የገምጋሚ ዕይታ ሁነታ (Evaluator Oversight View):</span> You have permission to inspect department quotas, live telemetry, and allocated members. Modifying, editing, suspending, unassigning, or deleting members is strictly reserved for Administrators.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CAMPUS & DEPARTMENT SELECTOR CONTROLS                                  */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 print:hidden">
        {/* Campus Selector */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
            Select Campus (ግቢ ይምረጡ)
          </label>
          <select
            value={selectedCampusId}
            onChange={(e) => {
              setSelectedCampusId(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5b61] transition"
          >
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Department Selector */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            <Layers className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
            Select Department (የተመደቡበት ዲፓርትመንት)
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5b61] transition"
          >
            {departments.length === 0 ? (
              <option value="">No departments available</option>
            ) : (
              departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code}) — {d.targetPercentage}% target quota
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DEDICATED DEPARTMENT TELEMETRY DASHBOARD (COMPATIBLE HIGH-CONTRAST UI) */}
      {/* ========================================================================= */}
      {rosterData && (
        <div className="space-y-4">
          {/* Department Overview Master Card - Light Mode Compatible & High Contrast */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden border-t-4 border-t-[#0d5b61]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-teal-50 text-[#0d5b61] border border-teal-200 shadow-xs">
                    {rosterData.department.code}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCampus?.name || "Main Campus"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Quota Roster (ንቁ ምደባ)</span>
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {rosterData.department.name}
                </h2>

                {rosterData.department.description && (
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed font-medium">
                    {rosterData.department.description}
                  </p>
                )}
              </div>

              {/* Department Highlights - High Contrast Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Target Quota */}
                <div className="bg-sky-50 rounded-xl px-4 py-3 text-center border border-sky-200/80 min-w-[120px] shadow-xs">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-sky-800">
                    TARGET QUOTA
                  </p>
                  <p className="text-2xl font-black text-sky-950 mt-0.5">
                    {rosterData.department.targetPercentage}%
                  </p>
                  <p className="text-[10px] text-sky-700 font-semibold mt-0.5">Campus Quota</p>
                </div>

                {/* 2. Allocated Members */}
                <div className="bg-amber-50 rounded-xl px-4 py-3 text-center border border-amber-200/80 min-w-[120px] shadow-xs">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                    ALLOCATED
                  </p>
                  <p className="text-2xl font-black text-amber-950 mt-0.5">
                    {deptAnalytics.totalAllocated}
                  </p>
                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    {rosterData.department.capacityUtilization}% Capacity
                  </p>
                </div>

                {/* 3. Remaining Seats */}
                <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center border border-emerald-200/80 min-w-[120px] shadow-xs">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                    REMAINING
                  </p>
                  <p className="text-2xl font-black text-emerald-950 mt-0.5">
                    {rosterData.department.remainingCapacity}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    Of {rosterData.department.capacity} Seats
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity Progress Bar with High-Contrast Track and Text */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-700 mb-2">
                <span className="font-bold flex items-center gap-1.5 text-slate-800">
                  <Percent className="w-4 h-4 text-[#0d5b61]" />
                  <span>Capacity Utilization (የመቀበል አቅም አጠቃቀም)</span>
                </span>
                <span className="font-black text-slate-900">
                  {rosterData.department.capacityUtilization}% ({deptAnalytics.totalAllocated} / {rosterData.department.capacity} seats)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    rosterData.department.capacityUtilization >= 100
                      ? "bg-rose-500"
                      : rosterData.department.capacityUtilization >= 80
                      ? "bg-amber-500"
                      : "bg-[#0d5b61]"
                  }`}
                  style={{ width: `${Math.min(100, rosterData.department.capacityUtilization)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 8-Card Telemetry Grid for Selected Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Target Share % */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  TARGET SHARE (ዒላማ ምጣኔ %)
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {rosterData.department.targetPercentage}%
              </div>
              <div className="mt-2 pl-1.5 text-[11px] font-bold text-sky-800 flex items-center gap-1.5">
                <span>Campus Quota: {rosterData.department.targetPercentage}% of active members</span>
              </div>
            </div>

            {/* Card 2: Men (ወንዶች) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  MEN (ወንዶች)
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/80 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {deptAnalytics.menCount}
              </div>
              <div className="mt-2 pl-1.5 text-[11px] font-bold text-blue-800 flex items-center justify-between">
                <span>{deptAnalytics.menPercentage}% of department</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
                  ወንድ (Male)
                </span>
              </div>
            </div>

            {/* Card 3: Women (ሴቶች) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  WOMEN (ሴቶች)
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/80 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {deptAnalytics.womenCount}
              </div>
              <div className="mt-2 pl-1.5 text-[11px] font-bold text-rose-800 flex items-center justify-between">
                <span>{deptAnalytics.womenPercentage}% of department</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 text-[10px] font-bold">
                  ሴት (Female)
                </span>
              </div>
            </div>

            {/* Card 4: Ordained Deacons (ዲያቆናት) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  ORDAINED DEACONS (ዲያቆናት)
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/80 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {deptAnalytics.deaconsCount}
              </div>
              <div className="mt-2 pl-1.5 text-[11px] font-bold text-purple-800 flex items-center justify-between">
                <span>Liturgical leadership role</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold">
                  ዲያቆን
                </span>
              </div>
            </div>

            {/* Card 5: Sunday School Background */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  SUNDAY SCHOOL (ሰንበት ት/ቤት)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {deptAnalytics.sundaySchoolTotal}
              </div>
              <div className="mt-2 pl-1.5 text-[10px] font-bold text-emerald-900 flex flex-wrap items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                  5+ yrs: {deptAnalytics.sundaySchoolSenior}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                  3-4 yrs: {deptAnalytics.sundaySchoolMid}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                  1-2 yrs: {deptAnalytics.sundaySchoolJunior}
                </span>
              </div>
            </div>

            {/* Card 6: Allocated vs Capacity */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  SEAT CAPACITY (አጠቃላይ አቅም)
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200/80 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {rosterData.department.capacity}
              </div>
              <div className="mt-2 pl-1.5 text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                <span>{deptAnalytics.totalAllocated} filled</span>
                <span className="text-[10px] font-black text-indigo-950 px-1.5 py-0.5 rounded bg-indigo-100 border border-indigo-200">
                  {rosterData.department.remainingCapacity} seats left
                </span>
              </div>
            </div>

            {/* Card 7: Remaining Capacity */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  REMAINING SEATS (የቀረ ክፍት ቦታ)
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {rosterData.department.remainingCapacity}
              </div>
              <div className="mt-2 pl-1.5 text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                <span>
                  {rosterData.department.remainingCapacity > 0
                    ? "Available quota seats ready for assignment"
                    : "Department capacity reached"}
                </span>
              </div>
            </div>

            {/* Card 8: Average Age & Servants */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-[#0d5b61] shadow-[0_0_10px_rgba(13,91,97,0.4)]" />
              <div className="flex items-center justify-between mb-2 pl-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  AVERAGE AGE & SERVANTS (አማካይ ዕድሜ)
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0d5b61] border border-teal-200/80 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 pl-1.5 tracking-tight">
                {deptAnalytics.averageAge} yrs
              </div>
              <div className="mt-2 pl-1.5 text-[11px] font-bold text-teal-800 flex items-center justify-between">
                <span>{deptAnalytics.servantsCount} Servants (አገልጋይ)</span>
                <span className="px-2 py-0.5 rounded bg-teal-100 text-[#0d5b61] text-[10px] font-bold border border-teal-200">
                  {deptAnalytics.activeCount} Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SEARCH & STATUS FILTER PILLS                                           */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, baptismal name (ክርስትና ስም), ID, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d5b61] transition"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-stretch md:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`px-3 py-1 rounded-lg transition shrink-0 ${
                statusFilter === ""
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Statuses (ሁሉም)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-800 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active (ንቁ)</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                statusFilter === "INACTIVE"
                  ? "bg-white text-slate-800 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Inactive (ቦዘኔ)</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("SUSPENDED")}
              className={`px-3 py-1 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                statusFilter === "SUSPENDED"
                  ? "bg-white text-amber-800 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Suspended (የታገደ)</span>
            </button>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 font-medium bg-slate-50 focus:outline-none"
            >
              <option value="">All Genders (ጾታ)</option>
              <option value="MALE">ወንድ (Male)</option>
              <option value="FEMALE">ሴት (Female)</option>
            </select>

            <select
              value={spiritualStatus}
              onChange={(e) => {
                setSpiritualStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 font-medium bg-slate-50 focus:outline-none"
            >
              <option value="">All Spiritual Roles (መንፈሳዊ)</option>
              <option value="DEACON">ዲያቆን (Deacon)</option>
              <option value="SERVANT">አገልጋይ (Servant)</option>
              <option value="REGULAR">ምዕመን (Regular)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FLOATING BATCH ACTIONS BAR                                             */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs shadow-inner">
              {selectedIds.length} የተመረጡ (Selected)
            </span>
            <span className="text-xs text-slate-300">
              Department member batch actions available:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Batch Suspend */}
            {hasPermission("member.manage") && (
              <button
                type="button"
                onClick={handleBatchSuspend}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>እገድ (Suspend)</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Batch Unassign from Department */}
            {hasPermission("member.manage") && (
              <button
                type="button"
                onClick={() => setShowBatchUnassignModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>ከዲፓርትመንት አውጣ (Unassign)</span>
              </button>
            )}

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. OFFICIAL 17-COLUMN DEPARTMENT MEMBER ROSTER TABLE                     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-3 border-[#0d5b61] border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-slate-600">Loading department members...</p>
          </div>
        ) : !rosterData || displayedMembers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-800 text-base">No allocated members found in this roster</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {search || gender || spiritualStatus || statusFilter
                ? "No members match the applied search filter criteria. Try clearing filters."
                : "Run the Intelligent Allocation Engine from the Allocation tab to assign members to this department."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              {/* Deep Teal Header matching the Member List page standard */}
              <thead
                className="text-white font-bold uppercase tracking-wider text-[11px]"
                style={{
                  backgroundColor: "#0d5b61",
                }}
              >
                <tr className="border-b border-[#0a464a]">
                  {hasPermission("member.manage") && (
                    <th className="px-3.5 py-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-4 py-4">ተ.ቁ (No.)</th>
                  <th className="px-4 py-4">ሙሉ ስም (Full Name)</th>
                  <th className="px-4 py-4">ክርስትና ስም (Baptismal Name)</th>
                  <th className="px-3 py-4">ጾታ (Gender)</th>
                  <th className="px-4 py-4">ስልክ ቁጥር (Phone)</th>
                  <th className="px-4 py-4">ዲፓርትመንት (Academic Dept)</th>
                  <th className="px-4 py-4">የመጡበት ክልል (Origin Region)</th>
                  <th className="px-3 py-4">ዞን (Zone)</th>
                  <th className="px-3 py-4">ወረዳ (Woreda)</th>
                  <th className="px-3 py-4">ቀበሌ (Kebele)</th>
                  <th className="px-3 py-4">ብሎክ (Block)</th>
                  <th className="px-3 py-4">ዶርም (Dorm)</th>
                  <th className="px-3 py-4">ቋንቋ (Language)</th>
                  <th className="px-4 py-4">የተጠሪ ስም (Emergency Contact)</th>
                  <th className="px-4 py-4">የተጠሪ ስልክ (Emergency Phone)</th>
                  <th className="px-4 py-4">የሰንበት ት/ቤት ቆይታ (Sunday School)</th>
                  <th className="px-3 py-4">ዕድሜ (Age)</th>
                  <th className="px-4 py-4">ሁኔታ (Status)</th>
                  <th className="px-6 py-4 text-center">
                    {hasPermission("member.manage") ? "እርምጃዎች (Actions)" : "ዝርዝር (Details)"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedMembers.map((m, idx) => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors hover:bg-slate-50/90 ${
                        isSelected ? "bg-teal-50/60" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      {/* Checkbox (Admin Only) */}
                      {hasPermission("member.manage") && (
                        <td className="px-3.5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(m.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* 1. ተ.ቁ (No. / Member ID) */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-mono text-[11px]">
                          {m.memberId}
                        </span>
                      </td>

                      {/* 2. ሙሉ ስም (Full Name) */}
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{m.fullName}</span>
                          {m.spiritualStatus === "DEACON" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              ዲያቆን
                            </span>
                          )}
                          {m.spiritualStatus === "SERVANT" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-200">
                              አገልጋይ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. ክርስትና ስም (Baptismal Name) */}
                      <td className="px-4 py-3 text-blue-950 font-semibold font-serif">
                        {m.christianName || "—"}
                      </td>

                      {/* 4. ጾታ (Gender) */}
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.gender === "FEMALE"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-sky-50 text-sky-700 border border-sky-200"
                          }`}
                        >
                          {m.gender === "FEMALE" ? "ሴት (F)" : "ወንድ (M)"}
                        </span>
                      </td>

                      {/* 5. ስልክ ቁጥር (Phone) */}
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                        {m.phoneNumber || "—"}
                      </td>

                      {/* 6. ዲፓርትመንት (Academic Department) */}
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {m.academicDepartment || m.educationLevel || "—"}
                      </td>

                      {/* 7. የመጡበት ክልል (Origin Region) */}
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {m.originRegion || "—"}
                      </td>

                      {/* 8. ዞን (Zone) */}
                      <td className="px-3 py-3 text-slate-600">{m.zone || "—"}</td>

                      {/* 9. ወረዳ (Woreda) */}
                      <td className="px-3 py-3 text-slate-600">{m.woreda || "—"}</td>

                      {/* 10. ቀበሌ (Kebele) */}
                      <td className="px-3 py-3 text-slate-600">{m.kebele || "—"}</td>

                      {/* 11. ብሎክ (Block) */}
                      <td className="px-3 py-3 font-mono text-slate-700 font-bold">
                        {m.dormBlock || "—"}
                      </td>

                      {/* 12. ዶርም (Dorm) */}
                      <td className="px-3 py-3 font-mono text-slate-700 font-bold">
                        {m.dormRoom || "—"}
                      </td>

                      {/* 13. ቋንቋ (Language) */}
                      <td className="px-3 py-3 text-slate-600">{m.language || "አማርኛ"}</td>

                      {/* 14. የተጠሪ ስም (Emergency Contact) */}
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {m.emergencyContactName || m.emergencyContact || "—"}
                      </td>

                      {/* 15. የተጠሪ ስልክ (Emergency Phone) */}
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {m.emergencyContactPhone || "—"}
                      </td>

                      {/* 16. የሰንበት ት/ቤት ቆይታ (Sunday School Duration) */}
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          {m.sundaySchoolDuration || "—"}
                        </span>
                      </td>

                      {/* 17. ዕድሜ (Age) */}
                      <td className="px-3 py-3 font-mono text-slate-700 font-bold">
                        {m.age || 21}
                      </td>

                      {/* 18. ሁኔታ (Status) */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : m.status === "SUSPENDED"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              m.status === "ACTIVE"
                                ? "bg-emerald-500 animate-pulse"
                                : m.status === "SUSPENDED"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>
                            {m.status === "ACTIVE"
                              ? "ንቁ (Active)"
                              : m.status === "SUSPENDED"
                              ? "የታገደ (Suspended)"
                              : "ቦዘኔ (Inactive)"}
                          </span>
                        </span>
                      </td>

                      {/* 19. እርምጃዎች (Glowing Jewel Pill Button Set: View, Edit, Suspend, Unassign) */}
                      <td className="px-6 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-700/60 shadow-lg">
                          {/* 1. View Details (Deep Blue Glow) */}
                          <button
                            type="button"
                            onClick={() => setSelectedMember(m)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-blue-300 bg-blue-900/40 border border-blue-500/40 hover:bg-blue-800/60 hover:scale-105 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all"
                            title="View Full Profile Details (ዝርዝር ይመልከቱ)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Edit Member (Amber/Gold Glow) */}
                          {hasPermission("member.manage") && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(m)}
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-amber-300 bg-amber-900/40 border border-amber-500/50 hover:bg-amber-800/60 hover:scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all"
                              title="Edit Member Information (መረጃ አሻሽል)"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3. Lock / Suspend (Emerald / Amber Glow) */}
                          {hasPermission("member.manage") && (
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(m)}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center border hover:scale-105 transition-all ${
                                m.status === "SUSPENDED"
                                  ? "text-amber-400 bg-amber-950/60 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                                  : "text-emerald-400 bg-emerald-950/60 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                              }`}
                              title={
                                m.status === "SUSPENDED"
                                  ? "Lift Suspension (እግድ አንሳ)"
                                  : "Suspend Member (እገድ)"
                              }
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 4. Unassign / Remove from Department (Crimson/Rose Glow) */}
                          {hasPermission("member.manage") && (
                            <button
                              type="button"
                              onClick={() => setUnassignTarget(m)}
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-rose-400 bg-rose-950/60 border border-rose-500/50 hover:bg-rose-900/60 hover:scale-105 shadow-[0_0_10px_rgba(244,63,94,0.35)] transition-all"
                              title="Unassign from Department (ከዲፓርትመንት አስወጣ)"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        {rosterData && rosterData.pagination.total > 0 && (
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 print:hidden">
            <div>
              Showing{" "}
              <span className="font-bold text-slate-900">
                {(page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-900">
                {Math.min(page * limit, rosterData.pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {rosterData.pagination.total}
              </span>{" "}
              allocated department members
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-800">
                Page {page} of {rosterData.pagination.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= rosterData.pagination.totalPages}
                className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. VIEW MEMBER FULL PROFILE MODAL (17 OFFICIAL FIELDS)                   */}
      {/* ========================================================================= */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0d5b61] to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {selectedMember.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>{selectedMember.fullName}</span>
                    {selectedMember.spiritualStatus === "DEACON" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                        ዲያቆን
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedMember.memberId} · {selectedMember.christianName || "ክርስትና ስም አልተመዘገበም"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Field Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ሙሉ ስም (Full Name)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMember.fullName}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ክርስትና ስም (Baptismal)</span>
                <p className="text-sm font-bold text-blue-950 font-serif mt-1">
                  {selectedMember.christianName || "—"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ጾታ (Gender)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedMember.gender === "MALE" ? "ወንድ (Male)" : "ሴት (Female)"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ስልክ ቁጥር (Phone)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMember.phoneNumber || "—"}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">የአካዳሚክ ዲፓርትመንት</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedMember.academicDepartment || selectedMember.educationLevel || "—"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">የመጡበት ክልል (Region)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMember.originRegion || "—"}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ዞን / ወረዳ / ቀበሌ</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedMember.zone || "—"} / {selectedMember.woreda || "—"} / {selectedMember.kebele || "—"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ብሎክ እና ዶርም (Block/Dorm)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedMember.dormBlock || "—"} / {selectedMember.dormRoom || "—"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ቋንቋ (Language)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMember.language || "አማርኛ"}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">የተጠሪ ስም (Emergency Contact)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedMember.emergencyContactName || selectedMember.emergencyContact || "—"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">የተጠሪ ስልክ (Emergency Phone)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedMember.emergencyContactPhone || "—"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">የሰንበት ት/ቤት ቆይታ (Duration)</span>
                <p className="text-sm font-bold text-emerald-800 mt-1">
                  {selectedMember.sundaySchoolDuration || "—"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">ዕድሜ (Age)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMember.age || 21} years old</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">መንፈሳዊ ደረጃ (Spiritual Role)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMember.spiritualStatus}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">የአባልነት ሁኔታ (Status)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedMember.status}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. EDIT MEMBER MODAL (Admin Only)                                         */}
      {/* ========================================================================= */}
      {editingMember && hasPermission("member.manage") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-500" />
                <span>Edit Profile: {editingMember.fullName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">First Name (ስም)</label>
                <input
                  type="text"
                  value={editFormData.firstName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Last Name (የአባት ስም)</label>
                <input
                  type="text"
                  value={editFormData.lastName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ክርስትና ስም (Baptismal Name)</label>
                <input
                  type="text"
                  value={editFormData.christianName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, christianName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ስልክ ቁጥር (Phone)</label>
                <input
                  type="text"
                  value={editFormData.phoneNumber || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ጾታ (Gender)</label>
                <select
                  value={editFormData.gender || "MALE"}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none bg-white"
                >
                  <option value="MALE">ወንድ (Male)</option>
                  <option value="FEMALE">ሴት (Female)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spiritual Status (መንፈሳዊ)</label>
                <select
                  value={editFormData.spiritualStatus || "REGULAR"}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, spiritualStatus: e.target.value as SpiritualStatus })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none bg-white"
                >
                  <option value="REGULAR">ምዕመን (Regular)</option>
                  <option value="SERVANT">አገልጋይ (Servant)</option>
                  <option value="DEACON">ዲያቆን (Deacon)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sunday School (የሰንበት ት/ቤት ቆይታ)</label>
                <input
                  type="text"
                  value={editFormData.sundaySchoolDuration || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, sundaySchoolDuration: e.target.value })
                  }
                  placeholder="e.g. 5 ዓመት"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ዕድሜ (Age)</label>
                <input
                  type="number"
                  value={editFormData.age || 21}
                  onChange={(e) => setEditFormData({ ...editFormData, age: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0d5b61] outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#0d5b61] text-white font-bold hover:bg-[#0a464a] shadow-sm disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. UNASSIGN CONFIRMATION MODAL (Admin Only)                               */}
      {/* ========================================================================= */}
      {unassignTarget && hasPermission("member.manage") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <UserMinus className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Unassign Member from Department?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{unassignTarget.fullName}</strong> ({unassignTarget.memberId}) from <strong>{selectedDepartment?.name}</strong>?
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                The member will be returned to the unassigned candidate pool and can be re-allocated during the next cycle.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs">
              <button
                onClick={() => setUnassignTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnassign}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 disabled:opacity-50"
              >
                {submitting ? "Unassigning..." : "Confirm Unassign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. BATCH UNASSIGN MODAL (Admin Only)                                    */}
      {/* ========================================================================= */}
      {showBatchUnassignModal && hasPermission("member.manage") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <UserMinus className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Unassign {selectedIds.length} Members?
              </h3>
              <p className="text-xs text-slate-500">
                Remove all {selectedIds.length} selected members from <strong>{selectedDepartment?.name}</strong> and return them to unassigned status?
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs">
              <button
                onClick={() => setShowBatchUnassignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchUnassign}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 disabled:opacity-50"
              >
                {submitting ? "Processing..." : `Unassign ${selectedIds.length} Members`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
