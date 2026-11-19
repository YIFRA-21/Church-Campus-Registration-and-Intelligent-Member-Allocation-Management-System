import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import {
  fetchDepartments,
  fetchDepartmentById,
  fetchDepartmentDashboardSummary,
  createDepartment,
  updateDepartment,
  changeDepartmentStatus,
  updateDepartmentCapacity,
  toggleDepartmentActive,
  deleteDepartment,
  fetchCurrentTargetConfiguration,
  fetchTargetHistory,
  validateTargets,
  finalizeTargets,
  simulateTargets,
  fetchEligibilityRules,
  saveEligibilityRules,
} from "../api/department.api";
import { Campus } from "../types/campus";
import {
  Department,
  CreateDepartmentPayload,
  DepartmentStatus,
  DepartmentDashboardSummary,
  TargetConfiguration,
  CalculatedTarget,
  EligibilityRule,
} from "../types/department";
import {
  Layers,
  Percent,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Calculator,
  Save,
  Users,
  Building2,
  Sliders,
  Eye,
  Edit,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Clock,
  History,
  AlertCircle,
  Check,
  Download,
  BookOpen,
  Calendar,
  Lock,
} from "lucide-react";

export const DepartmentsPage: React.FC = () => {
  const { token, hasPermission, user } = useAuth();

  // Campuses state
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");

  // Departments list & pagination
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ARCHIVED">("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "name" | "code" | "capacity" | "utilization">("priority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 8;

  // Dashboard summary KPIs
  const [summary, setSummary] = useState<DepartmentDashboardSummary | null>(null);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"directory" | "targetStudio">("directory");

  // Multi-select for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedDeptForView, setSelectedDeptForView] = useState<Department | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "history" | "capacityHistory" | "rules">("overview");

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    description: string;
    capacity: number;
    priority: number;
    targetPercentage: number;
    status: DepartmentStatus;
  }>({
    name: "",
    description: "",
    capacity: 500,
    priority: 1,
    targetPercentage: 0,
    status: "ACTIVE",
  });
  const [updating, setUpdating] = useState<boolean>(false);

  // Status Transition Modal
  const [statusModalDept, setStatusModalDept] = useState<Department | null>(null);
  const [statusTransitionTarget, setStatusTransitionTarget] = useState<DepartmentStatus>("ACTIVE");
  const [statusReason, setStatusReason] = useState<string>("");
  const [transitioningStatus, setTransitioningStatus] = useState<boolean>(false);

  // Capacity Adjustment Modal
  const [capacityModalDept, setCapacityModalDept] = useState<Department | null>(null);
  const [newCapacityValue, setNewCapacityValue] = useState<number>(500);
  const [capacityReason, setCapacityReason] = useState<string>("");
  const [capacityConfirmed, setCapacityConfirmed] = useState<boolean>(false);
  const [capacityWarningMessage, setCapacityWarningMessage] = useState<string | null>(null);
  const [adjustingCapacity, setAdjustingCapacity] = useState<boolean>(false);

  // Eligibility Rules Modal
  const [eligibilityDept, setEligibilityDept] = useState<Department | null>(null);
  const [currentRules, setCurrentRules] = useState<EligibilityRule[]>([]);
  const [savingRules, setSavingRules] = useState<boolean>(false);

  // Delete Safety Modal
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Create Form State
  const [createFormData, setCreateFormData] = useState<CreateDepartmentPayload>({
    campusId: "",
    code: "",
    name: "",
    description: "",
    capacity: 500,
    targetPercentage: 0,
    priority: 1,
    status: "ACTIVE",
  });
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Target Studio Workspace State
  const [targetStudioCycleName, setTargetStudioCycleName] = useState<string>("2026/2027 Annual Allocation Cycle");
  const [targetPercentages, setTargetPercentages] = useState<Record<string, number>>({});
  const [activeConfig, setActiveConfig] = useState<TargetConfiguration | null>(null);
  const [targetHistory, setTargetHistory] = useState<TargetConfiguration[]>([]);
  const [targetStudioTab, setTargetStudioTab] = useState<"editor" | "simulation" | "history">("editor");
  const [simPopulation, setSimPopulation] = useState<number>(1000);
  const [simResults, setSimResults] = useState<CalculatedTarget[]>([]);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [finalizingTargets, setFinalizingTargets] = useState<boolean>(false);
  const [shortfallWarnings, setShortfallWarnings] = useState<
    {
      departmentId: string;
      departmentCode: string;
      departmentName: string;
      capacity: number;
      projectedTarget: number;
      shortfall: number;
    }[]
  >([]);

  // 1. Initial Load: Campuses
  useEffect(() => {
    async function init() {
      if (!token) return;
      try {
        const cList = await fetchCampuses(token);
        setCampuses(cList);
        if (cList.length > 0 && !selectedCampusId) {
          setSelectedCampusId(cList[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading campuses");
      }
    }
    init();
  }, [token]);

  // 2. Load Dashboard Summary & Departments whenever campus or filters change
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Dashboard KPI Summary
      const summaryData = await fetchDepartmentDashboardSummary(token, selectedCampusId || undefined);
      setSummary(summaryData);

      // 2. Fetch Paginated Departments
      const deptsData = await fetchDepartments(token, {
        campusId: selectedCampusId || undefined,
        status: statusFilter,
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
      });

      setDepartments(deptsData.departments);
      setTotalCount(deptsData.total);
      setTotalPages(deptsData.totalPages);

      // 3. Initialize Target Studio Percentages
      const pMap: Record<string, number> = {};
      deptsData.departments.forEach((d) => {
        pMap[d.id] = d.targetPercentage;
      });
      setTargetPercentages((prev) => ({ ...prev, ...pMap }));

      // 4. Fetch Active Target Configuration & History for Campus
      if (selectedCampusId) {
        const cfg = await fetchCurrentTargetConfiguration(selectedCampusId, token);
        setActiveConfig(cfg);
        if (cfg && cfg.targets) {
          setTargetStudioCycleName(cfg.cycleName);
          const activeMap: Record<string, number> = {};
          cfg.targets.forEach((t) => {
            activeMap[t.departmentId] = t.percentage;
          });
          setTargetPercentages((prev) => ({ ...prev, ...activeMap }));
        }

        const hist = await fetchTargetHistory(selectedCampusId, token);
        setTargetHistory(hist);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load department records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, selectedCampusId, statusFilter, searchTerm, sortBy, sortOrder, currentPage]);

  // Selected campus display name
  const currentCampus = useMemo(() => {
    return campuses.find((c) => c.id === selectedCampusId);
  }, [campuses, selectedCampusId]);

  // Active departments in current view for target configuration
  const activeDepartmentsList = useMemo(() => {
    return departments.filter((d) => d.status === "ACTIVE" || d.isActive);
  }, [departments]);

  // Calculated current sum of percentages in editor
  const currentTargetSum = useMemo(() => {
    const sum = activeDepartmentsList.reduce((acc, d) => {
      const val = targetPercentages[d.id] ?? d.targetPercentage;
      return acc + (Number(val) || 0);
    }, 0);
    return Math.round(sum * 100) / 100;
  }, [activeDepartmentsList, targetPercentages]);

  const isTargetSumValid = useMemo(() => {
    return Math.abs(currentTargetSum - 100.0) < 0.01;
  }, [currentTargetSum]);

  // Run simulation / shortfall check whenever targets or sim population change
  const runLiveTargetValidation = async () => {
    if (!token || !selectedCampusId || activeDepartmentsList.length === 0) return;
    try {
      const targetsPayload = activeDepartmentsList.map((d) => ({
        departmentId: d.id,
        percentage: targetPercentages[d.id] ?? d.targetPercentage,
      }));

      const res = await validateTargets(
        {
          campusId: selectedCampusId,
          cycleName: targetStudioCycleName,
          targets: targetsPayload,
          totalBaseCount: simPopulation,
        },
        token
      );

      setSimResults(res.projectedAllocations || []);
      setShortfallWarnings(res.shortfalls || []);
    } catch {
      // Non-blocking background preview
    }
  };

  useEffect(() => {
    if (activeTab === "targetStudio" && isTargetSumValid) {
      runLiveTargetValidation();
    }
  }, [activeTab, targetPercentages, simPopulation, isTargetSumValid, selectedCampusId]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Create Department
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCampusId) return;
    setSubmittingCreate(true);
    setError(null);

    try {
      await createDepartment({ ...createFormData, campusId: selectedCampusId }, token);
      setShowCreateModal(false);
      setSuccessMsg(`Department "${createFormData.name}" registered successfully.`);
      setCreateFormData({
        campusId: selectedCampusId,
        code: "",
        name: "",
        description: "",
        capacity: 500,
        targetPercentage: 0,
        priority: departments.length + 1,
        status: "ACTIVE",
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create department");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditFormData({
      name: dept.name,
      description: dept.description || "",
      capacity: dept.capacity,
      priority: dept.priority,
      targetPercentage: dept.targetPercentage,
      status: dept.status,
    });
  };

  // Update Department
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingDept) return;
    setUpdating(true);
    setError(null);

    try {
      const res = await updateDepartment(editingDept.id, editFormData, token);
      setEditingDept(null);
      setSuccessMsg(
        res.warning
          ? `Department updated. Warning: ${res.warning}`
          : `Department "${res.department.name}" updated successfully.`
      );
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update department");
    } finally {
      setUpdating(false);
    }
  };

  // Open Status Transition Modal
  const handleOpenStatusModal = (dept: Department) => {
    setStatusModalDept(dept);
    setStatusTransitionTarget(dept.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    setStatusReason("");
  };

  // Submit Status Transition
  const handleStatusTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !statusModalDept) return;
    if (statusReason.trim().length < 5) {
      setError("Please provide a valid justification (minimum 5 characters) for the status change.");
      return;
    }

    setTransitioningStatus(true);
    setError(null);
    try {
      await changeDepartmentStatus(
        statusModalDept.id,
        statusTransitionTarget,
        statusReason.trim(),
        token
      );
      setStatusModalDept(null);
      setSuccessMsg(`Department status transitioned to ${statusTransitionTarget}.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to transition department status");
    } finally {
      setTransitioningStatus(false);
    }
  };

  // Open Capacity Adjustment Modal
  const handleOpenCapacityModal = (dept: Department) => {
    setCapacityModalDept(dept);
    setNewCapacityValue(dept.capacity);
    setCapacityReason("");
    setCapacityConfirmed(false);
    setCapacityWarningMessage(null);
  };

  // Submit Capacity Adjustment
  const handleCapacitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !capacityModalDept) return;

    setAdjustingCapacity(true);
    setError(null);
    try {
      const res = await updateDepartmentCapacity(
        capacityModalDept.id,
        newCapacityValue,
        capacityReason,
        capacityConfirmed,
        token
      );

      if (res.requiresConfirmation && !capacityConfirmed) {
        setCapacityWarningMessage(res.message);
        setAdjustingCapacity(false);
        return;
      }

      setCapacityModalDept(null);
      setSuccessMsg(res.message);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to adjust capacity");
    } finally {
      setAdjustingCapacity(false);
    }
  };

  // Open Eligibility Rules Modal
  const handleOpenEligibilityModal = async (dept: Department) => {
    if (!token) return;
    setEligibilityDept(dept);
    try {
      const rules = await fetchEligibilityRules(dept.id, token);
      setCurrentRules(
        rules.length > 0
          ? rules
          : [
              {
                ruleName: "Christian Baptism Required",
                ruleType: "BAPTISM_STATUS",
                operator: "EQUALS",
                value: true,
                isMandatory: true,
                isActive: true,
              },
            ]
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load eligibility rules");
    }
  };

  // Save Eligibility Rules
  const handleSaveRules = async () => {
    if (!token || !eligibilityDept) return;
    setSavingRules(true);
    setError(null);
    try {
      await saveEligibilityRules(eligibilityDept.id, currentRules, token);
      setEligibilityDept(null);
      setSuccessMsg(`Eligibility rules updated for ${eligibilityDept.name}.`);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save eligibility rules");
    } finally {
      setSavingRules(false);
    }
  };

  // Finalize Targets (Immutable Version Snapshot)
  const handleFinalizeTargets = async () => {
    if (!token || !selectedCampusId || !isTargetSumValid) return;
    setFinalizingTargets(true);
    setError(null);

    try {
      const targetsPayload = activeDepartmentsList.map((d) => ({
        departmentId: d.id,
        percentage: targetPercentages[d.id] ?? d.targetPercentage,
      }));

      const newConfig = await finalizeTargets(
        {
          campusId: selectedCampusId,
          cycleName: targetStudioCycleName,
          targets: targetsPayload,
          totalBaseCount: simPopulation,
          confirmShortfalls: true,
        },
        token
      );

      setActiveConfig(newConfig);
      setSuccessMsg(
        `Version ${newConfig.version} targets finalized & locked successfully (100.00% Sum Validated).`
      );
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to finalize target configuration");
    } finally {
      setFinalizingTargets(false);
    }
  };

  // Delete Department Confirmation
  const handleDeleteConfirm = async () => {
    if (!token || !deletingDept) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteDepartment(deletingDept.id, token);
      setSuccessMsg(`Department "${deletingDept.name}" deleted successfully.`);
      setDeletingDept(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete department");
    } finally {
      setIsDeleting(false);
    }
  };

  // Multi-select Row Handling
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(departments.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = departments.length > 0 && selectedIds.length === departments.length;

  // Batch Status Transition
  const handleBatchStatus = async (status: DepartmentStatus) => {
    if (!token || selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          changeDepartmentStatus(
            id,
            status,
            `Batch administrative transition to ${status}`,
            token
          )
        )
      );
      setSuccessMsg(`Updated ${selectedIds.length} departments to ${status}.`);
      setSelectedIds([]);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Batch operation failed");
    }
  };

  // Export Selected Departments as CSV
  const handleExportSelected = () => {
    const listToExport =
      selectedIds.length > 0
        ? departments.filter((d) => selectedIds.includes(d.id))
        : departments;

    const headers = [
      "Department Code",
      "Department Name",
      "Campus Share Target %",
      "Allocated Members",
      "Max Capacity",
      "Utilization %",
      "Priority",
      "Status",
    ];

    const rows = listToExport.map((d) => {
      const util = d.capacity > 0 ? Math.round((d.allocatedMembersCount / d.capacity) * 100) : 0;
      return [
        d.code,
        `"${d.name.replace(/"/g, '""')}"`,
        `${d.targetPercentage}%`,
        d.allocatedMembersCount,
        d.capacity,
        `${util}%`,
        d.priority,
        d.status,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `C-CIMAS-Departments-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`Exported ${listToExport.length} departments to CSV.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE CANVA-INSPIRED HERO BANNER WITH DUAL FLUID WAVE SVG          */}
      {/* ========================================================================= */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl transition-all text-white border border-slate-800"
        style={{
          backgroundColor: "#070b13",
          backgroundImage:
            "linear-gradient(135deg, #070b13 0%, #0d1e38 45%, #0d5b61 100%)",
          boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* TOP CURVED WAVE SVG */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-70">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path
              d="M0,0 C180,90 380,-30 550,55 C720,130 950,15 1200,35 L1200,0 L0,0 Z"
              fill="url(#topWaveDept)"
            />
            <defs>
              <linearGradient id="topWaveDept" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d5b61" />
                <stop offset="50%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* BOTTOM CURVED WAVE SVG */}
        <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden pointer-events-none opacity-70">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-full">
            <path
              d="M0,65 C320,125 620,15 920,95 C1070,130 1160,85 1200,65 L1200,120 L0,120 Z"
              fill="url(#bottomWaveDept)"
            />
            <defs>
              <linearGradient id="bottomWaveDept" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0d5b61" />
                <stop offset="100%" stopColor="#042f2e" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Banner Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-300 tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Module 2 • Department Management & Target Studio</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Layers className="w-9 h-9 text-cyan-400 shrink-0" />
              <span>የግቢ ጉባኤ ንዑሳን ክፍላት (Departments Directory)</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              Configure specialized ministry departments, capacity boundaries, allowlisted
              eligibility prerequisites, and strict 100.00% percentage target distributions with
              immutable version snapshot governance.
            </p>
          </div>

          {/* Quick Actions & Campus Switcher */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Campus Selector Pill */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 backdrop-blur-md text-xs shadow-md">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-300">Campus:</span>
              <select
                value={selectedCampusId}
                onChange={(e) => {
                  setSelectedCampusId(e.target.value);
                  setCurrentPage(1);
                }}
                className="font-bold text-cyan-300 bg-transparent focus:outline-none cursor-pointer"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadData()}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* New Department Button */}
            {hasPermission("department.manage") && (
              <button
                onClick={() => {
                  setCreateFormData((prev) => ({
                    ...prev,
                    campusId: selectedCampusId,
                    priority: departments.length + 1,
                  }));
                  setShowCreateModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Department (አዲስ ክፍል)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:text-rose-950 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:text-emerald-950 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 6 GLOWING KPI METRIC CARDS WITH COLORED ACCENTS                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Units */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-600 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Units
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary?.totalDepartments ?? departments.length}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Registered in diocese
            </span>
          </div>
        </div>

        {/* Card 2: Active Units */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Units
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary?.activeDepartments ?? departments.filter((d) => d.status === "ACTIVE").length}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-500 font-medium">
              Operational in cycle
            </span>
          </div>
        </div>

        {/* Card 3: Inactive / Archived */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-slate-400 dark:border-l-slate-600 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inactive / Off
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Power className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
              {(summary?.inactiveDepartments ?? 0) + (summary?.archivedDepartments ?? 0)}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Seasonal / archived
            </span>
          </div>
        </div>

        {/* Card 4: Near Capacity (>80%) */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Near Capacity
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {summary?.nearCapacityCount ?? 0}
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">
              &gt;80% seats filled
            </span>
          </div>
        </div>

        {/* Card 5: Over Capacity / Alert */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-rose-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Over Capacity
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {summary?.overCapacityCount ?? 0}
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-500 font-medium">
              Requires expansion
            </span>
          </div>
        </div>

        {/* Card 6: Target Status */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-cyan-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Target Status
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {summary?.currentTargetSum ?? currentTargetSum}%
              </span>
              {isTargetSumValid ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Exact 100%
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Unbalanced
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">
              {summary?.currentTargetCycleName || "Active Cycle"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABS HEADER: DIRECTORY VS TARGET CONFIGURATION STUDIO                  */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "directory"
              ? "border-cyan-600 text-cyan-600 dark:text-cyan-400 font-black"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Departments Directory ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("targetStudio")}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "targetStudio"
              ? "border-cyan-600 text-cyan-600 dark:text-cyan-400 font-black"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Target Configuration Studio (የድርሻ ምጣኔ ስቱዲዮ)</span>
          {isTargetSumValid ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="100% Validated" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Total must equal 100%" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADVANCED ENTERPRISE DIRECTORY TABLE                                */}
      {/* ========================================================================= */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Controls Bar: Search + Status Filter Pills + Sorting */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search departments by code, name, description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Pills */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                {(["ALL", "ACTIVE", "INACTIVE", "ARCHIVED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === st
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {st === "ALL"
                      ? "All"
                      : st === "ACTIVE"
                      ? "Active"
                      : st === "INACTIVE"
                      ? "Inactive"
                      : "Archived"}
                  </button>
                ))}
              </div>

              {/* Sort By Select */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="priority">Priority Rank</option>
                  <option value="name">Name</option>
                  <option value="code">Code</option>
                  <option value="capacity">Capacity</option>
                  <option value="utilization">Utilization</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Toggle Ascending / Descending"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>

          {/* Floating Batch Action Bar when rows are selected */}
          {selectedIds.length > 0 && (
            <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-cyan-600 text-white font-mono font-bold text-xs shadow-sm">
                  {selectedIds.length} ተመርጠዋል ({selectedIds.length} Selected)
                </span>
                <span className="text-xs text-slate-300 hidden sm:inline">
                  ፈጣን የጅምላ እርምጃዎች (Apply batch department operations)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasPermission("department.manage") && (
                  <button
                    type="button"
                    onClick={() => handleBatchStatus("ACTIVE")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>አንቃ (Activate)</span>
                  </button>
                )}

                {hasPermission("department.manage") && (
                  <button
                    type="button"
                    onClick={() => handleBatchStatus("INACTIVE")}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>አቦዝን (Deactivate)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportSelected}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

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

          {/* Directory Table */}
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
              Loading departments directory...
            </div>
          ) : departments.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No departments found matching your criteria.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  {/* Teal Header matching Ethiopian Orthodox Fellowship Theme */}
                  <thead
                    className="text-white uppercase tracking-wider font-bold text-[11px]"
                    style={{ backgroundColor: "#0d5b61" }}
                  >
                    <tr className="border-b border-[#0a464a]">
                      <th className="px-3.5 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="px-5 py-4">Department / Code (የክፍል ኮድና ስም)</th>
                      <th className="px-5 py-4">Target Share (የድርሻ ምጣኔ)</th>
                      <th className="px-5 py-4">Capacity & Utilization (አቅምና አጠቃቀም)</th>
                      <th className="px-5 py-4">Priority (ቅድሚያ)</th>
                      <th className="px-5 py-4">Status (ሁኔታ)</th>
                      <th className="px-6 py-4 text-center">Actions (እርምጃዎች)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {departments.map((d, idx) => {
                      const isSelected = selectedIds.includes(d.id);
                      const utilization =
                        d.capacity > 0 ? Math.round((d.allocatedMembersCount / d.capacity) * 100) : 0;
                      return (
                        <tr
                          key={d.id}
                          className={`transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/60 ${
                            isSelected
                              ? "bg-cyan-50/60 dark:bg-cyan-950/30"
                              : idx % 2 === 0
                              ? "bg-white dark:bg-slate-900"
                              : "bg-slate-50/30 dark:bg-slate-900/50"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-3.5 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(d.id)}
                              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Code & Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 shrink-0">
                                {d.code}
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                  {d.name}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {d.description || "No description provided."}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Target Share */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                                {d.targetPercentage}%
                              </span>
                              <span className="text-[11px] text-slate-400">Campus Share</span>
                            </div>
                          </td>

                          {/* Capacity & Utilization */}
                          <td className="px-5 py-4 min-w-[200px]">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {d.allocatedMembersCount}
                                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                                    {" "}
                                    / {d.capacity} seats
                                  </span>
                                </span>
                                <span
                                  className={`font-mono font-bold ${
                                    utilization >= 100 || d.overCapacity
                                      ? "text-rose-600 dark:text-rose-400"
                                      : utilization >= 80
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-emerald-600 dark:text-emerald-400"
                                  }`}
                                >
                                  {utilization}%
                                  {d.overCapacity && " (OVER)"}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    utilization >= 100 || d.overCapacity
                                      ? "bg-rose-500"
                                      : utilization >= 80
                                      ? "bg-amber-400"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, utilization)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              #{d.priority}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                d.status === "ACTIVE"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : d.status === "ARCHIVED"
                                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  d.status === "ACTIVE"
                                    ? "bg-emerald-500 animate-pulse"
                                    : d.status === "ARCHIVED"
                                    ? "bg-amber-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {d.status === "ACTIVE"
                                ? "Active (ንቁ)"
                                : d.status === "ARCHIVED"
                                ? "Archived (ማህደር)"
                                : "Inactive (ቦዘኔ)"}
                            </span>
                          </td>

                          {/* Actions: Glowing Jewel Buttons */}
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-700/60 shadow-lg">
                              {/* 1. View Details (Deep Blue Glow) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDeptForView(d);
                                  setDetailTab("overview");
                                }}
                                className="w-7 h-7 rounded-xl flex items-center justify-center text-blue-300 bg-blue-900/40 border border-blue-500/40 hover:bg-blue-800/60 hover:scale-105 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
                                title="View Details (ዝርዝር ይመልከቱ)"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* 2. Target Quota Studio (Cyan Glow) */}
                              <button
                                type="button"
                                onClick={() => setActiveTab("targetStudio")}
                                className="w-7 h-7 rounded-xl flex items-center justify-center text-cyan-300 bg-cyan-900/40 border border-cyan-500/40 hover:bg-cyan-800/60 hover:scale-105 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                                title="Target Quota Studio (የድርሻ ምጣኔ)"
                              >
                                <Percent className="w-3.5 h-3.5" />
                              </button>

                              {/* 3. Adjust Capacity (Emerald Glow) */}
                              {hasPermission("department.manage") && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCapacityModal(d)}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center text-emerald-300 bg-emerald-900/40 border border-emerald-500/40 hover:bg-emerald-800/60 hover:scale-105 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                                  title="Adjust Capacity Limit (አቅም አስተካክል)"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 4. Eligibility Rules (Purple Glow) */}
                              {hasPermission("department.manage") && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEligibilityModal(d)}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center text-purple-300 bg-purple-900/40 border border-purple-500/40 hover:bg-purple-800/60 hover:scale-105 shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
                                  title="Eligibility Prerequisites (መስፈርቶች)"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 5. Edit Details (Amber Glow) */}
                              {hasPermission("department.manage") && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(d)}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center text-amber-300 bg-amber-900/40 border border-amber-500/40 hover:bg-amber-800/60 hover:scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
                                  title="Edit Department (ክፍል አሻሽል)"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 6. Lifecycle Status Transition (Rose/Emerald Glow) */}
                              {hasPermission("department.manage") && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusModal(d)}
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center border hover:scale-105 transition-all cursor-pointer ${
                                    d.status === "ACTIVE"
                                      ? "text-rose-400 bg-rose-950/60 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                      : "text-emerald-400 bg-emerald-950/60 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                  }`}
                                  title="Change Status with Reason (ሁኔታ ቀይር)"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 7. Delete (Crimson Glow) */}
                              {hasPermission("department.manage") && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingDept(d)}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center text-rose-400 bg-rose-950/60 border border-rose-500/50 hover:bg-rose-900/60 hover:scale-105 shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
                                  title="Delete Department (ክፍል ሰርዝ)"
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

              {/* Table Footer / Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Showing page{" "}
                    <strong className="text-slate-800 dark:text-white">{currentPage}</strong> of{" "}
                    <strong className="text-slate-800 dark:text-white">{totalPages}</strong> (
                    {totalCount} total departments)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TARGET CONFIGURATION STUDIO (CAMPUS SHARE BASIS)                   */}
      {/* ========================================================================= */}
      {activeTab === "targetStudio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Main Target Configuration Workspace */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            {/* Studio Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-cyan-500" />
                  <span>Campus Target Share Distribution</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Authoritative target basis: <strong className="text-cyan-600 dark:text-cyan-400">campus_share</strong>.
                  Must sum to exactly 100.00% before member allocation.
                </p>
              </div>

              {/* Exact 100% Badge */}
              <div
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
                  isTargetSumValid
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                }`}
              >
                {isTargetSumValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Sum: {currentTargetSum.toFixed(2)}% (Validated 100%)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>
                      Sum: {currentTargetSum.toFixed(2)}% (Difference:{" "}
                      {(100 - currentTargetSum).toFixed(2)}%)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sub-Tabs: Editor, Largest Remainder Simulator, Version History */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold">
              <button
                onClick={() => setTargetStudioTab("editor")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  targetStudioTab === "editor"
                    ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Target Weights Editor
              </button>
              <button
                onClick={() => setTargetStudioTab("simulation")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  targetStudioTab === "simulation"
                    ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Largest Remainder Preview
              </button>
              <button
                onClick={() => setTargetStudioTab("history")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  targetStudioTab === "history"
                    ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Version Snapshots ({targetHistory.length})
              </button>
            </div>

            {/* Target Weights Editor Tab */}
            {targetStudioTab === "editor" && (
              <div className="space-y-4">
                {/* Cycle Name Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Allocation Cycle Identifier *
                  </label>
                  <input
                    type="text"
                    value={targetStudioCycleName}
                    onChange={(e) => setTargetStudioCycleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                  />
                </div>

                {/* Shortfall Warnings Banner (Business Rule 5) */}
                {shortfallWarnings.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                    <div className="font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Capacity Shortfall Alert for Current Cycle:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                      {shortfallWarnings.map((s) => (
                        <li key={s.departmentId}>
                          <strong>{s.departmentCode}</strong>: Projected target is{" "}
                          <strong>{s.projectedTarget} seats</strong>, but max capacity is only{" "}
                          <strong>{s.capacity} seats</strong> (Shortfall: {s.shortfall} seats).
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Department Target Rows */}
                <div className="space-y-3">
                  {activeDepartmentsList.map((d) => {
                    const currentVal = targetPercentages[d.id] ?? d.targetPercentage;
                    const shortfall = shortfallWarnings.find((s) => s.departmentId === d.id);
                    return (
                      <div
                        key={d.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          shortfall
                            ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                            : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-bold text-cyan-900 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800">
                              {d.code}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {d.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Max Capacity: <strong>{d.capacity}</strong> seats</span>
                            <span>•</span>
                            <span>Currently Assigned: <strong>{d.allocatedMembersCount}</strong></span>
                          </div>
                        </div>

                        {/* Sliders and Numerical Input */}
                        <div className="flex items-center gap-3 shrink-0">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={currentVal}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setTargetPercentages((prev) => ({ ...prev, [d.id]: v }));
                            }}
                            className="w-32 accent-cyan-600 cursor-pointer"
                          />
                          <div className="relative w-20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={currentVal}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value) || 0;
                                setTargetPercentages((prev) => ({ ...prev, [d.id]: v }));
                              }}
                              className="w-full pl-2 pr-6 py-1.5 text-xs font-bold text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Finalize Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {!isTargetSumValid && "⚠️ Total percentage must equal exactly 100.00% to finalize."}
                  </span>
                  {hasPermission("department.target.manage") && (
                    <button
                      onClick={handleFinalizeTargets}
                      disabled={!isTargetSumValid || finalizingTargets}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition disabled:opacity-40 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{finalizingTargets ? "Finalizing..." : "Finalize & Lock Version (ቋሚ አድርግ)"}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Simulation Preview Tab */}
            {targetStudioTab === "simulation" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-300">
                  <span className="font-bold">Hare-Niemeyer Largest Remainder Calculation:</span>
                  <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                    Integer quotas are derived by rounding down fractional shares and assigning remaining seats
                    one-by-one according to the largest decimal remainders.
                  </p>
                </div>

                <div className="space-y-2">
                  {simResults.map((t) => (
                    <div
                      key={t.departmentId}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{t.departmentName}</span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t.percentage}% · Exact share: {t.exactShare.toFixed(2)} · Remainder: {t.remainder.toFixed(4)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-cyan-600 dark:text-cyan-400">
                          {t.targetCount}
                        </span>
                        <span className="text-[10px] text-slate-400 block">allocated seats</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Version Snapshots History Tab */}
            {targetStudioTab === "history" && (
              <div className="space-y-3">
                {targetHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No finalized snapshot history yet.</p>
                ) : (
                  targetHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300">
                            v{h.version}
                          </span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {h.cycleName}
                          </span>
                        </div>
                        {h.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            Current Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Finalized by: {h.finalizedByName || "Admin"}</span>
                        <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Largest Remainder Calculator Sandbox */}
          <div className="bg-slate-50 dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">Population Simulator</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hamilton-Hare Largest Remainder
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Simulated Campus Population
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={simPopulation}
                  onChange={(e) => setSimPopulation(parseInt(e.target.value) || 1000)}
                  className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={runLiveTargetValidation}
                  disabled={!isTargetSumValid || simulating}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow disabled:opacity-50 cursor-pointer"
                >
                  Simulate
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Benchmark tested with 1,000 (Specification) and odd counts like 1,003.
              </p>
            </div>

            {/* Quick Summary of Calculated Quotas */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Calculated Department Quotas:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                  {simResults.reduce((acc, t) => acc + t.targetCount, 0)} / {simPopulation}
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {simResults.map((t) => (
                  <div
                    key={t.departmentId}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{t.departmentName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t.percentage}% · Exact: {t.exactShare.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                        {t.targetCount}
                      </span>
                      <span className="text-[10px] text-slate-400 block">seats</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE DEPARTMENT                                                */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Register New Department</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign to {currentCampus?.name || "Campus"} with globally unique code
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CHOIR-02"
                    value={createFormData.code}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Case-insensitive unique</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="500"
                    value={createFormData.capacity}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, capacity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Youth Liturgical Hymns Ministry"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Spiritual duties, liturgical assignments, choir sessions..."
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Share %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={createFormData.targetPercentage}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        targetPercentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Rank
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={createFormData.priority}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingCreate ? "Saving..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT DEPARTMENT                                                  */}
      {/* ========================================================================= */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Department</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {editingDept.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editFormData.capacity}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Rank
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editFormData.priority}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STATUS TRANSITION WITH MANDATORY REASON                          */}
      {/* ========================================================================= */}
      {statusModalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Transition Lifecycle Status
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {statusModalDept.name} ({statusModalDept.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusModalDept(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusTransitionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ACTIVE", "INACTIVE", "ARCHIVED"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusTransitionTarget(st)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        statusTransitionTarget === st
                          ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Audit Reason * (Min 5 chars)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify official diocesan rationale for this department lifecycle change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusModalDept(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitioningStatus}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {transitioningStatus ? "Updating..." : "Commit Status Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CAPACITY ADJUSTMENT WITH SHORTFALL CONFIRMATION                   */}
      {/* ========================================================================= */}
      {capacityModalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Adjust Capacity Limit
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {capacityModalDept.name} ({capacityModalDept.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCapacityModalDept(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCapacitySubmit} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Capacity</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {capacityModalDept.capacity} seats
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Members</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 text-base">
                    {capacityModalDept.allocatedMembersCount} members
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Department Capacity Limit *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCapacityValue}
                  onChange={(e) => setNewCapacityValue(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Change Reason (Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hall renovation / ministry seating expansion"
                  value={capacityReason}
                  onChange={(e) => setCapacityReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Warning if reducing below current allocation */}
              {newCapacityValue < capacityModalDept.allocatedMembersCount && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Capacity Shortfall Warning (Business Rule 4)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    New capacity ({newCapacityValue}) is less than current member assignments (
                    {capacityModalDept.allocatedMembersCount}). A shortfall of{" "}
                    <strong>{capacityModalDept.allocatedMembersCount - newCapacityValue} seats</strong> will
                    occur. Existing member assignments are strictly preserved.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer font-bold pt-1">
                    <input
                      type="checkbox"
                      checked={capacityConfirmed}
                      onChange={(e) => setCapacityConfirmed(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span>I explicitly confirm and authorize this capacity reduction</span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCapacityModalDept(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    adjustingCapacity ||
                    (newCapacityValue < capacityModalDept.allocatedMembersCount && !capacityConfirmed)
                  }
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {adjustingCapacity ? "Updating..." : "Save Capacity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ELIGIBILITY RULES BUILDER (MODULES 2 & 5)                        */}
      {/* ========================================================================= */}
      {eligibilityDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Eligibility Prerequisites Builder
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {eligibilityDept.name} ({eligibilityDept.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEligibilityDept(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300">
                <span className="font-bold">Allowlisted Rule Evaluator Schema (Business Rule 7):</span>
                <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                  Rules defined here are evaluated by Module 5 during allocation scoring without executing arbitrary
                  code.
                </p>
              </div>

              <div className="space-y-3">
                {currentRules.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        Rule #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentRules(currentRules.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Rule Name
                        </label>
                        <input
                          type="text"
                          value={r.ruleName}
                          onChange={(e) => {
                            const updated = [...currentRules];
                            updated[idx].ruleName = e.target.value;
                            setCurrentRules(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Type
                        </label>
                        <select
                          value={r.ruleType}
                          onChange={(e) => {
                            const updated = [...currentRules];
                            updated[idx].ruleType = e.target.value;
                            setCurrentRules(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="SUNDAY_SCHOOL_YEARS">Sunday School Duration</option>
                          <option value="BAPTISM_STATUS">Baptism Status</option>
                          <option value="SPIRITUAL_STATUS">Spiritual Status (Deacon/Servant)</option>
                          <option value="MIN_AGE">Minimum Age</option>
                          <option value="MAX_AGE">Maximum Age</option>
                          <option value="GENDER">Gender Requirement</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Operator & Value
                        </label>
                        <div className="flex gap-1.5">
                          <select
                            value={r.operator}
                            onChange={(e) => {
                              const updated = [...currentRules];
                              updated[idx].operator = e.target.value;
                              setCurrentRules(updated);
                            }}
                            className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none text-xs"
                          >
                            <option value="EQUALS">=</option>
                            <option value="GREATER_THAN_OR_EQUAL">&gt;=</option>
                            <option value="LESS_THAN_OR_EQUAL">&lt;=</option>
                            <option value="IN">IN</option>
                          </select>
                          <input
                            type="text"
                            value={typeof r.value === "object" ? JSON.stringify(r.value) : r.value}
                            onChange={(e) => {
                              const updated = [...currentRules];
                              updated[idx].value = e.target.value;
                              setCurrentRules(updated);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.isMandatory}
                          onChange={(e) => {
                            const updated = [...currentRules];
                            updated[idx].isMandatory = e.target.checked;
                            setCurrentRules(updated);
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Mandatory Prerequisite (Disqualifies if unmet)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentRules([
                    ...currentRules,
                    {
                      ruleName: "New Eligibility Rule",
                      ruleType: "SUNDAY_SCHOOL_YEARS",
                      operator: "GREATER_THAN_OR_EQUAL",
                      value: 2,
                      isMandatory: true,
                      isActive: true,
                    },
                  ])
                }
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-purple-500 hover:text-purple-600 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Rule Row</span>
              </button>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEligibilityDept(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingRules}
                onClick={handleSaveRules}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition disabled:opacity-50 cursor-pointer"
              >
                {savingRules ? "Saving..." : "Save Eligibility Rules"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DEPARTMENT DETAILS DRAWER / MODAL WITH TABBED VIEWS              */}
      {/* ========================================================================= */}
      {selectedDeptForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Gradient */}
            <div
              className="h-2 w-full"
              style={{
                background: "linear-gradient(90deg, #0d5b61 0%, #0284c7 50%, #f59e0b 100%)",
              }}
            />
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-800 dark:text-cyan-300 font-mono font-bold text-sm">
                  {selectedDeptForView.code}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedDeptForView.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Comprehensive Ministry Profile & Audit Telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeptForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-4 text-xs font-bold pt-2 shrink-0">
              <button
                onClick={() => setDetailTab("overview")}
                className={`pb-2.5 border-b-2 transition cursor-pointer ${
                  detailTab === "overview"
                    ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDetailTab("history")}
                className={`pb-2.5 border-b-2 transition cursor-pointer ${
                  detailTab === "history"
                    ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Status Audit ({selectedDeptForView.statusHistory?.length || 0})
              </button>
              <button
                onClick={() => setDetailTab("capacityHistory")}
                className={`pb-2.5 border-b-2 transition cursor-pointer ${
                  detailTab === "capacityHistory"
                    ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Capacity History ({selectedDeptForView.capacityHistory?.length || 0})
              </button>
              <button
                onClick={() => setDetailTab("rules")}
                className={`pb-2.5 border-b-2 transition cursor-pointer ${
                  detailTab === "rules"
                    ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Eligibility Rules ({selectedDeptForView.eligibilityRules?.length || 0})
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {detailTab === "overview" && (
                <div className="space-y-4 text-xs">
                  {selectedDeptForView.description && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Description & Ministry Duties
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                        {selectedDeptForView.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Target Percentage
                      </span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-base mt-0.5 block">
                        {selectedDeptForView.targetPercentage}%
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Capacity Limit
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-base mt-0.5 block">
                        {selectedDeptForView.capacity} Seats
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Allocated Members
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base mt-0.5 block">
                        {selectedDeptForView.allocatedMembersCount} Assigned
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Priority Rank
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-base mt-0.5 block">
                        #{selectedDeptForView.priority}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Current Status
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white mt-0.5 inline-flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            selectedDeptForView.status === "ACTIVE"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-slate-400"
                          }`}
                        />
                        {selectedDeptForView.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Registered Date
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400 text-xs mt-0.5 block">
                        {new Date(selectedDeptForView.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "history" && (
                <div className="space-y-3">
                  {!selectedDeptForView.statusHistory || selectedDeptForView.statusHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No status transitions recorded.</p>
                  ) : (
                    selectedDeptForView.statusHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            {h.oldStatus} → <strong className="text-cyan-500">{h.newStatus}</strong>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(h.changedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] italic">
                          &ldquo;{h.reason}&rdquo;
                        </p>
                        <div className="text-[10px] text-slate-400">By: {h.changedByName}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === "capacityHistory" && (
                <div className="space-y-3">
                  {!selectedDeptForView.capacityHistory || selectedDeptForView.capacityHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No capacity modifications recorded.</p>
                  ) : (
                    selectedDeptForView.capacityHistory.map((ch) => (
                      <div
                        key={ch.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            {ch.previousCapacity} seats →{" "}
                            <strong className="text-emerald-500">{ch.newCapacity} seats</strong>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ch.changedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                          Reason: {ch.changeReason}
                        </p>
                        <div className="text-[10px] text-slate-400">
                          By: {ch.changedByName} {ch.confirmationGiven && "• Explicitly Confirmed"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === "rules" && (
                <div className="space-y-3">
                  {!selectedDeptForView.eligibilityRules || selectedDeptForView.eligibilityRules.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No eligibility rules configured.</p>
                  ) : (
                    selectedDeptForView.eligibilityRules.map((er) => (
                      <div
                        key={er.id}
                        className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{er.ruleName}</div>
                          <div className="text-[10px] text-slate-500">
                            Type: {er.ruleType} • Op: {er.operator} • Value: {JSON.stringify(er.value)}
                          </div>
                        </div>
                        {er.isMandatory && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Mandatory
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDeptForView(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: DELETE SAFETY CONFIRMATION                                       */}
      {/* ========================================================================= */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="h-2 w-full bg-rose-600" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Department</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Confirm permanent removal</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
                <p className="font-bold">
                  Are you sure you want to delete &ldquo;{deletingDept.name}&rdquo; ({deletingDept.code})?
                </p>
                {deletingDept.allocatedMembersCount > 0 ? (
                  <p className="text-rose-700 dark:text-rose-300 font-semibold">
                    ⚠️ Error Safeguard: This department has{" "}
                    <strong>{deletingDept.allocatedMembersCount} assigned members</strong>. Members must be
                    reallocated before department deletion can proceed.
                  </p>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">
                    This will permanently remove the department unit and archive its target configurations.
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingDept(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || deletingDept.allocatedMembersCount > 0}
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition disabled:opacity-40 cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Delete Department"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
