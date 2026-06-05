import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitReportButton } from "@/components/reports/submit-report-button";
import { FeedbackHistory } from "@/components/reports/feedback-history";
import { ReviewActions } from "@/components/reports/review-actions";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { getReportById, getReportReviewNames, isCoAuthor, listReportFeedbacks } from "@/lib/weekly-reports/queries";
import { parseBulletItems } from "@/lib/reports/bullets";
import { parseIncidents } from "@/lib/reports/incidents";
import { submitReportAction } from "@/lib/weekly-reports/actions";
import { markReviewedAction, requestRevisionAction, approveReportAction } from "@/lib/reviews/actions";
import { canReviewReport, canStartQaApproval } from "@/lib/weekly-reports/transitions";
import { canEditReport } from "@/lib/weekly-reports/rules";
import { reportStageDescription } from "@/lib/reports/status";
import { calculateReportMetrics } from "@/lib/reports/calculator";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function WeeklyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  const metrics = calculateReportMetrics(report);
  const userIsCoAuthor = await isCoAuthor(id, user.id);
  const isReviewer = can(user.role, "report:review");

  if (!userIsCoAuthor && !isReviewer) {
    notFound();
  }

  const canEdit = userIsCoAuthor && canEditReport(report.status);
  const canSubmit = userIsCoAuthor && canStartQaApproval(report.status);
  const canReview = isReviewer && canReviewReport(report.status);
  const feedbacks = await listReportFeedbacks(id);
  const { reviewerName, approverName } = await getReportReviewNames(report.reviewedBy, report.approvedBy);
  const stageDescription = reportStageDescription(report.status, { reviewerName, approverName });

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
          <div className="flex flex-col items-end gap-0.5">
            <StatusBadge status={report.status} />
            <p className="text-xs text-muted-foreground">{stageDescription}</p>
          </div>
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
        <CardContent className="space-y-6">
          <MetricGroup title="Overview">
            <Metric label="Total test case" value={metrics.totalTestCase} />
          </MetricGroup>
          <MetricGroup title="Backend">
            <Metric label="Test case" value={report.testCaseBeTotal} />
            <Metric label="Automation coverage" value={`${metrics.automationBeCoverage}%`} />
            <Metric label="Pass rate" value={`${metrics.automationBePassRate}%`} />
          </MetricGroup>
          <MetricGroup title="Frontend">
            <Metric label="Test case" value={report.testCaseFeTotal} />
            <Metric label="Automation coverage" value={`${metrics.automationFeCoverage}%`} />
            <Metric label="Pass rate" value={`${metrics.automationFePassRate}%`} />
          </MetricGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production incidents</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <IncidentsList count={report.productionIncidentCount} value={report.productionIncidentNotes} bugDocumentUrl={report.bugDocumentUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan & notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <BulletField label="Blocker" value={report.blocker} />
          <BulletField label="Next week plan" value={report.nextWeekPlan} />
          <Field label="Notes" value={report.notes ?? "-"} />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="grid gap-4 sm:grid-cols-3">{children}</div>
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
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}

function BulletField({ label, value }: { label: string; value: string | null }) {
  const items = parseBulletItems(value);

  return (
    <div className="space-y-1.5">
      {label ? <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p> : null}
      {items.length === 0 ? (
        <p className="text-muted-foreground">-</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-foreground marker:text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="whitespace-pre-wrap">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IncidentsList({ count, value, bugDocumentUrl }: { count: number; value: string | null; bugDocumentUrl: string | null }) {
  const incidents = parseIncidents(value);

  if (count <= 0 && incidents.length === 0) {
    return <p className="text-muted-foreground">Tidak ada production incident minggu ini.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground">
          <span className="text-2xl font-semibold tabular-nums">{count}</span>
          <span className="ml-1.5 text-muted-foreground">incident dilaporkan</span>
        </p>
        {bugDocumentUrl ? (
          <a
            href={bugDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="size-4" />
            Bug document
          </a>
        ) : null}
      </div>
      {incidents.length === 0 ? (
        <p className="text-muted-foreground">Belum ada detail incident.</p>
      ) : (
        <ul className="space-y-2">
          {incidents.map((incident, i) => (
            <li key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                {incident.title ? <p className="font-medium text-foreground">{incident.title}</p> : null}
                {incident.relatedTestCaseId ? (
                  <span
                    title={`Related test case: ${incident.relatedTestCaseId}`}
                    className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums"
                  >
                    {incident.relatedTestCaseId}
                  </span>
                ) : null}
              </div>
              {incident.description ? (
                <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">{incident.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
