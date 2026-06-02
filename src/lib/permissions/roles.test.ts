import { describe, expect, it } from "vitest";
import { can, canSeeAllProjects, canManageProjects } from "./roles";

describe("permission matrix", () => {
  it("allows admin and qa lead to manage projects", () => {
    expect(canManageProjects("ADMIN")).toBe(true);
    expect(canManageProjects("QA_LEAD")).toBe(true);
  });

  it("blocks qa member from managing projects", () => {
    expect(canManageProjects("QA_MEMBER")).toBe(false);
  });

  it("allows only admins and qa leads to see every project", () => {
    expect(canSeeAllProjects("ADMIN")).toBe(true);
    expect(canSeeAllProjects("QA_LEAD")).toBe(true);
    expect(canSeeAllProjects("QA_MEMBER")).toBe(false);
  });

  it("lets every role read projects", () => {
    expect(can("ADMIN", "project:read")).toBe(true);
    expect(can("QA_LEAD", "project:read")).toBe(true);
    expect(can("QA_MEMBER", "project:read")).toBe(true);
  });
});
