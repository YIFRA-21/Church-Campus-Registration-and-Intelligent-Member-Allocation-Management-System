import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Campus } from "../../types/campus";
import {
  Member,
  CreateMemberPayload,
  Gender,
  MemberCategory,
  SpiritualStatus,
  MemberStatus,
} from "../../types/member";

interface MemberEditModalProps {
  isOpen: boolean;
  member: Member | null;
  campuses: Campus[];
  onClose: () => void;
  onSave: (id: string, payload: Partial<CreateMemberPayload>) => Promise<void>;
}

const ETHIOPIAN_REGIONS = [
  "አዲስ አበባ (Addis Ababa)",
  "ኦሮሚያ (Oromia)",
  "አማራ (Amhara)",
  "ትግራይ (Tigray)",
  "ደቡብ ኢትዮጵያ (South Ethiopia)",
  "ሲዳማ (Sidama)",
  "ሶማሌ (Somali)",
  "አፋር (Afar)",
  "ቤንሻንጉል ጉሙዝ (Benishangul)",
  "ጋምቤላ (Gambella)",
  "ሐረሪ (Harari)",
  "ድሬዳዋ (Dire Dawa)",
];

const ETHIOPIAN_LANGUAGES = [
  "አማርኛ (Amharic)",
  "Afaan Oromoo",
  "ትግርኛ (Tigrinya)",
  "Somali",
  "Sidama",
  "Wolaytta",
  "English",
];

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  isOpen,
  member,
  campuses,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "fellowship" | "contact">("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateMemberPayload>>({});

  useEffect(() => {
    if (member) {
      setFormData({
        campusId: member.campusId,
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        christianName: member.christianName || "",
        gender: member.gender || "MALE",
        phoneNumber: member.phoneNumber || "",
        email: member.email || "",
        academicDepartment: member.academicDepartment || "",
        originRegion: member.originRegion || "",
        zone: member.zone || "",
        woreda: member.woreda || "",
        kebele: member.kebele || "",
        dormBlock: member.dormBlock || "",
        dormRoom: member.dormRoom || "",
        language: member.language || "",
        emergencyContactName: member.emergencyContactName || "",
        emergencyContactPhone: member.emergencyContactPhone || "",
        sundaySchoolDuration: member.sundaySchoolDuration || "",
        age: member.age || undefined,
        category: member.category || "STUDENT",
        spiritualStatus: member.spiritualStatus || "REGULAR",
        educationLevel: member.educationLevel || "",
        address: member.address || "",
      });
      setError(null);
      setActiveTab("personal");
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleChange = (field: keyof CreateMemberPayload, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      setError("First Name and Last Name are required fields.");
      setActiveTab("personal");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(member.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save member updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="cortex-modal-backdrop" onClick={onClose}>
        <motion.div
          className="cortex-modal-dialog"
          style={{ maxWidth: "800px" }}
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
                  width: "44px",
                  height: "44px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.3))",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  color: "#a78bfa",
                  fontSize: "1.3rem",
                }}
              >
                <i className="bi bi-pencil-square"></i>
              </div>
              <div>
                <h5 className="text-white fw-bold mb-0">Modify Fellowship Member Profile</h5>
                <p className="text-muted small mb-0">
                  Editing record for <span className="text-white fw-semibold">{member.fullName}</span>
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

          {/* Rule 6 Notice: Immutability Banner */}
          <div
            className="p-3 my-3 rounded-3 d-flex align-items-center justify-content-between"
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock-fill text-warning"></i>
              <div>
                <span className="text-muted small d-block">System Member Code (Rule 6 — Immutable):</span>
                <span className="font-monospace fw-bold text-white small">{member.memberId}</span>
              </div>
            </div>
            <div className="text-end">
              <span className="text-muted small d-block">Current Status:</span>
              <span className="badge rounded-pill bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 px-2 py-1 small">
                {member.status}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <ul className="nav nav-pills gap-2 mb-3 border-bottom border-white-10 pb-2">
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${
                  activeTab === "personal"
                    ? "btn-primary text-white"
                    : "btn-outline-secondary text-light border-0"
                }`}
                onClick={() => setActiveTab("personal")}
              >
                <i className="bi bi-person me-1"></i> Personal Identity
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${
                  activeTab === "academic"
                    ? "btn-primary text-white"
                    : "btn-outline-secondary text-light border-0"
                }`}
                onClick={() => setActiveTab("academic")}
              >
                <i className="bi bi-mortarboard me-1"></i> Academic & Residence
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${
                  activeTab === "fellowship"
                    ? "btn-primary text-white"
                    : "btn-outline-secondary text-light border-0"
                }`}
                onClick={() => setActiveTab("fellowship")}
              >
                <i className="bi bi-cross me-1"></i> Spiritual & Ministry
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`btn btn-sm ${
                  activeTab === "contact"
                    ? "btn-primary text-white"
                    : "btn-outline-secondary text-light border-0"
                }`}
                onClick={() => setActiveTab("contact")}
              >
                <i className="bi bi-telephone me-1"></i> Contact & Emergency
              </button>
            </li>
          </ul>

          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
              {/* TAB 1: PERSONAL */}
              {activeTab === "personal" && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="cortex-form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.firstName || ""}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.lastName || ""}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Christian / Baptismal Name (የክርስትና ስም)</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.christianName || ""}
                      onChange={(e) => handleChange("christianName", e.target.value)}
                      placeholder="e.g. ወለተ ማርያም / ኃይለ ጊዮርጊስ"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="cortex-form-label">Gender</label>
                    <select
                      className="form-select cortex-form-control"
                      value={formData.gender || "MALE"}
                      onChange={(e) => handleChange("gender", e.target.value as Gender)}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="cortex-form-label">Age</label>
                    <input
                      type="number"
                      className="form-control cortex-form-control"
                      value={formData.age || ""}
                      onChange={(e) => handleChange("age", e.target.value ? parseInt(e.target.value) : undefined)}
                      min="1"
                      max="120"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Primary Language</label>
                    <select
                      className="form-select cortex-form-control"
                      value={formData.language || ""}
                      onChange={(e) => handleChange("language", e.target.value)}
                    >
                      <option value="">Select Language</option>
                      {ETHIOPIAN_LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Campus Tenancy</label>
                    <select
                      className="form-select cortex-form-control"
                      value={formData.campusId || ""}
                      onChange={(e) => handleChange("campusId", e.target.value)}
                    >
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: ACADEMIC & RESIDENCE */}
              {activeTab === "academic" && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="cortex-form-label">Academic Department / Faculty</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.academicDepartment || ""}
                      onChange={(e) => handleChange("academicDepartment", e.target.value)}
                      placeholder="e.g. Software Engineering, Medicine"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Education Level</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.educationLevel || ""}
                      onChange={(e) => handleChange("educationLevel", e.target.value)}
                      placeholder="e.g. Year 3 Undergraduate, MSc"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Dorm Block Number</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.dormBlock || ""}
                      onChange={(e) => handleChange("dormBlock", e.target.value)}
                      placeholder="e.g. Block 42"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Dorm Room Number</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.dormRoom || ""}
                      onChange={(e) => handleChange("dormRoom", e.target.value)}
                      placeholder="e.g. Room 204"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Origin Region (ክልል)</label>
                    <select
                      className="form-select cortex-form-control"
                      value={formData.originRegion || ""}
                      onChange={(e) => handleChange("originRegion", e.target.value)}
                    >
                      <option value="">Select Region</option>
                      {ETHIOPIAN_REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Zone (ዞን)</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.zone || ""}
                      onChange={(e) => handleChange("zone", e.target.value)}
                      placeholder="e.g. Arsi, North Shewa"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Woreda (ወረዳ)</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.woreda || ""}
                      onChange={(e) => handleChange("woreda", e.target.value)}
                      placeholder="e.g. Woreda 03"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Kebele (ቀበሌ)</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.kebele || ""}
                      onChange={(e) => handleChange("kebele", e.target.value)}
                      placeholder="e.g. Kebele 08"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: FELLOWSHIP */}
              {activeTab === "fellowship" && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="cortex-form-label">Member Fellowship Category</label>
                    <select
                      className="form-select cortex-form-control"
                      value={formData.category || "STUDENT"}
                      onChange={(e) => handleChange("category", e.target.value as MemberCategory)}
                    >
                      <option value="STUDENT">Student (ተማሪ)</option>
                      <option value="YOUTH">Youth (ወጣት)</option>
                      <option value="YOUNG_ADULT">Young Adult</option>
                      <option value="ADULT">Adult (ጎልማሳ)</option>
                      <option value="ELDER">Elder (ሽማግሌ)</option>
                      <option value="CHILDREN">Children</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Spiritual Status / Ordination</label>
                    <select
                      className="form-select cortex-form-control"
                      value={formData.spiritualStatus || "REGULAR"}
                      onChange={(e) => handleChange("spiritualStatus", e.target.value as SpiritualStatus)}
                    >
                      <option value="REGULAR">Regular Member (ምዕመን)</option>
                      <option value="DEACON">Ordained Deacon (ዲያቆን)</option>
                      <option value="SERVANT">Fellowship Servant (አገልጋይ)</option>
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="cortex-form-label">Sunday School Background & Experience</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.sundaySchoolDuration || ""}
                      onChange={(e) => handleChange("sundaySchoolDuration", e.target.value)}
                      placeholder="e.g. 4 years at Debre Mewi St. Mary Sunday School"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACT */}
              {activeTab === "contact" && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="cortex-form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control cortex-form-control"
                      value={formData.phoneNumber || ""}
                      onChange={(e) => handleChange("phoneNumber", e.target.value)}
                      placeholder="+251 91 123 4567"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control cortex-form-control"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="member@example.com"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Emergency Contact Name</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.emergencyContactName || ""}
                      onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                      placeholder="e.g. Yohannes Tesfaye (Parent)"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="cortex-form-label">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      className="form-control cortex-form-control"
                      value={formData.emergencyContactPhone || ""}
                      onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                      placeholder="+251 91 234 5678"
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="cortex-form-label">Residential Address</label>
                    <input
                      type="text"
                      className="form-control cortex-form-control"
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Street, City, House Number"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="d-flex align-items-center justify-content-between pt-3 mt-3 border-top border-white-10">
              <span className="text-muted small">
                <i className="bi bi-info-circle me-1"></i> Changes will immediately sync to database audit logs
              </span>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="cortex-btn cortex-btn--secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cortex-btn cortex-btn--primary d-flex align-items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle"></i>
                      <span>Save Updates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
