import { describe, expect, it } from "vitest";
import { buildRemoveMemberUpdate, hasActiveAssignment } from "./rules";

describe("hasActiveAssignment", () => {
  it("returns true when an active record exists", () => {
    expect(hasActiveAssignment({ id: "x", removedAt: null })).toBe(true);
  });

  it("returns true when removedAt is undefined", () => {
    expect(hasActiveAssignment({ id: "x" })).toBe(true);
  });

  it("returns false when no record", () => {
    expect(hasActiveAssignment(null)).toBe(false);
  });

  it("returns false when record is removed", () => {
    expect(hasActiveAssignment({ id: "x", removedAt: new Date() })).toBe(false);
  });
});

describe("buildRemoveMemberUpdate", () => {
  it("sets removedAt to a Date", () => {
    const update = buildRemoveMemberUpdate();
    expect(update.removedAt).toBeInstanceOf(Date);
  });
});
