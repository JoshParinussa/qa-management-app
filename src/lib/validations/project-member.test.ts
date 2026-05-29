import { describe, expect, it } from "vitest";
import { assignMemberSchema } from "./project-member";

describe("assignMemberSchema", () => {
  it("accepts a valid assignment payload", () => {
    const result = assignMemberSchema.safeParse({
      userId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      assignmentRole: "QA_MEMBER",
    });
    expect(result.success).toBe(true);
  });

  it("defaults assignment role to QA_MEMBER", () => {
    const result = assignMemberSchema.safeParse({
      userId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignmentRole).toBe("QA_MEMBER");
    }
  });

  it("rejects an invalid assignment role", () => {
    const result = assignMemberSchema.safeParse({
      userId: "018f0b3c-1d2e-7a3b-8c4d-5e6f70819293",
      assignmentRole: "OWNER",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid user id", () => {
    const result = assignMemberSchema.safeParse({ userId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
