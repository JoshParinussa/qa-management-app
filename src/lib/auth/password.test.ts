import { describe, expect, it } from "vitest";
import { generateRandomPassword } from "./password";

describe("generateRandomPassword", () => {
  it("generates a password of at least 12 characters", () => {
    const password = generateRandomPassword();
    expect(password.length).toBeGreaterThanOrEqual(12);
  });

  it("generates a different password each call", () => {
    const a = generateRandomPassword();
    const b = generateRandomPassword();
    expect(a).not.toBe(b);
  });

  it("does not equal the default seed password", () => {
    const password = generateRandomPassword();
    expect(password).not.toBe("password123");
  });
});
