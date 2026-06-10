import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

export type CoAuthorRow = {
  authorId: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignmentRole: "QA_MEMBER" | "QA_PIC" | null;
  approvedAt: Date | null;
};

const roleLabel: Record<NonNullable<CoAuthorRow["assignmentRole"]>, string> = {
  QA_MEMBER: "QA Member",
  QA_PIC: "QA PIC",
};

export function CoAuthorsPanel({
  authors,
  approvedCount,
  totalCount,
}: {
  authors: CoAuthorRow[];
  approvedCount: number;
  totalCount: number;
}) {
  if (authors.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada co-author.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2 text-sm">
               <span className="font-medium text-foreground tabular-nums">
          {approvedCount}/{totalCount}{' '}
        </span>
       <span className="text-muted-foreground">co-author sudah approve</span>
      </div>

      <ul className="space-y-2">
        {authors.map((author) => {
          const approved = author.approvedAt != null;
          const role = author.assignmentRole ? roleLabel[author.assignmentRole] : "QA";
          return (
            <li
              key={author.authorId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{author.userName}</p>
                <p className="truncate text-xs text-muted-foreground">{author.userEmail}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {role}
                </Badge>
                {approved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="size-3.5" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    Pending
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
