import { describe, expect, it } from "vitest";
import { canDeactivateUser } from "./rules";

describe("canDeactivateUser", () => {
  it("allows deactivating a non-admin", () => {
    expect(canDeactivateUser({ role: "QA_MEMBER", isActive: true }, 5)).toEqual({ ok: true });
    expect(canDeactivateUser({ role: "QA_LEAD", isActive: true }, 1)).toEqual({ ok: true });
  });

  it("allows deactivating an admin when more than one active admin remains", () => {
    expect(canDeactivateUser({ role: "ADMIN", isActive: true }, 3)).toEqual({ ok: true });
  });

  it("blocks deactivating the last active admin", () => {
    expect(canDeactivateUser({ role: "ADMIN", isActive: true }, 1)).toEqual({
      ok: false,
      error: "Tidak bisa menonaktifkan admin terakhir.",
    });
  });

  it("allows when target admin is already inactive (no real change)", () => {
    expect(canDeactivateUser({ role: "ADMIN", isActive: false }, 1)).toEqual({ ok: true });
  });
});
