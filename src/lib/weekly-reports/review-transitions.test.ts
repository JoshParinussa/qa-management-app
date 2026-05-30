import { describe, expect, it } from "vitest";
import { canReviewReport, nextStatusForAction } from "./transitions";

describe("review transitions", () => {
  it("allows reviewing only a submitted report", () => {
    expect(canReviewReport("SUBMITTED")).toBe(true);
    expect(canReviewReport("DRAFT")).toBe(false);
    expect(canReviewReport("REVIEWED")).toBe(false);
    expect(canReviewReport("NEED_REVISION")).toBe(false);
    expect(canReviewReport("APPROVED")).toBe(false);
  });

  it("maps review actions to next status", () => {
    expect(nextStatusForAction("REVIEWED")).toBe("REVIEWED");
    expect(nextStatusForAction("NEED_REVISION")).toBe("NEED_REVISION");
    expect(nextStatusForAction("APPROVED")).toBe("APPROVED");
  });
});
