import { describe, expect, it } from "vitest";
import {
  canEditReport,
  detectContentChanges,
  isContentField,
  validateSubmitReadiness,
} from "./rules";

describe("canEditReport", () => {
  it("blocks editing once a report is submitted, reviewed, or approved", () => {
    expect(canEditReport("SUBMITTED")).toBe(false);
    expect(canEditReport("REVIEWED")).toBe(false);
    expect(canEditReport("APPROVED")).toBe(false);
  });

  it("allows editing draft, pending QA approval, and need-revision reports", () => {
    expect(canEditReport("DRAFT")).toBe(true);
    expect(canEditReport("PENDING_QA_APPROVAL")).toBe(true);
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

describe("isContentField", () => {
  it("recognizes whitelisted content fields", () => {
    expect(isContentField("summary")).toBe(true);
    expect(isContentField("nextWeekPlan")).toBe(true);
    expect(isContentField("blocker")).toBe(true);
    expect(isContentField("testCaseBeTotal")).toBe(true);
    expect(isContentField("automationFePassed")).toBe(true);
  });

  it("rejects metadata or unknown fields", () => {
    expect(isContentField("status")).toBe(false);
    expect(isContentField("submittedAt")).toBe(false);
    expect(isContentField("createdBy")).toBe(false);
    expect(isContentField("randomField")).toBe(false);
  });
});

describe("detectContentChanges", () => {
  it("returns empty when nothing changed", () => {
    const prev = { summary: "Same", nextWeekPlan: "Plan" };
    const next = { summary: "Same", nextWeekPlan: "Plan" };
    expect(detectContentChanges(prev, next)).toEqual([]);
  });

  it("detects a single string field change", () => {
    const prev = { summary: "Old", nextWeekPlan: "Same" };
    const next = { summary: "New", nextWeekPlan: "Same" };
    expect(detectContentChanges(prev, next)).toEqual(["summary"]);
  });

  it("detects multiple field changes", () => {
    const prev = { summary: "A", blocker: "B", nextWeekPlan: "C" };
    const next = { summary: "X", blocker: "Y", nextWeekPlan: "C" };
    expect(detectContentChanges(prev, next)).toContain("summary");
    expect(detectContentChanges(prev, next)).toContain("blocker");
    expect(detectContentChanges(prev, next)).not.toContain("nextWeekPlan");
  });

  it("detects undefined → value transitions", () => {
    const prev = {};
    const next = { blocker: "now exists" };
    expect(detectContentChanges(prev, next)).toEqual(["blocker"]);
  });

  it("detects value → null/undefined transitions", () => {
    const prev = { blocker: "had value" };
    const next = { blocker: null };
    expect(detectContentChanges(prev, next)).toEqual(["blocker"]);
  });

  it("treats numerically equal values as equal", () => {
    const prev = { testCaseBeTotal: 10 };
    const next = { testCaseBeTotal: 10 };
    expect(detectContentChanges(prev, next)).toEqual([]);
  });

  it("detects numeric changes", () => {
    const prev = { testCaseBeTotal: 10 };
    const next = { testCaseBeTotal: 12 };
    expect(detectContentChanges(prev, next)).toEqual(["testCaseBeTotal"]);
  });

  it("treats null and undefined as equal", () => {
    const prev = { notes: null };
    const next = { notes: undefined };
    expect(detectContentChanges(prev, next)).toEqual([]);
  });

  it("ignores fields outside the content whitelist", () => {
    const prev = { summary: "same", status: "DRAFT" } as Partial<Record<string, unknown>>;
    const next = { summary: "same", status: "SUBMITTED" } as Partial<Record<string, unknown>>;
    expect(detectContentChanges(prev, next)).toEqual([]);
  });
});
