import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlySummary } from "@/lib/monthly-reports/queries";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function MonthlySummaryView({ summary }: { summary: MonthlySummary }) {
  if (summary.reportCount === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada report approved untuk filter ini.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Production incidents" value={summary.productionIncident} />
        <Metric label="Test case BE" value={summary.testCaseBe} />
        <Metric label="Test case FE" value={summary.testCaseFe} />
        <Metric label="Automation BE" value={summary.automationBe} />
        <Metric label="Automation FE" value={summary.automationFe} />
        <Metric label="Avg automation coverage" value={`${summary.avgAutomation.toFixed(2)}%`} />
        <Metric label="Avg execution coverage" value={`${summary.avgExecution.toFixed(2)}%`} />
        <Metric label="Approved reports" value={summary.reportCount} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blockers</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.blockers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada blocker.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {summary.blockers.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next plan</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.nextPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada next plan.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {summary.nextPlans.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
