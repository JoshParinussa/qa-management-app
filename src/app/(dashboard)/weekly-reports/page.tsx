import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/roles";
import { listAllReports, listReportsByUser } from "@/lib/weekly-reports/queries";

function formatDate(value: Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function WeeklyReportsPage() {
  const user = await requireUser();
  const isReviewer = can(user.role, "report:review");
  const reports = isReviewer ? await listAllReports() : await listReportsByUser(user.id);
  const canCreate = can(user.role, "report:create");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly reports</h2>
          <p className="text-muted-foreground">Draft, submit, dan review weekly report QA.</p>
        </div>
        {canCreate ? (
          <Link href="/weekly-reports/new">
            <Button>New report</Button>
          </Link>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{isReviewer ? "All reports" : "My reports"}</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada report.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.projectName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(report.weekStartDate)} → {formatDate(report.weekEndDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/weekly-reports/${report.id}`} className="font-medium text-foreground hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
