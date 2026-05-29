import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonthlyReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500">Monthly summary memakai weekly report berstatus approved.</p>
      </CardContent>
    </Card>
  );
}
