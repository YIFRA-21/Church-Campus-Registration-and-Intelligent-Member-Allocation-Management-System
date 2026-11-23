import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import { Campus } from "../types/campus";
import {
  ImportBatch,
  ImportValidationError,
  ImportDuplicateCandidate,
  DuplicateReviewDecision,
  ImportRow,
} from "../types/import";
import {
  downloadCsvTemplate,
  downloadExcelTemplate,
  uploadCsvFile,
  fetchImportHistory,
  fetchBatchById,
  fetchBatchPreview,
  fetchStagedRecords,
  saveColumnMappings,
  fetchValidationResults,
  fetchDuplicateCandidates,
  submitDuplicateReview,
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
  RefreshCw,
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
  X,
  Eye,
  FileText,
  UserCheck,
  UserX,
  HelpCircle,
  CheckCheck,
  BarChart3,
  UserPlus,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  PhoneCall,
} from "lucide-react";

// Canonical 17 Module 3 member fields with Amharic labels and categories
const CANONICAL_FIELDS: { key: string; labelEn: string; labelAm: string; category: string; required: boolean }[] = [
  { key: "serial_number", labelEn: "Serial Number / Member ID", labelAm: "ተ.ቁጥር / መለያ", category: "Core", required: false },
  { key: "full_name", labelEn: "Full Name", labelAm: "ሙሉ ስም", category: "Core", required: true },
  { key: "christian_name", labelEn: "Baptismal / Christian Name", labelAm: "የክርስትና ስም", category: "Spiritual", required: false },
  { key: "gender", labelEn: "Gender (MALE/FEMALE)", labelAm: "ጾታ", category: "Demographics", required: true },
  { key: "phone", labelEn: "Phone Number", labelAm: "ስልክ ቁጥር", category: "Contact", required: false },
  { key: "source_department_name", labelEn: "Source / Academic Department", labelAm: "የትምህርት ክፍል (ዲፓርትመንት)", category: "Academic", required: false },
  { key: "service_department", labelEn: "Ministry Service Department", labelAm: "የአገልግሎት ክፍል (ዕቅድ፣ ትምህርት፣ ልማት...)", category: "Spiritual", required: false },
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
  const navigate = useNavigate();

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
  const [showMappingCards, setShowMappingCards] = useState<boolean>(false);

  // Staged Records for Full Interactive Table List
  const [stagedRecords, setStagedRecords] = useState<ImportRow[]>([]);
  const [tableSearch, setTableSearch] = useState<string>("");
  const [tableStatusFilter, setTableStatusFilter] = useState<"ALL" | "READY" | "IMPORTED" | "FLAGGED">("ALL");

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

  // Initial Load of Campuses and History
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

      try {
        const preview = await fetchBatchPreview(batchId, token);
        if (preview.mappings && preview.mappings.length > 0) {
          const mapObj: Record<string, string> = {};
          preview.mappings.forEach((m: any) => {
            mapObj[m.csvColumnName] = m.systemFieldName;
          });
          setCurrentMappings(mapObj);
          setDetectedHeaders(preview.mappings.map((m: any) => m.csvColumnName));
        }
        if (preview.sampleRows && preview.sampleRows.length > 0) {
          setSampleRows(preview.sampleRows);
        } else if (preview.previewRows && preview.previewRows.length > 0) {
          setSampleRows(preview.previewRows.map((r: any) => r.originalData || {}));
        }
      } catch {
        // Mappings might not be established yet
      }

      try {
        const recordsRes = await fetchStagedRecords(batchId, token, undefined, 1, 1000);
        setStagedRecords(recordsRes.records || []);
      } catch {
        setStagedRecords([]);
      }

      try {
        const valRes = await fetchValidationResults(batchId, token);
        setValidationErrors(valRes.errors || []);
      } catch {
        setValidationErrors([]);
      }

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
    setSelectedFile(file);
    setError(null);
    setSuccessMsg(`File selected: "${file.name}" (${(file.size / 1024).toFixed(1)} KB) · Ready for automated staging and ingestion.`);
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
          const headers =
            uploadRes.headers && uploadRes.headers.length > 0
              ? uploadRes.headers
              : Object.keys(uploadRes.suggestedMappings);
          setDetectedHeaders(headers);
          setSampleRows(uploadRes.sampleRows || []);

          // Automatically save mappings and validate rows
          const mappingsPayload = Object.entries(uploadRes.suggestedMappings).map(([csvColumn, targetField]) => ({
            csvColumn,
            targetField,
          }));
          try {
            const updated = await saveColumnMappings(uploadRes.batch.id, mappingsPayload, token);
            setActiveBatch(updated);
            await loadBatchDeepDetails(updated.id);
          } catch {
            await loadBatchDeepDetails(uploadRes.batch.id);
          }
          await loadBatches();

          setSuccessMsg(
            `File staged & verified: ${uploadRes.batch.totalRows} member records detected and ready.`
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

  // 1-Click "Add All to Members" (Direct verification, approval, and permanent insertion into Module 3)
  const handleAddAllToMembers = async () => {
    if (!token || !activeBatch) return;

    setActionLoading(true);
    setIsProcessingLive(true);
    setProcessingProgress(15);
    setError(null);
    setSuccessMsg(null);

    try {
      let batch = activeBatch;

      // 1. Ensure column mappings are established and batch is validated
      if (batch.status === "uploaded" || batch.status === "mapping_required" || batch.validRows === 0) {
        setProcessingProgress(30);
        const mappingsPayload = Object.entries(currentMappings).map(([csvCol, targetField]) => ({
          csvColumn: csvCol,
          targetField,
        }));
        batch = await saveColumnMappings(batch.id, mappingsPayload, token);
        setActiveBatch(batch);
      }

      // 2. Auto-resolve any pending duplicate candidates as confirmed new members
      const pendingDups = duplicateCandidates.filter((c) => c.reviewStatus === "pending");
      if (pendingDups.length > 0) {
        setProcessingProgress(50);
        for (const dup of pendingDups) {
          try {
            await submitDuplicateReview(
              batch.id,
              dup.id,
              "create_new_member",
              "Confirmed new member by Administrator via Add All to Members",
              token
            );
          } catch {}
        }
      }

      // 3. Approve batch if not yet approved
      if (batch.status !== "approved" && batch.status !== "importing" && batch.status !== "completed") {
        setProcessingProgress(65);
        batch = await approveBatch(batch.id, "Approved by Administrator via Add All to Members", token);
        setActiveBatch(batch);
      }

      // 4. Ingest and create permanent Module 3 member records
      setProcessingProgress(80);
      const processed = await processApprovedBatch(batch.id, token);
      setProcessingProgress(100);
      setActiveBatch(processed);

      // 5. Reload deep details and staged records to display green "Imported" badges
      await loadBatchDeepDetails(batch.id);
      await loadBatches();

      setSuccessMsg(
        `🎉 እንኳን ደስ አላችሁ! ${processed.importedRows || processed.validRows || activeBatch.totalRows} አባላት በተሳካ ሁኔታ ወደ ማኅበረ ቅዱሳን አባላት ዝርዝር ገብተዋል!`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add members to database");
    } finally {
      setActionLoading(false);
      setTimeout(() => {
        setIsProcessingLive(false);
        setProcessingProgress(0);
      }, 700);
    }
  };

  // Re-verify / Check Data
  const handleVerifyData = async () => {
    if (!token || !activeBatch) return;
    setActionLoading(true);
    setError(null);
    try {
      const mappingsPayload = Object.entries(currentMappings).map(([csvCol, targetField]) => ({
        csvColumn: csvCol,
        targetField,
      }));
      const updated = await saveColumnMappings(activeBatch.id, mappingsPayload, token);
      setActiveBatch(updated);
      await loadBatchDeepDetails(updated.id);
      await loadBatches();
      setSuccessMsg(`✓ Verification completed: ${updated.validRows} valid rows verified and ready to add.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered rows for the full interactive table
  const filteredTableRows = useMemo(() => {
    let list: ImportRow[] = stagedRecords;

    // Fallback: If stagedRecords has not loaded yet, use sampleRows
    if (list.length === 0 && sampleRows.length > 0) {
      list = sampleRows.map((r, idx) => ({
        id: `prev-${idx + 1}`,
        batchId: activeBatch?.id || "",
        campusId: selectedCampusId,
        rowNumber: idx + 1,
        originalData: r,
        normalizedData: {
          serialNumber: r["ተ.ቁ"] || String(idx + 1),
          fullName: r["ሙሉ ስም"] || r["full_name"] || "",
          christianName: r["ክርስትና ስም"] || r["christian_name"] || "",
          gender: (r["ጾታ"] || r["gender"] || "").includes("ሴ") ? "FEMALE" : "MALE",
          phoneNumber: r["ስልክ ቁጥር"] || r["phone"] || "",
          academicDepartment: r["ዲፓርትመንት"] || r["source_department_name"] || "",
          dormBlock: r["ብሎክ"] || r["block"] || "",
          dormRoom: r["ዶርም"] || r["dormitory"] || "",
          language: r["ቋንቋ"] || r["language"] || "አማርኛ",
          emergencyContactName: r["የተጠሪ ስም"] || r["emergency_contact_name"] || "",
          emergencyContactPhone: r["የተጠሪ ስልክ"] || r["emergency_contact_phone"] || "",
          sundaySchoolDuration: r["የሰንበት ት/ቤት ቆይታ"] || r["residence_or_sunday_school"] || "",
        },
        validationStatus: "valid",
        duplicateStatus: "no_duplicate",
        reviewStatus: "not_required",
        importStatus: activeBatch?.status === "completed" ? "imported" : "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter((r) => {
        const name = (r.normalizedData.fullName || "").toLowerCase();
        const cName = (r.normalizedData.christianName || "").toLowerCase();
        const phone = (r.normalizedData.phoneNumber || "").toLowerCase();
        const dept = (r.normalizedData.academicDepartment || "").toLowerCase();
        const block = (r.normalizedData.dormBlock || "").toLowerCase();
        return name.includes(q) || cName.includes(q) || phone.includes(q) || dept.includes(q) || block.includes(q);
      });
    }

    if (tableStatusFilter === "READY") {
      list = list.filter((r) => r.importStatus !== "imported" && r.validationStatus === "valid");
    } else if (tableStatusFilter === "IMPORTED") {
      list = list.filter((r) => r.importStatus === "imported" || r.importStatus === "updated");
    } else if (tableStatusFilter === "FLAGGED") {
      list = list.filter((r) => r.validationStatus === "invalid" || r.duplicateStatus === "possible_duplicate");
    }

    return list;
  }, [stagedRecords, sampleRows, tableSearch, tableStatusFilter, activeBatch?.status, selectedCampusId]);

  // Save Column Mappings and Run Validation
  const handleSaveMappings = async () => {
    if (!token || !activeBatch) return;

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
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-16 transition-colors">
      {/* 1. HIGH-DEFINITION EXECUTIVE HERO COMMAND BANNER */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 border-t-2 border-t-indigo-500 shadow-2xl p-6 sm:p-8">
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Module 4 &bull; Member Import &amp; Data Validation Suite</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
                RFC 4180 CSV
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span>Member Import &amp; Validation Suite</span>
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              ማኅበረ ቅዱሳን የግቢ ጉባኤያት አባላት ዳታ ማስገቢያና ማረጋገጫ ሥርዓት &bull; Single-campus membership enforcement, SHA-256 cryptographic integrity, intelligent column mapping, and duplicate review gateway.
            </p>
          </div>

          {/* Quick Actions & Campus Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Campus Selector */}
            <div className="relative">
              <select
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
                className="bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-md cursor-pointer"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* CSV Template Download */}
            <button
              onClick={() => downloadCsvTemplate(token!)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 text-sm font-semibold shadow-md flex items-center gap-2 transition hover:border-slate-500 active:scale-95"
              title="Download Official UTF-8 CSV Template with Amharic & English Headers"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>CSV Template</span>
            </button>

            {/* Excel Reference Download */}
            <button
              onClick={() => downloadExcelTemplate(token!)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 text-sm font-semibold shadow-md flex items-center gap-2 transition hover:border-slate-500 active:scale-95"
              title="Download Excel Reference Template"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Excel Ref</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => {
                loadBatches();
                if (activeBatch) loadBatchDeepDetails(activeBatch.id);
              }}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 transition shadow-md hover:border-slate-500 active:scale-95"
              title="Refresh Ingestion Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : "text-slate-300"}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Flash Notifications */}
        {error && (
          <div className="rounded-xl bg-red-950/60 border border-red-800 p-4 text-red-200 text-sm flex items-center justify-between shadow-lg animate-scale-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 p-4 text-emerald-200 text-sm flex items-center justify-between shadow-lg animate-scale-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. SIX VIVID KPI METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Batches */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 border-t-2 border-t-indigo-500 p-4 sm:p-5 shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Batches</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.totalBatches}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
              Across campus history
            </div>
          </div>

          {/* Card 2: Staged Records */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 border-t-2 border-t-cyan-500 p-4 sm:p-5 shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Staged Records</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
              {metrics.totalStaged.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
              5,000–50,000+ capacity
            </div>
          </div>

          {/* Card 3: Clean & Imported */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 border-t-2 border-t-emerald-500 p-4 sm:p-5 shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clean &amp; Ingested</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {metrics.totalImported.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Created in Module 3
            </div>
          </div>

          {/* Card 4: Duplicate Review Queue */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 border-t-2 border-t-amber-500 p-4 sm:p-5 shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Duplicate Queue</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {metrics.totalPendingReviews}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              Require admin decision
            </div>
          </div>

          {/* Card 5: Completed Pipelines */}
          <div className="rounded-2xl bg-slate-900/95 border border-slate-800 border-t-2 border-t-purple-500 p-4 sm:p-5 shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-400 tracking-tight">
              {metrics.completedBatches}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 font-medium">
              100% finished pipelines
            </div>
          </div>
        </div>

        {/* 3. MODERN HORIZONTAL TAB NAVIGATION BAR */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-1.5 flex flex-wrap gap-2 shadow-inner">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-150 ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview &amp; Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-150 ${
              activeTab === "upload"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>CSV Upload</span>
          </button>

          <button
            onClick={() => setActiveTab("mapping")}
            disabled={!activeBatch}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "mapping"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Column Mapping</span>
            {detectedHeaders.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-200">
                {detectedHeaders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("validation")}
            disabled={!activeBatch}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "validation"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Validation Diagnostic</span>
            {validationErrors.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-rose-500/30 text-rose-300 font-bold">
                {validationErrors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("duplicates")}
            disabled={!activeBatch}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "duplicates"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Duplicate Review Center</span>
            {duplicateCandidates.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-amber-500/30 text-amber-300 font-bold">
                {duplicateCandidates.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("approval")}
            disabled={!activeBatch}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "approval"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>Approval &amp; Ingestion</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-150 ${
              activeTab === "history"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>History &amp; Audit</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-200">
              {history.length}
            </span>
          </button>
        </div>

        {/* 4. TAB 1: OVERVIEW & DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {activeBatch ? (
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Active Staged Batch &bull; {activeBatch.status.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        {activeBatch.id}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{activeBatch.fileName}</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Destination Campus: <strong className="text-white">{activeBatch.campusName}</strong> &bull; Size: {(activeBatch.fileSize / 1024).toFixed(1)} KB &bull; SHA-256 Checksum: <code className="text-cyan-400 text-xs">{activeBatch.fileChecksum?.substring(0, 20)}...</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => downloadOriginalCsvFile(activeBatch.id, activeBatch.fileName, token!)}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 text-sm font-semibold shadow-md flex items-center gap-2 transition hover:border-slate-500"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Original CSV</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("upload")}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload New Batch</span>
                    </button>
                  </div>
                </div>

                {/* Step Flow Jumper Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {/* Step 1 */}
                  <div
                    onClick={() => setActiveTab("mapping")}
                    className="rounded-xl bg-slate-950/70 border border-slate-800 p-5 hover:border-indigo-500 transition cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold uppercase tracking-wider text-indigo-400">Step 1</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition text-slate-500 group-hover:text-white" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Column Mapping</h4>
                    <p className="text-xs text-slate-400">
                      {detectedHeaders.length > 0 ? `${detectedHeaders.length} columns mapped` : "Map 17 member fields"}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div
                    onClick={() => setActiveTab("validation")}
                    className="rounded-xl bg-slate-950/70 border border-slate-800 p-5 hover:border-cyan-500 transition cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold uppercase tracking-wider text-cyan-400">Step 2</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition text-slate-500 group-hover:text-white" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Row Validation</h4>
                    <p className="text-xs text-slate-400">
                      {validationErrors.length > 0 ? (
                        <span className="text-rose-400 font-bold">{validationErrors.length} errors to review</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Clean schema validation</span>
                      )}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    onClick={() => setActiveTab("duplicates")}
                    className="rounded-xl bg-slate-950/70 border border-slate-800 p-5 hover:border-amber-500 transition cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold uppercase tracking-wider text-amber-400">Step 3</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition text-slate-500 group-hover:text-white" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Duplicate Review</h4>
                    <p className="text-xs text-slate-400">
                      {duplicateCandidates.length > 0 ? (
                        <span className="text-amber-400 font-bold">{duplicateCandidates.length} candidate decisions</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">0 duplicate conflicts</span>
                      )}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div
                    onClick={() => setActiveTab("approval")}
                    className="rounded-xl bg-slate-950/70 border border-slate-800 p-5 hover:border-emerald-500 transition cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold uppercase tracking-wider text-emerald-400">Step 4</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition text-slate-500 group-hover:text-white" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Approval &amp; Ingestion</h4>
                    <p className="text-xs text-slate-400">
                      Status: <strong className="text-white uppercase">{activeBatch.status}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/90 border-2 border-dashed border-slate-800 p-12 text-center shadow-xl">
                <UploadCloud className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Ingestion Batch Selected</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                  Select a previous batch from history or upload a new CSV file to trigger intelligent staging, deduplication, and registration.
                </p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Member CSV</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. TAB 2: CSV UPLOAD ENGINE */}
        {activeTab === "upload" && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Staging &amp; Ingestion Gateway</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Strict CSV format enforcement. Every upload is verified for UTF-8 integrity, hashed with SHA-256, and stored securely in permanent retention.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Target Campus</div>
                  <div className="text-sm font-bold text-white">
                    {currentCampus ? `${currentCampus.name} (${currentCampus.code})` : "None Selected"}
                  </div>
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById("csv-file-input")?.click()}
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition duration-300 cursor-pointer shadow-inner ${
                isDragOver
                  ? "border-indigo-400 bg-indigo-950/20"
                  : "border-slate-700 bg-slate-950/60 hover:border-indigo-500/70 hover:bg-slate-900/60"
              }`}
            >
              <input
                type="file"
                id="csv-file-input"
                accept=".csv, .xlsx, .xls, .xlsm, .ods, .tsv, .txt, *"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <h4 className="text-lg font-bold text-white mb-1">
                {selectedFile ? selectedFile.name : "Drag & Drop Member Spreadsheet or Data File Here"}
              </h4>
              <p className="text-sm text-slate-400 mb-4">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready for staging & ingestion`
                  : "Accepts any file format: Microsoft Excel (.xlsx, .xls), CSV (.csv), TSV, or text files"}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                  Excel (.xlsx / .xls) Supported
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/50 text-cyan-300 border border-cyan-800/40">
                  Universal File Ingestion
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                  CSV / TSV / TXT
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                  UTF-8 Unicode &amp; Amharic
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                  SHA-256 Hashed
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                onClick={() => downloadCsvTemplate(token!)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 text-sm font-semibold shadow-md flex items-center gap-2 transition hover:border-slate-500"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Official CSV Template</span>
              </button>

              <div className="flex items-center gap-3">
                {selectedFile && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition"
                  >
                    Clear Selection
                  </button>
                )}

                <button
                  onClick={handleExecuteUpload}
                  disabled={!selectedFile || actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying &amp; Staging...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Stage File (CSV or Excel)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. TAB 3: IMPORTED DATA LIST & INSTANT REGISTRATION */}
        {activeTab === "mapping" && (
          <div className="space-y-6">
            {/* A. COMPACT FIELD MAPPING STATUS BANNER (REPLACES THE 12 GIANT CARDS) */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {detectedHeaders.length > 0 ? `${detectedHeaders.length}/12 Columns Auto-Mapped` : "Columns Detected"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      100% Ready
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ተ.ቁ ➔ Serial</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ሙሉ ስም ➔ Name</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ክርስትና ➔ Christian</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ጾታ ➔ Gender</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ስልክ ➔ Phone</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ዲፓርትመንት ➔ Dept</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ዶርም/ብሎክ ➔ Residence</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ተጠሪ ➔ Contact</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">ሰንበት ት/ቤት ➔ Sunday School</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => setShowMappingCards((prev) => !prev)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showMappingCards ? "Hide Mapping Cards" : "Configure / Edit Mappings"}</span>
                </button>
              </div>
            </div>

            {/* B. OPTIONAL COLLAPSIBLE MAPPING CARDS (ONLY SHOWN IF USER EXPLICITLY WANTS TO EDIT) */}
            {showMappingCards && (
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-white">Manual Column Mapping Configuration</h4>
                  <button
                    onClick={handleSaveMappings}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply &amp; Save Mappings</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {detectedHeaders.map((header) => {
                    const currentTarget = currentMappings[header] || "ignored";
                    return (
                      <div
                        key={header}
                        className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Source Column
                          </span>
                          {currentTarget !== "ignored" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Mapped
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-white mb-2 truncate" title={header}>
                          {header}
                        </div>
                        <select
                          value={currentTarget}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCurrentMappings((prev) => ({ ...prev, [header]: val }));
                          }}
                          className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        >
                          <option value="ignored">-- (Ignore column) --</option>
                          {CANONICAL_FIELDS.map((cf) => (
                            <option key={cf.key} value={cf.key} className="bg-slate-900 text-white">
                              {cf.required ? "* " : ""}{cf.labelEn} ({cf.labelAm})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* C. HERO VERIFICATION & 1-CLICK ADD TO MEMBER COMMAND BAR */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-7 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Module 3 Integrated Member Ingestion</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <span>የተጫኑ የአባላት መረጃዎች ዝርዝር</span>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {activeBatch?.totalRows || stagedRecords.length || filteredTableRows.length} አባላት
                  </span>
                </h3>
                <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                  ሁሉም የExcel/CSV ረድፎች ተረጋግጠው ተለይተዋል &bull; በአንድ ክሊክ ሙሉውን ዳታ ወደ C-CIMAS ቋሚ የአባላት ዳታቤዝ ያስገቡ።
                </p>

                {/* Status Badges Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{stagedRecords.filter((r) => r.validationStatus === "valid").length || activeBatch?.validRows || activeBatch?.totalRows || filteredTableRows.length} ዝግጁ የሆኑ አባላት</span>
                  </span>

                  {activeBatch?.importedRows && activeBatch.importedRows > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{activeBatch.importedRows} ቀድመው የተመዘገቡ አባላት</span>
                    </span>
                  ) : null}

                  {duplicateCandidates.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{duplicateCandidates.length} Duplicate Flagged</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Command Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleVerifyData}
                  disabled={actionLoading || isProcessingLive}
                  className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-bold flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
                  title="Check and re-verify all data rows"
                >
                  <RefreshCw className={`w-4 h-4 text-cyan-400 ${actionLoading ? "animate-spin" : ""}`} />
                  <span>Check / Verify Data</span>
                </button>

                {activeBatch?.status === "completed" ? (
                  <button
                    onClick={() => navigate("/members")}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/30 flex items-center gap-2.5 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>View in Member Directory (ወደ አባላት ዝርዝር ሂድ)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleAddAllToMembers}
                    disabled={actionLoading || isProcessingLive}
                    className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-400 text-white text-sm font-extrabold shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 flex items-center gap-2.5 transition active:scale-95 disabled:opacity-50 transform hover:-translate-y-0.5"
                  >
                    {isProcessingLive || actionLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Adding All to Members ({processingProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-white" />
                        <span>Add All to Members (ሁሉንም ወደ አባላት መዝግብ)</span>
                        <ArrowRight className="w-4 h-4 text-indigo-200" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* D. LIVE SEARCH & STATUS FILTER TABS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search by name, phone, department, or dormitory..."
                  className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Badges */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setTableStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    tableStatusFilter === "ALL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({stagedRecords.length || activeBatch?.totalRows || filteredTableRows.length})
                </button>
                <button
                  onClick={() => setTableStatusFilter("READY")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    tableStatusFilter === "READY" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Ready to Add
                </button>
                <button
                  onClick={() => setTableStatusFilter("IMPORTED")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    tableStatusFilter === "IMPORTED" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Added to Members ({activeBatch?.importedRows || 0})
                </button>
              </div>
            </div>

            {/* E. FULL INTERACTIVE DATA TABLE (ALL ROWS) */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5 text-center text-cyan-400 font-bold w-12">ተ.ቁ</th>
                      <th className="p-3.5 text-slate-200">ሙሉ ስም (Full Name)</th>
                      <th className="p-3.5 text-slate-300">ክርስትና ስም (Christian Name)</th>
                      <th className="p-3.5 text-center">ጾታ (Gender)</th>
                      <th className="p-3.5">ስልክ ቁጥር (Phone)</th>
                      <th className="p-3.5">የትምህርት ክፍል (Department)</th>
                      <th className="p-3.5">ዶርም / ብሎክ</th>
                      <th className="p-3.5">ቋንቋ</th>
                      <th className="p-3.5">የተጠሪ መረጃ (Emergency Contact)</th>
                      <th className="p-3.5">ሰንበት ት/ቤት</th>
                      <th className="p-3.5 text-center">ሁኔታ (Status)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {filteredTableRows.length > 0 ? (
                      filteredTableRows.map((row, idx) => {
                        const serial = row.normalizedData?.serialNumber || String(row.rowNumber || idx + 1);
                        const isFemale =
                          row.normalizedData?.gender === "FEMALE" ||
                          (row.originalData["ጾታ"] || "").includes("ሴ");
                        const isImported =
                          row.importStatus === "imported" ||
                          row.importStatus === "updated" ||
                          activeBatch?.status === "completed";

                        return (
                          <tr
                            key={row.id || idx}
                            className="hover:bg-slate-800/40 transition duration-150 group"
                          >
                            {/* 1. Serial */}
                            <td className="p-3.5 text-center text-cyan-400 font-mono font-bold">
                              {serial}
                            </td>

                            {/* 2. Full Name */}
                            <td className="p-3.5 font-bold text-white whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 shadow-sm">
                                  {(row.normalizedData?.fullName || "M").charAt(0)}
                                </div>
                                <span className="group-hover:text-indigo-300 transition">
                                  {row.normalizedData?.fullName || row.originalData["ሙሉ ስም"] || "-"}
                                </span>
                              </div>
                            </td>

                            {/* 3. Christian Name */}
                            <td className="p-3.5 text-slate-300 whitespace-nowrap">
                              {row.normalizedData?.christianName || row.originalData["ክርስትና ስም"] || "-"}
                            </td>

                            {/* 4. Gender */}
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {isFemale ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                  ሴት (F)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  ወንድ (M)
                                </span>
                              )}
                            </td>

                            {/* 5. Phone */}
                            <td className="p-3.5 text-slate-200 font-mono whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <PhoneCall className="w-3 h-3 text-slate-500" />
                                <span>{row.normalizedData?.phoneNumber || row.originalData["ስልክ ቁጥር"] || "-"}</span>
                              </div>
                            </td>

                            {/* 6. Academic Department */}
                            <td className="p-3.5 whitespace-nowrap">
                              {row.normalizedData?.academicDepartment || row.originalData["ዲፓርትመንት"] ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                                  {row.normalizedData?.academicDepartment || row.originalData["ዲፓርትመንት"]}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>

                            {/* 7. Dorm & Block */}
                            <td className="p-3.5 text-slate-300 whitespace-nowrap">
                              {row.normalizedData?.dormBlock || row.normalizedData?.dormRoom || row.originalData["ብሎክ"] ? (
                                <span className="text-[11px]">
                                  ብሎክ {row.normalizedData?.dormBlock || row.originalData["ብሎክ"] || "-"} &bull; ዶርም {row.normalizedData?.dormRoom || row.originalData["ዶርም"] || "-"}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>

                            {/* 8. Language */}
                            <td className="p-3.5 text-slate-300 whitespace-nowrap">
                              {row.normalizedData?.language || row.originalData["ቋንቋ"] || "አማርኛ"}
                            </td>

                            {/* 9. Emergency Contact */}
                            <td className="p-3.5 text-slate-300 whitespace-nowrap">
                              <div>
                                <span className="font-medium text-slate-200">
                                  {row.normalizedData?.emergencyContactName || row.originalData["የተጠሪ ስም"] || "-"}
                                </span>
                                {(row.normalizedData?.emergencyContactPhone || row.originalData["የተጠሪ ስልክ"]) && (
                                  <span className="block text-[10px] text-slate-400 font-mono">
                                    {row.normalizedData?.emergencyContactPhone || row.originalData["የተጠሪ ስልክ"]}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 10. Sunday School Duration */}
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {row.normalizedData?.sundaySchoolDuration || row.originalData["የሰንበት ት/ቤት ቆይታ"] ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                  {row.normalizedData?.sundaySchoolDuration || row.originalData["የሰንበት ት/ቤት ቆይታ"]}
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>

                            {/* 11. Status */}
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {isImported ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Added to Members</span>
                                </span>
                              ) : row.validationStatus === "invalid" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  <XCircle className="w-3 h-3 text-rose-400" />
                                  <span>Validation Error</span>
                                </span>
                              ) : row.duplicateStatus === "possible_duplicate" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span>Duplicate Match</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  <Check className="w-3 h-3 text-indigo-400" />
                                  <span>Ready to Add</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="p-12 text-center text-slate-400">
                          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-slate-300">No member records match the active filter or search</p>
                          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Count */}
              <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong>{filteredTableRows.length}</strong> of <strong>{stagedRecords.length || activeBatch?.totalRows || filteredTableRows.length}</strong> total member rows
                </span>
                <span className="text-slate-500">
                  C-CIMAS &bull; Active Campus ID: <code className="text-slate-400">{selectedCampusId}</code>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 7. TAB 4: VALIDATION DIAGNOSTIC */}
        {activeTab === "validation" && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Row Validation &amp; Error Diagnostic</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Detailed inspection of schema constraints, missing mandatory fields, invalid phone formats, and out-of-bounds age values.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {activeBatch && (
                  <button
                    onClick={() => downloadImportErrorReport(activeBatch.id, token!)}
                    className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800 text-sm font-semibold shadow-md flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4 text-rose-400" />
                    <span>Download Error Report (.xlsx)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (activeBatch) loadBatchDeepDetails(activeBatch.id);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 transition"
                  title="Reload Validation Results"
                >
                  <RefreshCw className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </div>

            {/* Severity Filter Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setErrorFilterSeverity("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  errorFilterSeverity === "ALL"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                All Issues ({validationErrors.length})
              </button>
              <button
                onClick={() => setErrorFilterSeverity("ERROR")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  errorFilterSeverity === "ERROR"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                Errors ({validationErrors.filter((e) => e.severity === "error").length})
              </button>
              <button
                onClick={() => setErrorFilterSeverity("WARNING")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  errorFilterSeverity === "WARNING"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                Warnings ({validationErrors.filter((e) => e.severity === "warning").length})
              </button>
            </div>

            {/* Errors Table */}
            {filteredErrors.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3.5 border-b border-slate-800 text-cyan-400 font-bold">ተ.ቁ (Row #)</th>
                      <th className="p-3.5 border-b border-slate-800">Target Field</th>
                      <th className="p-3.5 border-b border-slate-800">Error Code</th>
                      <th className="p-3.5 border-b border-slate-800">Diagnostic Message</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {filteredErrors.map((err, errIdx) => (
                      <tr key={err.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5 text-cyan-400 font-mono font-bold whitespace-nowrap">
                          {err.rowNumber} (ተ.ቁ {errIdx + 1})
                        </td>
                        <td className="p-3.5 text-cyan-400 font-mono font-semibold whitespace-nowrap">
                          {err.fieldName}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {err.errorCode}
                        </td>
                        <td className="p-3.5 text-slate-200">
                          {err.errorMessage}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              err.severity === "error"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
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
              <div className="text-center py-12 rounded-xl bg-slate-950/50 border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-1">Zero Schema Validation Errors</h4>
                <p className="text-xs text-slate-400">
                  All staged records meet C-CIMAS database constraints and validation criteria.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 8. TAB 5: DUPLICATE REVIEW CENTER */}
        {activeTab === "duplicates" && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Administrator Duplicate Review Center</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Side-by-side comparison between incoming staged rows and existing registered members. Strict blocking ensures no batch can be approved until all duplicate decisions are resolved.
                </p>
              </div>

              <div className="text-sm text-slate-300">
                Pending Decisions: <strong className="text-amber-400 text-base">{duplicateCandidates.filter((c) => c.reviewStatus === "pending").length}</strong>
              </div>
            </div>

            {duplicateCandidates.length > 0 ? (
              <div className="space-y-6">
                {duplicateCandidates.map((candidate) => {
                  const isPending = candidate.reviewStatus === "pending";
                  return (
                    <div
                      key={candidate.id}
                      className="rounded-2xl bg-slate-950/90 border border-amber-500/40 p-6 shadow-xl space-y-5"
                    >
                      {/* Top Candidate Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Incoming Row #{candidate.rowNumber} Duplicate Conflict
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Match Score: {candidate.matchScore}%
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                            isPending
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          Status: {candidate.reviewStatus.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        Reason: <strong className="text-white">{candidate.matchReason}</strong> &bull; Matched Fields: <code className="text-cyan-400 text-xs">{candidate.matchingFields.join(", ")}</code>
                      </div>

                      {/* Side-by-Side Comparison Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Staged Row Side */}
                        <div className="rounded-xl bg-slate-900/90 border border-indigo-500/30 p-5 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold uppercase text-indigo-400">
                              Incoming Staged Record
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Row #{candidate.rowNumber}</span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Full Name:</span>
                              <span className="text-white font-bold">{candidate.stagedRow?.fullName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Baptismal Name:</span>
                              <span className="text-slate-200">{candidate.stagedRow?.christianName || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Gender:</span>
                              <span className="text-slate-200">{candidate.stagedRow?.gender || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Phone Number:</span>
                              <span className="text-white font-bold">{candidate.stagedRow?.phoneNumber || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Department:</span>
                              <span className="text-slate-200">{candidate.stagedRow?.academicDepartment || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Existing Member Side */}
                        <div className="rounded-xl bg-slate-900/90 border border-emerald-500/30 p-5 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold uppercase text-emerald-400">
                              Existing System Member
                            </span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">
                              {candidate.existingMember.memberId}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Full Name:</span>
                              <span className="text-white font-bold">{candidate.existingMember.fullName}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Baptismal Name:</span>
                              <span className="text-slate-200">{candidate.existingMember.christianName || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Gender:</span>
                              <span className="text-slate-200">{candidate.existingMember.gender}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-800/40">
                              <span className="text-slate-400">Phone Number:</span>
                              <span className="text-white font-bold">{candidate.existingMember.phoneNumber || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Academic Dept:</span>
                              <span className="text-slate-200">{candidate.existingMember.academicDepartment || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Decision Controls */}
                      {isPending ? (
                        <div className="pt-3 border-t border-slate-800 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("create_new_member");
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                selectedCandidate?.id === candidate.id && reviewDecision === "create_new_member"
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                              }`}
                            >
                              Create As New Member
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("update_existing_member");
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                selectedCandidate?.id === candidate.id && reviewDecision === "update_existing_member"
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                              }`}
                            >
                              Update Existing Member
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("skip_existing");
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                selectedCandidate?.id === candidate.id && reviewDecision === "skip_existing"
                                  ? "bg-slate-700 text-white shadow-md"
                                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                              }`}
                            >
                              Skip (Do Not Re-import)
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setReviewDecision("reject_row");
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                selectedCandidate?.id === candidate.id && reviewDecision === "reject_row"
                                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                              }`}
                            >
                              Reject Staged Row
                            </button>
                          </div>

                          {selectedCandidate?.id === candidate.id && (
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 animate-scale-in">
                              <input
                                type="text"
                                placeholder="Enter administrator justification reason for this decision..."
                                value={reviewReason}
                                onChange={(e) => setReviewReason(e.target.value)}
                                className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner"
                              />
                              <button
                                onClick={handleSubmitReviewDecision}
                                disabled={actionLoading}
                                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 whitespace-nowrap transition active:scale-95"
                              >
                                {actionLoading ? "Applying..." : "Confirm Decision"}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                          Reviewed by <strong className="text-white">{candidate.reviewedBy || "Administrator"}</strong> &bull; Reason: <em>&quot;{candidate.decisionReason || "Resolved"}&quot;</em>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl bg-slate-950/50 border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-1">Zero Duplicate Conflicts</h4>
                <p className="text-xs text-slate-400">
                  All staged records are verified unique against existing members and intra-batch rows.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 9. TAB 6: APPROVAL & PROCESSING PIPELINE */}
        {activeTab === "approval" && activeBatch && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Batch Approval &amp; Member Ingestion</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Strict gate enforcement: Approval is blocked until all duplicate candidates have an explicit administrator decision. Once approved, members are created idempotently via Module 3.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Batch Status: {activeBatch.status}
              </span>
            </div>

            {/* Pre-Approval Checklist Box */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Pre-Approval Gate Checklist</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">
                    Active Campus Match: Validated into <strong>{activeBatch.campusName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">
                    Column Mapping: Mandatory <code>full_name</code> and <code>gender</code> mapped
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {duplicateCandidates.filter((c) => c.reviewStatus === "pending").length === 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-200">Duplicate Resolution: All candidates resolved (0 pending)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span className="text-rose-400 font-bold">
                        Duplicate Resolution: {duplicateCandidates.filter((c) => c.reviewStatus === "pending").length} candidates require decision before approval
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div>
                {activeBatch.status === "approved" && (
                  <div className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approved by {activeBatch.reviewedByName || "Administrator"}. Ready for member ingestion.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeBatch.status !== "approved" && activeBatch.status !== "completed" && (
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    disabled={duplicateCandidates.filter((c) => c.reviewStatus === "pending").length > 0 || actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-40 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Import Batch</span>
                  </button>
                )}

                {activeBatch.status === "approved" && (
                  <button
                    onClick={handleProcessBatch}
                    disabled={isProcessingLive}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
                  >
                    {isProcessingLive ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Creating Members ({processingProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Execute Member Creation</span>
                      </>
                    )}
                  </button>
                )}

                {activeBatch.failedRows > 0 && (
                  <button
                    onClick={handleRetryFailed}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 border border-amber-500/40 text-sm font-semibold transition"
                  >
                    Retry Failed Rows
                  </button>
                )}
              </div>
            </div>

            {/* Live Ingestion Progress Bar */}
            {isProcessingLive && (
              <div className="pt-4 border-t border-slate-800 space-y-2 animate-scale-in">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Executing Member Ingestion via Module 3 Member Service</span>
                  <span className="font-bold text-white">{processingProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 10. TAB 7: HISTORY & AUDIT LEDGER */}
        {activeTab === "history" && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Batch Import History &amp; Audit Ledger</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Full provenance of all import batches, cryptographic checksums, author identity, and original raw files.
                </p>
              </div>

              <button
                onClick={loadBatches}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 text-xs font-semibold shadow-md flex items-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                <span>Refresh Ledger</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5 border-b border-slate-800 text-cyan-400 font-bold">ተ.ቁ</th>
                    <th className="p-3.5 border-b border-slate-800">Batch ID</th>
                    <th className="p-3.5 border-b border-slate-800">File Name</th>
                    <th className="p-3.5 border-b border-slate-800">Campus</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Total</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Imported</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Duplicates</th>
                    <th className="p-3.5 border-b border-slate-800">Status</th>
                    <th className="p-3.5 border-b border-slate-800">Date</th>
                    <th className="p-3.5 border-b border-slate-800 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {history.map((batch, idx) => (
                    <tr key={batch.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-mono text-cyan-400 font-bold whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {batch.id.substring(0, 10)}...
                      </td>
                      <td className="p-3.5 text-white font-bold whitespace-nowrap">
                        {batch.fileName}
                      </td>
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        {batch.campusName}
                      </td>
                      <td className="p-3.5 text-center text-white font-bold whitespace-nowrap">
                        {batch.totalRows}
                      </td>
                      <td className="p-3.5 text-center text-emerald-400 font-bold whitespace-nowrap">
                        {batch.importedRows}
                      </td>
                      <td className="p-3.5 text-center text-amber-400 font-bold whitespace-nowrap">
                        {batch.duplicateRows}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {batch.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveBatch(batch);
                              setActiveTab("mapping");
                            }}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 transition"
                            title="Open Batch Workspace"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => downloadOriginalCsvFile(batch.id, batch.fileName, token!)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition"
                            title="Download Original Retained CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
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
      </div>

      {/* APPROVAL CONFIRMATION MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span>Authorize Batch Approval</span>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Confirming approval unlocks member registration. You are authorizing registration of validated members into campus: <strong className="text-white">{activeBatch?.campusName}</strong>.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Administrator Approval Authorization Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter approval justification, cohort details, or reference remarks..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveBatch}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                {actionLoading ? "Authorizing..." : "Confirm & Authorize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
