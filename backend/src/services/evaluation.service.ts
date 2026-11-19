import {
  CreateEvaluationTaskInput,
  SubmitEvaluationInput,
  CorrectionRequestInput,
  ApproveEvaluationInput,
  TaskStatus,
  EvaluationStatus,
} from "../schemas/evaluation.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";
import { CampusService } from "./campus.service";
import { DepartmentService } from "./department.service";
import { MemberService } from "./member.service";
import { UserService } from "./user.service";

export interface EvaluationTaskRecord {
  id: string;
  campusId: string;
  campusName: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  title: string;
  description: string;
  assignedTo: string; // Evaluator user ID
  evaluatorName: string;
  assignedBy: string; // Admin user ID
  candidateMemberIds: string[];
  dueDate?: string;
  status: TaskStatus;
  totalCandidates: number;
  completedEvaluationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationRecord {
  id: string;
  taskId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  comments: string;
  criteriaScores?: Record<string, number>;
  status: EvaluationStatus;
  adminFeedback?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial in-memory evaluation tasks & submissions
const INITIAL_TASKS: EvaluationTaskRecord[] = [
  {
    id: "t0000000-0000-0000-0000-000000000001",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    departmentId: "d0000000-0000-0000-0000-000000000001",
    departmentCode: "CHOIR-01",
    departmentName: "Choir & Sacred Music Department",
    title: "Choir Vocal Audition & Liturgical Assessment",
    description: "Assess liturgical vocal readiness, hymn proficiency, and availability for weekend rehearsals.",
    assignedTo: "f0000000-0000-0000-0000-000000000002", // Dr. Aster Melaku
    evaluatorName: "Dr. Aster Melaku (Evaluator)",
    assignedBy: "f0000000-0000-0000-0000-000000000001",
    candidateMemberIds: [
      "10000000-0000-0000-0000-000000000001",
      "10000000-0000-0000-0000-000000000002",
      "10000000-0000-0000-0000-000000000005",
    ],
    dueDate: "2026-12-31T23:59:59.000Z",
    status: "IN_PROGRESS",
    totalCandidates: 3,
    completedEvaluationsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_EVALUATIONS: EvaluationRecord[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    taskId: "t0000000-0000-0000-0000-000000000001",
    memberId: "10000000-0000-0000-0000-000000000001",
    memberCode: "MEM-2026-001",
    memberName: "Ephraim Haile",
    evaluatorId: "f0000000-0000-0000-0000-000000000002",
    evaluatorName: "Dr. Aster Melaku (Evaluator)",
    score: 88,
    comments: "Excellent liturgical chant understanding and dedicated servant heart. Highly recommended for Senior Choir section.",
    criteriaScores: {
      liturgicalKnowledge: 90,
      vocalRange: 85,
      commitment: 90,
    },
    status: "APPROVED",
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let evaluationTasksStore: EvaluationTaskRecord[] = [...INITIAL_TASKS];
export let evaluationsStore: EvaluationRecord[] = [...INITIAL_EVALUATIONS];

export class EvaluationService {
  /**
   * Create an evaluation task (Admin Only)
   */
  static async createTask(
    input: CreateEvaluationTaskInput,
    currentUser: AuthSessionPayload
  ): Promise<EvaluationTaskRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can create and assign evaluation tasks");
    }

    const campus = await CampusService.getById(input.campusId, currentUser);
    if (!campus) throw new Error("Campus not found");

    const dept = await DepartmentService.getById(input.departmentId);
    if (!dept) throw new Error("Department not found");

    const users = await UserService.getAll(currentUser);
    const evaluator = users.find((u) => u.id === input.assignedTo);
    if (!evaluator) throw new Error("Assigned evaluator user not found");
    if (evaluator.role !== "EVALUATOR" && evaluator.role !== "ADMIN") {
      throw new Error("Target user is not registered as an Evaluator");
    }

    const taskId = `t0000000-0000-0000-0000-${(evaluationTasksStore.length + 1)
      .toString()
      .padStart(12, "0")}`;

    const newTask: EvaluationTaskRecord = {
      id: taskId,
      campusId: input.campusId,
      campusName: campus.name,
      departmentId: input.departmentId,
      departmentCode: dept.code,
      departmentName: dept.name,
      title: input.title,
      description: input.description || "",
      assignedTo: input.assignedTo,
      evaluatorName: evaluator.fullName,
      assignedBy: currentUser.userId,
      candidateMemberIds: input.candidateMemberIds,
      dueDate: input.dueDate,
      status: "PENDING",
      totalCandidates: input.candidateMemberIds.length,
      completedEvaluationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    evaluationTasksStore.unshift(newTask);
    return newTask;
  }

  /**
   * Get all tasks filtered by access role
   */
  static async getTasks(
    filter: { campusId?: string; status?: TaskStatus },
    currentUser: AuthSessionPayload
  ): Promise<EvaluationTaskRecord[]> {
    let tasks = [...evaluationTasksStore];

    // Evaluator can strictly only view tasks assigned to them
    if (currentUser.role === "EVALUATOR") {
      tasks = tasks.filter((t) => t.assignedTo === currentUser.userId);
    }

    if (filter.campusId) {
      tasks = tasks.filter((t) => t.campusId === filter.campusId);
    }

    if (filter.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }

    return tasks;
  }

  /**
   * Get task details with candidate member roster and existing evaluations
   */
  static async getTaskDetails(taskId: string, currentUser: AuthSessionPayload) {
    const task = evaluationTasksStore.find((t) => t.id === taskId);
    if (!task) throw new Error("Evaluation task not found");

    // Evaluators cannot access tasks assigned to others
    if (currentUser.role === "EVALUATOR" && task.assignedTo !== currentUser.userId) {
      throw new Error("Forbidden: You do not have permission to access this evaluation task");
    }

    // Retrieve candidate members details
    const { members } = await MemberService.getAll({ limit: 50000 }, currentUser);
    const candidateMembers = members.filter((m) => task.candidateMemberIds.includes(m.id));

    // Get current evaluations for this task
    const taskEvaluations = evaluationsStore.filter((e) => e.taskId === taskId);

    return {
      task,
      candidates: candidateMembers.map((m) => {
        const evalItem = taskEvaluations.find((e) => e.memberId === m.id);
        return {
          member: m,
          evaluation: evalItem || null,
        };
      }),
    };
  }

  /**
   * Save evaluation draft or submit completed assessment
   */
  static async saveEvaluation(
    input: SubmitEvaluationInput,
    currentUser: AuthSessionPayload
  ): Promise<EvaluationRecord> {
    const task = evaluationTasksStore.find((t) => t.id === input.taskId);
    if (!task) throw new Error("Evaluation task not found");

    if (currentUser.role === "EVALUATOR" && task.assignedTo !== currentUser.userId) {
      throw new Error("Forbidden: You are not assigned to evaluate members on this task");
    }

    if (!task.candidateMemberIds.includes(input.memberId)) {
      throw new Error("Candidate member is not part of this evaluation task");
    }

    const { members } = await MemberService.getAll({ limit: 50000 }, currentUser);
    const candidate = members.find((m) => m.id === input.memberId);
    if (!candidate) throw new Error("Candidate member not found");

    let evalRecord = evaluationsStore.find(
      (e) => e.taskId === input.taskId && e.memberId === input.memberId
    );

    const isDraft = !!input.isDraft;
    const newStatus: EvaluationStatus = isDraft ? "DRAFT" : "SUBMITTED";

    if (evalRecord) {
      if (evalRecord.status === "APPROVED" && currentUser.role === "EVALUATOR") {
        throw new Error("Cannot modify an already approved evaluation");
      }

      evalRecord.score = input.score;
      evalRecord.comments = input.comments;
      evalRecord.criteriaScores = input.criteriaScores;
      evalRecord.status = newStatus;
      evalRecord.updatedAt = new Date().toISOString();
      if (!isDraft) {
        evalRecord.submittedAt = new Date().toISOString();
      }
    } else {
      evalRecord = {
        id: `e0000000-0000-0000-0000-${(evaluationsStore.length + 1)
          .toString()
          .padStart(12, "0")}`,
        taskId: input.taskId,
        memberId: input.memberId,
        memberCode: candidate.memberId,
        memberName: candidate.fullName,
        evaluatorId: currentUser.userId,
        evaluatorName: currentUser.email,
        score: input.score,
        comments: input.comments,
        criteriaScores: input.criteriaScores,
        status: newStatus,
        submittedAt: isDraft ? undefined : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      evaluationsStore.push(evalRecord);
    }

    // Refresh task progress
    const completedCount = evaluationsStore.filter(
      (e) => e.taskId === input.taskId && (e.status === "SUBMITTED" || e.status === "APPROVED")
    ).length;

    task.completedEvaluationsCount = completedCount;
    if (completedCount === task.totalCandidates) {
      task.status = "COMPLETED";
    } else if (completedCount > 0) {
      task.status = "IN_PROGRESS";
    }
    task.updatedAt = new Date().toISOString();

    return evalRecord;
  }

  /**
   * Request correction from Evaluator (Admin Only)
   */
  static async requestCorrection(
    evaluationId: string,
    input: CorrectionRequestInput,
    currentUser: AuthSessionPayload
  ): Promise<EvaluationRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can request evaluation corrections");
    }

    const evalRecord = evaluationsStore.find((e) => e.id === evaluationId);
    if (!evalRecord) throw new Error("Evaluation record not found");

    evalRecord.status = "CORRECTION_REQUESTED";
    evalRecord.adminFeedback = input.notes;
    evalRecord.updatedAt = new Date().toISOString();

    const task = evaluationTasksStore.find((t) => t.id === evalRecord.taskId);
    if (task) {
      task.status = "NEEDS_CORRECTION";
      task.updatedAt = new Date().toISOString();
    }

    return evalRecord;
  }

  /**
   * Approve evaluation (Admin Only)
   */
  static async approveEvaluation(
    evaluationId: string,
    input: ApproveEvaluationInput,
    currentUser: AuthSessionPayload
  ): Promise<EvaluationRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can approve evaluations");
    }

    const evalRecord = evaluationsStore.find((e) => e.id === evaluationId);
    if (!evalRecord) throw new Error("Evaluation record not found");

    evalRecord.status = "APPROVED";
    if (input.notes) {
      evalRecord.adminFeedback = input.notes;
    }
    evalRecord.updatedAt = new Date().toISOString();

    return evalRecord;
  }

  /**
   * Evaluator submission history
   */
  static async getEvaluatorHistory(currentUser: AuthSessionPayload): Promise<EvaluationRecord[]> {
    if (currentUser.role === "EVALUATOR") {
      return evaluationsStore.filter((e) => e.evaluatorId === currentUser.userId);
    }
    return evaluationsStore;
  }
}
