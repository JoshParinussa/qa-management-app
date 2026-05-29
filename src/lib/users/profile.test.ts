import { describe, expect, it } from "vitest";
import { getInitials, getRoleLabel } from "./profile";

describe("profile helpers", () => {
  it("creates initials from a full name", () => {
    expect(getInitials("Jopa Parinussa")).toBe("JP");
    expect(getInitials("QA Member 1")).toBe("QM");
  });

  it("maps role enum values into readable labels", () => {
    expect(getRoleLabel("ADMIN")).toBe("Admin");
    expect(getRoleLabel("QA_LEAD")).toBe("QA Lead");
    expect(getRoleLabel("QA_MEMBER")).toBe("QA Member");
  });
});
