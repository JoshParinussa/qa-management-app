CREATE TABLE "weekly_report_reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"week_start_date" timestamp with time zone NOT NULL,
	"week_end_date" timestamp with time zone NOT NULL,
	"reserved_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_report_reservations" ADD CONSTRAINT "weekly_report_reservations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_report_reservations" ADD CONSTRAINT "weekly_report_reservations_reserved_by_users_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_report_reservations_project_week_unique" ON "weekly_report_reservations" USING btree ("project_id","week_start_date","week_end_date");