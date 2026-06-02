import { FolderKanban, Clock, RotateCcw, CheckCircle2, Send, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { DashboardReportTable } from "@/components/dashboard/dashboard-report-table";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import {
  getDashboardSummary,
  getIncidentTotal,
  getMemberSummary,
  listCoverageByProject,
  listPendingReviewReports,
  listRecentReportsByUser,
  listTopBlockers,
} from "@/lib/dashboard/queries";

function formatPercent(value: string | null) {
  if (!value) return "0%";
  return `${Number(value).toFixed(2)}%`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isReviewer = can(user.role, "dashboard:all");

  if (isReviewer) {
    const summary = await getDashboardSummary();
    const pending = await listPendingReviewReports();
    const coverage = await listCoverageByProject();
    const incidentTotal = await getIncidentTotal();
    const topBlockers = await listTopBlockers();

    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Ringkasan operasional QA team." />
        <StatCards
          cards={[
            { label: "Active projects", value: summary.activeProjects, icon: FolderKanban },
            { label: "Pending review", value: summary.pendingReview, icon: Clock },
            { label: "Need revision", value: summary.needRevision, icon: RotateCcw },
            { label: "Approved", value: summary.approved, icon: CheckCircle2 },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Pending review</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardReportTable reports={pending} emptyLabel="Tidak ada report menunggu review." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coverage per project (approved)</CardTitle>
          </CardHeader>
          <CardContent>
            {coverage.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada report approved.</p>
            ) : (
              <div className="space-y-3">
                {coverage.map((row) => (
                  <div key={row.projectName} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-sm font-medium">{row.projectName}</span>
                    <span className="text-sm text-muted-foreground">
                      BE {formatPercent(row.avgAutomationBe)} · FE {formatPercent(row.avgAutomationFe)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-muted-foreground" />
                Production incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{incidentTotal}</p>
              <p className="mt-1 text-sm text-muted-foreground">Total dari semua report.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top blockers</CardTitle>
            </CardHeader>
            <CardContent>
              {topBlockers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada blocker.</p>
              ) : (
                <div className="space-y-2">
                  {topBlockers.map((row) => (
                    <div key={row.blocker} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                      <span className="truncate text-sm">{row.blocker}</span>
                      <span className="text-sm text-muted-foreground">{row.value}×</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const member = await getMemberSummary(user.id);
  const recent = await listRecentReportsByUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Ringkasan report QA kamu." />
      <StatCards
        cards={[
          { label: "Assigned projects", value: member.assignedProjects, icon: FolderKanban },
          { label: "Submitted", value: member.submitted, icon: Send },
          { label: "Need revision", value: member.needRevision, icon: RotateCcw },
          { label: "Approved", value: member.approved, icon: CheckCircle2 },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>My recent reports</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardReportTable reports={recent} emptyLabel="Belum ada report." />
        </CardContent>
      </Card>
    </div>
  );
}
