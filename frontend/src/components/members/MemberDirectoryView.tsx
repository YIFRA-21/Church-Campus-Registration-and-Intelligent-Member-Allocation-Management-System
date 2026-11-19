import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Campus } from "../../types/campus";
import {
  Member,
  MemberStatus,
  Gender,
  MemberCategory,
  SpiritualStatus,
} from "../../types/member";
import { MemberStatusBadge } from "./MemberStatusBadge";

interface MemberDirectoryViewProps {
  members: Member[];
  campuses: Campus[];
  selectedCampusId: string;
  onCampusChange: (id: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  genderFilter: string;
  onGenderChange: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  spiritualFilter: string;
  onSpiritualChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  loading: boolean;
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
  onViewMember: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onStatusMember: (member: Member) => void;
  onHistoryMember: (member: Member) => void;
  onArchiveMember: (member: Member) => void;
  onBatchStatus: (status: MemberStatus) => void;
  onOpenBatchDelete: () => void;
  onExportCSV: () => void;
  onOpenRegister: () => void;
  canWrite: boolean;
  canDelete: boolean;
}

export const MemberDirectoryView: React.FC<MemberDirectoryViewProps> = ({
  members,
  campuses,
  selectedCampusId,
  onCampusChange,
  search,
  onSearchChange,
  genderFilter,
  onGenderChange,
  categoryFilter,
  onCategoryChange,
  spiritualFilter,
  onSpiritualChange,
  statusFilter,
  onStatusChange,
  page,
  totalPages,
  totalCount,
  onPageChange,
  loading,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onViewMember,
  onEditMember,
  onStatusMember,
  onHistoryMember,
  onArchiveMember,
  onBatchStatus,
  onOpenBatchDelete,
  onExportCSV,
  onOpenRegister,
  canWrite,
  canDelete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="container-fluid px-0 space-y-4"
    >
      {/* =========================================================================
          1. DIRECTORY CONTROL HEADER & SEARCH BAR
         ========================================================================= */}
      <div className="cortex-card p-3 p-md-4">
        <div className="row g-3 align-items-center">
          {/* Live Search */}
          <div className="col-12 col-md-4">
            <div className="position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                type="text"
                placeholder="Search code, name, phone, dept..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="form-control cortex-form-control ps-5"
              />
            </div>
          </div>

          {/* Campus Selector */}
          <div className="col-6 col-md-2">
            <select
              value={selectedCampusId}
              onChange={(e) => onCampusChange(e.target.value)}
              className="form-select cortex-form-control"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-2">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="form-select cortex-form-control"
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
          <div className="col-6 col-md-2">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="form-select cortex-form-control"
            >
              <option value="">All Categories</option>
              <option value="STUDENT">STUDENT</option>
              <option value="YOUTH">YOUTH</option>
              <option value="YOUNG_ADULT">YOUNG ADULT</option>
              <option value="ADULT">ADULT</option>
              <option value="ELDER">ELDER</option>
            </select>
          </div>

          {/* Action Buttons: Export & Register */}
          <div className="col-6 col-md-2 d-flex justify-content-end gap-2">
            <button
              onClick={onExportCSV}
              className="cortex-btn cortex-btn--secondary"
              title="Export CSV"
            >
              <i className="bi bi-file-earmark-excel"></i>
            </button>
            {canWrite && (
              <button
                onClick={onOpenRegister}
                className="cortex-btn cortex-btn--primary"
              >
                <i className="bi bi-person-plus-fill"></i> Add
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="row g-2 mt-2 pt-2 border-top border-secondary border-opacity-10 align-items-center text-xs">
          <div className="col-auto text-secondary fw-semibold">
            <i className="bi bi-funnel me-1"></i> More Filters:
          </div>
          <div className="col-auto">
            <select
              value={spiritualFilter}
              onChange={(e) => onSpiritualChange(e.target.value)}
              className="form-select form-select-sm cortex-form-control py-1 px-2"
              style={{ fontSize: "0.75rem" }}
            >
              <option value="">Spiritual: All</option>
              <option value="REGULAR">Regular (ምእመን)</option>
              <option value="SERVANT">Servant (አገልጋይ)</option>
              <option value="DEACON">Deacon (ዲያቆን)</option>
            </select>
          </div>
          <div className="col-auto">
            <select
              value={genderFilter}
              onChange={(e) => onGenderChange(e.target.value)}
              className="form-select form-select-sm cortex-form-control py-1 px-2"
              style={{ fontSize: "0.75rem" }}
            >
              <option value="">Gender: All</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          {(search || statusFilter || categoryFilter || spiritualFilter || genderFilter) && (
            <div className="col-auto ms-auto">
              <button
                onClick={() => {
                  onSearchChange("");
                  onStatusChange("");
                  onCategoryChange("");
                  onSpiritualChange("");
                  onGenderChange("");
                }}
                className="btn btn-link btn-sm text-decoration-none text-info p-0"
              >
                <i className="bi bi-x-circle me-1"></i> Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. BATCH ACTION BAR
         ========================================================================= */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-4 bg-primary bg-opacity-25 border border-primary d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm"
          >
            <div className="d-flex align-items-center gap-2 text-white fw-bold fs-6">
              <i className="bi bi-check2-square text-info"></i>
              <span>{selectedIds.length} member{selectedIds.length > 1 ? "s" : ""} selected</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => onBatchStatus("ACTIVE")}
                className="btn btn-sm btn-success fw-bold px-3 rounded-pill"
              >
                Set Active
              </button>
              <button
                onClick={() => onBatchStatus("INACTIVE")}
                className="btn btn-sm btn-warning text-dark fw-bold px-3 rounded-pill"
              >
                Set Inactive
              </button>
              {canDelete && (
                <button
                  onClick={onOpenBatchDelete}
                  className="btn btn-sm btn-danger fw-bold px-3 rounded-pill"
                >
                  Archive Selected
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          3. BOOTSTRAP 5.3 GLASS DATA TABLE
         ========================================================================= */}
      <div className="cortex-table-container">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th style={{ width: "45px" }} className="text-center">
                  <input
                    type="checkbox"
                    className="form-check-input cortex-form-control p-2 cursor-pointer"
                    checked={selectedIds.length > 0 && selectedIds.length === members.length}
                    onChange={onToggleSelectAll}
                  />
                </th>
                <th>Member Code</th>
                <th>Full & Christian Name</th>
                <th>Gender & Age</th>
                <th>Academic Department</th>
                <th>Spiritual Role</th>
                <th>Contact</th>
                <th className="text-center">Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading fellowship directory...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-secondary">
                    <i className="bi bi-people display-4 d-block mb-2 text-muted"></i>
                    <span className="fw-bold fs-6 text-white">No members found</span>
                    <p className="text-muted small mt-1">Try adjusting your search criteria or filters.</p>
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <tr key={m.id} className={isSelected ? "table-active" : ""}>
                      {/* Checkbox */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input cortex-form-control p-2 cursor-pointer"
                          checked={isSelected}
                          onChange={() => onToggleSelectOne(m.id)}
                        />
                      </td>

                      {/* Member Code */}
                      <td>
                        <span className="badge font-monospace bg-dark border border-secondary text-info px-2 py-1">
                          {m.memberId}
                        </span>
                      </td>

                      {/* Name & Christian Name */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                            style={{
                              width: "32px",
                              height: "32px",
                              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                            }}
                          >
                            {m.firstName.charAt(0)}
                            {m.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold text-white">{m.fullName}</div>
                            {m.christianName && (
                              <div className="small text-warning" style={{ fontSize: "0.75rem" }}>
                                <i className="bi bi-shield-fill me-1"></i>
                                {m.christianName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Gender & Age */}
                      <td>
                        <span className="text-secondary">{m.gender}</span>
                        <div className="small text-muted">{m.age ? `${m.age} yrs` : "N/A"}</div>
                      </td>

                      {/* Academic Dept / Category */}
                      <td>
                        <div className="text-white fw-medium">{m.academicDepartment || "Undeclared"}</div>
                        <span className="badge bg-secondary bg-opacity-25 text-light" style={{ fontSize: "0.7rem" }}>
                          {m.category}
                        </span>
                      </td>

                      {/* Spiritual Role */}
                      <td>
                        <span
                          className={`badge ${
                            m.spiritualStatus === "DEACON"
                              ? "bg-purple bg-opacity-25 text-purple border border-purple"
                              : m.spiritualStatus === "SERVANT"
                              ? "bg-primary bg-opacity-25 text-primary border border-primary"
                              : "bg-dark text-secondary"
                          }`}
                        >
                          {m.spiritualStatus}
                        </span>
                      </td>

                      {/* Phone */}
                      <td>
                        <div className="small text-secondary">
                          <i className="bi bi-telephone me-1"></i>
                          {m.phoneNumber || "No phone"}
                        </div>
                        {m.dormRoom && (
                          <div className="small text-muted" style={{ fontSize: "0.7rem" }}>
                            Dorm: {m.dormRoom}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="text-center">
                        <MemberStatusBadge status={m.status} />
                      </td>

                      {/* Action Buttons */}
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          {/* 360 View */}
                          <button
                            onClick={() => onViewMember(m)}
                            className="cortex-btn--icon"
                            title="View Full Profile (360°)"
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* Edit */}
                          {canWrite && (
                            <button
                              onClick={() => onEditMember(m)}
                              className="cortex-btn--icon"
                              title="Edit Member Profile"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}

                          {/* Transition Status */}
                          {canWrite && (
                            <button
                              onClick={() => onStatusMember(m)}
                              className="cortex-btn--icon"
                              title="Change Status"
                            >
                              <i className="bi bi-person-check"></i>
                            </button>
                          )}

                          {/* Audit History */}
                          <button
                            onClick={() => onHistoryMember(m)}
                            className="cortex-btn--icon"
                            title="Audit History Timeline"
                          >
                            <i className="bi bi-clock-history"></i>
                          </button>

                          {/* Archive */}
                          {canDelete && (
                            <button
                              onClick={() => onArchiveMember(m)}
                              className="cortex-btn--icon text-danger"
                              title="Archive Member"
                            >
                              <i className="bi bi-archive"></i>
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

        {/* Pagination Bar */}
        <div className="table-pagination-bar">
          <div>
            Showing {members.length} of {totalCount} records (Page {page} of {totalPages || 1})
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="cortex-btn cortex-btn--secondary py-1 px-3"
            >
              <i className="bi bi-chevron-left me-1"></i> Prev
            </button>
            <span className="fw-bold text-white px-2">{page}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="cortex-btn cortex-btn--secondary py-1 px-3"
            >
              Next <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
