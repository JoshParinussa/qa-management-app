import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ExportReportSection, WeeklyReportsExportData } from "./export-data";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
    lineHeight: 1.4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  filterBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  filterLabel: {
    fontFamily: "Helvetica-Bold",
    width: 70,
  },
  reportCount: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  empty: {
    fontSize: 11,
    color: "#64748b",
  },
  report: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  reportHeader: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  reportMeta: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 3,
    color: "#1e293b",
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bulletDot: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  muted: {
    color: "#64748b",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricCell: {
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1,
    paddingRight: 12,
  },
  metricLabel: {
    color: "#475569",
  },
  metricValue: {
    fontFamily: "Helvetica-Bold",
  },
  incident: {
    marginBottom: 3,
  },
  incidentTitle: {
    fontFamily: "Helvetica-Bold",
  },
  link: {
    color: "#2563eb",
  },
});

function Bullets({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return <Text style={styles.muted}>{emptyText}</Text>;
  }
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ReportBlock({ report }: { report: ExportReportSection }) {
  return (
    <View style={styles.report} wrap={false}>
      <Text style={styles.reportHeader}>
        {report.title} — {report.weekRange}
      </Text>
      <Text style={styles.reportMeta}>
        Status: {report.status}  ·  Reviewed by: {report.reviewerName}  ·  Approved by: {report.approverName}
      </Text>

      <Text style={styles.sectionTitle}>Summary</Text>
      <Bullets items={report.summary} emptyText="-" />

      <Text style={styles.sectionTitle}>Metrics</Text>
      <View style={styles.metricsGrid}>
        {report.metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCell}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Production incidents ({report.incidentCount})</Text>
      {report.incidents.length === 0 ? (
        <Text style={styles.muted}>
          {report.incidentCount > 0 ? "Belum ada detail incident." : "Tidak ada production incident."}
        </Text>
      ) : (
        <View>
          {report.incidents.map((incident, i) => (
            <View key={i} style={styles.incident}>
              <Text style={styles.incidentTitle}>
                {incident.title || "(tanpa judul)"}
                {incident.relatedTestCaseId ? ` (${incident.relatedTestCaseId})` : ""}
              </Text>
              {incident.description ? <Text>{incident.description}</Text> : null}
            </View>
          ))}
        </View>
      )}
      {report.bugDocumentUrl ? (
        <Text style={styles.link}>Bug document: {report.bugDocumentUrl}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Blocker</Text>
      <Bullets items={report.blocker} emptyText="Tidak ada blocker." />

      <Text style={styles.sectionTitle}>Next week plan</Text>
      <Bullets items={report.nextWeekPlan} emptyText="Tidak ada next plan." />

      <Text style={styles.sectionTitle}>Notes</Text>
      <Text>{report.notes}</Text>
    </View>
  );
}

export function WeeklyReportsDocument({ data }: { data: WeeklyReportsExportData }) {
  return (
    <Document title="Weekly QA Reports">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Weekly QA Reports</Text>

        <View style={styles.filterBox}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Project</Text>
            <Text>{data.projectLabel}</Text>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status</Text>
            <Text>{data.statusLabel}</Text>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Period</Text>
            <Text>{data.periodLabel}</Text>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Generated</Text>
            <Text>{data.generatedAt}</Text>
          </View>
        </View>

        <Text style={styles.reportCount}>Reports ({data.reportCount})</Text>

        {data.reports.length === 0 ? (
          <Text style={styles.empty}>Tidak ada report yang cocok dengan filter ini.</Text>
        ) : (
          data.reports.map((report, i) => <ReportBlock key={i} report={report} />)
        )}
      </Page>
    </Document>
  );
}

export function renderWeeklyReportsPdf(data: WeeklyReportsExportData): Promise<Buffer> {
  return renderToBuffer(<WeeklyReportsDocument data={data} />);
}
