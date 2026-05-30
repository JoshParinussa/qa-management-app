import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth";
import { userSchema } from "./user";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "jopa@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "jopa@example.com", password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("userSchema", () => {
  it("accepts a valid user payload", () => {
    const result = userSchema.safeParse({
      name: "QA Member 1",
      email: "qa1@example.com",
      role: "QA_MEMBER",
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid role", () => {
    const result = userSchema.safeParse({ name: "X", email: "x@example.com", role: "OWNER" });
    expect(result.success).toBe(false);
  });

  it("rejects too-short name", () => {
    const result = userSchema.safeParse({ name: "X", email: "x@example.com", role: "QA_MEMBER" });
    expect(result.success).toBe(false);
  });
});
