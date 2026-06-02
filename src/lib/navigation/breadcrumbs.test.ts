import { describe, expect, it } from "vitest";
import { getBreadcrumbItems } from "./breadcrumbs";

describe("getBreadcrumbItems", () => {
  it("labels top-level routes", () => {
    expect(getBreadcrumbItems("/projects")).toEqual([{ label: "Projects", href: "/projects", current: true }]);
    expect(getBreadcrumbItems("/weekly-reports")).toEqual([{ label: "Weekly reports", href: "/weekly-reports", current: true }]);
  });

  it("labels nested detail and edit routes", () => {
    expect(getBreadcrumbItems("/projects/abc/edit")).toEqual([
      { label: "Projects", href: "/projects", current: false },
      { label: "Detail", href: "/projects/abc", current: false },
      { label: "Edit", href: "/projects/abc/edit", current: true },
    ]);
  });

  it("labels create routes", () => {
    expect(getBreadcrumbItems("/weekly-reports/new")).toEqual([
      { label: "Weekly reports", href: "/weekly-reports", current: false },
      { label: "New", href: "/weekly-reports/new", current: true },
    ]);
  });
});
