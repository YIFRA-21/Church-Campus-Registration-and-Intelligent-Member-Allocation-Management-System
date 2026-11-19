import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Campus } from "../../types/campus";
import {
  CreateMemberPayload,
  Gender,
  MemberCategory,
  SpiritualStatus,
} from "../../types/member";

interface MemberRegistrationModalProps {
  campuses: Campus[];
  defaultCampusId: string;
  onClose: () => void;
  onSubmit: (data: CreateMemberPayload) => Promise<void>;
  submitting: boolean;
}

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

export const MemberRegistrationModal: React.FC<MemberRegistrationModalProps> = ({
  campuses,
  defaultCampusId,
  onClose,
  onSubmit,
  submitting,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateMemberPayload>({
    campusId: defaultCampusId || (campuses[0]?.id ?? ""),
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

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setErrorMsg("Please enter both First Name and Last Name.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.phoneNumber?.trim()) {
        setErrorMsg("Please enter a valid Phone Number.");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.campusId) {
        setErrorMsg("Please select a valid Church Campus.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onSubmit(formData);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register member.");
    }
  };

  return (
    <div className="cortex-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="cortex-modal-dialog max-w-4xl"
      >
        {/* Header */}
        <div className="modal-header-bar">
          <h4 className="modal-title-text">
            <i className="bi bi-person-plus-fill"></i>
            Official Member Registration (5-Section Stepper)
          </h4>
          <button onClick={onClose} className="btn-close btn-close-white"></button>
        </div>

        {/* Stepper Navigation */}
        <div className="p-3 pt-4 border-bottom border-secondary border-opacity-10 bg-dark bg-opacity-25">
          <div className="cortex-stepper">
            <div
              className={`step-node ${currentStep === 1 ? "step-active" : currentStep > 1 ? "step-completed" : ""}`}
              onClick={() => setCurrentStep(1)}
            >
              <div className="step-circle">{currentStep > 1 ? <i className="bi bi-check-lg"></i> : "1"}</div>
              <span className="step-label">Personal</span>
            </div>

            <div
              className={`step-node ${currentStep === 2 ? "step-active" : currentStep > 2 ? "step-completed" : ""}`}
              onClick={() => setCurrentStep(2)}
            >
              <div className="step-circle">{currentStep > 2 ? <i className="bi bi-check-lg"></i> : "2"}</div>
              <span className="step-label">Contact</span>
            </div>

            <div
              className={`step-node ${currentStep === 3 ? "step-active" : currentStep > 3 ? "step-completed" : ""}`}
              onClick={() => setCurrentStep(3)}
            >
              <div className="step-circle">{currentStep > 3 ? <i className="bi bi-check-lg"></i> : "3"}</div>
              <span className="step-label">Campus</span>
            </div>

            <div
              className={`step-node ${currentStep === 4 ? "step-active" : currentStep > 4 ? "step-completed" : ""}`}
              onClick={() => setCurrentStep(4)}
            >
              <div className="step-circle">{currentStep > 4 ? <i className="bi bi-check-lg"></i> : "4"}</div>
              <span className="step-label">Fellowship</span>
            </div>

            <div
              className={`step-node ${currentStep === 5 ? "step-active" : ""}`}
              onClick={() => setCurrentStep(5)}
            >
              <div className="step-circle">5</div>
              <span className="step-label">Residence</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden">
          <div className="modal-body-scroll">
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* SECTION 1: Personal Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="row g-3"
                >
                  <div className="col-12 text-info fw-bold small text-uppercase">
                    <i className="bi bi-person-fill me-1"></i> Section A: Personal Information & Baptism
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">First Name (ስም) <span className="req-star">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yohannes"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Last Name (የአባት ስም) <span className="req-star">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Haile"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Christian Name (የክርስትና ስም)</label>
                    <input
                      type="text"
                      placeholder="e.g. ወልደ ማርያም"
                      value={formData.christianName}
                      onChange={(e) => setFormData({ ...formData, christianName: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="cortex-form-label">Gender <span className="req-star">*</span></label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="form-select cortex-form-control"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="cortex-form-label">Age</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Primary Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="form-select cortex-form-control"
                    >
                      {ETHIOPIAN_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* SECTION 2: Contact Information */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="row g-3"
                >
                  <div className="col-12 text-info fw-bold small text-uppercase">
                    <i className="bi bi-telephone-fill me-1"></i> Section B: Contact & Emergency Guardian
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Phone Number <span className="req-star">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="+251911223344"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="member@c-cimas.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Emergency Contact Name</label>
                    <input
                      type="text"
                      placeholder="Guardian / Family Name"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+251911..."
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>
                </motion.div>
              )}

              {/* SECTION 3: Campus Information */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="row g-3"
                >
                  <div className="col-12 text-info fw-bold small text-uppercase">
                    <i className="bi bi-building-fill me-1"></i> Section C: Campus Identification (Rule 1: Single Campus)
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Church Campus <span className="req-star">*</span></label>
                    <select
                      required
                      value={formData.campusId}
                      onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                      className="form-select cortex-form-control"
                    >
                      <option value="">Select Campus</option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Academic Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, Medicine"
                      value={formData.academicDepartment}
                      onChange={(e) => setFormData({ ...formData, academicDepartment: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  {/* Auto-code notification note */}
                  <div className="col-12 mt-4">
                    <div className="p-3 rounded-4 bg-primary bg-opacity-10 border border-primary text-info small d-flex align-items-center gap-2">
                      <i className="bi bi-shield-check fs-5"></i>
                      <span>
                        <strong>Concurrency-Safe Automatic Code Generation:</strong> Upon saving, the backend sequence generator will assign an atomic, immutable code (format: <code>MEM-YYYY-XXXX</code>).
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION 4: Church Information */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="row g-3"
                >
                  <div className="col-12 text-info fw-bold small text-uppercase">
                    <i className="bi bi-shield-shaded me-1"></i> Section D: Church Ministry & Spiritual Role
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Spiritual Role <span className="req-star">*</span></label>
                    <select
                      value={formData.spiritualStatus}
                      onChange={(e) => setFormData({ ...formData, spiritualStatus: e.target.value as SpiritualStatus })}
                      className="form-select cortex-form-control"
                    >
                      <option value="REGULAR">REGULAR (ምእመን)</option>
                      <option value="SERVANT">SERVANT (አገልጋይ)</option>
                      <option value="DEACON">DEACON (ዲያቆን)</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Fellowship Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as MemberCategory })}
                      className="form-select cortex-form-control"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="YOUTH">YOUTH</option>
                      <option value="YOUNG_ADULT">YOUNG ADULT</option>
                      <option value="ADULT">ADULT</option>
                      <option value="ELDER">ELDER</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Sunday School Duration / Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 ዓመት"
                      value={formData.sundaySchoolDuration}
                      onChange={(e) => setFormData({ ...formData, sundaySchoolDuration: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Education Level</label>
                    <input
                      type="text"
                      value={formData.educationLevel}
                      onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                      className="form-control cortex-form-control"
                    />
                  </div>
                </motion.div>
              )}

              {/* SECTION 5: Residence Information */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="row g-3"
                >
                  <div className="col-12 text-info fw-bold small text-uppercase">
                    <i className="bi bi-geo-alt-fill me-1"></i> Section E: Origin & Campus Dormitory Residence
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Origin Region (ክልል)</label>
                    <select
                      value={formData.originRegion}
                      onChange={(e) => setFormData({ ...formData, originRegion: e.target.value })}
                      className="form-select cortex-form-control"
                    >
                      {ETHIOPIAN_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Zone / Woreda</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <input
                          type="text"
                          placeholder="Zone"
                          value={formData.zone}
                          onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                          className="form-control cortex-form-control"
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          placeholder="Woreda"
                          value={formData.woreda}
                          onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                          className="form-control cortex-form-control"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="cortex-form-label">Dorm Block & Room</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <input
                          type="text"
                          placeholder="Block 42"
                          value={formData.dormBlock}
                          onChange={(e) => setFormData({ ...formData, dormBlock: e.target.value })}
                          className="form-control cortex-form-control"
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          placeholder="Room 204"
                          value={formData.dormRoom}
                          onChange={(e) => setFormData({ ...formData, dormRoom: e.target.value })}
                          className="form-control cortex-form-control"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stepper Footer Controls */}
          <div className="modal-footer-bar">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="cortex-btn cortex-btn--secondary"
                >
                  <i className="bi bi-arrow-left"></i> Previous
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cortex-btn cortex-btn--secondary"
              >
                Cancel
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="cortex-btn cortex-btn--primary"
                >
                  Next <i className="bi bi-arrow-right"></i>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="cortex-btn cortex-btn--primary"
                >
                  {submitting ? "Registering..." : "Submit Registration"}
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
