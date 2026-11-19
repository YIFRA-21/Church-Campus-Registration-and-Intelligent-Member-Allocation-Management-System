import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// Sub-components
import { MemberDashboardView } from "../components/members/MemberDashboardView";
import { MemberDirectoryView } from "../components/members/MemberDirectoryView";
import { MemberRegistrationModal } from "../components/members/MemberRegistrationModal";
import { MemberProfileDrawer } from "../components/members/MemberProfileDrawer";
import { MemberEditModal } from "../components/members/MemberEditModal";
import { MemberStatusModal } from "../components/members/MemberStatusModal";
import { MemberHistoryModal } from "../components/members/MemberHistoryModal";

export const MembersPage: React.FC = () => {
  const { token, hasPermission, user } = useAuth();

  // Navigation tab: 'dashboard' (CORTEX Telemetry) vs 'directory' (Fellowship Member Directory)
  const [activeTab, setActiveTab] = useState<"dashboard" | "directory">("dashboard");

  // Tenancy & Data state
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<MemberDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [search, setSearch] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [spiritualFilter, setSpiritualFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawers state
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null); // 360 Drawer
  const [editingMember, setEditingMember] = useState<Member | null>(null); // Edit Modal
  const [statusTargetMember, setStatusTargetMember] = useState<Member | null>(null); // Status Modal
  const [historyTargetMember, setHistoryTargetMember] = useState<Member | null>(null); // History Modal
  const [archivingMember, setArchivingMember] = useState<Member | null>(null); // Archive Modal
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);

  // Form Submitting & Alerts
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Permission Checks
  const canWrite = Boolean(hasPermission("members:write") || user?.role === "ADMIN");
  const canDelete = Boolean(hasPermission("members:delete") || user?.role === "ADMIN");

  // Auto-dismiss alerts after 6 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // 1. Load Campuses
  useEffect(() => {
    async function loadCampuses() {
      if (!token) return;
      try {
        const list = await fetchCampuses(token);
        setCampuses(list);
        if (list.length > 0 && !selectedCampusId) {
          setSelectedCampusId(list[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load campuses:", err);
      }
    }
    loadCampuses();
  }, [token]);

  // 2. Load Executive Dashboard Summary
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

  // 3. Load Members Directory
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
      setError(err.message || "Failed to load fellowship directory");
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Multi-selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Create Member Handler
  const handleCreateSubmit = async (payload: CreateMemberPayload) => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createMember(payload, token);
      setSuccessMsg(
        `Fellowship member "${created.fullName}" successfully registered! System code assigned: ${created.memberId}`
      );
      setShowRegisterModal(false);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Update Member Handler (Rule 6: Member code immutable)
  const handleUpdateSave = async (id: string, payload: Partial<CreateMemberPayload>) => {
    if (!token) return;
    try {
      const updated = await updateMember(id, payload, token);
      setSuccessMsg(`Member "${updated.fullName}" (${updated.memberId}) profile successfully updated.`);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      throw err;
    }
  };

  // Status Change Handler (Rule 9: Written justification required)
  const handleStatusConfirm = async (
    memberId: string,
    targetStatus: MemberStatus,
    reason: string
  ) => {
    if (!token) return;
    try {
      const updated = await changeMemberStatus(memberId, targetStatus, reason, token);
      setSuccessMsg(
        `Status for member ${updated.memberId} transitioned to ${targetStatus}. Audit trail updated.`
      );
      loadMembers();
      loadSummary();
    } catch (err: any) {
      throw err;
    }
  };

  // Single Soft Archive / Delete Handler
  const handleConfirmArchive = async () => {
    if (!token || !archivingMember) return;
    setSubmitting(true);
    try {
      await deleteMember(archivingMember.id, token);
      setSuccessMsg(
        `Member record ${archivingMember.memberId} has been archived. Historical data preserved (Rule 5).`
      );
      setArchivingMember(null);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Failed to archive member.");
    } finally {
      setSubmitting(false);
    }
  };

  // Batch Status Update
  const handleBatchStatus = async (status: MemberStatus) => {
    if (!token || selectedIds.length === 0) return;
    try {
      await batchUpdateMemberStatus(selectedIds, status, token);
      setSuccessMsg(
        `Batch operation complete: ${selectedIds.length} members transitioned to ${status}.`
      );
      setSelectedIds([]);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Batch status update failed.");
    }
  };

  // Batch Delete / Archive
  const handleBatchDeleteConfirm = async () => {
    if (!token || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await batchDeleteMembers(selectedIds, token);
      setSuccessMsg(
        `Batch operation complete: ${selectedIds.length} members safely archived.`
      );
      setSelectedIds([]);
      setShowBatchDeleteModal(false);
      loadMembers();
      loadSummary();
    } catch (err: any) {
      setError(err.message || "Batch archive failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // History Provider callback
  const handleFetchHistory = useCallback(
    async (id: string): Promise<MemberStatusHistory[]> => {
      if (!token) return [];
      return fetchMemberHistory(id, token);
    },
    [token]
  );

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
    link.setAttribute(
      "download",
      `CCIMAS_Members_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cortex-dashboard">
      {/* Background radial ambient aura */}
      <div className="cortex-dashboard__bg-glow"></div>

      {/* TOP HEADER & TELEMETRY NAV */}
      <div className="cortex-dashboard__nav">
        <div className="d-flex align-items-center gap-3">
          <div className="cortex-brand-mark">
            <i className="bi bi-person-lines-fill"></i>
          </div>
          <div>
            <h1 className="h4 text-white fw-bold mb-0">Member Management</h1>
            <p className="text-secondary small mb-0">
              Campus Fellowship CRM &bull; Demographic Telemetry &bull; Rule-Enforced Membership
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="cortex-nav-pills d-none d-md-flex">
          <button
            type="button"
            className={`cortex-nav-pill ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Executive Telemetry</span>
          </button>
          <button
            type="button"
            className={`cortex-nav-pill ${activeTab === "directory" ? "active" : ""}`}
            onClick={() => setActiveTab("directory")}
          >
            <i className="bi bi-people"></i>
            <span>Fellowship Directory</span>
            <span className="badge rounded-pill bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 ms-1">
              {totalCount}
            </span>
          </button>
        </div>

        {/* Actions & Campus Filter */}
        <div className="d-flex align-items-center gap-2">
          {/* Campus Tenancy Selector */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small d-none d-lg-inline">Campus:</span>
            <select
              className="form-select form-select-sm cortex-form-control"
              style={{ minWidth: "160px" }}
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => {
              loadSummary();
              loadMembers();
            }}
            className="cortex-btn--icon"
            title="Refresh Telemetry"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>

          {/* Primary Action: Register */}
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="cortex-btn cortex-btn--primary d-flex align-items-center gap-2 shadow-sm"
            >
              <i className="bi bi-person-plus-fill"></i>
              <span className="d-none d-sm-inline">Register Member</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE TABS (sm and below) */}
      <div className="d-flex d-md-none px-3 mb-3 gap-2">
        <button
          type="button"
          className={`btn btn-sm flex-fill ${
            activeTab === "dashboard" ? "btn-primary text-white" : "btn-dark text-muted"
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          <i className="bi bi-speedometer2 me-1"></i> Telemetry
        </button>
        <button
          type="button"
          className={`btn btn-sm flex-fill ${
            activeTab === "directory" ? "btn-primary text-white" : "btn-dark text-muted"
          }`}
          onClick={() => setActiveTab("directory")}
        >
          <i className="bi bi-people me-1"></i> Directory ({totalCount})
        </button>
      </div>

      {/* ALERT NOTIFICATIONS */}
      <div className="px-4">
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-3 border-0 bg-success bg-opacity-20 text-success rounded-3 shadow-sm"
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill"></i>
              <span className="small fw-semibold">{successMsg}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white small"
              onClick={() => setSuccessMsg(null)}
            ></button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-danger d-flex align-items-center justify-content-between py-2 px-3 mb-3 border-0 bg-danger bg-opacity-20 text-danger rounded-3 shadow-sm"
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span className="small fw-semibold">{error}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white small"
              onClick={() => setError(null)}
            ></button>
          </motion.div>
        )}
      </div>

      {/* VIEW 1: EXECUTIVE TELEMETRY DASHBOARD */}
      {activeTab === "dashboard" && (
        <MemberDashboardView
          summary={summary}
          recentMembers={members}
          loading={summaryLoading}
          onViewMember={(m) => setSelectedMember(m)}
          onOpenRegister={() => setShowRegisterModal(true)}
        />
      )}

      {/* VIEW 2: FELLOWSHIP MEMBER DIRECTORY */}
      {activeTab === "directory" && (
        <MemberDirectoryView
          members={members}
          campuses={campuses}
          selectedCampusId={selectedCampusId}
          onCampusChange={(id) => {
            setSelectedCampusId(id);
            setPage(1);
          }}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          genderFilter={genderFilter}
          onGenderChange={(val) => {
            setGenderFilter(val);
            setPage(1);
          }}
          categoryFilter={categoryFilter}
          onCategoryChange={(val) => {
            setCategoryFilter(val);
            setPage(1);
          }}
          spiritualFilter={spiritualFilter}
          onSpiritualChange={(val) => {
            setSpiritualFilter(val);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={(newPage) => setPage(newPage)}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectOne={handleToggleSelectOne}
          onViewMember={(m) => setSelectedMember(m)}
          onEditMember={(m) => setEditingMember(m)}
          onStatusMember={(m) => setStatusTargetMember(m)}
          onHistoryMember={(m) => setHistoryTargetMember(m)}
          onArchiveMember={(m) => setArchivingMember(m)}
          onBatchStatus={handleBatchStatus}
          onOpenBatchDelete={() => setShowBatchDeleteModal(true)}
          onExportCSV={handleExportCSV}
          onOpenRegister={() => setShowRegisterModal(true)}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}

      {/* ========================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================= */}

      {/* 1. Registration Modal (5-Step Stepper) */}
      <AnimatePresence>
        {showRegisterModal && (
          <MemberRegistrationModal
            campuses={campuses}
            defaultCampusId={selectedCampusId || (campuses[0]?.id ?? "")}
            onClose={() => setShowRegisterModal(false)}
            onSubmit={handleCreateSubmit}
            submitting={submitting}
          />
        )}
      </AnimatePresence>

      {/* 2. 360° Profile Drawer */}
      <AnimatePresence>
        {selectedMember && (
          <MemberProfileDrawer
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onEdit={(m) => {
              setSelectedMember(null);
              setEditingMember(m);
            }}
            onStatusChange={(m) => {
              setSelectedMember(null);
              setStatusTargetMember(m);
            }}
            canEdit={canWrite}
          />
        )}
      </AnimatePresence>

      {/* 3. Member Edit Modal (Rule 6: Member Code Immutable) */}
      <MemberEditModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        campuses={campuses}
        onClose={() => setEditingMember(null)}
        onSave={handleUpdateSave}
      />

      {/* 4. Member Status Transition Modal (Rule 9: Justification Required) */}
      <MemberStatusModal
        isOpen={Boolean(statusTargetMember)}
        member={statusTargetMember}
        onClose={() => setStatusTargetMember(null)}
        onConfirm={handleStatusConfirm}
      />

      {/* 5. Member Audit History Modal */}
      <MemberHistoryModal
        isOpen={Boolean(historyTargetMember)}
        member={historyTargetMember}
        onClose={() => setHistoryTargetMember(null)}
        fetchHistory={handleFetchHistory}
      />

      {/* 6. Soft Archive Confirmation Modal (Rule 5) */}
      <AnimatePresence>
        {archivingMember && (
          <div className="cortex-modal-backdrop" onClick={() => setArchivingMember(null)}>
            <motion.div
              className="cortex-modal-dialog"
              style={{ maxWidth: "480px" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    fontSize: "1.3rem",
                  }}
                >
                  <i className="bi bi-archive-fill"></i>
                </div>
                <div>
                  <h5 className="text-white fw-bold mb-0">Archive Member Record?</h5>
                  <p className="text-muted small mb-0">
                    Rule 5 Compliance: Soft Archival
                  </p>
                </div>
              </div>

              <div
                className="p-3 rounded-3 mb-3"
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div className="small text-muted mb-1">Target Member:</div>
                <div className="fw-bold text-white mb-1">{archivingMember.fullName}</div>
                <span className="font-monospace small text-primary">{archivingMember.memberId}</span>
              </div>

              <p className="text-secondary small mb-4">
                This member will be placed in the <span className="text-warning fw-semibold">ARCHIVED</span> status.
                All historical audit traces, ministry evaluations, and contact records remain intact. The record will be
                omitted from active ministry allocation algorithms.
              </p>

              <div className="d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="cortex-btn cortex-btn--secondary"
                  onClick={() => setArchivingMember(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-2"
                  onClick={handleConfirmArchive}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-archive"></i>
                      <span>Confirm Archive</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Batch Delete / Archive Confirmation Modal */}
      <AnimatePresence>
        {showBatchDeleteModal && (
          <div className="cortex-modal-backdrop" onClick={() => setShowBatchDeleteModal(false)}>
            <motion.div
              className="cortex-modal-dialog"
              style={{ maxWidth: "480px" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    fontSize: "1.3rem",
                  }}
                >
                  <i className="bi bi-trash3-fill"></i>
                </div>
                <div>
                  <h5 className="text-white fw-bold mb-0">Batch Archive Selection?</h5>
                  <p className="text-muted small mb-0">
                    {selectedIds.length} members selected
                  </p>
                </div>
              </div>

              <p className="text-secondary small mb-4">
                Are you sure you want to transition all <span className="text-white fw-bold">{selectedIds.length}</span>{" "}
                selected member records to the ARCHIVED state? Their historic logs remain preserved.
              </p>

              <div className="d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="cortex-btn cortex-btn--secondary"
                  onClick={() => setShowBatchDeleteModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-2"
                  onClick={handleBatchDeleteConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-archive"></i>
                      <span>Confirm Batch Archive</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
