"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "@/db/client";
import { projects, reportAuthors, reportQaApprovals, weeklyReports } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { calculateReportMetrics } from "@/lib/reports/calculator";
import { findActiveAssignment, listProjectMembers } from "@/lib/project-members/queries";
import { hasActiveAssignment } from "@/lib/project-members/rules";
import { canEditReport, detectContentChanges, validateSubmitReadiness } from "@/lib/weekly-reports/rules";
import {
  findReportForWeek,
  findReportSummaryForWeek,
  getReportById,
  isCoAuthor,
} from "@/lib/weekly-reports/queries";
import { canStartQaApproval } from "@/lib/weekly-reports/transitions";
import { ACTIVITY_ACTIONS, insertActivity } from "@/lib/weekly-reports/activity";
import { weeklyReportSchema, type WeeklyReportInput } from "@/lib/validations/weekly-report";
import type { ActionState } from "@/types";
import {
  fieldErrorsFromZod,
  weeklyReportErrorState,
  type ExistingWeeklyReport,
  type WeeklyReportConflict,
  type WeeklyReportActionState,
} from "./form-state";

function parseReportForm(formData: FormData) {
  const num = (key: string) => Number(formData.get(key) ?? 0);
  const optionalNum = (key: string) => {
    const raw = formData.get(key);
    if (raw === null || raw === "") return undefined;
    return Number(raw);
  };
  const testCaseBeTotal = optionalNum("testCaseBeTotal");
  const testCaseFeTotal = optionalNum("testCaseFeTotal");
  const optionalNumbers = {
    automationBePassed: optionalNum("automationBePassed"),
    automationBeFailed: optionalNum("automationBeFailed"),
    automationFePassed: optionalNum("automationFePassed"),
    automationFeFailed: optionalNum("automationFeFailed"),
  };
  const splitAutomationPresent =
    optionalNumbers.automationBePassed !== undefined ||
    optionalNumbers.automationBeFailed !== undefined ||
    optionalNumbers.automationFePassed !== undefined ||
    optionalNumbers.automationFeFailed !== undefined;
  const optionalEntries = Object.fromEntries(
    Object.entries(optionalNumbers).filter(([, value]) => value !== undefined),
  );

  return weeklyReportSchema.safeParse({
    projectId: formData.get("projectId"),
    weekStartDate: formData.get("weekStartDate"),
    weekEndDate: formData.get("weekEndDate"),
    summary: formData.get("summary"),
    productionIncidentCount: num("productionIncidentCount"),
    productionIncidentNotes: String(formData.get("productionIncidentNotes") ?? "") || undefined,
    bugDocumentUrl: String(formData.get("bugDocumentUrl") ?? ""),
    testCaseTotal: optionalNum("testCaseTotal"),
    testCaseBeTotal,
    testCaseBeExecuted: num("testCaseBeExecuted"),
    testCaseFeTotal,
    testCaseFeExecuted: num("testCaseFeExecuted"),
    automationBeTotal: num("automationBeTotal"),
    automationFeTotal: num("automationFeTotal"),
    ...optionalEntries,
    automationPassed: splitAutomationPresent
      ? (optionalNumbers.automationBePassed ?? 0) + (optionalNumbers.automationFePassed ?? 0)
      : num("automationPassed"),
    automationFailed: splitAutomationPresent
      ? (optionalNumbers.automationBeFailed ?? 0) + (optionalNumbers.automationFeFailed ?? 0)
      : num("automationFailed"),
    blocker: String(formData.get("blocker") ?? "") || undefined,
    nextWeekPlan: formData.get("nextWeekPlan"),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
}

function coverageValues(data: WeeklyReportInput) {
  const metrics = calculateReportMetrics(data);
  return {
    automationCoverage: String(metrics.automationCoverage),
    executionCoverage: String(metrics.executionCoverage),
    automationBeCoverage: String(metrics.automationBeCoverage),
    automationFeCoverage: String(metrics.automationFeCoverage),
    automationBePassRate: String(metrics.automationBePassRate),
    automationFePassRate: String(metrics.automationFePassRate),
  };
}

function nullableSplitValues(data: WeeklyReportInput) {
  return {
    testCaseTotal: data.testCaseTotal ?? null,
    automationBePassed: data.automationBePassed ?? null,
    automationBeFailed: data.automationBeFailed ?? null,
    automationFePassed: data.automationFePassed ?? null,
    automationFeFailed: data.automationFeFailed ?? null,
  };
}

function existingReportResult(
  report: {
    id: string;
    status: ExistingWeeklyReport["status"];
    createdByName?: string | null;
    createdByEmail?: string | null;
    createdAt?: Date | string | null;
  },
  canEdit: boolean,
): ExistingWeeklyReport {
  return {
    id: report.id,
    status: report.status,
    createdByName: report.createdByName,
    createdByEmail: report.createdByEmail,
    createdAt: report.createdAt,
    canEdit,
  };
}

function reportConflict(report: ExistingWeeklyReport): WeeklyReportConflict {
  return { type: "report", report };
}

function parseDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function ensureCanStartWeeklyReport(projectId: string, userId: string) {
  const assignment = await findActiveAssignment(projectId, userId);

  if (!hasActiveAssignment(assignment)) {
    return { ok: false as const, error: "Kamu tidak ter-assign di project ini." };
  }

  const [project] = await db
    .select({
      status: projects.status,
      weeklyReportRequired: projects.weeklyReportRequired,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project || project.status !== "ACTIVE" || !project.weeklyReportRequired) {
    return { ok: false as const, error: "Project ini tidak mewajibkan weekly report." };
  }

  return { ok: true as const, assignment };
}

async function insertReportAuthorsForProject(reportId: string, projectId: string, userId: string, assignmentRole: "QA_MEMBER" | "QA_PIC") {
  // Snapshot all currently-active QA members of the project as co-authors.
  const members = await listProjectMembers(projectId);
  const memberIds = new Set(members.map((m) => m.userId));
  const authorRows = members.map((m) => ({
    weeklyReportId: reportId,
    userId: m.userId,
    assignmentRole: m.assignmentRole,
  }));

  // Always make sure the creator is a co-author, even if not in active members.
  if (!memberIds.has(userId)) {
    authorRows.push({
      weeklyReportId: reportId,
      userId,
      assignmentRole,
    });
  }

  if (authorRows.length > 0) {
    await db.insert(reportAuthors).values(authorRows);
  }
}

export async function checkExistingWeeklyReportAction(
  projectId: string,
  weekStartDateValue: string,
  weekEndDateValue: string,
): Promise<WeeklyReportConflict | null> {
  const user = await requireUser();
  const weekStartDate = parseDateValue(weekStartDateValue);
  const weekEndDate = parseDateValue(weekEndDateValue);

  if (!projectId || !weekStartDate || !weekEndDate || weekStartDate >= weekEndDate) {
    return null;
  }

  const assignment = await findActiveAssignment(projectId, user.id);
  if (!hasActiveAssignment(assignment)) {
    return null;
  }

  const report = await findReportSummaryForWeek(projectId, weekStartDate, weekEndDate);
  if (report) {
    const userIsCoAuthor = await isCoAuthor(report.id, user.id);
    return reportConflict(existingReportResult(report, userIsCoAuthor && canEditReport(report.status)));
  }

  return null;
}

type CreateInitialWeeklyReportDraftState = ActionState & {
  href?: string;
  conflict?: WeeklyReportConflict;
};

export async function createInitialWeeklyReportDraftAction(
  projectId: string,
  weekStartDateValue: string,
  weekEndDateValue: string,
): Promise<CreateInitialWeeklyReportDraftState> {
  const user = await requireUser();
  const weekStartDate = parseDateValue(weekStartDateValue);
  const weekEndDate = parseDateValue(weekEndDateValue);

  if (!projectId || !weekStartDate || !weekEndDate || weekStartDate >= weekEndDate) {
    return { error: "Pilih project dan periode report yang valid." };
  }

  const permission = await ensureCanStartWeeklyReport(projectId, user.id);
  if (!permission.ok) {
    return { error: permission.error };
  }

  const report = await findReportSummaryForWeek(projectId, weekStartDate, weekEndDate);
  if (report) {
    const userIsCoAuthor = await isCoAuthor(report.id, user.id);
    return {
      error: "Report untuk project dan minggu ini sudah ada.",
      conflict: reportConflict(existingReportResult(report, userIsCoAuthor && canEditReport(report.status))),
    };
  }

  const reportId = uuidv7();

  try {
    await db.insert(weeklyReports).values({
      id: reportId,
      projectId,
      weekStartDate,
      weekEndDate,
      createdBy: user.id,
      status: "DRAFT",
      summary: "",
      productionIncidentCount: 0,
      productionIncidentNotes: null,
      bugDocumentUrl: null,
      testCaseTotal: null,
      testCaseBeTotal: 0,
      testCaseBeExecuted: 0,
      testCaseFeTotal: 0,
      testCaseFeExecuted: 0,
      automationBeTotal: 0,
      automationFeTotal: 0,
      automationBePassed: null,
      automationBeFailed: null,
      automationFePassed: null,
      automationFeFailed: null,
      automationPassed: 0,
      automationFailed: 0,
      automationBeCoverage: "0",
      automationFeCoverage: "0",
      automationCoverage: "0",
      automationBePassRate: "0",
      automationFePassRate: "0",
      executionCoverage: "0",
      blocker: null,
      nextWeekPlan: "",
      notes: null,
    });
  } catch (error) {
    const duplicateAfterRace = await findReportSummaryForWeek(projectId, weekStartDate, weekEndDate);
    if (duplicateAfterRace) {
      const userIsCoAuthor = await isCoAuthor(duplicateAfterRace.id, user.id);
      return {
        error: "Report untuk project dan minggu ini baru saja dibuat oleh QA lain.",
        conflict: reportConflict(existingReportResult(duplicateAfterRace, userIsCoAuthor && canEditReport(duplicateAfterRace.status))),
      };
    }

    throw error;
  }

  await insertReportAuthorsForProject(reportId, projectId, user.id, permission.assignment.assignmentRole);

  await insertActivity({
    weeklyReportId: reportId,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.CREATED,
  });

  return {
    success: "Draft report berhasil dibuat.",
    href: `/weekly-reports/${reportId}/edit`,
  };
}

export async function createDraftAction(_state: WeeklyReportActionState, formData: FormData): Promise<WeeklyReportActionState> {
  const user = await requireUser();
  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return weeklyReportErrorState("Data report tidak valid. Periksa kembali isian.", formData, fieldErrorsFromZod(parsed.error));
  }

  const permission = await ensureCanStartWeeklyReport(parsed.data.projectId, user.id);

  if (!permission.ok) {
    return weeklyReportErrorState(permission.error, formData);
  }

  const duplicate = await findReportForWeek(
    parsed.data.projectId,
    parsed.data.weekStartDate,
    parsed.data.weekEndDate,
  );

  if (duplicate) {
    const userIsCoAuthor = await isCoAuthor(duplicate.id, user.id);
    return weeklyReportErrorState("Report untuk project dan minggu ini sudah ada. Lanjutkan report yang sudah dibuat.", formData, undefined, {
      reportConflict: reportConflict(existingReportResult(duplicate, userIsCoAuthor && canEditReport(duplicate.status))),
    });
  }

  const coverage = coverageValues(parsed.data);
  const reportId = uuidv7();

  try {
    await db.insert(weeklyReports).values({
      id: reportId,
      ...parsed.data,
      ...nullableSplitValues(parsed.data),
      createdBy: user.id,
      bugDocumentUrl: parsed.data.bugDocumentUrl || null,
      status: "DRAFT",
      ...coverage,
    });
  } catch (error) {
    const duplicateAfterRace = await findReportForWeek(
      parsed.data.projectId,
      parsed.data.weekStartDate,
      parsed.data.weekEndDate,
    );

    if (duplicateAfterRace) {
      const userIsCoAuthor = await isCoAuthor(duplicateAfterRace.id, user.id);
      return weeklyReportErrorState("Report untuk project dan minggu ini baru saja dibuat oleh QA lain.", formData, undefined, {
        reportConflict: reportConflict(existingReportResult(duplicateAfterRace, userIsCoAuthor && canEditReport(duplicateAfterRace.status))),
      });
    }

    throw error;
  }

  await insertReportAuthorsForProject(reportId, parsed.data.projectId, user.id, permission.assignment.assignmentRole);

  await insertActivity({
    weeklyReportId: reportId,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.CREATED,
  });

  redirect("/weekly-reports");
}

export async function updateDraftAction(id: string, _state: WeeklyReportActionState, formData: FormData): Promise<WeeklyReportActionState> {
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report) {
    return { error: "Report tidak ditemukan." };
  }

  const userIsCoAuthor = await isCoAuthor(id, user.id);
  if (!userIsCoAuthor) {
    return { error: "Hanya co-author yang bisa edit report ini." };
  }

  if (!canEditReport(report.status)) {
    return { error: "Report ini sudah dikunci dan tidak bisa diedit." };
  }

  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return weeklyReportErrorState("Data report tidak valid. Periksa kembali isian.", formData, fieldErrorsFromZod(parsed.error));
  }

  const coverage = coverageValues(parsed.data);
  const nextValues = {
    ...parsed.data,
    ...nullableSplitValues(parsed.data),
    bugDocumentUrl: parsed.data.bugDocumentUrl || null,
    ...coverage,
  };

  const changedFields = detectContentChanges(
    report as unknown as Partial<Record<string, unknown>>,
    nextValues as unknown as Partial<Record<string, unknown>>,
  );

  await db
    .update(weeklyReports)
    .set({
      ...nextValues,
      updatedAt: new Date(),
    })
    .where(eq(weeklyReports.id, id));

  if (changedFields.length > 0) {
    const deleted = await db
      .delete(reportQaApprovals)
      .where(eq(reportQaApprovals.weeklyReportId, id))
      .returning({ id: reportQaApprovals.id });

    if (report.status !== "DRAFT") {
      await db
        .update(weeklyReports)
        .set({ status: "DRAFT", updatedAt: new Date() })
        .where(eq(weeklyReports.id, id));
    }

    await insertActivity({
      weeklyReportId: id,
      actorId: user.id,
      action: ACTIVITY_ACTIONS.EDITED,
      changedFields,
    });

    if (deleted.length > 0) {
      await insertActivity({
        weeklyReportId: id,
        actorId: user.id,
        action: ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED,
      });
    }
  } else {
    await insertActivity({
      weeklyReportId: id,
      actorId: user.id,
      action: ACTIVITY_ACTIONS.EDITED,
    });
  }

  redirect(`/weekly-reports/${id}`);
}

