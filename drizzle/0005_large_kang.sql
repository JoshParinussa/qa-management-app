ALTER TABLE "projects" ADD COLUMN "weekly_report_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "weekly_report_disabled_reason" varchar(40);