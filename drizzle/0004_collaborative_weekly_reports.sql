ALTER TYPE "public"."report_status" ADD VALUE 'PENDING_QA_APPROVAL' BEFORE 'SUBMITTED';--> statement-breakpoint
CREATE TABLE "report_activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"weekly_report_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"changed_fields" jsonb,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_authors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"weekly_report_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assignment_role" "assignment_role" NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "report_qa_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"weekly_report_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_reports" RENAME COLUMN "user_id" TO "created_by";--> statement-breakpoint
ALTER TABLE "weekly_reports" DROP CONSTRAINT "weekly_reports_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "weekly_reports_project_user_week_unique";--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "submitted_by" uuid;--> statement-breakpoint
ALTER TABLE "report_activities" ADD CONSTRAINT "report_activities_weekly_report_id_weekly_reports_id_fk" FOREIGN KEY ("weekly_report_id") REFERENCES "public"."weekly_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_activities" ADD CONSTRAINT "report_activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_authors" ADD CONSTRAINT "report_authors_weekly_report_id_weekly_reports_id_fk" FOREIGN KEY ("weekly_report_id") REFERENCES "public"."weekly_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_authors" ADD CONSTRAINT "report_authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_qa_approvals" ADD CONSTRAINT "report_qa_approvals_weekly_report_id_weekly_reports_id_fk" FOREIGN KEY ("weekly_report_id") REFERENCES "public"."weekly_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_qa_approvals" ADD CONSTRAINT "report_qa_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "report_authors_report_user_unique" ON "report_authors" USING btree ("weekly_report_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "report_qa_approvals_report_user_unique" ON "report_qa_approvals" USING btree ("weekly_report_id","user_id");--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_reports_project_week_unique" ON "weekly_reports" USING btree ("project_id","week_start_date","week_end_date");--> statement-breakpoint
UPDATE "weekly_reports" SET "submitted_by" = "created_by" WHERE "status" IN ('SUBMITTED','REVIEWED','NEED_REVISION','APPROVED');--> statement-breakpoint
INSERT INTO "report_authors" ("id", "weekly_report_id", "user_id", "assignment_role", "added_at")
SELECT gen_random_uuid(), wr."id", wr."created_by", COALESCE(pm."assignment_role", 'QA_MEMBER'::"assignment_role"), wr."created_at"
FROM "weekly_reports" wr
LEFT JOIN "project_members" pm ON pm."project_id" = wr."project_id" AND pm."user_id" = wr."created_by";--> statement-breakpoint
INSERT INTO "report_qa_approvals" ("id", "weekly_report_id", "user_id", "approved_at")
SELECT gen_random_uuid(), "id", "created_by", COALESCE("submitted_at", NOW())
FROM "weekly_reports"
WHERE "status" IN ('SUBMITTED','REVIEWED','NEED_REVISION','APPROVED');--> statement-breakpoint
INSERT INTO "report_activities" ("id", "weekly_report_id", "actor_id", "action", "created_at")
SELECT gen_random_uuid(), "id", "created_by", 'CREATED', "created_at" FROM "weekly_reports";