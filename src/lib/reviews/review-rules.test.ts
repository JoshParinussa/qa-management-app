import { describe, expect, it } from "vitest";
import { validateReviewFeedback } from "./review-rules";

describe("validateReviewFeedback", () => {
  it("rejects request revision without feedback", () => {
    const result = validateReviewFeedback("NEED_REVISION", "");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/feedback/i);
    }
  });

  it("rejects request revision with whitespace-only feedback", () => {
    expect(validateReviewFeedback("NEED_REVISION", "   ").ok).toBe(false);
  });

  it("accepts request revision with feedback", () => {
    expect(validateReviewFeedback("NEED_REVISION", "Please fix coverage")).toEqual({ ok: true });
  });

  it("allows mark reviewed without feedback", () => {
    expect(validateReviewFeedback("REVIEWED", "")).toEqual({ ok: true });
  });

  it("allows approve without feedback", () => {
    expect(validateReviewFeedback("APPROVED", "")).toEqual({ ok: true });
  });
});
