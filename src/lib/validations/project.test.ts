import { describe, expect, it } from "vitest";
import { projectSchema } from "./project";

describe("projectSchema", () => {
  it("accepts a valid project payload", () => {
    const result = projectSchema.safeParse({
      name: "UHealth Frontend",
      code: "UHF",
      description: "Frontend QA coverage",
      status: "ACTIVE",
      weeklyReportRequired: true,
    });

    expect(result.success).toBe(true);
  });

  it("requires a reason when weekly report is disabled", () => {
    const result = projectSchema.safeParse({
      name: "Maintenance Project",
      code: "MNT",
      status: "ACTIVE",
      weeklyReportRequired: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a maintenance-only project without weekly reporting", () => {
    const result = projectSchema.safeParse({
      name: "Maintenance Project",
      code: "MNT",
      status: "ACTIVE",
      weeklyReportRequired: false,
      weeklyReportDisabledReason: "MAINTENANCE_ONLY",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a code with invalid characters", () => {
    const result = projectSchema.safeParse({
      name: "UHealth Frontend",
      code: "uh f!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name that is too short", () => {
    const result = projectSchema.safeParse({
      name: "U",
      code: "UHF",
    });

    expect(result.success).toBe(false);
  });
});
