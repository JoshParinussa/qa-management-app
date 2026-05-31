import { describe, expect, it } from "vitest";
import { getPaginationRange } from "./pagination";

describe("getPaginationRange", () => {
  it("lists all pages when total is small", () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows leading pages with trailing ellipsis", () => {
    expect(getPaginationRange(1, 10)).toEqual([1, 2, 3, "...", 10]);
  });

  it("shows trailing pages with leading ellipsis", () => {
    expect(getPaginationRange(10, 10)).toEqual([1, "...", 8, 9, 10]);
  });

  it("shows both ellipses in the middle", () => {
    expect(getPaginationRange(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("returns single page for total of 1", () => {
    expect(getPaginationRange(1, 1)).toEqual([1]);
  });
});
