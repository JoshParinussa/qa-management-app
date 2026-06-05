import { describe, expect, it } from "vitest";
import { aggregateTopBlockers, countByStatus, scopeReportsForRole } from "./aggregate";

describe("countByStatus", () => {
  it("counts reports per status", () => {
    const result = countByStatus([
      { status: "DRAFT" },
      { status: "SUBMITTED" },
      { status: "SUBMITTED" },
      { status: "APPROVED" },
    ]);
    expect(result.DRAFT).toBe(1);
    expect(result.SUBMITTED).toBe(2);
    expect(result.APPROVED).toBe(1);
    expect(result.NEED_REVISION).toBe(0);
    expect(result.REVIEWED).toBe(0);
  });

  it("returns all-zero for empty input", () => {
    const result = countByStatus([]);
    expect(result.DRAFT).toBe(0);
    expect(result.APPROVED).toBe(0);
  });
});

describe("aggregateTopBlockers", () => {
  it("counts and sorts blockers by frequency", () => {
    const result = aggregateTopBlockers([
      { blocker: "Flaky test" },
      { blocker: "Env down" },
      { blocker: "Flaky test" },
      { blocker: "  " },
      { blocker: null },
    ]);
    expect(result[0]).toEqual({ blocker: "Flaky test", value: 2 });
    expect(result[1]).toEqual({ blocker: "Env down", value: 1 });
    expect(result).toHaveLength(2);
  });

  it("respects the limit", () => {
    const rows = [{ blocker: "a" }, { blocker: "b" }, { blocker: "c" }];
    expect(aggregateTopBlockers(rows, 2)).toHaveLength(2);
  });

  it("counts JSON-array blocker items without splitting multiline text", () => {
    const result = aggregateTopBlockers([
      { blocker: JSON.stringify(["Flaky test\nNeeds rerun", "Env down"]) },
      { blocker: JSON.stringify(["Flaky test\nNeeds rerun"]) },
    ]);

    expect(result[0]).toEqual({ blocker: "Flaky test\nNeeds rerun", value: 2 });
    expect(result[1]).toEqual({ blocker: "Env down", value: 1 });
  });
});

describe("scopeReportsForRole", () => {
  const all = [
    { id: "1", createdBy: "u1" },
    { id: "2", createdBy: "u2" },
  ];

  it("returns all reports for reviewer roles", () => {
    expect(scopeReportsForRole(all, "QA_LEAD", "u1")).toHaveLength(2);
    expect(scopeReportsForRole(all, "ADMIN", "u1")).toHaveLength(2);
  });

  it("returns only own reports for qa member", () => {
    const scoped = scopeReportsForRole(all, "QA_MEMBER", "u1");
    expect(scoped).toHaveLength(1);
    expect(scoped[0].id).toBe("1");
  });
});
