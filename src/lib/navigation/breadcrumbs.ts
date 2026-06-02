export type BreadcrumbItem = {
  label: string;
  href: string;
  current: boolean;
};

const rootLabels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  users: "Users",
  profile: "Profile settings",
  "weekly-reports": "Weekly reports",
  "monthly-reports": "Monthly reports",
};

function segmentLabel(segment: string) {
  if (segment === "new") return "New";
  if (segment === "edit") return "Edit";
  return "Detail";
}

export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard", current: true }];
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = index === 0 ? rootLabels[segment] ?? segmentLabel(segment) : segmentLabel(segment);

    return {
      label,
      href,
      current: index === segments.length - 1,
    };
  });
}
