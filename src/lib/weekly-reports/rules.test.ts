import { describe, expect, it } from "vitest";
import { canEditReport, validateSubmitReadiness } from "./rules";

describe("canEditReport", () => {
  it("blocks editing an approved report", () => {
    expect(canEditReport("APPROVED")).toBe(false);
  });

  it("allows editing draft, submitted, reviewed, need_revision", () => {
    expect(canEditReport("DRAFT")).toBe(true);
    expect(canEditReport("SUBMITTED")).toBe(true);
    expect(canEditReport("REVIEWED")).toBe(true);
    expect(canEditReport("NEED_REVISION")).toBe(true);
  });
});

describe("validateSubmitReadiness", () => {
  it("rejects missing summary", () => {
    const result = validateSubmitReadiness({ summary: "", nextWeekPlan: "Plan" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/summary/i);
    }
  });

  it("rejects whitespace-only summary", () => {
    const result = validateSubmitReadiness({ summary: "   ", nextWeekPlan: "Plan" });
    expect(result.ok).toBe(false);
  });

  it("rejects missing next week plan", () => {
    const result = validateSubmitReadiness({ summary: "Done", nextWeekPlan: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/next week plan/i);
    }
  });

  it("accepts when both fields are present", () => {
    expect(validateSubmitReadiness({ summary: "Done", nextWeekPlan: "Continue" })).toEqual({ ok: true });
  });
});
