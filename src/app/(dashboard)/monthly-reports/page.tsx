import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function MonthlyReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Monthly reports" description="Summary bulanan dari weekly report berstatus approved." />
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Monthly summary akan dibangun di Phase 9.</p>
        </CardContent>
      </Card>
    </div>
  );
}
