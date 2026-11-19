import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import { Campus } from "../types/campus";
import {
  ImportBatch,
  ImportColumnMapping,
  ImportValidationError,
  ImportDuplicateCandidate,
  ImportRow,
  DuplicateReviewDecision,
} from "../types/import";
import {
  downloadCsvTemplate,
  downloadExcelTemplate,
  uploadCsvFile,
  fetchImportHistory,
  fetchBatchById,
  fetchBatchPreview,
  saveColumnMappings,
  runBatchValidation,
  fetchValidationResults,
  fetchDuplicateCandidates,
  submitDuplicateReview,
  fetchStagedRecords,
  approveBatch,
  processApprovedBatch,
  retryBatchProcessing,
  downloadOriginalCsvFile,
  downloadImportErrorReport,
} from "../api/import.api";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  History,
  FileCheck2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  FileCode,
  Users,
  AlertCircle,
  Layers,
  Database,
  Lock,
  Clock,
  Sparkles,
} from "lucide-react";

// Canonical 17 Module 3 member fields with Amharic labels and categories
const CANONICAL_FIELDS: { key: string; labelEn: string; labelAm: string; category: string; required: boolean }[] = [
  { key: "serial_number", labelEn: "Serial Number / Member ID", labelAm: "ተ.ቁጥር / መለያ", category: "Core", required: false },
  { key: "full_name", labelEn: "Full Name", labelAm: "ሙሉ ስም", category: "Core", required: true },
  { key: "christian_name", labelEn: "Baptismal / Christian Name", labelAm: "የክርስትና ስም", category: "Spiritual", required: false },
  { key: "gender", labelEn: "Gender (MALE/FEMALE)", labelAm: "ጾታ", category: "Demographics", required: true },
  { key: "phone", labelEn: "Phone Number", labelAm: "ስልክ ቁጥር", category: "Contact", required: false },
  { key: "source_department_name", labelEn: "Source / Academic Department", labelAm: "የትምህርት ክፍል (ዲፓርትመንት)", category: "Academic", required: false },
  { key: "region", labelEn: "Origin Region", labelAm: "የመጡበት ክልል", category: "Origin", required: false },
  { key: "zone", labelEn: "Zone", labelAm: "ዞን", category: "Origin", required: false },
  { key: "woreda", labelEn: "Woreda", labelAm: "ወረዳ", category: "Origin", required: false },
  { key: "kebele", labelEn: "Kebele", labelAm: "ቀበሌ", category: "Origin", required: false },
  { key: "block", labelEn: "Dormitory Block", labelAm: "ዶርም ብሎክ", category: "Campus Residence", required: false },
  { key: "dormitory", labelEn: "Dormitory Room", labelAm: "ዶርም ክፍል", category: "Campus Residence", required: false },
  { key: "language", labelEn: "Language", labelAm: "ቋንቋ", category: "Demographics", required: false },
  { key: "emergency_contact_name", labelEn: "Emergency Contact Name", labelAm: "የተጠሪ ስም", category: "Emergency", required: false },
  { key: "emergency_contact_phone", labelEn: "Emergency Contact Phone", labelAm: "የተጠሪ ስልክ", category: "Emergency", required: false },
  { key: "residence_or_sunday_school", labelEn: "Sunday School Duration / Background", labelAm: "የሰንበት ት/ቤት ቆይታ", category: "Spiritual", required: false },
  { key: "age", labelEn: "Age", labelAm: "ዕድሜ", category: "Demographics", required: false },
];

