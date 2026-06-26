import { config } from "dotenv";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db, pool } from "@/db/client";
import {
  projects,
  reportActivities,
  reportAuthors,
  reportQaApprovals,
  users,
  weeklyReports,
} from "@/db/schema";
import { calculateReportMetrics } from "@/lib/reports/calculator";
import { serializeBulletItems } from "@/lib/reports/bullets";
import type { ReportStatus } from "@/types";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

/**
 * Seeds weekly reports for local checking of the export feature.
 * Idempotent: removes any reports (and their children) within the seeded
 * week window before inserting. Does NOT touch users or projects.
 */

// Mondays used as week starts. Each week runs Mon-Sun.
const WEEK_STARTS = ["2026-06-01", "2026-06-08", "2026-06-15"] as const;
const PROJECT_NAMES = ["UHEALTH", "CMS", "ISAFE BIB"] as const;

type MetricSeed = {
  testCaseTotal: number;
  testCaseBeTotal: number;
  testCaseBeExecuted: number;
  testCaseFeTotal: number;
  testCaseFeExecuted: number;
  automationBeTotal: number;
  automationFeTotal: number;
  automationBePassed: number;
  automationBeFailed: number;
  automationFePassed: number;
  automationFeFailed: number;
};

function metricsFor(seed: MetricSeed) {
  const automationPassed = seed.automationBePassed + seed.automationFePassed;
  const automationFailed = seed.automationBeFailed + seed.automationFeFailed;
  const computed = calculateReportMetrics({ ...seed, automationPassed, automationFailed });
  return {
    ...seed,
    automationPassed,
    automationFailed,
    automationCoverage: String(computed.automationCoverage),
    executionCoverage: String(computed.executionCoverage),
    automationBeCoverage: String(computed.automationBeCoverage),
    automationFeCoverage: String(computed.automationFeCoverage),
    automationBePassRate: String(computed.automationBePassRate),
    automationFePassRate: String(computed.automationFePassRate),
  };
}

function weekDates(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { weekStartDate: start, weekEndDate: end };
}

