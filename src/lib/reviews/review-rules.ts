export type ReviewAction = "REVIEWED" | "NEED_REVISION" | "APPROVED";

type Result = { ok: true } | { ok: false; error: string };

export function validateReviewFeedback(action: ReviewAction, feedback: string): Result {
  if (action === "NEED_REVISION" && !feedback.trim()) {
    return { ok: false, error: "Feedback wajib diisi untuk meminta revisi." };
  }

  return { ok: true };
}
