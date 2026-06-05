import type { ReportStatus } from "@/types";

export function formatReportStatus(status: ReportStatus) {
  const lower = status.replaceAll("_", " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

type StagePeople = {
  reviewerName?: string | null;
  approverName?: string | null;
  submitterName?: string | null;
  approvalProgress?: { approved: number; total: number };
};

export function reportStageDescription(status: ReportStatus, people: StagePeople = {}): string {
  switch (status) {
    case "DRAFT":
      return "Belum diajukan untuk approval QA";
    case "PENDING_QA_APPROVAL": {
      const progress = people.approvalProgress;
      if (progress) {
        return `Menunggu approval QA (${progress.approved}/${progress.total})`;
      }
      return "Menunggu approval internal QA";
    }
    case "SUBMITTED": {
      const submitter = people.submitterName?.trim();
      if (submitter) {
        return `Dikirim ke reviewer oleh ${submitter}`;
      }
      return "Menunggu review & approval dari QA Lead";
    }
    case "NEED_REVISION":
      return "Perlu diperbaiki, lalu ajukan approval QA ulang";
    case "REVIEWED":
      return `Sudah direview oleh ${people.reviewerName?.trim() || "QA Lead"}`;
    case "APPROVED":
      return `Disetujui oleh ${people.approverName?.trim() || "QA Lead"}`;
  }
}
