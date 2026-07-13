import { FolderKanban, Clock, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { DashboardReportTable } from "@/components/dashboard/dashboard-report-table";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { CoverageProjectList } from "@/components/dashboard/coverage-project-list";
import { WeeklyReportChecklistCard } from "@/components/dashboard/weekly-report-checklist-card";
import { requireUser } from "@/lib/auth/session";
import { defaultDashboardDateValues, parseDashboardDateRange } from "@/lib/dashboard/date-range";
import { can } from "@/lib/permissions/roles";
import { listWeeklyReportChecklist } from "@/lib/weekly-reports/checklist";
import { createInitialWeeklyReportDraftAction } from "@/lib/weekly-reports/actions";
import { bulkApproveReportsAction } from "@/lib/reviews/actions";
import {
  getDashboardSummary,
  getIncidentTotal,
  getMemberSummary,
  listCoverageByProject,
  listPendingReviewReports,
  listRecentReportsByUser,
} from "@/lib/dashboard/queries";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const defaultRange = defaultDashboardDateValues();
  const dateRange = parseDashboardDateRange(params.from, params.to);
  const isReviewer = can(user.role, "dashboard:all");

  if (isReviewer) {
    const [summary, pending, coverage, incidentTotal, checklist] = await Promise.all([
      getDashboardSummary(dateRange),
      listPendingReviewReports(dateRange),
      listCoverageByProject(dateRange),
      getIncidentTotal(dateRange),
      listWeeklyReportChecklist(dateRange),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader title="Dashboard" description="Ringkasan operasional QA team." />
          <DateRangeFilter
            key={`${dateRange.from}-${dateRange.to}`}
            from={dateRange.from}
            to={dateRange.to}
            defaultFrom={defaultRange.from}
            defaultTo={defaultRange.to}
          />
        </div>
        <StatCards
          cards={[
            { label: "Active projects", value: summary.activeProjects, icon: FolderKanban, subtitle: "On track" },
            { label: "Pending review", value: summary.pendingReview, icon: Clock, subtitle: summary.pendingReview === 0 ? "All clear" : "Needs attention" },
            { label: "Need revision", value: summary.needRevision, icon: RotateCcw, subtitle: summary.needRevision === 0 ? "No issues" : "Action required" },
            { label: "Approved", value: summary.approved, icon: CheckCircle2, subtitle: "Completed" },
          ]}
        />
        <WeeklyReportChecklistCard
          approveReports={bulkApproveReportsAction}
          canBulkApprove={can(user.role, "report:review")}
          currentUserId={user.id}
          createInitialDraft={createInitialWeeklyReportDraftAction}
          items={checklist}
          range={{ from: dateRange.from, to: dateRange.to }}
        />
        <Card className="gap-0 overflow-hidden py-0 shadow-none">
          <CardHeader className="border-b px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Pending review</CardTitle>
                <CardDescription>Report yang menunggu review dan keputusan QA Lead.</CardDescription>
              </div>
              <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-700">
                {summary.pendingReview}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-3">
            <DashboardReportTable reports={pending} />
          </CardContent>
        </Card>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <Card className="gap-0 overflow-hidden py-0 shadow-none">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle>Coverage per project</CardTitle>
              <CardDescription>Rata-rata coverage dan pass rate dari report approved.</CardDescription>
              <CardAction>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 tabular-nums">
                  {coverage.length} project
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              {coverage.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">Belum ada report approved.</p>
              ) : (
                <CoverageProjectList projects={coverage} />
              )}
            </CardContent>
          </Card>
          <Card className="gap-0 overflow-hidden py-0 shadow-none">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle>Production incidents</CardTitle>
              <CardDescription>Total incident dari seluruh weekly report.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">{incidentTotal}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">Incident tercatat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const [member, recent] = await Promise.all([
    getMemberSummary(user.id, dateRange),
    listRecentReportsByUser(user.id, dateRange),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Dashboard" description="Ringkasan report QA kamu." />
        <DateRangeFilter
          key={`${dateRange.from}-${dateRange.to}`}
          from={dateRange.from}
          to={dateRange.to}
          defaultFrom={defaultRange.from}
          defaultTo={defaultRange.to}
        />
      </div>
      <StatCards
        cards={[
          { label: "Assigned projects", value: member.assignedProjects, icon: FolderKanban, subtitle: "Active" },
          { label: "Pending approval", value: member.pendingApproval, icon: Clock, subtitle: member.pendingApproval === 0 ? "All clear" : "Action required" },
          { label: "Need revision", value: member.needRevision, icon: RotateCcw, subtitle: member.needRevision === 0 ? "No issues" : "Action required" },
          { label: "Approved", value: member.approved, icon: CheckCircle2, subtitle: "Completed" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>My recent reports</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardReportTable
            reports={recent}
            emptyTitle="Belum ada report"
            emptyDescription="Report yang kamu ikuti sebagai co-author akan tampil di sini."
          />
        </CardContent>
      </Card>
    </div>
  );
}
