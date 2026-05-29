import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

const metrics = [
  { label: "Active Projects", value: "3" },
  { label: "Pending Review", value: "0" },
  { label: "Need Revision", value: "0" },
  { label: "Approved", value: "0" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-slate-500">Summary operasional QA team.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Report Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <StatusBadge status="DRAFT" />
          <StatusBadge status="SUBMITTED" />
          <StatusBadge status="NEED_REVISION" />
          <StatusBadge status="APPROVED" />
        </CardContent>
      </Card>
    </div>
  );
}
