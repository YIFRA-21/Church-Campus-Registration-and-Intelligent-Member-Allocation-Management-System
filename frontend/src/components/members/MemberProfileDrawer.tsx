import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "../../types/member";
import { MemberStatusBadge } from "./MemberStatusBadge";

interface MemberProfileDrawerProps {
  member: Member;
  onClose: () => void;
  onEdit: (m: Member) => void;
  onStatusChange: (m: Member) => void;
  canEdit: boolean;
}

export const MemberProfileDrawer: React.FC<MemberProfileDrawerProps> = ({
  member,
  onClose,
  onEdit,
  onStatusChange,
  canEdit,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "personal" | "contact" | "church" | "residence"
  >("overview");

  return (
    <div className="cortex-drawer-backdrop" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="cortex-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="modal-header-bar">
          <div className="d-flex align-items-center gap-2">
            <span className="badge font-monospace bg-dark border border-secondary text-info px-2 py-1">
              {member.memberId}
            </span>
            <span className="text-secondary small">· 360° Fellowship CRM Profile</span>
          </div>
          <button onClick={onClose} className="btn-close btn-close-white"></button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="drawer-body-scroll">
          {/* Profile Card Header Banner */}
          <div className="cortex-profile-header">
            <div className="profile-avatar-lg">
              {member.firstName.charAt(0)}
              {member.lastName.charAt(0)}
            </div>

            <div className="profile-title-group">
              <span className="member-code-tag">{member.memberId}</span>
              <h2 className="member-name">{member.fullName}</h2>
              {member.christianName && (
                <div className="member-baptismal">
                  <i className="bi bi-shield-fill"></i>
                  <span>ክርስትና ስም: {member.christianName}</span>
                </div>
              )}
              <div className="mt-2 d-flex align-items-center gap-2">
                <MemberStatusBadge status={member.status} />
                <span className="badge bg-secondary bg-opacity-25 text-light">
                  {member.category}
                </span>
                <span className="badge bg-info bg-opacity-15 text-info border border-info border-opacity-25">
                  {member.spiritualStatus}
                </span>
              </div>
            </div>

            {canEdit && (
              <div>
                <button
                  onClick={() => onEdit(member)}
                  className="cortex-btn cortex-btn--secondary"
                  title="Edit Member"
                >
                  <i className="bi bi-pencil-fill"></i> Edit
                </button>
              </div>
            )}
          </div>

          {/* Profile Tabs */}
          <div className="cortex-profile-tabs">
            <button
              className={`profile-tab-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="bi bi-grid-1x2"></i> Overview
            </button>
            <button
              className={`profile-tab-item ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <i className="bi bi-person"></i> Personal
            </button>
            <button
              className={`profile-tab-item ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => setActiveTab("contact")}
            >
              <i className="bi bi-telephone"></i> Contact
            </button>
            <button
              className={`profile-tab-item ${activeTab === "church" ? "active" : ""}`}
              onClick={() => setActiveTab("church")}
            >
              <i className="bi bi-church"></i> Fellowship
            </button>
            <button
              className={`profile-tab-item ${activeTab === "residence" ? "active" : ""}`}
              onClick={() => setActiveTab("residence")}
            >
              <i className="bi bi-geo-alt"></i> Residence
            </button>
          </div>

          {/* Tab Content Display */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="profile-attribute-grid">
                  <div className="attribute-box">
                    <div className="attr-label">Gender & Age</div>
                    <div className="attr-value">{member.gender}, {member.age || "N/A"} years</div>
                  </div>
                  <div className="attribute-box">
                    <div className="attr-label">Academic Department</div>
                    <div className="attr-value">{member.academicDepartment || "Undeclared"}</div>
                  </div>
                  <div className="attribute-box">
                    <div className="attr-label">Education Level</div>
                    <div className="attr-value">{member.educationLevel}</div>
                  </div>
                  <div className="attribute-box">
                    <div className="attr-label">Campus Dormitory</div>
                    <div className="attr-value">Block {member.dormBlock || "N/A"} · Room {member.dormRoom || "N/A"}</div>
                  </div>
                </div>

                {/* Quick Action Banner */}
                <div className="p-3 rounded-4 bg-dark border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-white fw-bold small">Lifecycle Status Management</div>
                    <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      Current status: <strong className="text-info">{member.status}</strong>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => onStatusChange(member)}
                      className="cortex-btn cortex-btn--secondary py-1 px-3 text-warning border-warning"
                    >
                      <i className="bi bi-arrow-repeat me-1"></i> Transition Status
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "personal" && (
              <motion.div
                key="tab-personal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="profile-attribute-grid"
              >
                <div className="attribute-box">
                  <div className="attr-label">Full Name</div>
                  <div className="attr-value">{member.fullName}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Christian Baptismal Name</div>
                  <div className="attr-value text-warning">{member.christianName || "None registered"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Gender</div>
                  <div className="attr-value">{member.gender}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Age</div>
                  <div className="attr-value">{member.age || "N/A"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Primary Language</div>
                  <div className="attr-value">{member.language || "አማርኛ"}</div>
                </div>
              </motion.div>
            )}

            {activeTab === "contact" && (
              <motion.div
                key="tab-contact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="profile-attribute-grid"
              >
                <div className="attribute-box">
                  <div className="attr-label">Primary Phone</div>
                  <div className="attr-value text-info">
                    <i className="bi bi-telephone-fill me-1"></i>
                    {member.phoneNumber || "N/A"}
                  </div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Email</div>
                  <div className="attr-value">{member.email || "N/A"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Emergency Guardian Name</div>
                  <div className="attr-value">{member.emergencyContactName || "Not provided"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Emergency Guardian Phone</div>
                  <div className="attr-value">{member.emergencyContactPhone || "Not provided"}</div>
                </div>
              </motion.div>
            )}

            {activeTab === "church" && (
              <motion.div
                key="tab-church"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="profile-attribute-grid"
              >
                <div className="attribute-box">
                  <div className="attr-label">Spiritual Role</div>
                  <div className="attr-value text-purple">{member.spiritualStatus}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Fellowship Category</div>
                  <div className="attr-value">{member.category}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Sunday School Experience</div>
                  <div className="attr-value">{member.sundaySchoolDuration || "N/A"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Academic Department</div>
                  <div className="attr-value">{member.academicDepartment || "Undeclared"}</div>
                </div>
              </motion.div>
            )}

            {activeTab === "residence" && (
              <motion.div
                key="tab-residence"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="profile-attribute-grid"
              >
                <div className="attribute-box">
                  <div className="attr-label">Origin Region (ክልል)</div>
                  <div className="attr-value">{member.originRegion || "አዲስ አበባ"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Zone & Woreda</div>
                  <div className="attr-value">{member.zone || "N/A"} · {member.woreda || "N/A"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Dormitory Block</div>
                  <div className="attr-value">{member.dormBlock || "N/A"}</div>
                </div>
                <div className="attribute-box">
                  <div className="attr-label">Dormitory Room</div>
                  <div className="attr-value">{member.dormRoom || "N/A"}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
