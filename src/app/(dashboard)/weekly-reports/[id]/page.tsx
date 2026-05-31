import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitReportButton } from "@/components/reports/submit-report-button";
import { FeedbackHistory } from "@/components/reports/feedback-history";
import { ReviewActions } from "@/components/reports/review-actions";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { getReportById, listReportFeedbacks } from "@/lib/weekly-reports/queries";
import { parseIncidents } from "@/lib/reports/incidents";
import { submitReportAction } from "@/lib/weekly-reports/actions";
import { markReviewedAction, requestRevisionAction, approveReportAction } from "@/lib/reviews/actions";
import { canReviewReport, canSubmitReport } from "@/lib/weekly-reports/transitions";
import { calculateReportMetrics } from "@/lib/reports/calculator";

function formatDate(value: Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function WeeklyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  const metrics = calculateReportMetrics(report);
  const isOwner = report.userId === user.id;
  const canEdit = isOwner && report.status !== "APPROVED";
  const canSubmit = isOwner && canSubmitReport(report.status);
  const isReviewer = can(user.role, "report:review");
  const canReview = isReviewer && canReviewReport(report.status);
  const feedbacks = await listReportFeedbacks(id);

  async function submit() {
    "use server";
    return submitReportAction(id);
  }

  async function markReviewed(formData: FormData) {
    "use server";
    await markReviewedAction(id, {}, formData);
  }

  async function requestRevision(formData: FormData) {
    "use server";
    await requestRevisionAction(id, {}, formData);
  }

  async function approve(formData: FormData) {
    "use server";
    await approveReportAction(id, {}, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly report</h2>
          <p className="text-muted-foreground">
            {formatDate(report.weekStartDate)} → {formatDate(report.weekEndDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={report.status} />
          {canEdit ? (
            <Link href={`/weekly-reports/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          ) : null}
          {canSubmit ? <SubmitReportButton action={submit} /> : null}
        </div>
      </div>

      {canReview ? (
        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewActions markReviewed={markReviewed} requestRevision={requestRevision} approve={approve} />
          </CardContent>
        </Card>
      ) : null}

      {feedbacks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Feedback history</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackHistory feedbacks={feedbacks} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <BulletField label="" value={report.summary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Total test case" value={metrics.totalTestCase} />
            <Metric label="Executed" value={metrics.totalExecutedTestCase} />
            <Metric label="Total automation" value={metrics.totalAutomation} />
            <Metric label="Automation coverage" value={`${metrics.automationCoverage}%`} />
            <Metric label="Execution coverage" value={`${metrics.executionCoverage}%`} />
            <Metric label="Automation pass rate" value={`${metrics.automationPassRate}%`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan & notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Field label="Production incidents" value={String(report.productionIncidentCount)} />
          <IncidentsField label="Production incident notes" value={report.productionIncidentNotes} />
          <BulletField label="Blocker" value={report.blocker} />
          <BulletField label="Next week plan" value={report.nextWeekPlan} />
          <Field label="Notes" value={report.notes ?? "-"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}

function BulletField({ label, value }: { label: string; value: string | null }) {
  const items = (value ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div>
      {label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
      {items.length === 0 ? (
        <p className="mt-0.5 text-foreground">-</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IncidentsField({ label, value }: { label: string; value: string | null }) {
  const incidents = parseIncidents(value);

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {incidents.length === 0 ? (
        <p className="mt-0.5 text-foreground">-</p>
      ) : (
        <ul className="mt-1 space-y-2">
          {incidents.map((incident, i) => (
            <li key={i} className="rounded-lg border border-border p-3">
              {incident.title ? <p className="font-medium text-foreground">{incident.title}</p> : null}
              {incident.description ? (
                <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{incident.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
