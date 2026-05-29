import { relations } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["ADMIN", "QA_LEAD", "QA_MEMBER"]);
export const projectStatusEnum = pgEnum("project_status", ["ACTIVE", "ARCHIVED"]);
export const assignmentRoleEnum = pgEnum("assignment_role", ["QA_MEMBER", "QA_PIC"]);
export const reportStatusEnum = pgEnum("report_status", ["DRAFT", "SUBMITTED", "REVIEWED", "NEED_REVISION", "APPROVED"]);
export const reviewActionEnum = pgEnum("review_action", ["REVIEWED", "NEED_REVISION", "APPROVED"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 160 }).notNull(),
  code: varchar("code", { length: 24 }).notNull().unique(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("ACTIVE"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    assignmentRole: assignmentRoleEnum("assignment_role").notNull().default("QA_MEMBER"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("project_members_project_user_unique").on(table.projectId, table.userId)],
);

export const weeklyReports = pgTable(
  "weekly_reports",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    weekStartDate: timestamp("week_start_date", { withTimezone: true }).notNull(),
    weekEndDate: timestamp("week_end_date", { withTimezone: true }).notNull(),
    status: reportStatusEnum("status").notNull().default("DRAFT"),
    summary: text("summary").notNull(),
    productionIncidentCount: integer("production_incident_count").notNull().default(0),
    productionIncidentNotes: text("production_incident_notes"),
    bugDocumentUrl: text("bug_document_url"),
    testCaseBeTotal: integer("test_case_be_total").notNull().default(0),
    testCaseBeExecuted: integer("test_case_be_executed").notNull().default(0),
    testCaseFeTotal: integer("test_case_fe_total").notNull().default(0),
    testCaseFeExecuted: integer("test_case_fe_executed").notNull().default(0),
    automationBeTotal: integer("automation_be_total").notNull().default(0),
    automationFeTotal: integer("automation_fe_total").notNull().default(0),
    automationPassed: integer("automation_passed").notNull().default(0),
    automationFailed: integer("automation_failed").notNull().default(0),
    automationCoverage: numeric("automation_coverage", { precision: 5, scale: 2 }),
    executionCoverage: numeric("execution_coverage", { precision: 5, scale: 2 }),
    blocker: text("blocker"),
    nextWeekPlan: text("next_week_plan").notNull(),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("weekly_reports_project_user_week_unique").on(table.projectId, table.userId, table.weekStartDate, table.weekEndDate)],
);

export const reportFeedbacks = pgTable("report_feedbacks", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  weeklyReportId: uuid("weekly_report_id").notNull().references(() => weeklyReports.id),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id),
  feedback: text("feedback").notNull(),
  action: reviewActionEnum("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportAttachments = pgTable("report_attachments", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  weeklyReportId: uuid("weekly_report_id").notNull().references(() => weeklyReports.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projectMembers: many(projectMembers),
  weeklyReports: many(weeklyReports, { relationName: "reportAuthor" }),
  reviewedReports: many(weeklyReports, { relationName: "reportReviewer" }),
  approvedReports: many(weeklyReports, { relationName: "reportApprover" }),
  feedbacks: many(reportFeedbacks, { relationName: "feedbackReviewer" }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
  weeklyReports: many(weeklyReports),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const weeklyReportsRelations = relations(weeklyReports, ({ one, many }) => ({
  project: one(projects, { fields: [weeklyReports.projectId], references: [projects.id] }),
  user: one(users, { fields: [weeklyReports.userId], references: [users.id], relationName: "reportAuthor" }),
  reviewer: one(users, { fields: [weeklyReports.reviewedBy], references: [users.id], relationName: "reportReviewer" }),
  approver: one(users, { fields: [weeklyReports.approvedBy], references: [users.id], relationName: "reportApprover" }),
  feedbacks: many(reportFeedbacks),
  attachments: many(reportAttachments),
}));

export const reportFeedbacksRelations = relations(reportFeedbacks, ({ one }) => ({
  weeklyReport: one(weeklyReports, { fields: [reportFeedbacks.weeklyReportId], references: [weeklyReports.id] }),
  reviewer: one(users, { fields: [reportFeedbacks.reviewerId], references: [users.id], relationName: "feedbackReviewer" }),
}));

export const reportAttachmentsRelations = relations(reportAttachments, ({ one }) => ({
  weeklyReport: one(weeklyReports, { fields: [reportAttachments.weeklyReportId], references: [weeklyReports.id] }),
}));