async function main() {
  const allUsers = await db.select().from(users);
  const byEmail = (email: string) => {
    const u = allUsers.find((row) => row.email === email);
    if (!u) throw new Error(`User ${email} not found. Run db:seed:demo first.`);
    return u;
  };

  const lead = byEmail("lead.demo@example.com");
  const qa1 = byEmail("qa.demo1@example.com");

  const seededProjects = await db
    .select()
    .from(projects)
    .where(inArray(projects.name, [...PROJECT_NAMES]));
  const projectByName = new Map(seededProjects.map((p) => [p.name, p]));
  for (const name of PROJECT_NAMES) {
    if (!projectByName.get(name)) throw new Error(`Project ${name} not found. Run db:seed:demo first.`);
  }

  const projectIds = seededProjects.map((p) => p.id);
  const windowStart = new Date(`${WEEK_STARTS[0]}T00:00:00.000Z`);
  const windowEnd = weekDates(WEEK_STARTS[WEEK_STARTS.length - 1]).weekEndDate;

  // Clean existing reports in the seeded window for these projects (children cascade).
  const existing = await db
    .select({ id: weeklyReports.id })
    .from(weeklyReports)
    .where(
      and(
        inArray(weeklyReports.projectId, projectIds),
        gte(weeklyReports.weekStartDate, windowStart),
        lte(weeklyReports.weekStartDate, windowEnd),
      ),
    );
  if (existing.length > 0) {
    const ids = existing.map((r) => r.id);
    await db.delete(reportActivities).where(inArray(reportActivities.weeklyReportId, ids));
    await db.delete(reportQaApprovals).where(inArray(reportQaApprovals.weeklyReportId, ids));
    await db.delete(reportAuthors).where(inArray(reportAuthors.weeklyReportId, ids));
    await db.delete(weeklyReports).where(inArray(weeklyReports.id, ids));
    console.log(`Removed ${ids.length} existing report(s) in the seed window.`);
  }

  // status matrix: most APPROVED, plus one DRAFT and one SUBMITTED to show filtering.
  const statusPlan: Record<string, ReportStatus> = {
    "UHEALTH|2026-06-01": "APPROVED",
    "UHEALTH|2026-06-08": "APPROVED",
    "UHEALTH|2026-06-15": "SUBMITTED",
    "CMS|2026-06-01": "APPROVED",
    "CMS|2026-06-08": "APPROVED",
    "CMS|2026-06-15": "DRAFT",
    "ISAFE BIB|2026-06-01": "APPROVED",
    "ISAFE BIB|2026-06-08": "APPROVED",
    "ISAFE BIB|2026-06-15": "APPROVED",
  };

  let created = 0;
  for (const name of PROJECT_NAMES) {
    const project = projectByName.get(name)!;
    for (let i = 0; i < WEEK_STARTS.length; i++) {
      const weekStart = WEEK_STARTS[i];
      const status = statusPlan[`${name}|${weekStart}`] ?? "APPROVED";
      const { weekStartDate, weekEndDate } = weekDates(weekStart);
      const isApproved = status === "APPROVED";
      const isSubmittedOrLater = status === "APPROVED" || status === "SUBMITTED";

      const m = metricsFor({
        testCaseTotal: 80 + i * 10,
        testCaseBeTotal: 40 + i * 5,
        testCaseBeExecuted: 38 + i * 5,
        testCaseFeTotal: 40 + i * 5,
        testCaseFeExecuted: 39 + i * 5,
        automationBeTotal: 20 + i * 3,
        automationFeTotal: 22 + i * 3,
        automationBePassed: 18 + i * 3,
        automationBeFailed: 2,
        automationFePassed: 20 + i * 3,
        automationFeFailed: 2,
      });

      const reportId = uuidv7();
      await db.insert(weeklyReports).values({
        id: reportId,
        projectId: project.id,
        createdBy: qa1.id,
        submittedBy: isSubmittedOrLater ? qa1.id : null,
        weekStartDate,
        weekEndDate,
        status,
        summary: serializeBulletItems([
          `Regression testing ${name} selesai untuk minggu ${weekStart}`,
          "Smoke test pada environment staging lulus",
        ]),
        productionIncidentCount: i === 1 ? 1 : 0,
        productionIncidentNotes:
          i === 1
            ? JSON.stringify([
                {
                  title: "Login intermittent error",
                  description: "Token kadaluarsa lebih cepat dari konfigurasi",
                  relatedTestCaseId: "TC-101",
                },
              ])
            : null,
        bugDocumentUrl: i === 1 ? "https://docs.example.com/bug-report" : null,
        testCaseTotal: m.testCaseTotal,
        testCaseBeTotal: m.testCaseBeTotal,
        testCaseBeExecuted: m.testCaseBeExecuted,
        testCaseFeTotal: m.testCaseFeTotal,
        testCaseFeExecuted: m.testCaseFeExecuted,
        automationBeTotal: m.automationBeTotal,
        automationFeTotal: m.automationFeTotal,
        automationBePassed: m.automationBePassed,
        automationBeFailed: m.automationBeFailed,
        automationFePassed: m.automationFePassed,
        automationFeFailed: m.automationFeFailed,
        automationPassed: m.automationPassed,
        automationFailed: m.automationFailed,
        automationBeCoverage: m.automationBeCoverage,
        automationFeCoverage: m.automationFeCoverage,
        automationCoverage: m.automationCoverage,
        automationBePassRate: m.automationBePassRate,
        automationFePassRate: m.automationFePassRate,
        executionCoverage: m.executionCoverage,
        blocker: i === 2 ? serializeBulletItems(["Menunggu akses ke environment UAT"]) : "",
        nextWeekPlan: serializeBulletItems([
          "Mulai automation untuk modul API",
          "Lanjutkan regression untuk fitur baru",
        ]),
        notes: isApproved ? "Approved tanpa catatan tambahan." : null,
        submittedAt: isSubmittedOrLater ? new Date() : null,
        reviewedAt: isApproved ? new Date() : null,
        reviewedBy: isApproved ? lead.id : null,
        approvedAt: isApproved ? new Date() : null,
        approvedBy: isApproved ? lead.id : null,
      });

      // co-authors: qa1 + lead
      await db.insert(reportAuthors).values([
        { weeklyReportId: reportId, userId: qa1.id, assignmentRole: "QA_MEMBER" },
        { weeklyReportId: reportId, userId: lead.id, assignmentRole: "QA_PIC" },
      ]);

      if (isSubmittedOrLater) {
        await db.insert(reportQaApprovals).values([
          { weeklyReportId: reportId, userId: qa1.id },
          { weeklyReportId: reportId, userId: lead.id },
        ]);
      }

      await db.insert(reportActivities).values({
        weeklyReportId: reportId,
        actorId: qa1.id,
        action: "CREATED",
        note: `Seeded ${status} report`,
      });

      created++;
    }
  }

  console.log(`Seeded ${created} weekly reports across ${PROJECT_NAMES.length} projects and ${WEEK_STARTS.length} weeks.`);
  console.log(`Window: ${WEEK_STARTS[0]} .. ${WEEK_STARTS[WEEK_STARTS.length - 1]} (Mon-Sun weeks).`);
}

main()
  .finally(async () => {
    await pool.end();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
