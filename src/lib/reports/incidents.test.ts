import { describe, expect, it } from "vitest";
import { parseIncidentCountInput, parseIncidents, syncIncidentItemsToCount } from "./incidents";

describe("parseIncidents", () => {
  it("parses related test case IDs from incident JSON", () => {
    const incidents = parseIncidents(JSON.stringify([
      { title: "Bug A", description: "Detail", relatedTestCaseId: "TC-BE-001" },
    ]));

    expect(incidents).toEqual([
      { title: "Bug A", description: "Detail", relatedTestCaseId: "TC-BE-001" },
    ]);
  });

  it("defaults missing related test case IDs for legacy incident JSON", () => {
    const incidents = parseIncidents(JSON.stringify([{ title: "Bug A", description: "Detail" }]));

    expect(incidents).toEqual([
      { title: "Bug A", description: "Detail", relatedTestCaseId: "" },
    ]);
  });
});

describe("parseIncidentCountInput", () => {
  it("treats blank and invalid values as zero", () => {
    expect(parseIncidentCountInput("")).toBe(0);
    expect(parseIncidentCountInput("abc")).toBe(0);
    expect(parseIncidentCountInput("-1")).toBe(0);
  });

  it("uses whole non-negative numbers", () => {
    expect(parseIncidentCountInput("3")).toBe(3);
    expect(parseIncidentCountInput("2.7")).toBe(2);
  });
});

describe("syncIncidentItemsToCount", () => {
  it("expands incidents to the requested count", () => {
    expect(syncIncidentItemsToCount([{ title: "A", description: "Detail", relatedTestCaseId: "TC-1" }], 3)).toEqual([
      { title: "A", description: "Detail", relatedTestCaseId: "TC-1" },
      { title: "", description: "", relatedTestCaseId: "" },
      { title: "", description: "", relatedTestCaseId: "" },
    ]);
  });

  it("trims incidents to the requested count", () => {
    expect(syncIncidentItemsToCount([
      { title: "A", description: "", relatedTestCaseId: "TC-1" },
      { title: "B", description: "", relatedTestCaseId: "TC-2" },
    ], 1)).toEqual([{ title: "A", description: "", relatedTestCaseId: "TC-1" }]);
  });

  it("returns no cards for zero incidents", () => {
    expect(syncIncidentItemsToCount([{ title: "A", description: "", relatedTestCaseId: "TC-1" }], 0)).toEqual([]);
  });
});
