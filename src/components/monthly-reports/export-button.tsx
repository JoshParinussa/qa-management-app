"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({ month, projectId }: { month: string; projectId?: string }) {
  const params = new URLSearchParams({ month });
  if (projectId) params.set("projectId", projectId);

  return (
    <a href={`/api/monthly-reports/export?${params.toString()}`}>
      <Button variant="outline">
        <Download className="size-4" />
        Export Markdown
      </Button>
    </a>
  );
}
