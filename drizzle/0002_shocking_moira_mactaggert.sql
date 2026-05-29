ALTER TABLE "project_members" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "report_attachments" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "report_feedbacks" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "weekly_reports" ALTER COLUMN "id" DROP DEFAULT;