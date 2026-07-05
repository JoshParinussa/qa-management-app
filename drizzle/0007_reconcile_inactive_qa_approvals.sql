WITH "ready_reports" AS (
	SELECT
		wr."id",
		COALESCE(
			(
				SELECT approval."user_id"
				FROM "report_qa_approvals" approval
				INNER JOIN "report_authors" author
					ON author."weekly_report_id" = approval."weekly_report_id"
					AND author."user_id" = approval."user_id"
				INNER JOIN "users" approver ON approver."id" = approval."user_id"
				WHERE approval."weekly_report_id" = wr."id"
					AND author."removed_at" IS NULL
					AND approver."is_active" = true
				ORDER BY approval."approved_at" DESC
				LIMIT 1
			),
			wr."created_by"
		) AS "actor_id"
	FROM "weekly_reports" wr
	WHERE wr."status" = 'PENDING_QA_APPROVAL'
		AND NOT EXISTS (
			SELECT 1
			FROM "report_authors" author
			INNER JOIN "users" required_approver ON required_approver."id" = author."user_id"
			WHERE author."weekly_report_id" = wr."id"
				AND author."removed_at" IS NULL
				AND required_approver."is_active" = true
				AND NOT EXISTS (
					SELECT 1
					FROM "report_qa_approvals" approval
					WHERE approval."weekly_report_id" = author."weekly_report_id"
						AND approval."user_id" = author."user_id"
				)
		)
),
"updated_reports" AS (
	UPDATE "weekly_reports" report
	SET
		"status" = 'SUBMITTED',
		"submitted_at" = NOW(),
		"submitted_by" = ready."actor_id",
		"updated_at" = NOW()
	FROM "ready_reports" ready
	WHERE report."id" = ready."id"
		AND report."status" = 'PENDING_QA_APPROVAL'
	RETURNING report."id", report."submitted_by"
)
INSERT INTO "report_activities" (
	"id",
	"weekly_report_id",
	"actor_id",
	"action",
	"note"
)
SELECT
	gen_random_uuid(),
	updated."id",
	updated."submitted_by",
	'SUBMITTED_TO_REVIEWER',
	'Auto-submitted karena approval QA inactive tidak lagi diwajibkan.'
FROM "updated_reports" updated;
