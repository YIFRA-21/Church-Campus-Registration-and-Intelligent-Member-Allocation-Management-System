import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Member, MemberStatus } from "../../types/member";
import { MemberStatusBadge } from "./MemberStatusBadge";

interface MemberStatusModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onConfirm: (memberId: string, status: MemberStatus, reason: string) => Promise<void>;
}

const STATUS_DESCRIPTIONS: Record<MemberStatus, { label: string; desc: string; icon: string; badgeColor: string }> = {
  ACTIVE: {
    label: "Active (ተሳታፊ)",
    desc: "Member is in good standing and eligible for fellowship department allocation and ministry roles.",
    icon: "bi-check-circle-fill",
    badgeColor: "success",
  },
  INACTIVE: {
    label: "Inactive (ያልተሳተፈ)",
    desc: "Member has ceased active participation temporarily; excluded from current active rosters.",
    icon: "bi-pause-circle-fill",
    badgeColor: "warning",
  },
  ON_HOLD: {
    label: "On Hold (ተጠባባቂ)",
    desc: "Member status is temporarily paused pending review, verification, or academic leave.",
    icon: "bi-hourglass-split",
    badgeColor: "info",
  },
  SUSPENDED: {
    label: "Suspended (የታገደ)",
    desc: "Member is formally restricted from ministry operations pending administrative review.",
    icon: "bi-slash-circle-fill",
    badgeColor: "danger",
  },
  ARCHIVED: {
    label: "Archived (የተቀመጠ / የተመረቀ)",
    desc: "Member has graduated, relocated, or departed. Soft archived while preserving all historical records (Rule 5).",
    icon: "bi-archive-fill",
    badgeColor: "secondary",
  },
};

export const MemberStatusModal: React.FC<MemberStatusModalProps> = ({
  isOpen,
  member,
  onClose,
  onConfirm,
}) => {
  const [targetStatus, setTargetStatus] = useState<MemberStatus>("ACTIVE");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setTargetStatus(member.status);
      setReason("");
      setError(null);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === member.status) {
      setError("Please select a new status different from the current status.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Rule 9 Compliance: Written justification must be at least 5 characters long.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(member.id, targetStatus, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update member status.");
    } finally {
      setSubmitting(false);
    }
  };

  const isDestructive = targetStatus === "ARCHIVED" || targetStatus === "SUSPENDED";

  return (
    <AnimatePresence>
      <div className="cortex-modal-backdrop" onClick={onClose}>
        <motion.div
          className="cortex-modal-dialog"
          style={{ maxWidth: "560px" }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-white-10">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{
                  width: "42px",
                  height: "42px",
                  background: isDestructive
                    ? "rgba(239, 68, 68, 0.15)"
                    : "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.3))",
                  border: isDestructive
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid rgba(139, 92, 246, 0.4)",
                  color: isDestructive ? "#f87171" : "#a78bfa",
                  fontSize: "1.25rem",
                }}
              >
                <i className={isDestructive ? "bi bi-shield-slash" : "bi bi-sliders2-vertical"}></i>
              </div>
              <div>
                <h5 className="text-white fw-bold mb-0">Transition Member Status</h5>
                <p className="text-muted small mb-0">
                  Record transition for <span className="text-white fw-semibold">{member.fullName}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className="cortex-btn--icon"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-3">
            {/* Current vs Target Transition Visual */}
            <div
              className="p-3 rounded-3 mb-3 d-flex align-items-center justify-content-between"
              style={{
                background: "rgba(15, 23, 42, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div className="text-center">
                <span className="text-muted small d-block mb-1">Current Status</span>
                <MemberStatusBadge status={member.status} />
              </div>

              <div className="d-flex flex-column align-items-center text-muted">
                <i className="bi bi-arrow-right fs-4 text-indigo"></i>
                <span style={{ fontSize: "0.68rem" }} className="text-uppercase tracking-wider">Transition</span>
              </div>

              <div className="text-center">
                <span className="text-muted small d-block mb-1">Target Status</span>
                <MemberStatusBadge status={targetStatus} />
              </div>
            </div>

            {/* Target Status Select */}
            <div className="mb-3">
              <label className="cortex-form-label">
                Select Target Status <span className="text-danger">*</span>
              </label>
              <select
                className="form-select cortex-form-control"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as MemberStatus)}
              >
                {(["ACTIVE", "INACTIVE", "ON_HOLD", "SUSPENDED", "ARCHIVED"] as MemberStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_DESCRIPTIONS[st].label}
                  </option>
                ))}
              </select>
              <div className="mt-2 p-2 rounded-2 bg-dark bg-opacity-50 border border-white-5 small text-light">
                <i className={`${STATUS_DESCRIPTIONS[targetStatus].icon} me-1 text-info`}></i>
                {STATUS_DESCRIPTIONS[targetStatus].desc}
              </div>
            </div>

            {/* Warning for Archival / Suspension */}
            {isDestructive && (
              <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>
                  <strong>Important Notice:</strong> Changing to{" "}
                  <span className="text-uppercase fw-bold">{targetStatus}</span> will automatically
                  exclude this member from active allocation algorithms (Module 7). Historical audit records
                  remain strictly preserved.
                </div>
              </div>
            )}

            {/* Mandatory Justification (Rule 9) */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="cortex-form-label mb-0">
                  Audit Justification & Reason <span className="text-danger">*</span>
                </label>
                <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                  Rule 9 Mandatory Requirement
                </span>
              </div>
              <textarea
                className="form-control cortex-form-control"
                rows={3}
                placeholder="Explain the reason for this status transition (e.g., Graduated and relocated, Completed semester abroad, Disciplinary hold)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              ></textarea>
              <span className="text-muted small mt-1 d-block" style={{ fontSize: "0.75rem" }}>
                Minimum 5 characters. This text is permanently stored in the audit history trail.
              </span>
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-exclamation-circle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="d-flex align-items-center justify-content-end gap-2 pt-3 border-top border-white-10">
              <button
                type="button"
                className="cortex-btn cortex-btn--secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`cortex-btn ${isDestructive ? "btn-danger" : "cortex-btn--primary"} d-flex align-items-center gap-2`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Recording Transition...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle"></i>
                    <span>Apply Transition</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
