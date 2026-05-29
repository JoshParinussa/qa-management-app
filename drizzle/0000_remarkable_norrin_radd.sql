CREATE TYPE "public"."assignment_role" AS ENUM('QA_MEMBER', 'QA_PIC');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('DRAFT', 'SUBMITTED', 'REVIEWED', 'NEED_REVISION', 'APPROVED');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('REVIEWED', 'NEED_REVISION', 'APPROVED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'QA_LEAD', 'QA_MEMBER');--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assignment_role" "assignment_role" DEFAULT 'QA_MEMBER' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"code" varchar(24) NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'ACTIVE' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "report_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekly_report_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekly_report_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"feedback" text NOT NULL,
	"action" "review_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start_date" timestamp with time zone NOT NULL,
	"week_end_date" timestamp with time zone NOT NULL,
	"status" "report_status" DEFAULT 'DRAFT' NOT NULL,
	"summary" text NOT NULL,
	"production_incident_count" integer DEFAULT 0 NOT NULL,
	"production_incident_notes" text,
	"bug_document_url" text,
	"test_case_be_total" integer DEFAULT 0 NOT NULL,
	"test_case_be_executed" integer DEFAULT 0 NOT NULL,
	"test_case_fe_total" integer DEFAULT 0 NOT NULL,
	"test_case_fe_executed" integer DEFAULT 0 NOT NULL,
	"automation_be_total" integer DEFAULT 0 NOT NULL,
	"automation_fe_total" integer DEFAULT 0 NOT NULL,
	"automation_passed" integer DEFAULT 0 NOT NULL,
	"automation_failed" integer DEFAULT 0 NOT NULL,
	"automation_coverage" numeric(5, 2),
	"execution_coverage" numeric(5, 2),
	"blocker" text,
	"next_week_plan" text NOT NULL,
	"notes" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_weekly_report_id_weekly_reports_id_fk" FOREIGN KEY ("weekly_report_id") REFERENCES "public"."weekly_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_feedbacks" ADD CONSTRAINT "report_feedbacks_weekly_report_id_weekly_reports_id_fk" FOREIGN KEY ("weekly_report_id") REFERENCES "public"."weekly_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_feedbacks" ADD CONSTRAINT "report_feedbacks_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_members_project_user_unique" ON "project_members" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_reports_project_user_week_unique" ON "weekly_reports" USING btree ("project_id","user_id","week_start_date","week_end_date");