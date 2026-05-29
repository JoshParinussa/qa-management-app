export const roles = ["ADMIN", "QA_LEAD", "QA_MEMBER"] as const;
export const reportStatuses = ["DRAFT", "SUBMITTED", "REVIEWED", "NEED_REVISION", "APPROVED"] as const;
export const projectStatuses = ["ACTIVE", "ARCHIVED"] as const;

export type Role = (typeof roles)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type ProjectStatus = (typeof projectStatuses)[number];

export type ActionState = {
  error?: string;
  success?: string;
};
