import { describe, expect, it } from "vitest";
import { getPostLoginRedirect, validateNewPassword } from "./flow";

describe("auth flow", () => {
  it("redirects users with default password to change password page", () => {
    expect(getPostLoginRedirect({ mustChangePassword: true })).toBe("/change-password");
  });

  it("redirects users with changed password to dashboard", () => {
    expect(getPostLoginRedirect({ mustChangePassword: false })).toBe("/dashboard");
  });

  it("requires a strong new password and matching confirmation", () => {
    expect(validateNewPassword("short", "short")).toEqual({ ok: false, error: "Password minimal 8 karakter." });
    expect(validateNewPassword("password123", "different123")).toEqual({ ok: false, error: "Konfirmasi password tidak sama." });
    expect(validateNewPassword("password123", "password123")).toEqual({ ok: true });
  });
});
