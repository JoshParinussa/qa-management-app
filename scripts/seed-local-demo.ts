import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { hashPassword } from "@/lib/auth/password";
import {
  projectMembers,
  projects,
  reportActivities,
  reportAttachments,
  reportAuthors,
  reportFeedbacks,
  reportQaApprovals,
  users,
  weeklyReportReservations,
  weeklyReports,
} from "@/db/schema";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const ADMIN = {
  name: "Josh Yehezkiel Nusera Parinussa",
  email: "yehezkieljosh@gmail.com",
  role: "ADMIN" as const,
};

const DEMO_USERS = [
  { name: "QA Lead Demo", email: "lead.demo@example.com", role: "QA_LEAD" as const },
  { name: "QA Member Demo 1", email: "qa.demo1@example.com", role: "QA_MEMBER" as const },
  { name: "QA Member Demo 2", email: "qa.demo2@example.com", role: "QA_MEMBER" as const },
  { name: "QA Member Demo 3", email: "qa.demo3@example.com", role: "QA_MEMBER" as const },
];

const PROJECT_NAMES = [
  "ISAFE BIB",
  "ISAFE SUMATERA",
  "UHEALTH",
  "FAMS BIB",
  "FAMS SUMATERA",
  "FAMS HRB",
  "FAMS DANAMAS",
  "SIDARA",
  "ICORE",
  "UBUDGET",
  "UCONTRACT",
  "URISE",
  "SYNOVA",
  "P3L",
  "BIB ACADEMY GEMS UNIV",
  "CMS",
  "ESG",
  "INTEROPERABILITY",
  "IPERMIT",
  "ISS",
  "MITIGASI",
] as const;

function deriveCode(name: string): string {
  const compact = name.replace(/\s+/g, "_").toUpperCase();
  return compact.length <= 24 ? compact : compact.slice(0, 24);
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const passwordHash = await hashPassword(requireEnv("DEFAULT_USER_PASSWORD"));

  await db.execute(
    sql`TRUNCATE TABLE
      ${reportActivities},
      ${reportQaApprovals},
      ${reportAuthors},
      ${reportAttachments},
      ${reportFeedbacks},
      ${weeklyReportReservations},
      ${weeklyReports},
      ${projectMembers},
      ${projects},
      ${users}
      RESTART IDENTITY CASCADE`,
  );

  const [admin, lead, qa1, qa2, qa3] = await db
    .insert(users)
    .values([ADMIN, ...DEMO_USERS].map((user) => ({ ...user, passwordHash, isActive: true, mustChangePassword: true })))
    .returning();

  const seededProjects = await db
    .insert(projects)
    .values(
      PROJECT_NAMES.map((name) => ({
        name,
        code: deriveCode(name),
        status: "ACTIVE" as const,
        weeklyReportRequired: true,
      })),
    )
    .returning();

  const projectByName = new Map(seededProjects.map((project) => [project.name, project]));
  const project = (name: (typeof PROJECT_NAMES)[number]) => {
    const value = projectByName.get(name);
    if (!value) throw new Error(`Project ${name} not seeded`);
    return value;
  };

  await db.insert(projectMembers).values([
    { projectId: project("UHEALTH").id, userId: lead.id, assignmentRole: "QA_PIC" },
    { projectId: project("CMS").id, userId: lead.id, assignmentRole: "QA_PIC" },
    { projectId: project("ISAFE BIB").id, userId: lead.id, assignmentRole: "QA_PIC" },
    { projectId: project("FAMS BIB").id, userId: lead.id, assignmentRole: "QA_PIC" },
    { projectId: project("UHEALTH").id, userId: qa1.id, assignmentRole: "QA_MEMBER" },
    { projectId: project("CMS").id, userId: qa2.id, assignmentRole: "QA_MEMBER" },
    { projectId: project("ISAFE BIB").id, userId: qa3.id, assignmentRole: "QA_MEMBER" },
  ]);

  console.log("Local demo database seeded.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Dummy users: ${[lead, qa1, qa2, qa3].map((user) => user.email).join(", ")}`);
  console.log(`Projects: ${seededProjects.length}`);
}

main()
  .finally(async () => {
    await pool.end();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
