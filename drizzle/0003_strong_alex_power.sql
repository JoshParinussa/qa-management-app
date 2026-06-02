ALTER TABLE "weekly_reports" ADD COLUMN "test_case_total" integer;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_be_passed" integer;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_be_failed" integer;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_fe_passed" integer;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_fe_failed" integer;--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_be_coverage" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_fe_coverage" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_be_pass_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "weekly_reports" ADD COLUMN "automation_fe_pass_rate" numeric(5, 2);
