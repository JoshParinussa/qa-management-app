import { describe, expect, it } from "vitest";
import { canSubmitReport } from "./transitions";

describe("canSubmitReport", () => {
  it("allows submitting a draft", () => {
    expect(canSubmitReport("DRAFT")).toBe(true);
  });

  it("allows submitting a need-revision report", () => {
    expect(canSubmitReport("NEED_REVISION")).toBe(true);
  });

  it("blocks submitting an already submitted report", () => {
    expect(canSubmitReport("SUBMITTED")).toBe(false);
  });

  it("blocks submitting an approved report", () => {
    expect(canSubmitReport("APPROVED")).toBe(false);
  });

  it("blocks submitting a reviewed report", () => {
    expect(canSubmitReport("REVIEWED")).toBe(false);
  });
});
