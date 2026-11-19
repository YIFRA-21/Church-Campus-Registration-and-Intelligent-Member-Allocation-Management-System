import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Member, MemberStatusHistory } from "../../types/member";
import { MemberStatusBadge } from "./MemberStatusBadge";

interface MemberHistoryModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  fetchHistory: (id: string) => Promise<MemberStatusHistory[]>;
}

export const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({
  isOpen,
  member,
  onClose,
  fetchHistory,
}) => {
  const [history, setHistory] = useState<MemberStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && member) {
      setLoading(true);
      setError(null);
      fetchHistory(member.id)
        .then((data) => {
          setHistory(data || []);
        })
        .catch((err) => {
          setError(err.message || "Failed to load status audit history.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, member, fetchHistory]);

  if (!isOpen || !member) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      <div className="cortex-modal-backdrop" onClick={onClose}>
        <motion.div
          className="cortex-modal-dialog"
          style={{ maxWidth: "640px" }}
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
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.3))",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  color: "#a78bfa",
                  fontSize: "1.25rem",
                }}
              >
                <i className="bi bi-clock-history"></i>
              </div>
              <div>
                <h5 className="text-white fw-bold mb-0">Status Audit Trail</h5>
                <p className="text-muted small mb-0">
                  Chronological lifecycle history for <span className="text-white fw-semibold">{member.fullName}</span>
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

          {/* Member Code Badge */}
          <div
            className="p-3 my-3 rounded-3 d-flex align-items-center justify-content-between"
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <span className="text-muted small d-block">Member Code</span>
              <span className="font-monospace fw-bold text-white small">{member.memberId}</span>
            </div>
            <div className="text-end">
              <span className="text-muted small d-block">Current Active State</span>
              <MemberStatusBadge status={member.status} />
            </div>
          </div>

          {/* Timeline Content */}
          <div style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading history...</span>
                </div>
                <p className="text-muted small mt-2">Retrieving audit log entries...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-5">
                <div
                  className="rounded-circle d-inline-flex p-3 mb-2"
                  style={{ background: "rgba(255, 255, 255, 0.05)" }}
                >
                  <i className="bi bi-file-earmark-text text-muted fs-3"></i>
                </div>
                <h6 className="text-light">No Status Changes Recorded</h6>
                <p className="text-muted small mb-0">
                  This member retains their initial creation status ({member.status}).
                </p>
              </div>
            ) : (
              <div className="position-relative ps-4 ms-2" style={{ borderLeft: "2px solid rgba(99, 102, 241, 0.3)" }}>
                {history.map((item, idx) => (
                  <div key={item.id || idx} className="position-relative mb-4">
                    {/* Circle Node */}
                    <div
                      className="position-absolute rounded-circle"
                      style={{
                        width: "12px",
                        height: "12px",
                        background: "#6366f1",
                        boxShadow: "0 0 10px rgba(99, 102, 241, 0.7)",
                        left: "-25px",
                        top: "4px",
                      }}
                    ></div>

                    {/* Content Box */}
                    <div
                      className="p-3 rounded-3"
                      style={{
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <MemberStatusBadge status={item.oldStatus} />
                          <i className="bi bi-arrow-right text-muted small"></i>
                          <MemberStatusBadge status={item.newStatus} />
                        </div>
                        <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                          <i className="bi bi-calendar3 me-1"></i>
                          {formatDate(item.changedAt)}
                        </span>
                      </div>

                      {/* Reason */}
                      <div
                        className="p-2 rounded-2 mt-2"
                        style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          borderLeft: "3px solid #6366f1",
                        }}
                      >
                        <span className="text-muted d-block small" style={{ fontSize: "0.72rem" }}>
                          Audit Justification:
                        </span>
                        <p className="text-light small mb-0 fst-italic">"{item.reason}"</p>
                      </div>

                      {/* Changed By */}
                      <div className="d-flex align-items-center gap-1 mt-2 text-muted" style={{ fontSize: "0.72rem" }}>
                        <i className="bi bi-person-check"></i>
                        <span>Recorded by:</span>
                        <span className="text-white fw-semibold">
                          {item.changedByName || item.changedBy || "System Administrator"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="d-flex align-items-center justify-content-between pt-3 mt-3 border-top border-white-10">
            <span className="text-muted small">
              <i className="bi bi-shield-check me-1 text-success"></i> Tamper-evident ledger log
            </span>
            <button
              type="button"
              className="cortex-btn cortex-btn--secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
