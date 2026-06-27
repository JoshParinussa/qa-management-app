import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ExportReportSection, WeeklyReportsExportData } from "./export-data";

const MUTED = "64748b";
const ACCENT = "2563eb";

function filterParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

function bulletParagraphs(items: string[], emptyText: string): Paragraph[] {
  if (items.length === 0) {
    return [new Paragraph({ children: [new TextRun({ text: emptyText, color: MUTED })] })];
  }
  return items.map(
    (item) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: item })],
      }),
  );
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    children: [new TextRun({ text, bold: true })],
  });
}

function metricsTable(metrics: ExportReportSection["metrics"]): Table {
  const rows = metrics.map(
    (metric) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: metric.label, color: MUTED })] })],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: metric.value, bold: true })],
              }),
            ],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
    },
    rows,
  });
}

function reportChildren(report: ExportReportSection): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 20 },
      children: [new TextRun({ text: `${report.title} — ${report.weekRange}` })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `Status: ${report.status}  ·  Reviewed by: ${report.reviewerName}  ·  Approved by: ${report.approverName}`,
          color: MUTED,
          size: 18,
        }),
      ],
    }),
    sectionHeading("Summary"),
    ...bulletParagraphs(report.summary, "-"),
    sectionHeading("Metrics"),
    metricsTable(report.metrics),
    sectionHeading(`Production incidents (${report.incidentCount})`),
  ];

  if (report.incidents.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: report.incidentCount > 0 ? "Belum ada detail incident." : "Tidak ada production incident.",
            color: MUTED,
          }),
        ],
      }),
    );
  } else {
    for (const incident of report.incidents) {
      const suffix = incident.relatedTestCaseId ? ` (${incident.relatedTestCaseId})` : "";
      children.push(
        new Paragraph({
          spacing: { before: 40 },
          children: [new TextRun({ text: `${incident.title || "(tanpa judul)"}${suffix}`, bold: true })],
        }),
      );
      if (incident.description) {
        children.push(new Paragraph({ children: [new TextRun({ text: incident.description })] }));
      }
    }
  }

  if (report.bugDocumentUrl) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Bug document: ${report.bugDocumentUrl}`, color: ACCENT })],
      }),
    );
  }

  children.push(
    sectionHeading("Blocker"),
    ...bulletParagraphs(report.blocker, "Tidak ada blocker."),
    sectionHeading("Next week plan"),
    ...bulletParagraphs(report.nextWeekPlan, "Tidak ada next plan."),
    sectionHeading("Notes"),
    new Paragraph({ children: [new TextRun({ text: report.notes })] }),
  );

  return children;
}

export function buildWeeklyReportsDocument(data: WeeklyReportsExportData): Document {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Weekly QA Reports" })],
    }),
    filterParagraph("Project", data.projectLabel),
    filterParagraph("Status", data.statusLabel),
    filterParagraph("Period", data.periodLabel),
    filterParagraph("Generated", data.generatedAt),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 160, after: 40 },
      children: [new TextRun({ text: `Reports (${data.reportCount})` })],
    }),
  ];

  if (data.reports.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Tidak ada report yang cocok dengan filter ini.", color: MUTED })],
      }),
    );
  } else {
    for (const report of data.reports) {
      children.push(...reportChildren(report));
    }
  }

  return new Document({ sections: [{ children }] });
}

export function renderWeeklyReportsDocx(data: WeeklyReportsExportData): Promise<Buffer> {
  return Packer.toBuffer(buildWeeklyReportsDocument(data));
}