export const ExcelImportPage: React.FC = () => {
  const { token, user, hasPermission } = useAuth();

  // Primary Selection States
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "upload" | "mapping" | "validation" | "duplicates" | "approval" | "history">("dashboard");

  // Batches and Active Batch State
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [activeBatch, setActiveBatch] = useState<ImportBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Mapping States
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [currentMappings, setCurrentMappings] = useState<Record<string, string>>({});
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);

  // Validation States
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([]);
  const [errorFilterSeverity, setErrorFilterSeverity] = useState<string>("ALL");

  // Duplicate Review States
  const [duplicateCandidates, setDuplicateCandidates] = useState<ImportDuplicateCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ImportDuplicateCandidate | null>(null);
  const [reviewDecision, setReviewDecision] = useState<DuplicateReviewDecision>("create_new_member");
  const [reviewReason, setReviewReason] = useState<string>("");

  // Approval Modal States
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  // Processing Progress States
  const [isProcessingLive, setIsProcessingLive] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // 1. Initial Load of Campuses and History
  useEffect(() => {
    async function init() {
      if (!token) return;
      try {
        setLoading(true);
        const cList = await fetchCampuses(token);
        const activeCampuses = cList.filter((c) => c.status === "ACTIVE");
        setCampuses(activeCampuses);
        if (activeCampuses.length > 0) {
          setSelectedCampusId(activeCampuses[0].id);
        }
        await loadBatches();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error initializing campus data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  // Load Batches
  const loadBatches = async () => {
    if (!token) return;
    try {
      const list = await fetchImportHistory(token, selectedCampusId || undefined);
      setHistory(list);
      if (list.length > 0 && !activeBatch) {
        setActiveBatch(list[0]);
      }
    } catch (err: unknown) {
      console.error("Error loading import history:", err);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [selectedCampusId]);

  // Load Active Batch Details when switched
  useEffect(() => {
    if (!activeBatch || !token) return;
    loadBatchDeepDetails(activeBatch.id);
  }, [activeBatch?.id]);

  const loadBatchDeepDetails = async (batchId: string) => {
    if (!token) return;
    try {
      const refreshed = await fetchBatchById(batchId, token);
      setActiveBatch(refreshed);

      // Load preview / mappings
      try {
        const preview = await fetchBatchPreview(batchId, token);
        if (preview.mappings) {
          const mapObj: Record<string, string> = {};
          preview.mappings.forEach((m: any) => {
            mapObj[m.csvColumnName] = m.systemFieldName;
          });
          setCurrentMappings(mapObj);
          setDetectedHeaders(preview.mappings.map((m: any) => m.csvColumnName));
        }
        if (preview.sampleRows) {
          setSampleRows(preview.sampleRows);
        }
      } catch {
        // May not have mappings yet
      }

      // Load validation errors
      try {
        const valRes = await fetchValidationResults(batchId, token);
        setValidationErrors(valRes.errors || []);
      } catch {
        setValidationErrors([]);
      }

      // Load duplicates
      try {
        const dupRes = await fetchDuplicateCandidates(batchId, token);
        setDuplicateCandidates(dupRes.candidates || []);
      } catch {
        setDuplicateCandidates([]);
      }
    } catch (err: unknown) {
      console.error("Error loading deep batch details:", err);
    }
  };

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const totalBatches = history.length;
    const totalStaged = history.reduce((acc, b) => acc + (b.totalRows || 0), 0);
    const totalImported = history.reduce((acc, b) => acc + (b.importedRows || 0), 0);
    const totalPendingReviews = history.reduce((acc, b) => acc + (b.pendingReviewRows || 0), 0);
    const completedBatches = history.filter((b) => b.status === "completed").length;
    return {
      totalBatches,
      totalStaged,
      totalImported,
      totalPendingReviews,
      completedBatches,
    };
  }, [history]);

  // Selected Campus Object
  const currentCampus = useMemo(() => {
    return campuses.find((c) => c.id === selectedCampusId);
  }, [campuses, selectedCampusId]);

  // File Drop Handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm") || name.endsWith(".ods")) {
      setError(
        "Only CSV (.csv) files are supported for import. Uploading Excel (.xlsx/.xls) spreadsheets is not permitted. Please export or save your file as UTF-8 CSV before uploading."
      );
      setSelectedFile(null);
      return;
    }
    if (!name.endsWith(".csv")) {
      setError(`Unsupported file format "${file.name}". Please provide a standard comma-delimited (.csv) file.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError(null);
    setSuccessMsg(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };

  // Upload and Stage CSV
  const handleExecuteUpload = async () => {
    if (!token || !selectedFile || !selectedCampusId) {
      setError("Please select both an active campus and a valid CSV file.");
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          const uploadRes = await uploadCsvFile(
            selectedCampusId,
            selectedFile.name,
            base64String,
            token
          );

          setActiveBatch(uploadRes.batch);
          setCurrentMappings(uploadRes.suggestedMappings);
          setDetectedHeaders(Object.keys(uploadRes.suggestedMappings));
          setSampleRows(uploadRes.sampleRows);
          await loadBatches();

          setSuccessMsg(
            `CSV staged successfully: ${uploadRes.batch.totalRows} rows ready. SHA-256: ${uploadRes.batch.fileChecksum.substring(0, 12)}...`
          );
          setSelectedFile(null);
          setActiveTab("mapping");
        } catch (uploadErr: unknown) {
          setError(uploadErr instanceof Error ? uploadErr.message : "CSV staging failed");
        } finally {
          setActionLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Error reading CSV file.");
        setActionLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "File preparation error");
      setActionLoading(false);
    }
  };

  // Save Column Mappings and Run Validation
  const handleSaveMappings = async () => {
    if (!token || !activeBatch) return;

    // Check required fields
    const mappedTargets = Object.values(currentMappings);
    if (!mappedTargets.includes("full_name")) {
      setError("Required field 'Full Name' (ሙሉ ስም) must be mapped before validating.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const mappingsPayload = Object.entries(currentMappings).map(([csvCol, targetField]) => ({
        csvColumn: csvCol,
        targetField,
      }));

      const updatedBatch = await saveColumnMappings(activeBatch.id, mappingsPayload, token);
      setActiveBatch(updatedBatch);
      await loadBatchDeepDetails(updatedBatch.id);
      await loadBatches();

      setSuccessMsg("Column mappings confirmed and batch validation completed!");
      setActiveTab("validation");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save column mappings");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Duplicate Review Decision
  const handleSubmitReviewDecision = async () => {
    if (!token || !activeBatch || !selectedCandidate) return;
    if (!reviewReason.trim()) {
      setError("Please provide a reason or note for this administrative decision.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await submitDuplicateReview(
        activeBatch.id,
        selectedCandidate.id,
        reviewDecision,
        reviewReason,
        token,
        reviewDecision === "update_existing_member" ? selectedCandidate.existingMember.id : undefined
      );

      await loadBatchDeepDetails(activeBatch.id);
      setSelectedCandidate(null);
      setReviewReason("");
      setSuccessMsg(`Duplicate review decision recorded: ${reviewDecision.replace(/_/g, " ").toUpperCase()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Review submission failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Batch
  const handleApproveBatch = async () => {
    if (!token || !activeBatch) return;

    setActionLoading(true);
    setError(null);

    try {
      const approved = await approveBatch(activeBatch.id, approvalNotes, token);
      setActiveBatch(approved);
      await loadBatches();
      setShowApprovalModal(false);
      setApprovalNotes("");
      setSuccessMsg("Batch approved successfully! Ready for final member creation.");
      setActiveTab("approval");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Batch approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Process Approved Batch
  const handleProcessBatch = async () => {
    if (!token || !activeBatch) return;

    setIsProcessingLive(true);
    setProcessingProgress(20);
    setError(null);

    try {
      const interval = setInterval(() => {
        setProcessingProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 250);

      const processed = await processApprovedBatch(activeBatch.id, token);
      clearInterval(interval);
      setProcessingProgress(100);

      setActiveBatch(processed);
      await loadBatches();
      setSuccessMsg(
        `Processing complete! ${processed.importedRows} members created, ${processed.updatedRows} updated.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setTimeout(() => {
        setIsProcessingLive(false);
        setProcessingProgress(0);
      }, 800);
    }
  };

  // Retry Failed Rows
  const handleRetryFailed = async () => {
    if (!token || !activeBatch) return;
    setActionLoading(true);
    setError(null);
    try {
      const retried = await retryBatchProcessing(activeBatch.id, token);
      setActiveBatch(retried);
      await loadBatches();
      setSuccessMsg("Retry operation executed.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Validation Errors
  const filteredErrors = useMemo(() => {
    if (errorFilterSeverity === "ALL") return validationErrors;
    return validationErrors.filter((e) => e.severity.toUpperCase() === errorFilterSeverity);
  }, [validationErrors, errorFilterSeverity]);

  return (
    <div className="page-import">
      {/* 1. Header Banner */}
      <div className="import-header-card">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge rounded-pill bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 px-3 py-1 text-uppercase fw-bold" style={{ fontSize: "0.6875rem" }}>
                <FileSpreadsheet size={13} className="me-1 inline" />
                Module 4: Import & Validation Management
              </span>
              <span className="badge rounded-pill bg-success bg-opacity-20 text-success border border-success border-opacity-30 px-2 py-1" style={{ fontSize: "0.6875rem" }}>
                RFC 4180 CSV Engine
              </span>
            </div>
            <h1 className="h3 fw-bold text-white mb-1">
              Member Import & Data Validation Suite
            </h1>
            <p className="text-secondary mb-0" style={{ fontSize: "0.875rem" }}>
              ማኅበረ ቅዱሳን የግቢ ጉባኤያት አባላት ዳታ ማስገቢያና ማረጋገጫ ሥርዓት · Single-campus integrity, SHA-256 verification, column mapping, and duplicate review center.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Campus Picker */}
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 px-3 py-2">
              <Building2 size={16} className="text-primary" />
              <div className="text-start">
                <div className="text-secondary" style={{ fontSize: "0.625rem", textTransform: "uppercase" }}>
                  Active Campus
                </div>
                <select
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                  className="bg-transparent text-white border-0 p-0 fw-bold"
                  style={{ fontSize: "0.8125rem", outline: "none", cursor: "pointer" }}
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-dark text-white">
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Download Actions */}
            <button
              onClick={() => downloadCsvTemplate(token!)}
              className="btn btn-outline-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2"
              title="Official UTF-8 CSV Template with English & Amharic Headers"
            >
              <Download size={15} />
              <span>CSV Template</span>
            </button>

            <button
              onClick={() => downloadExcelTemplate(token!)}
              className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2"
              title="Reference Excel Template"
            >
              <Download size={15} />
              <span>Excel Ref</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="alert alert-danger bg-danger bg-opacity-10 border border-danger border-opacity-30 text-danger d-flex align-items-center justify-content-between p-3 rounded-3" role="alert">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={18} />
            <span style={{ fontSize: "0.8125rem" }}>{error}</span>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={() => setError(null)} />
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success bg-success bg-opacity-10 border border-success border-opacity-30 text-success d-flex align-items-center justify-content-between p-3 rounded-3" role="alert">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={18} />
            <span style={{ fontSize: "0.8125rem" }}>{successMsg}</span>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

      {/* 2. Navigation Tabs Bar */}
      <div className="import-tabs-bar">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`import-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
        >
          <Layers size={16} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("upload")}
          className={`import-tab-btn ${activeTab === "upload" ? "active" : ""}`}
        >
          <UploadCloud size={16} />
          <span>CSV Upload</span>
        </button>

        <button
          onClick={() => setActiveTab("mapping")}
          disabled={!activeBatch}
          className={`import-tab-btn ${activeTab === "mapping" ? "active" : ""}`}
        >
          <FileCode size={16} />
          <span>Column Mapping</span>
          {detectedHeaders.length > 0 && <span className="tab-badge">{detectedHeaders.length}</span>}
        </button>

        <button
          onClick={() => setActiveTab("validation")}
          disabled={!activeBatch}
          className={`import-tab-btn ${activeTab === "validation" ? "active" : ""}`}
        >
          <ShieldAlert size={16} />
          <span>Validation Diagnostic</span>
          {validationErrors.length > 0 && (
            <span className="tab-badge bg-danger">{validationErrors.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("duplicates")}
          disabled={!activeBatch}
          className={`import-tab-btn ${activeTab === "duplicates" ? "active" : ""}`}
        >
          <Users size={16} />
          <span>Duplicate Review Center</span>
          {duplicateCandidates.length > 0 && (
            <span className="tab-badge bg-warning text-dark">{duplicateCandidates.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("approval")}
          disabled={!activeBatch}
          className={`import-tab-btn ${activeTab === "approval" ? "active" : ""}`}
        >
          <CheckCircle2 size={16} />
          <span>Approval & Processing</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`import-tab-btn ${activeTab === "history" ? "active" : ""}`}
        >
          <History size={16} />
          <span>History & Audit</span>
          <span className="tab-badge">{history.length}</span>
        </button>
      </div>

      {/* 3. TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="d-flex flex-column gap-4">
          {/* KPI Grid */}
          <div className="import-kpi-grid">
            <div className="import-kpi-card">
              <div className="d-flex justify-content-between align-items-center">
                <span className="kpi-title">Total Batches</span>
                <div className="kpi-icon-wrap bg-primary bg-opacity-20 text-primary">
                  <Database size={16} />
                </div>
              </div>
              <div className="kpi-val">{metrics.totalBatches}</div>
              <div className="kpi-sub">Across campus history</div>
            </div>

            <div className="import-kpi-card">
              <div className="d-flex justify-content-between align-items-center">
                <span className="kpi-title">Staged Records</span>
                <div className="kpi-icon-wrap bg-info bg-opacity-20 text-info">
                  <FileSpreadsheet size={16} />
                </div>
              </div>
              <div className="kpi-val">{metrics.totalStaged.toLocaleString()}</div>
              <div className="kpi-sub">Total CSV rows staged</div>
            </div>

            <div className="import-kpi-card">
              <div className="d-flex justify-content-between align-items-center">
                <span className="kpi-title">Clean & Imported</span>
                <div className="kpi-icon-wrap bg-success bg-opacity-20 text-success">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="kpi-val text-success">{metrics.totalImported.toLocaleString()}</div>
              <div className="kpi-sub">Created in Module 3</div>
            </div>

            <div className="import-kpi-card">
              <div className="d-flex justify-content-between align-items-center">
                <span className="kpi-title">Duplicate Queue</span>
                <div className="kpi-icon-wrap bg-warning bg-opacity-20 text-warning">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="kpi-val text-warning">{metrics.totalPendingReviews}</div>
              <div className="kpi-sub">Require admin review</div>
            </div>

            <div className="import-kpi-card">
              <div className="d-flex justify-content-between align-items-center">
                <span className="kpi-title">Completed Batches</span>
                <div className="kpi-icon-wrap bg-purple bg-opacity-20 text-purple" style={{ color: "#A855F7" }}>
                  <Sparkles size={16} />
                </div>
              </div>
              <div className="kpi-val">{metrics.completedBatches}</div>
              <div className="kpi-sub">100% finished pipelines</div>
            </div>
          </div>

          {/* Active Batch Summary & Quick Pipeline Jumper */}
          {activeBatch ? (
            <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom border-secondary border-opacity-25">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-primary text-uppercase px-2 py-1" style={{ fontSize: "0.6875rem" }}>
                      Active Batch: {activeBatch.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-secondary font-monospace" style={{ fontSize: "0.75rem" }}>
                      ID: {activeBatch.id}
                    </span>
                  </div>
                  <h4 className="h5 text-white fw-bold mb-0">{activeBatch.fileName}</h4>
                  <div className="text-secondary" style={{ fontSize: "0.8125rem" }}>
                    Campus: <strong className="text-white">{activeBatch.campusName}</strong> · Size: {(activeBatch.fileSize / 1024).toFixed(1)} KB · Checksum: <code className="text-info">{activeBatch.fileChecksum?.substring(0, 16)}...</code>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="btn btn-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1"
                  >
                    <UploadCloud size={14} />
                    <span>Upload New CSV</span>
                  </button>

                  <button
                    onClick={() => downloadOriginalCsvFile(activeBatch.id, activeBatch.fileName, token!)}
                    className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1"
                  >
                    <Download size={14} />
                    <span>Original CSV</span>
                  </button>
                </div>
              </div>

              {/* Step Flow Indicators */}
              <div className="row g-3 pt-4">
                <div className="col-12 col-md-3">
                  <div
                    onClick={() => setActiveTab("mapping")}
                    className="p-3 rounded-3 border border-secondary border-opacity-25 bg-secondary bg-opacity-10 cursor-pointer hover:border-primary transition"
                  >
                    <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                      <span>Step 1</span>
                      <ChevronRight size={14} />
                    </div>
                    <div className="fw-bold text-white mb-1">Column Mapping</div>
                    <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {detectedHeaders.length > 0 ? `${detectedHeaders.length} columns detected` : "Configure fields"}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div
                    onClick={() => setActiveTab("validation")}
                    className="p-3 rounded-3 border border-secondary border-opacity-25 bg-secondary bg-opacity-10 cursor-pointer hover:border-primary transition"
                  >
                    <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                      <span>Step 2</span>
                      <ChevronRight size={14} />
                    </div>
                    <div className="fw-bold text-white mb-1">Row Validation</div>
                    <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {validationErrors.length > 0 ? (
                        <span className="text-danger">{validationErrors.length} issues found</span>
                      ) : (
                        <span className="text-success">Clean & ready</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div
                    onClick={() => setActiveTab("duplicates")}
                    className="p-3 rounded-3 border border-secondary border-opacity-25 bg-secondary bg-opacity-10 cursor-pointer hover:border-primary transition"
                  >
                    <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                      <span>Step 3</span>
                      <ChevronRight size={14} />
                    </div>
                    <div className="fw-bold text-white mb-1">Duplicate Review</div>
                    <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {duplicateCandidates.length > 0 ? (
                        <span className="text-warning">{duplicateCandidates.length} pending review</span>
                      ) : (
                        <span className="text-success">0 pending reviews</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div
                    onClick={() => setActiveTab("approval")}
                    className="p-3 rounded-3 border border-secondary border-opacity-25 bg-secondary bg-opacity-10 cursor-pointer hover:border-primary transition"
                  >
                    <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
                      <span>Step 4</span>
                      <CheckCircle2 size={14} className="text-success" />
                    </div>
                    <div className="fw-bold text-white mb-1">Approval & Process</div>
                    <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      Status: {activeBatch.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 border border-dashed border-secondary border-opacity-30 rounded-3">
              <UploadCloud size={48} className="text-secondary mb-3 opacity-50" />
              <h5 className="text-white">No Active Import Batch</h5>
              <p className="text-secondary" style={{ fontSize: "0.8125rem" }}>
                Upload a CSV file to initiate the intelligent staging, mapping, and validation pipeline.
              </p>
              <button onClick={() => setActiveTab("upload")} className="btn btn-primary btn-sm px-4 py-2 rounded-3">
                Upload CSV File
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: CSV UPLOAD ENGINE */}
      {activeTab === "upload" && (
        <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-4 border-bottom border-secondary border-opacity-25 mb-4">
            <div>
              <h4 className="h5 text-white fw-bold mb-1">Staging & Ingestion Gateway</h4>
              <p className="text-secondary mb-0" style={{ fontSize: "0.8125rem" }}>
                Strict CSV format enforcement. Every upload is verified for UTF-8 integrity, hashed with SHA-256, and stored securely in permanent retention.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-75 border border-secondary border-opacity-30 rounded-3 px-3 py-2">
              <Building2 size={16} className="text-primary" />
              <div>
                <div className="text-secondary" style={{ fontSize: "0.625rem" }}>DESTINATION CAMPUS</div>
                <div className="text-white fw-bold" style={{ fontSize: "0.8125rem" }}>
                  {currentCampus ? `${currentCampus.name} (${currentCampus.code})` : "None Selected"}
                </div>
              </div>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            className={`import-dropzone ${isDragOver ? "is-dragover" : ""}`}
            onClick={() => document.getElementById("csv-file-picker")?.click()}
          >
            <input
              id="csv-file-picker"
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
              style={{ display: "none" }}
            />

            <div className="dropzone-icon">
              <FileSpreadsheet size={32} />
            </div>

            <h5 className="text-white fw-bold mb-2">
              {selectedFile ? selectedFile.name : "Drag & Drop Member CSV File Here"}
            </h5>
            <p className="text-secondary mb-3" style={{ fontSize: "0.8125rem" }}>
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to stage`
                : "Or click anywhere in this area to browse from your device"}
            </p>

            <div className="d-inline-flex flex-wrap align-items-center justify-content-center gap-2">
              <span className="badge bg-secondary bg-opacity-20 text-secondary border border-secondary border-opacity-25 px-2 py-1" style={{ fontSize: "0.6875rem" }}>
                UTF-8 Encoded
              </span>
              <span className="badge bg-secondary bg-opacity-20 text-secondary border border-secondary border-opacity-25 px-2 py-1" style={{ fontSize: "0.6875rem" }}>
                Comma Delimited
              </span>
              <span className="badge bg-secondary bg-opacity-20 text-secondary border border-secondary border-opacity-25 px-2 py-1" style={{ fontSize: "0.6875rem" }}>
                Multi-line Quotes
              </span>
              <span className="badge bg-secondary bg-opacity-20 text-secondary border border-secondary border-opacity-25 px-2 py-1" style={{ fontSize: "0.6875rem" }}>
                Amharic & English
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="d-flex justify-content-between align-items-center pt-4">
            <button
              onClick={() => downloadCsvTemplate(token!)}
              className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            >
              <Download size={15} />
              <span>Download Official CSV Template</span>
            </button>

            <div className="d-flex align-items-center gap-2">
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3"
                >
                  Clear Selection
                </button>
              )}

              <button
                onClick={handleExecuteUpload}
                disabled={!selectedFile || actionLoading}
                className="btn btn-primary px-4 py-2 rounded-3 d-flex align-items-center gap-2 fw-bold"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={15} className="spinner-border spinner-border-sm" />
                    <span>Verifying & Staging...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Stage CSV File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: COLUMN MAPPING & PREVIEW */}
      {activeTab === "mapping" && (
        <div className="d-flex flex-column gap-4">
          <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom border-secondary border-opacity-25 mb-4">
              <div>
                <h4 className="h5 text-white fw-bold mb-1">Column Mapping Engine</h4>
                <p className="text-secondary mb-0" style={{ fontSize: "0.8125rem" }}>
                  Map source CSV headers to the 17 Module 3 member fields. Target fields marked with * are strictly required.
                </p>
              </div>

              <button
                onClick={handleSaveMappings}
                disabled={actionLoading}
                className="btn btn-primary px-4 py-2 rounded-3 d-flex align-items-center gap-2 fw-bold"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={15} className="spinner-border spinner-border-sm" />
                    <span>Saving & Validating...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirm Mappings & Validate</span>
                  </>
                )}
              </button>
            </div>

            {/* Mapping Grid */}
            <div className="row g-3">
              {detectedHeaders.map((header) => {
                const currentTarget = currentMappings[header] || "ignored";
                return (
                  <div key={header} className="col-12 col-md-6 col-lg-4">
                    <div className="mapping-card">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-secondary" style={{ fontSize: "0.6875rem", textTransform: "uppercase" }}>
                          Source CSV Header
                        </span>
                        {currentTarget !== "ignored" && (
                          <span className="badge bg-success bg-opacity-20 text-success" style={{ fontSize: "0.625rem" }}>
                            Mapped
                          </span>
                        )}
                      </div>

                      <div className="fw-bold text-white mb-2 text-truncate" title={header}>
                        {header}
                      </div>

                      <select
                        value={currentTarget}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentMappings((prev) => ({ ...prev, [header]: val }));
                        }}
                        className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-30 rounded-3"
                        style={{ fontSize: "0.8125rem" }}
                      >
                        <option value="ignored">-- (Ignore this column) --</option>
                        {CANONICAL_FIELDS.map((cf) => (
                          <option key={cf.key} value={cf.key}>
                            {cf.required ? "* " : ""}{cf.labelEn} ({cf.labelAm})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Rows Preview Table */}
          {sampleRows.length > 0 && (
            <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
              <h5 className="text-white fw-bold mb-3">Sample Rows Preview (First 5 Rows)</h5>
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0" style={{ fontSize: "0.8125rem" }}>
                  <thead>
                    <tr>
                      <th className="text-secondary">#</th>
                      {detectedHeaders.map((h) => (
                        <th key={h} className="text-info">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-secondary">{idx + 1}</td>
                        {detectedHeaders.map((h) => (
                          <td key={h} className="text-white">{row[h] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: VALIDATION DIAGNOSTIC */}
      {activeTab === "validation" && (
        <div className="d-flex flex-column gap-4">
          <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom border-secondary border-opacity-25 mb-4">
              <div>
                <h4 className="h5 text-white fw-bold mb-1">Data Quality & Validation Diagnostic</h4>
                <p className="text-secondary mb-0" style={{ fontSize: "0.8125rem" }}>
                  Detailed breakdown of schema violations, missing required values, invalid phone digits, and out-of-range ages.
                </p>
              </div>

              <div className="d-flex gap-2">
                {activeBatch && (
                  <button
                    onClick={() => downloadImportErrorReport(activeBatch.id, token!)}
                    className="btn btn-outline-danger btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                  >
                    <Download size={14} />
                    <span>Download Error Report (.xlsx)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (activeBatch) loadBatchDeepDetails(activeBatch.id);
                  }}
                  className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Severity Filter */}
            <div className="d-flex gap-2 mb-3">
              <button
                onClick={() => setErrorFilterSeverity("ALL")}
                className={`btn btn-sm rounded-pill px-3 ${errorFilterSeverity === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ fontSize: "0.75rem" }}
              >
                All Issues ({validationErrors.length})
              </button>
              <button
                onClick={() => setErrorFilterSeverity("ERROR")}
                className={`btn btn-sm rounded-pill px-3 ${errorFilterSeverity === "ERROR" ? "btn-danger" : "btn-outline-secondary"}`}
                style={{ fontSize: "0.75rem" }}
              >
                Errors ({validationErrors.filter((e) => e.severity === "error").length})
              </button>
              <button
                onClick={() => setErrorFilterSeverity("WARNING")}
                className={`btn btn-sm rounded-pill px-3 ${errorFilterSeverity === "WARNING" ? "btn-warning" : "btn-outline-secondary"}`}
                style={{ fontSize: "0.75rem" }}
              >
                Warnings ({validationErrors.filter((e) => e.severity === "warning").length})
              </button>
            </div>

            {/* Errors Table */}
            {filteredErrors.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0" style={{ fontSize: "0.8125rem" }}>
                  <thead>
                    <tr>
                      <th className="text-secondary">Row #</th>
                      <th className="text-secondary">Field</th>
                      <th className="text-secondary">Error Code</th>
                      <th className="text-secondary">Diagnostic Message</th>
                      <th className="text-secondary">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredErrors.map((err) => (
                      <tr key={err.id}>
                        <td className="text-white fw-bold">Row {err.rowNumber}</td>
                        <td className="text-info font-monospace">{err.fieldName}</td>
                        <td className="text-secondary font-monospace" style={{ fontSize: "0.75rem" }}>
                          {err.errorCode}
                        </td>
                        <td className="text-white">{err.errorMessage}</td>
                        <td>
                          <span
                            className={`badge ${err.severity === "error" ? "bg-danger" : "bg-warning text-dark"} text-uppercase px-2 py-1`}
                            style={{ fontSize: "0.625rem" }}
                          >
                            {err.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <CheckCircle2 size={48} className="text-success mb-3 opacity-75" />
                <h5 className="text-white">Zero Validation Errors Found</h5>
                <p className="text-secondary" style={{ fontSize: "0.8125rem" }}>
                  All staged records meet C-CIMAS schema constraints and integrity rules.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. TAB 5: DUPLICATE REVIEW CENTER */}
      {activeTab === "duplicates" && (
        <div className="d-flex flex-column gap-4">
          <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom border-secondary border-opacity-25 mb-4">
              <div>
                <h4 className="h5 text-white fw-bold mb-1">Administrator Duplicate Review Center</h4>
                <p className="text-secondary mb-0" style={{ fontSize: "0.8125rem" }}>
                  Side-by-side comparison between staged rows and existing registered members. Strict blocking ensures no batch can be approved until all duplicate decisions are resolved.
                </p>
              </div>

              <div className="text-secondary" style={{ fontSize: "0.8125rem" }}>
                Pending Reviews: <strong className="text-warning">{duplicateCandidates.filter((c) => c.reviewStatus === "pending").length}</strong>
              </div>
            </div>

            {duplicateCandidates.length > 0 ? (
              <div className="d-flex flex-column gap-4">
                {duplicateCandidates.map((candidate) => {
                  const isPending = candidate.reviewStatus === "pending";
                  return (
                    <div key={candidate.id} className="duplicate-review-card">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: "0.6875rem" }}>
                            Row #{candidate.rowNumber} Duplicate Alert
                          </span>
                          <span className="match-score-pill bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30">
                            Match Score: {candidate.matchScore}%
                          </span>
                        </div>

                        <span
                          className={`badge ${isPending ? "bg-warning text-dark" : "bg-success"} text-uppercase px-2 py-1`}
                          style={{ fontSize: "0.6875rem" }}
                        >
                          Status: {candidate.reviewStatus.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="text-secondary mb-3" style={{ fontSize: "0.8125rem" }}>
                        Reason: <strong className="text-white">{candidate.matchReason}</strong> · Matched Attributes: <code className="text-info">{candidate.matchingFields.join(", ")}</code>
                      </div>

                      {/* Side-by-Side Comparison */}
                      <div className="comparison-grid mb-4">
                        {/* Staged Record Side */}
                        <div className="compare-side staged">
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                            <span className="text-primary fw-bold" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                              Staged CSV Record
                            </span>
                            <span className="text-secondary" style={{ fontSize: "0.6875rem" }}>
                              Incoming Row #{candidate.rowNumber}
                            </span>
                          </div>

                          <div className="d-flex flex-column gap-1.5" style={{ fontSize: "0.8125rem" }}>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Full Name:</span>
                              <span className="text-white fw-bold">{candidate.stagedRow?.fullName || "N/A"}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Baptismal Name:</span>
                              <span className="text-white">{candidate.stagedRow?.christianName || "-"}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Gender:</span>
                              <span className="text-white">{candidate.stagedRow?.gender || "-"}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Phone Number:</span>
                              <span className="text-white fw-bold">{candidate.stagedRow?.phoneNumber || "-"}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Department:</span>
                              <span className="text-white">{candidate.stagedRow?.academicDepartment || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Existing Member Side */}
                        <div className="compare-side existing">
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                            <span className="text-success fw-bold" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                              Existing Registered Member
                            </span>
                            <span className="text-success font-monospace" style={{ fontSize: "0.6875rem" }}>
                              {candidate.existingMember.memberId}
                            </span>
                          </div>

                          <div className="d-flex flex-column gap-1.5" style={{ fontSize: "0.8125rem" }}>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Full Name:</span>
                              <span className="text-white fw-bold">{candidate.existingMember.fullName}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Baptismal Name:</span>
                              <span className="text-white">{candidate.existingMember.christianName || "-"}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Gender:</span>
                              <span className="text-white">{candidate.existingMember.gender}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Phone Number:</span>
                              <span className="text-white fw-bold">{candidate.existingMember.phoneNumber || "-"}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">Academic Dept:</span>
                              <span className="text-white">{candidate.existingMember.academicDepartment || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Review Action Controls */}
                      {isPending ? (
                        <div className="d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25">
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("create_new_member");
                              }}
                              className={`btn btn-sm rounded-3 ${selectedCandidate?.id === candidate.id && reviewDecision === "create_new_member" ? "btn-primary" : "btn-outline-primary"}`}
                            >
                              Create As New Member
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("update_existing_member");
                              }}
                              className={`btn btn-sm rounded-3 ${selectedCandidate?.id === candidate.id && reviewDecision === "update_existing_member" ? "btn-success" : "btn-outline-success"}`}
                            >
                              Update Existing Member
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("skip_existing");
                              }}
                              className={`btn btn-sm rounded-3 ${selectedCandidate?.id === candidate.id && reviewDecision === "skip_existing" ? "btn-secondary" : "btn-outline-secondary"}`}
                            >
                              Skip (Do Not Re-import)
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("reject_row");
                              }}
                              className={`btn btn-sm rounded-3 ${selectedCandidate?.id === candidate.id && reviewDecision === "reject_row" ? "btn-danger" : "btn-outline-danger"}`}
                            >
                              Reject Staged Row
                            </button>
                          </div>

                          {selectedCandidate?.id === candidate.id && (
                            <div className="d-flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Enter administrator justification reason for this decision..."
                                value={reviewReason}
                                onChange={(e) => setReviewReason(e.target.value)}
                                className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-30 rounded-3"
                              />
                              <button
                                onClick={handleSubmitReviewDecision}
                                disabled={actionLoading}
                                className="btn btn-warning btn-sm text-dark fw-bold px-3 shrink-0 rounded-3"
                              >
                                {actionLoading ? "Submitting..." : "Apply Decision"}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                          Decision recorded by <strong className="text-white">{candidate.reviewedBy || "Administrator"}</strong> · Reason: <em>"{candidate.decisionReason || "Resolved"}"</em>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <CheckCircle2 size={48} className="text-success mb-3 opacity-75" />
                <h5 className="text-white">No Duplicate Conflicts</h5>
                <p className="text-secondary" style={{ fontSize: "0.8125rem" }}>
                  All rows are verified unique against both intra-batch entries and existing registered members.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. TAB 6: APPROVAL & PROCESSING PIPELINE */}
      {activeTab === "approval" && activeBatch && (
        <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom border-secondary border-opacity-25 mb-4">
            <div>
              <h4 className="h5 text-white fw-bold mb-1">Batch Approval & Member Execution</h4>
              <p className="text-secondary mb-0" style={{ fontSize: "0.8125rem" }}>
                Strict workflow enforcement: Approval is blocked until all duplicate candidates have an explicit administrator decision. Once approved, members are created idempotently via Module 3.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary text-uppercase px-3 py-2 rounded-3" style={{ fontSize: "0.8125rem" }}>
                Batch Status: {activeBatch.status}
              </span>
            </div>
          </div>

          {/* Pre-Approval Checklist */}
          <div className="p-3.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 mb-4">
            <h6 className="text-white fw-bold mb-3">Pre-Approval Gate Checklist</h6>
            <div className="d-flex flex-column gap-2" style={{ fontSize: "0.8125rem" }}>
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-white">Active Campus Verification: Validated into <strong>{activeBatch.campusName}</strong></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-white">Column Mapping: Required <code>full_name</code> and fields mapped</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {duplicateCandidates.filter((c) => c.reviewStatus === "pending").length === 0 ? (
                  <>
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="text-white">Duplicate Resolution: All candidates reviewed (0 pending)</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-danger" />
                    <span className="text-danger fw-bold">
                      Duplicate Resolution: {duplicateCandidates.filter((c) => c.reviewStatus === "pending").length} candidates require decision before approval
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-2">
            <div>
              {activeBatch.status === "approved" && (
                <div className="text-success fw-bold" style={{ fontSize: "0.875rem" }}>
                  <CheckCircle2 size={16} className="me-1 inline" />
                  Approved by {activeBatch.reviewedByName || "Admin"}. Ready for final processing.
                </div>
              )}
            </div>

            <div className="d-flex gap-2">
              {activeBatch.status !== "approved" && activeBatch.status !== "completed" && (
                <button
                  onClick={() => setShowApprovalModal(true)}
                  disabled={duplicateCandidates.filter((c) => c.reviewStatus === "pending").length > 0 || actionLoading}
                  className="btn btn-primary px-4 py-2.5 rounded-3 d-flex align-items-center gap-2 fw-bold"
                >
                  <CheckCircle2 size={16} />
                  <span>Approve Import Batch</span>
                </button>
              )}

              {activeBatch.status === "approved" && (
                <button
                  onClick={handleProcessBatch}
                  disabled={isProcessingLive}
                  className="btn btn-success px-4 py-2.5 rounded-3 d-flex align-items-center gap-2 fw-bold"
                >
                  {isProcessingLive ? (
                    <>
                      <RefreshCw size={16} className="spinner-border spinner-border-sm" />
                      <span>Ingesting Members ({processingProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      <span>Execute Member Creation</span>
                    </>
                  )}
                </button>
              )}

              {activeBatch.failedRows > 0 && (
                <button
                  onClick={handleRetryFailed}
                  disabled={actionLoading}
                  className="btn btn-outline-warning px-3 py-2 rounded-3"
                >
                  Retry Failed Rows
                </button>
              )}
            </div>
          </div>

          {/* Live Ingestion Progress Bar */}
          {isProcessingLive && (
            <div className="mt-4 pt-4 border-top border-secondary border-opacity-25">
              <div className="d-flex justify-content-between text-secondary mb-2" style={{ fontSize: "0.75rem" }}>
                <span>Processing Staged Records via Module 3 Member Service</span>
                <span className="text-white fw-bold">{processingProgress}%</span>
              </div>
              <div className="progress bg-dark" style={{ height: "8px" }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. TAB 7: HISTORY & AUDIT LEDGER */}
      {activeTab === "history" && (
        <div className="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded-3 p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom border-secondary border-opacity-25 mb-4">
            <div>
              <h4 className="h5 text-white fw-bold mb-1">Batch Import History & Audit Ledger</h4>
              <p className="text-secondary mb-0" style={{ fontSize: "0.8125rem" }}>
                Full provenance of all import batches, cryptographic checksums, author identity, and original raw files.
              </p>
            </div>

            <button
              onClick={loadBatches}
              className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ fontSize: "0.8125rem" }}>
              <thead>
                <tr>
                  <th className="text-secondary">Batch ID</th>
                  <th className="text-secondary">File Name</th>
                  <th className="text-secondary">Campus</th>
                  <th className="text-secondary text-center">Total</th>
                  <th className="text-secondary text-center">Imported</th>
                  <th className="text-secondary text-center">Duplicates</th>
                  <th className="text-secondary">Status</th>
                  <th className="text-secondary">Date</th>
                  <th className="text-secondary text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((batch) => (
                  <tr key={batch.id}>
                    <td className="font-monospace text-secondary" style={{ fontSize: "0.75rem" }}>
                      {batch.id.substring(0, 8)}...
                    </td>
                    <td className="text-white fw-bold">{batch.fileName}</td>
                    <td className="text-secondary">{batch.campusName}</td>
                    <td className="text-center text-white">{batch.totalRows}</td>
                    <td className="text-center text-success fw-bold">{batch.importedRows}</td>
                    <td className="text-center text-warning">{batch.duplicateRows}</td>
                    <td>
                      <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 text-uppercase px-2 py-1" style={{ fontSize: "0.625rem" }}>
                        {batch.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveBatch(batch);
                            setActiveTab("mapping");
                          }}
                          className="btn btn-outline-primary btn-sm px-2 py-1 rounded-2"
                          title="Open Batch Workspace"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          onClick={() => downloadOriginalCsvFile(batch.id, batch.fileName, token!)}
                          className="btn btn-outline-secondary btn-sm px-2 py-1 rounded-2"
                          title="Download Original Stored CSV"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVAL CONFIRMATION MODAL */}
      {showApprovalModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border border-secondary border-opacity-30 text-white rounded-3">
              <div className="modal-header border-bottom border-secondary border-opacity-25">
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Authorize Batch Approval</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowApprovalModal(false)}
                />
              </div>

              <div className="modal-body">
                <p className="text-secondary" style={{ fontSize: "0.8125rem" }}>
                  Confirming approval will unlock member ingestion. You are authorizing registration of validated members into campus: <strong className="text-white">{activeBatch?.campusName}</strong>.
                </p>

                <div className="mb-3">
                  <label className="form-label text-secondary" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                    Administrator Approval Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval authorization notes or cohort reference..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="form-control bg-dark text-white border-secondary border-opacity-30 rounded-3"
                    style={{ fontSize: "0.8125rem" }}
                  />
                </div>
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-3"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveBatch}
                  disabled={actionLoading}
                  className="btn btn-primary btn-sm rounded-3 px-3 fw-bold"
                >
                  {actionLoading ? "Authorizing..." : "Confirm & Authorize"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
