import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReviewActionFn = (formData: FormData) => void;

type ReviewActionsProps = {
  markReviewed: ReviewActionFn;
  requestRevision: ReviewActionFn;
  approve: ReviewActionFn;
  error?: string;
};

export function ReviewActions({ markReviewed, requestRevision, approve, error }: ReviewActionsProps) {
  return (
    <form className="space-y-4">
      {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea id="feedback" name="feedback" placeholder="Tulis feedback untuk QA member." />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" formAction={markReviewed}>
          Mark as reviewed
        </Button>
        <Button type="submit" variant="outline" formAction={requestRevision}>
          Request revision
        </Button>
        <Button type="submit" formAction={approve}>
          Approve
        </Button>
      </div>
    </form>
  );
}
