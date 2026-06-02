import { describe, expect, it } from "vitest";
import { formatMarkdownBullet, parseBulletItems, serializeBulletItems } from "./bullets";

describe("parseBulletItems", () => {
  it("preserves multiline text inside JSON-array bullet items", () => {
    const value = JSON.stringify(["Setup automation backend\nInclude smoke suite", "Setup automation uhealth"]);

    expect(parseBulletItems(value)).toEqual([
      "Setup automation backend\nInclude smoke suite",
      "Setup automation uhealth",
    ]);
  });

  it("keeps legacy newline-delimited text as separate bullet items", () => {
    expect(parseBulletItems("- Blocker 1\n• Blocker 2\nBlocker 3")).toEqual(["Blocker 1", "Blocker 2", "Blocker 3"]);
  });
});

describe("serializeBulletItems", () => {
  it("stores bullet items as JSON array string", () => {
    expect(serializeBulletItems(["Plan 1\nDetail", "", "Plan 2"])).toBe(JSON.stringify(["Plan 1\nDetail", "Plan 2"]));
  });
});

describe("formatMarkdownBullet", () => {
  it("indents continuation lines for multiline bullet items", () => {
    expect(formatMarkdownBullet("Plan 1\nDetail line")).toBe("- Plan 1\n  Detail line");
  });
});
