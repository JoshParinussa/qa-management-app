import { db } from "@/db/client";
import { reportActivities } from "@/db/schema";

export const ACTIVITY_ACTIONS = {
  CREATED: "CREATED",
  EDITED: "EDITED",
  QA_APPROVAL_REQUESTED: "QA_APPROVAL_REQUESTED",
  QA_APPROVED: "QA_APPROVED",
  QA_APPROVAL_REVOKED: "QA_APPROVAL_REVOKED",
  SUBMITTED_TO_REVIEWER: "SUBMITTED_TO_REVIEWER",
  REVIEWED: "REVIEWED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  APPROVED: "APPROVED",
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export type InsertActivityInput = {
  weeklyReportId: string;
  actorId: string;
  action: ActivityAction;
  changedFields?: readonly string[];
  note?: string | null;
};

export async function insertActivity(input: InsertActivityInput): Promise<void> {
  await db.insert(reportActivities).values({
    weeklyReportId: input.weeklyReportId,
    actorId: input.actorId,
    action: input.action,
    changedFields:
      input.changedFields && input.changedFields.length > 0 ? [...input.changedFields] : null,
    note: input.note ?? null,
  });
}
