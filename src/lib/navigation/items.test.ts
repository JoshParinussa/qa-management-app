import { describe, expect, it } from "vitest";
import { getVisiblePlatformItems } from "./items";

describe("getVisiblePlatformItems", () => {
  it("shows admin-only and monthly items for admins", () => {
    expect(getVisiblePlatformItems("ADMIN").map((item) => item.href)).toEqual([
      "/dashboard",
      "/projects",
      "/users",
      "/monthly-reports",
    ]);
  });

  it("shows project, weekly, and monthly items for QA leads", () => {
    expect(getVisiblePlatformItems("QA_LEAD").map((item) => item.href)).toEqual([
      "/dashboard",
      "/projects",
      "/weekly-reports",
      "/monthly-reports",
    ]);
  });

  it("hides users and monthly reports from QA members", () => {
    expect(getVisiblePlatformItems("QA_MEMBER").map((item) => item.href)).toEqual([
      "/dashboard",
      "/projects",
      "/weekly-reports",
    ]);
  });
});
