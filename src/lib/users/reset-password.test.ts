import { describe, expect, it } from "vitest";
import { buildResetPasswordUpdate } from "./rules";

describe("buildResetPasswordUpdate", () => {
  it("forces must_change_password=true on reset", () => {
    const update = buildResetPasswordUpdate("hashed-new-pass");
    expect(update.mustChangePassword).toBe(true);
  });

  it("uses the provided password hash", () => {
    const update = buildResetPasswordUpdate("hashed-new-pass");
    expect(update.passwordHash).toBe("hashed-new-pass");
  });

  it("stamps an updatedAt date", () => {
    const update = buildResetPasswordUpdate("hashed-new-pass");
    expect(update.updatedAt).toBeInstanceOf(Date);
  });
});