/**
 * User-initiated transition: DRAFT → PENDING_QA_APPROVAL.
 * The actual SUBMITTED transition is auto-triggered when the last QA approval lands
 * (see `approveAsCoAuthorAction` in `co-author-actions.ts`).
 */
export async function requestQaApprovalAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report) {
    return { error: "Report tidak ditemukan." };
  }

  const userIsCoAuthor = await isCoAuthor(id, user.id);
  if (!userIsCoAuthor) {
    return { error: "Hanya co-author yang bisa mengajukan approval QA." };
  }

  if (!canStartQaApproval(report.status)) {
    return { error: "Report ini tidak bisa diajukan untuk approval QA dari status sekarang." };
  }

  const readiness = validateSubmitReadiness({
    summary: report.summary,
    nextWeekPlan: report.nextWeekPlan,
  });

  if (!readiness.ok) {
    return { error: readiness.error };
  }

  await db
    .update(weeklyReports)
    .set({ status: "PENDING_QA_APPROVAL", updatedAt: new Date() })
    .where(eq(weeklyReports.id, id));

  await insertActivity({
    weeklyReportId: id,
    actorId: user.id,
    action: ACTIVITY_ACTIONS.QA_APPROVAL_REQUESTED,
  });

  redirect(`/weekly-reports/${id}`);
}

/**
 * Backward-compat alias. UI components import `submitReportAction`; the new
 * canonical name is `requestQaApprovalAction` because the user action is now
 * "ajukan untuk approval QA" rather than "submit ke reviewer".
 */
export const submitReportAction = requestQaApprovalAction;
