import { Badge } from "@/components/ui/badge";

type FeedbackRow = {
  id: string;
  feedback: string;
  action: "REVIEWED" | "NEED_REVISION" | "APPROVED";
  createdAt: Date;
  reviewerName: string;
};

const actionLabel: Record<FeedbackRow["action"], string> = {
  REVIEWED: "Reviewed",
  NEED_REVISION: "Need revision",
  APPROVED: "Approved",
};

export function FeedbackHistory({ feedbacks }: { feedbacks: FeedbackRow[] }) {
  if (feedbacks.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada feedback.</p>;
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((item) => (
        <div key={item.id} className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{item.reviewerName}</span>
            <Badge variant="outline">{actionLabel[item.action]}</Badge>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{item.feedback}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(item.createdAt).toISOString().slice(0, 16).replace("T", " ")}
          </p>
        </div>
      ))}
    </div>
  );
}
