import { describe, expect, it } from "vitest";
import { ACTIVITY_ACTIONS, type ActivityAction } from "./activity";

describe("ACTIVITY_ACTIONS", () => {
  it("exposes all action keys defined in the spec", () => {
    expect(ACTIVITY_ACTIONS.CREATED).toBe("CREATED");
    expect(ACTIVITY_ACTIONS.EDITED).toBe("EDITED");
    expect(ACTIVITY_ACTIONS.QA_APPROVAL_REQUESTED).toBe("QA_APPROVAL_REQUESTED");
    expect(ACTIVITY_ACTIONS.QA_APPROVED).toBe("QA_APPROVED");
    expect(ACTIVITY_ACTIONS.QA_APPROVAL_REVOKED).toBe("QA_APPROVAL_REVOKED");
    expect(ACTIVITY_ACTIONS.SUBMITTED_TO_REVIEWER).toBe("SUBMITTED_TO_REVIEWER");
    expect(ACTIVITY_ACTIONS.REVIEWED).toBe("REVIEWED");
    expect(ACTIVITY_ACTIONS.REVISION_REQUESTED).toBe("REVISION_REQUESTED");
    expect(ACTIVITY_ACTIONS.APPROVED).toBe("APPROVED");
  });

  it("ActivityAction type covers all values", () => {
    const all: ActivityAction[] = [
      "CREATED",
      "EDITED",
      "QA_APPROVAL_REQUESTED",
      "QA_APPROVED",
      "QA_APPROVAL_REVOKED",
      "SUBMITTED_TO_REVIEWER",
      "REVIEWED",
      "REVISION_REQUESTED",
      "APPROVED",
    ];
    expect(all).toHaveLength(9);
  });
});
