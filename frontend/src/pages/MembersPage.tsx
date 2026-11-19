import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import {
  fetchMembers,
  createMember,
  updateMember,
  deleteMember,
  batchUpdateMemberStatus,
  batchDeleteMembers,
  fetchMemberStats,
} from "../api/member.api";
import { Campus } from "../types/campus";
import {
  Member,
  CreateMemberPayload,
  MemberStats,
  Gender,
  MemberCategory,
  SpiritualStatus,
  MemberStatus,
} from "../types/member";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Phone,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Building2,
  X,
  Eye,
  FileSpreadsheet,
  Edit,
  Trash2,
  Lock,
  CheckSquare,
  Square,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Church,
  GraduationCap,
  Sparkles,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";

export const MembersPage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [spiritualFilter, setSpiritualFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Row Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateMemberPayload>({
    campusId: "",
    memberId: "",
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

  const [editFormData, setEditFormData] = useState<Partial<CreateMemberPayload>>({});
  const [submitting, setSubmitting] = useState(false);
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

  // Load members and stats
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [membersData, statsData] = await Promise.all([
        fetchMembers(token, {
          campusId: selectedCampusId || undefined,
          search: search || undefined,
          gender: (genderFilter as Gender) || undefined,
          category: (categoryFilter as MemberCategory) || undefined,
          spiritualStatus: (spiritualFilter as SpiritualStatus) || undefined,
          status: (statusFilter as MemberStatus) || undefined,
          page,
          limit: 15,
        }),
        fetchMemberStats(token, selectedCampusId || undefined),
      ]);

      setMembers(membersData.members);
      setTotalPages(membersData.pagination.totalPages);
      setTotalCount(membersData.pagination.total);
      setStats(statsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading member records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    token,
    selectedCampusId,
    search,
    genderFilter,
    categoryFilter,
    spiritualFilter,
    statusFilter,
    page,
  ]);

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(members.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = members.length > 0 && selectedIds.length === members.length;

  // Batch Status Change Handler
  const handleBatchStatus = async (status: MemberStatus) => {
    if (!token || selectedIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await batchUpdateMemberStatus(selectedIds, status, token);
      setSuccessMsg(`Successfully updated status to "${status}" for ${selectedIds.length} members.`);
      setSelectedIds([]);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update member status in batch");
    } finally {
      setSubmitting(false);
    }
  };

  // Batch Delete Handler
  const handleBatchDelete = async () => {
    if (!token || selectedIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await batchDeleteMembers(selectedIds, token);
      setSuccessMsg(`Successfully deleted ${selectedIds.length} selected members.`);
      setSelectedIds([]);
      setShowBatchDeleteModal(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete selected members");
    } finally {
      setSubmitting(false);
    }
  };

  // Single Delete Handler
  const handleDeleteSingle = async () => {
    if (!token || !deletingMember) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteMember(deletingMember.id, token);
      setSuccessMsg(`Member "${deletingMember.fullName}" successfully removed.`);
      setDeletingMember(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete member");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Form
  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setEditFormData({
      memberId: m.memberId,
      firstName: m.firstName,
      lastName: m.lastName,
      christianName: m.christianName || "",
      gender: m.gender,
      phoneNumber: m.phoneNumber,
      email: m.email,
      academicDepartment: m.academicDepartment || "",
      originRegion: m.originRegion || "",
      zone: m.zone || "",
      woreda: m.woreda || "",
      kebele: m.kebele || "",
      dormBlock: m.dormBlock || "",
      dormRoom: m.dormRoom || "",
      language: m.language || "",
      emergencyContactName: m.emergencyContactName || "",
      emergencyContactPhone: m.emergencyContactPhone || "",
      sundaySchoolDuration: m.sundaySchoolDuration || "",
      age: m.age || 20,
      category: m.category,
      spiritualStatus: m.spiritualStatus,
      educationLevel: m.educationLevel || "",
      address: m.address || "",
      status: m.status,
    });
  };

  // Submit Edit Form
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingMember) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateMember(editingMember.id, editFormData, token);
      setSuccessMsg(`Member "${editingMember.fullName}" updated successfully.`);
      setEditingMember(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSubmitting(false);
    }
  };

  // Single Quick Toggle Suspend
  const handleToggleSuspend = async (m: Member) => {
    if (!token) return;
    const newStatus: MemberStatus = m.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await updateMember(m.id, { status: newStatus }, token);
      setSuccessMsg(`Member status set to "${newStatus}".`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  // Export Selected Members to CSV
  const handleExportSelected = () => {
    const listToExport =
      selectedIds.length > 0
        ? members.filter((m) => selectedIds.includes(m.id))
        : members;

    const headers = [
      "ተ.ቁ",
      "ሙሉ ስም",
      "ክርስትና ስም",
      "ጾታ",
      "ስልክ ቁጥር",
      "ዲፓርትመንት",
      "የመጡበት ክልል",
      "ዞን",
      "ወረዳ",
      "ቀበሌ",
      "ብሎክ",
      "ዶርም",
      "ቋንቋ",
      "የተጠሪ ስም",
      "የተጠሪ ስልክ",
      "የሰንበት ት/ቤት ቆይታ",
      "ዕድሜ",
      "ሁኔታ",
    ];

    const rows = listToExport.map((m) => [
      m.memberId,
      m.fullName,
      m.christianName || "—",
      m.gender,
      m.phoneNumber,
      m.academicDepartment || "—",
      m.originRegion || "—",
      m.zone || "—",
      m.woreda || "—",
      m.kebele || "—",
      m.dormBlock || "—",
      m.dormRoom || "—",
      m.language || "—",
      m.emergencyContactName || "—",
      m.emergencyContactPhone || "—",
      m.sundaySchoolDuration || "—",
      m.age || "—",
      m.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `C-CIMAS-Members-Roster-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`Exported ${listToExport.length} members to CSV roster.`);
  };

  // Handle Create Member Submit
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCampusId) return;
    setSubmitting(true);
    setError(null);

    try {
      await createMember({ ...formData, campusId: selectedCampusId }, token);
      setShowCreateModal(false);
      setFormData({
        campusId: selectedCampusId,
        memberId: "",
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
      setSuccessMsg("Member successfully registered with complete official profile.");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>የግቢ ጉባኤ አባላት ዝርዝር ማውጫ</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
              C-CIMAS Registry
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Church Campus Registration, Demographics, Academic and Spiritual Records Master Table.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Campus Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Building2 className="w-4 h-4 text-blue-900" />
            <select
              value={selectedCampusId}
              onChange={(e) => {
                setSelectedCampusId(e.target.value);
                setPage(1);
              }}
              className="font-bold text-blue-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">All Campuses (ሁሉም ግቢዎች)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportSelected}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-blue-900" />
            <span>Export Roster</span>
          </button>

          <Link
            to="/import"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel Bulk Import</span>
          </Link>

          {hasPermission("member.register") && (
            <button
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  campusId: selectedCampusId || campuses[0]?.id || "",
                }));
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-900/30 flex items-center gap-2 transition shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>አዲስ አባል መዝግብ (Register)</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statistics Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats.male} ወንድ · {stats.female} ሴት
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Active (ንቁ)</span>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">{stats.active}</div>
            <p className="text-[11px] text-emerald-600 mt-1">Eligible for allocation cycle</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Ordained Deacons (ዲያቆናት)</span>
            <div className="text-2xl font-bold text-blue-900 mt-0.5">{stats.deacons}</div>
            <p className="text-[11px] text-blue-700 mt-1">Altar and liturgical ministry</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Allocated to Ministries</span>
            <div className="text-2xl font-bold text-indigo-700 mt-0.5">{stats.allocated}</div>
            <p className="text-[11px] text-indigo-600 mt-1">Assigned across departments</p>
          </div>
        </div>
      )}

      {/* Search and Filters Bar with Status Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, baptismal name (ክርስትና ስም), ID, phone, region..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-stretch md:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition shrink-0 ${
                statusFilter === ""
                  ? "bg-white text-blue-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Statuses (ሁሉም)
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ACTIVE");
                setPage(1);
              }}
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
              onClick={() => {
                setStatusFilter("INACTIVE");
                setPage(1);
              }}
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
              onClick={() => {
                setStatusFilter("SUSPENDED");
                setPage(1);
              }}
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

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 font-medium bg-slate-50 focus:outline-none"
            >
              <option value="">All Genders (ጾታ)</option>
              <option value="MALE">ወንድ (Male)</option>
              <option value="FEMALE">ሴት (Female)</option>
            </select>

            {/* Spiritual Status Filter */}
            <select
              value={spiritualFilter}
              onChange={(e) => {
                setSpiritualFilter(e.target.value);
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

      {/* Floating Batch Action Bar When Rows are Selected */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-bold text-xs shadow-sm">
              {selectedIds.length} ተመርጠዋል ({selectedIds.length} Selected)
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              ፈጣን የጅምላ እርምጃዎችን ይተግብሩ (Apply batch operations)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mark Active */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleBatchStatus("ACTIVE")}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ንቁ አድርግ (Active)</span>
            </button>

            {/* Mark Inactive */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleBatchStatus("INACTIVE")}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ቦዘኔ አድርግ (Inactive)</span>
            </button>

            {/* Suspend */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleBatchStatus("SUSPENDED")}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>እገድ (Suspend)</span>
            </button>

            {/* Export Selected */}
            <button
              type="button"
              onClick={handleExportSelected}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Delete Selected */}
            {hasPermission("member.manage") && (
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ሰርዝ (Delete)</span>
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
      {/* MEMBERS DATA TABLE (EXACT AMHARIC COLUMNS & JEWEL GLOW ACTION BUTTONS)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading member roster...</div>
        ) : members.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400">
            No member records found matching the applied filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              {/* Teal Header matching the provided screenshot */}
              <thead
                className="text-white font-bold uppercase tracking-wider text-[11px]"
                style={{
                  backgroundColor: "#0d5b61",
                }}
              >
                <tr className="border-b border-[#0a464a]">
                  <th className="px-3.5 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
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
                  <th className="px-6 py-4 text-center">እርምጃዎች (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m, idx) => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors hover:bg-slate-50/90 ${
                        isSelected ? "bg-blue-50/60" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3.5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(m.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* 1. ተ.ቁ (No.) */}
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
                        {m.sundaySchoolDuration || "—"}
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

                      {/* 19. እርምጃዎች (Actions: View, Edit, Suspend, Delete) */}
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

                          {/* 3. Lock / Suspend (Green / Emerald Glow) */}
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

                          {/* 4. Delete (Crimson/Red Glow) */}
                          {hasPermission("member.manage") && (
                            <button
                              type="button"
                              onClick={() => setDeletingMember(m)}
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-rose-400 bg-rose-950/60 border border-rose-500/50 hover:bg-rose-900/60 hover:scale-105 shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all"
                              title="Delete Member (አባል ሰርዝ)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Server-Side Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Total Members: <strong className="text-slate-900">{totalCount}</strong> · Page {page} of{" "}
            {Math.max(totalPages, 1)}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-blue-900 px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW MEMBER FULL DETAILS MODAL                                         */}
      {/* ========================================================================= */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div
              className="h-2.5 w-full shrink-0"
              style={{
                background: "linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #f59e0b 100%)",
              }}
            />

            <div className="p-6 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-md border border-blue-900/40">
                  {selectedMember.firstName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900">{selectedMember.fullName}</h3>
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      {selectedMember.memberId}
                    </span>
                  </div>
                  <p className="text-xs text-blue-900 font-serif font-bold mt-0.5">
                    ክርስትና ስም (Baptismal Name): {selectedMember.christianName || "ያልተጠቀሰ"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Status Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ጾታ (Gender)</span>
                  <strong className="text-slate-900">{selectedMember.gender}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ዕድሜ (Age)</span>
                  <strong className="text-slate-900">{selectedMember.age || 21} ዓመት</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">መንፈሳዊ ማዕረግ</span>
                  <strong className="text-purple-800">{selectedMember.spiritualStatus}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">የአባልነት ሁኔታ</span>
                  <strong
                    className={
                      selectedMember.status === "ACTIVE"
                        ? "text-emerald-700"
                        : selectedMember.status === "SUSPENDED"
                        ? "text-amber-700"
                        : "text-slate-600"
                    }
                  >
                    {selectedMember.status}
                  </strong>
                </div>
              </div>

              {/* Academic & Campus Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-900" />
                  <span>የትምህርትና የግቢ መኖሪያ መረጃ (Academic & Dormitory)</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">ዲፓርትመንት</span>
                    <span>{selectedMember.academicDepartment || selectedMember.educationLevel || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">የሰንበት ት/ቤት ቆይታ</span>
                    <span>{selectedMember.sundaySchoolDuration || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">ብሎክና ዶርም ቁጥር</span>
                    <span className="font-mono font-bold">
                      {selectedMember.dormBlock || "—"} · {selectedMember.dormRoom || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">የመገናኛ ቋንቋ</span>
                    <span>{selectedMember.language || "አማርኛ"}</span>
                  </div>
                </div>
              </div>

              {/* Residence & Origin */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-900" />
                  <span>የመጡበት አካባቢና አድራሻ (Origin Region & Address)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">ክልል</span>
                    <span>{selectedMember.originRegion || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">ዞን</span>
                    <span>{selectedMember.zone || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">ወረዳ</span>
                    <span>{selectedMember.woreda || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">ቀበሌ</span>
                    <span>{selectedMember.kebele || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-blue-900" />
                  <span>የአስቸኳይ ጊዜ ተጠሪና ስልክ (Emergency Contact)</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">የአባል ስልክ</span>
                    <span className="font-mono">{selectedMember.phoneNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">ኢሜይል</span>
                    <span className="font-mono">{selectedMember.email || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">የተጠሪ ስም</span>
                    <span>{selectedMember.emergencyContactName || selectedMember.emergencyContact || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400 text-[10px]">የተጠሪ ስልክ</span>
                    <span className="font-mono">{selectedMember.emergencyContactPhone || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT MEMBER FORM MODAL                                                  */}
      {/* ========================================================================= */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="h-2.5 w-full bg-amber-500 shrink-0" />
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">የአባል መረጃ አሻሽል (Edit Member)</h3>
                  <p className="text-xs text-slate-500 font-mono">{editingMember.memberId}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    First Name (ስም) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Last Name (የአባት ስም) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.lastName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    ክርስትና ስም (Baptismal Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ገብረ ማርያም"
                    value={editFormData.christianName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, christianName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ጾታ (Gender)</label>
                  <select
                    value={editFormData.gender || "MALE"}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  >
                    <option value="MALE">ወንድ (MALE)</option>
                    <option value="FEMALE">ሴት (FEMALE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ዕድሜ (Age)</label>
                  <input
                    type="number"
                    min="15"
                    max="80"
                    value={editFormData.age || 20}
                    onChange={(e) => setEditFormData({ ...editFormData, age: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ስልክ ቁጥር</label>
                  <input
                    type="text"
                    value={editFormData.phoneNumber || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ዲፓርትመንት</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={editFormData.academicDepartment || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, academicDepartment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ሁኔታ (Status)</label>
                  <select
                    value={editFormData.status || "ACTIVE"}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as MemberStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  >
                    <option value="ACTIVE">ንቁ (ACTIVE)</option>
                    <option value="INACTIVE">ቦዘኔ (INACTIVE)</option>
                    <option value="SUSPENDED">የታገደ (SUSPENDED)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">የመጡበት ክልል</label>
                  <input
                    type="text"
                    value={editFormData.originRegion || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, originRegion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ዞን (Zone)</label>
                  <input
                    type="text"
                    value={editFormData.zone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, zone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ብሎክ (Block)</label>
                  <input
                    type="text"
                    value={editFormData.dormBlock || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, dormBlock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ዶርም (Room)</label>
                  <input
                    type="text"
                    value={editFormData.dormRoom || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, dormRoom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">የተጠሪ ስም</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContactName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">የተጠሪ ስልክ</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContactPhone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SINGLE DELETE CONFIRMATION MODAL                                       */}
      {/* ========================================================================= */}
      {deletingMember && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-2.5 w-full bg-rose-600" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Member Record</h3>
                  <p className="text-[11px] text-slate-500">Confirm permanent removal</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-bold">
                  Are you sure you want to delete &ldquo;{deletingMember.fullName}&rdquo; ({deletingMember.memberId})?
                </p>
                <p className="text-slate-600">
                  This action will permanently delete this member&apos;s registration and evaluation records.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDeletingMember(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDeleteSingle}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Delete Member"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BATCH DELETE CONFIRMATION MODAL                                        */}
      {/* ========================================================================= */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-2.5 w-full bg-rose-600" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Batch Delete Members</h3>
                  <p className="text-[11px] text-slate-500">Remove multiple selected records</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-bold">
                  Are you sure you want to permanently delete {selectedIds.length} selected member records?
                </p>
                <p className="text-slate-600">
                  This cannot be undone. All demographic and allocation associations will be removed.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowBatchDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleBatchDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : `Delete ${selectedIds.length} Members`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REGISTER MEMBER MODAL (Full 17 Fields)                                 */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div
              className="h-2.5 w-full shrink-0"
              style={{
                background: "linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #f59e0b 100%)",
              }}
            />
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">አዲስ የግቢ ጉባኤ አባል መዝግብ (Register Member)</h3>
                <p className="text-xs text-slate-500">Enter complete 17 official fields for C-CIMAS roster</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ተ.ቁ (Member ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MEM-2026-901"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus *</label>
                  <select
                    value={formData.campusId}
                    onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name (ስም) *</label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name (የአባት ስም) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ክርስትና ስም</label>
                  <input
                    type="text"
                    placeholder="e.g. ገብረ ማርያም"
                    value={formData.christianName}
                    onChange={(e) => setFormData({ ...formData, christianName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ጾታ (Gender) *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="MALE">ወንድ (MALE)</option>
                    <option value="FEMALE">ሴት (FEMALE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ዕድሜ (Age)</label>
                  <input
                    type="number"
                    min="15"
                    max="80"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 21 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ስልክ ቁጥር</label>
                  <input
                    type="text"
                    placeholder="e.g. +251911223344"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ዲፓርትመንት (Academic Dept)</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science / Medicine"
                    value={formData.academicDepartment}
                    onChange={(e) => setFormData({ ...formData, academicDepartment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የመጡበት ክልል</label>
                  <input
                    type="text"
                    placeholder="e.g. አዲስ አበባ"
                    value={formData.originRegion}
                    onChange={(e) => setFormData({ ...formData, originRegion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ዞን (Zone)</label>
                  <input
                    type="text"
                    placeholder="e.g. ሰሜን ሸዋ"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ብሎክ (Block)</label>
                  <input
                    type="text"
                    placeholder="e.g. Block 42"
                    value={formData.dormBlock}
                    onChange={(e) => setFormData({ ...formData, dormBlock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ዶርም (Dorm)</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={formData.dormRoom}
                    onChange={(e) => setFormData({ ...formData, dormRoom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የተጠሪ ስም</label>
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የተጠሪ ስልክ</label>
                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Register Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
