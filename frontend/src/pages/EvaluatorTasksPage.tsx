import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchTasks,
  fetchTaskDetails,
  createEvaluationTask,
  submitEvaluation,
  requestEvaluationCorrection,
  approveEvaluationAssessment,
} from "../api/evaluation.api";
import { fetchCampuses } from "../api/campus.api";
import { fetchDepartments } from "../api/department.api";
import { fetchUsers } from "../api/user.api";
import { fetchMembers } from "../api/member.api";
import {
  EvaluationTask,
  TaskCandidateDetail,
  TaskDetailsResponse,
  CreateTaskPayload,
} from "../types/evaluation";
import { Campus } from "../types/campus";
import { Department } from "../types/department";
import { UserItem } from "../types/user";
import { Member } from "../types/member";
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  X,
  UserCheck,
  Award,
  MessageSquare,
  Building2,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export const EvaluatorTasksPage: React.FC = () => {
  const { token, user, hasPermission } = useAuth();

  const [tasks, setTasks] = useState<EvaluationTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<EvaluationTask | null>(null);
  const [taskDetails, setTaskDetails] = useState<TaskDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Evaluation Assessment Form Modal
  const [activeCandidate, setActiveCandidate] = useState<TaskCandidateDetail | null>(null);
  const [score, setScore] = useState<number>(85);
  const [spiritualReadiness, setSpiritualReadiness] = useState<number>(85);
  const [liturgicalKnowledge, setLiturgicalKnowledge] = useState<number>(85);
  const [serviceCommitment, setServiceCommitment] = useState<number>(85);
  const [comments, setComments] = useState<string>("");
  const [submittingEval, setSubmittingEval] = useState<boolean>(false);

  // Admin Request Correction Modal
  const [correctionTargetEvalId, setCorrectionTargetEvalId] = useState<string | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState<string>("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Admin Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [evaluators, setEvaluators] = useState<UserItem[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [taskForm, setTaskForm] = useState<CreateTaskPayload>({
    campusId: "",
    departmentId: "",
    assignedTo: "",
    title: "",
    description: "",
    candidateMemberIds: [],
    dueDate: "",
  });
  const [creatingTask, setCreatingTask] = useState(false);

  const loadTasks = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks(token);
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        handleSelectTask(data[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const handleSelectTask = async (task: EvaluationTask) => {
    setSelectedTask(task);
    if (!token) return;
    setLoadingDetails(true);
    try {
      const details = await fetchTaskDetails(task.id, token);
      setTaskDetails(details);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch task details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Evaluation Assessment Form
  const handleOpenAssessment = (candidate: TaskCandidateDetail) => {
    setActiveCandidate(candidate);
    const existing = candidate.evaluation;
    if (existing) {
      setScore(existing.score);
      setComments(existing.comments || "");
      if (existing.criteriaScores) {
        setSpiritualReadiness(existing.criteriaScores.spiritualReadiness || 85);
        setLiturgicalKnowledge(existing.criteriaScores.liturgicalKnowledge || 85);
        setServiceCommitment(existing.criteriaScores.serviceCommitment || 85);
      }
    } else {
      setScore(80);
      setSpiritualReadiness(80);
      setLiturgicalKnowledge(80);
      setServiceCommitment(80);
      setComments("");
    }
  };

  const handleSaveEvaluation = async (isDraft: boolean) => {
    if (!token || !selectedTask || !activeCandidate) return;
    if (!comments.trim()) {
      alert("Please provide evaluation feedback/comments.");
      return;
    }
    setSubmittingEval(true);
    try {
      await submitEvaluation(
        {
          taskId: selectedTask.id,
          memberId: activeCandidate.member.id,
          score,
          comments: comments.trim(),
          criteriaScores: {
            spiritualReadiness,
            liturgicalKnowledge,
            serviceCommitment,
          },
          isDraft,
        },
        token
      );
      setSuccessMsg(isDraft ? "Draft saved successfully" : "Assessment submitted for review");
      setActiveCandidate(null);
      await handleSelectTask(selectedTask);
      await loadTasks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save evaluation");
    } finally {
      setSubmittingEval(false);
    }
  };

  // Admin: Request Correction
  const handleSendCorrectionRequest = async () => {
    if (!token || !correctionTargetEvalId || !correctionNotes.trim()) return;
    setSubmittingCorrection(true);
    try {
      await requestEvaluationCorrection(correctionTargetEvalId, correctionNotes.trim(), token);
      setSuccessMsg("Correction requested from evaluator");
      setCorrectionTargetEvalId(null);
      setCorrectionNotes("");
      if (selectedTask) await handleSelectTask(selectedTask);
      await loadTasks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to request correction");
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Admin: Approve Evaluation
  const handleApproveEvaluation = async (evalId: string) => {
    if (!token) return;
    try {
      await approveEvaluationAssessment(evalId, "Approved by Administrator", token);
      setSuccessMsg("Evaluation assessment approved");
      if (selectedTask) await handleSelectTask(selectedTask);
      await loadTasks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve assessment");
    }
  };

  // Load Admin Modal dependencies
  const handleOpenCreateTask = async () => {
    if (!token) return;
    setShowCreateModal(true);
    try {
      const [campusList, userList] = await Promise.all([
        fetchCampuses(token),
        fetchUsers(token),
      ]);
      setCampuses(campusList);
      setEvaluators(userList.filter((u) => u.role === "EVALUATOR" || u.role === "ADMIN"));

      const defaultCampusId = campusList[0]?.id || "";
      const deptList = await fetchDepartments(token, defaultCampusId);
      setDepartments(deptList);

      const memberRes = await fetchMembers(token, { campusId: defaultCampusId, limit: 100 });
      setAvailableMembers(memberRes.members);

      setTaskForm({
        campusId: defaultCampusId,
        departmentId: deptList[0]?.id || "",
        assignedTo: userList.find((u) => u.role === "EVALUATOR")?.id || userList[0]?.id || "",
        title: "",
        description: "",
        candidateMemberIds: [],
        dueDate: "",
      });
      setSelectedCandidateIds([]);
    } catch (err: unknown) {
      alert("Failed to initialize task creation modal");
    }
  };

  const handleCampusChangeInModal = async (campusId: string) => {
    if (!token) return;
    try {
      const [deptList, memberRes] = await Promise.all([
        fetchDepartments(token, campusId),
        fetchMembers(token, { campusId, limit: 100 }),
      ]);
      setDepartments(deptList);
      setAvailableMembers(memberRes.members);
      setTaskForm((prev) => ({
        ...prev,
        campusId,
        departmentId: deptList[0]?.id || "",
      }));
      setSelectedCandidateIds([]);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (selectedCandidateIds.length === 0) {
      alert("Please select at least one candidate member for evaluation");
      return;
    }
    setCreatingTask(true);
    try {
      await createEvaluationTask(
        {
          ...taskForm,
          candidateMemberIds: selectedCandidateIds,
        },
        token
      );
      setSuccessMsg("Evaluation task created successfully");
      setShowCreateModal(false);
      await loadTasks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner with Luminous Blue Orb Texture */}
      <div
        className="rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden bg-cover bg-center flex flex-col md:flex-row md:items-center justify-between gap-5"
        style={{
          backgroundColor: "#020617",
          backgroundImage:
            "linear-gradient(135deg, rgba(2, 6, 23, 0.92) 0%, rgba(15, 23, 42, 0.88) 50%, rgba(30, 58, 138, 0.82) 100%), url('/assets/c-cimas-blue-orb.jpg')",
          border: "1px solid rgba(59, 130, 246, 0.35)",
          boxShadow: "0 20px 25px -5px rgba(2, 6, 23, 0.5)",
        }}
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {hasPermission("evaluation.assign")
                ? "Administrative Task Assignment & Governance"
                : "Candidate Assessment & Scoring Workspace"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Evaluation & Candidate Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {hasPermission("evaluation.assign")
              ? "Assign evaluation tasks to Evaluators, track assessment scoring, and review final submissions."
              : "Review assigned candidates, record evaluation scores, draft commentary, and submit assessments to Admin."}
          </p>
        </div>

        {hasPermission("evaluation.assign") && (
          <button
            onClick={handleOpenCreateTask}
            className="relative z-10 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition hover:scale-105 shrink-0"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create New Task</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Main Grid: Tasks List (Left) & Task Candidates Assessment Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            <span>{hasPermission("evaluation.assign") ? "All Evaluation Tasks" : "My Assigned Tasks"}</span>
            <span className="text-slate-400 font-mono">({tasks.length})</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="w-5 h-5 border-2 border-navy-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No evaluation tasks found.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                const progressPct =
                  task.totalCandidates > 0
                    ? Math.round((task.completedEvaluationsCount / task.totalCandidates) * 100)
                    : 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-navy-900 text-white border-navy-800 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isSelected ? "bg-navy-800 text-blue-200" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.departmentCode}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : task.status === "NEEDS_CORRECTION"
                            ? "bg-amber-100 text-amber-800"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold mt-2 line-clamp-1 ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </h3>

                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        isSelected ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {task.description || "No description provided."}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100/20 text-[11px] flex items-center justify-between">
                      <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                        Evaluator: <strong className={isSelected ? "text-white" : "text-slate-700"}>{task.evaluatorName}</strong>
                      </span>
                      <span className="font-mono font-semibold">
                        {task.completedEvaluationsCount}/{task.totalCandidates}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200/40 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Task Candidates Details & Evaluation Actions */}
        <div className="lg:col-span-8">
          {selectedTask && taskDetails ? (
            <div className="space-y-4">
              {/* Task Header Box */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-50 text-navy-800 border border-navy-200">
                        {selectedTask.departmentCode}
                      </span>
                      <span className="text-xs text-slate-500">
                        {selectedTask.campusName}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedTask.title}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Due Date</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toLocaleDateString()
                        : "No deadline"}
                    </span>
                  </div>
                </div>

                {selectedTask.description && (
                  <p className="text-xs text-slate-600 mt-3">{selectedTask.description}</p>
                )}
              </div>

              {/* Candidate Roster Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Candidate Members Assigned for Assessment ({taskDetails.candidates.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-200">
                  {taskDetails.candidates.map(({ member, evaluation }) => {
                    const isEvaluated = evaluation && (evaluation.status === "SUBMITTED" || evaluation.status === "APPROVED");
                    const isDraft = evaluation?.status === "DRAFT";
                    const isCorrection = evaluation?.status === "CORRECTION_REQUESTED";

                    return (
                      <div key={member.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-navy-800">
                                {member.memberId}
                              </span>
                              <span className="text-sm font-semibold text-slate-900">
                                {member.fullName}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {member.category}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                {member.spiritualStatus}
                              </span>
                            </div>

                            {evaluation && (
                              <div className="mt-2 text-xs flex flex-wrap items-center gap-3 text-slate-600">
                                <span className="font-bold text-navy-900 flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5 text-amber-500" />
                                  Score: {evaluation.score}/100
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="italic line-clamp-1">"{evaluation.comments}"</span>
                              </div>
                            )}

                            {isCorrection && evaluation?.adminFeedback && (
                              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                                <div>
                                  <span className="font-bold">Correction Requested by Admin:</span>{" "}
                                  {evaluation.adminFeedback}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Status badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                evaluation?.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : evaluation?.status === "SUBMITTED"
                                  ? "bg-blue-100 text-blue-800"
                                  : evaluation?.status === "CORRECTION_REQUESTED"
                                  ? "bg-amber-100 text-amber-800"
                                  : evaluation?.status === "DRAFT"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {evaluation?.status ? evaluation.status.replace("_", " ") : "NOT EVALUATED"}
                            </span>

                            {/* Evaluator Action: Evaluate / Edit */}
                            {hasPermission("evaluation.score") && (
                              <button
                                onClick={() => handleOpenAssessment({ member, evaluation })}
                                disabled={evaluation?.status === "APPROVED"}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-800 text-white hover:bg-navy-900 shadow-sm disabled:opacity-50"
                              >
                                {isEvaluated ? "Update Score" : isDraft ? "Resume Draft" : "Evaluate"}
                              </button>
                            )}

                            {/* Admin Action: Approve / Request Correction */}
                            {hasPermission("evaluation.review") && evaluation && evaluation.status === "SUBMITTED" && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApproveEvaluation(evaluation.id)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setCorrectionTargetEvalId(evaluation.id);
                                    setCorrectionNotes("");
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                                >
                                  Correction
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              Select an evaluation task from the left panel to review candidates.
            </div>
          )}
        </div>
      </div>

      {/* Evaluator Assessment Modal Form */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assess Candidate: {activeCandidate.member.fullName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {activeCandidate.member.memberId} · {activeCandidate.member.category} · {activeCandidate.member.spiritualStatus}
                </p>
              </div>
              <button
                onClick={() => setActiveCandidate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeCandidate.evaluation?.status === "CORRECTION_REQUESTED" && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Admin Correction Request:</p>
                  <p>{activeCandidate.evaluation.adminFeedback}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Overall Score Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Overall Assessment Score</span>
                  <span className="text-base text-navy-800">{score}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full accent-navy-700"
                />
              </div>

              {/* Sub-criteria sliders */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Spiritual Readiness
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={spiritualReadiness}
                    onChange={(e) => setSpiritualReadiness(Number(e.target.value))}
                    className="w-full text-xs rounded border-slate-300 py-1 px-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Liturgical Knowledge
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={liturgicalKnowledge}
                    onChange={(e) => setLiturgicalKnowledge(Number(e.target.value))}
                    className="w-full text-xs rounded border-slate-300 py-1 px-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Commitment & Dedication
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={serviceCommitment}
                    onChange={(e) => setServiceCommitment(Number(e.target.value))}
                    className="w-full text-xs rounded border-slate-300 py-1 px-2"
                  />
                </div>
              </div>

              {/* Evaluation Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluator Observations & Comments *
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide qualitative feedback regarding member dedication, liturgical chant readiness, or schedule availability..."
                  className="w-full text-xs rounded-lg border-slate-300 p-2.5 focus:ring-navy-500 focus:border-navy-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                onClick={() => setActiveCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEvaluation(true)}
                  disabled={submittingEval}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEvaluation(false)}
                  disabled={submittingEval}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-800 text-white hover:bg-navy-900 shadow-sm"
                >
                  {submittingEval ? "Submitting..." : "Submit Assessment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Correction Notes Modal */}
      {correctionTargetEvalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Request Evaluation Correction
            </h3>
            <p className="text-xs text-slate-500">
              Provide specific instructions for the evaluator to review or re-score this candidate.
            </p>

            <textarea
              rows={4}
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="e.g., Please double check availability for Sunday morning rehearsals..."
              className="w-full text-xs rounded-lg border-slate-300 p-2.5 focus:ring-navy-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCorrectionTargetEvalId(null)}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCorrectionRequest}
                disabled={submittingCorrection || !correctionNotes.trim()}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-sm disabled:opacity-50"
              >
                {submittingCorrection ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create Evaluation Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-navy-800" />
                Assign New Evaluation Task
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus</label>
                  <select
                    value={taskForm.campusId}
                    onChange={(e) => handleCampusChangeInModal(e.target.value)}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3 bg-slate-50"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
                  <select
                    value={taskForm.departmentId}
                    onChange={(e) => setTaskForm({ ...taskForm, departmentId: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3 bg-slate-50"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To Evaluator</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3 bg-slate-50"
                  >
                    {evaluators.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate ? taskForm.dueDate.slice(0, 10) : ""}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      })
                    }
                    className="w-full text-xs rounded-lg border-slate-300 py-2 px-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2026 Choir Vocal Auditions"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full text-xs rounded-lg border-slate-300 py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Describe evaluation requirements..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full text-xs rounded-lg border-slate-300 py-2 px-3"
                />
              </div>

              {/* Candidate Member Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Select Candidate Members ({selectedCandidateIds.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCandidateIds.length === availableMembers.length) {
                        setSelectedCandidateIds([]);
                      } else {
                        setSelectedCandidateIds(availableMembers.map((m) => m.id));
                      }
                    }}
                    className="text-[11px] text-navy-700 font-semibold hover:underline"
                  >
                    {selectedCandidateIds.length === availableMembers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y text-xs">
                  {availableMembers.map((m) => {
                    const checked = selectedCandidateIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2.5 p-2.5 hover:bg-slate-50 cursor-pointer ${
                          checked ? "bg-navy-50/50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCandidateIds([...selectedCandidateIds, m.id]);
                            } else {
                              setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded border-slate-300 text-navy-800 focus:ring-navy-500"
                        />
                        <span className="font-mono font-bold text-navy-800">{m.memberId}</span>
                        <span className="font-medium text-slate-800">{m.fullName}</span>
                        <span className="text-slate-400">({m.category} · {m.spiritualStatus})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask || selectedCandidateIds.length === 0}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-800 text-white hover:bg-navy-900 shadow-sm disabled:opacity-50"
                >
                  {creatingTask ? "Creating..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
