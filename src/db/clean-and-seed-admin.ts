import { sql } from "drizzle-orm";
import { db, pool } from "./client";
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
  weeklyReports,
} from "./schema";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin12345!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Super Admin";

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

/**
 * Generate a stable, uppercase project code from the human name.
 * Trim to 24 characters to honour the schema's varchar(24) limit and
 * ensure uniqueness for the curated list above.
 */
function deriveCode(name: string): string {
  const compact = name.replace(/\s+/g, "_").toUpperCase();
return compact.length <= 24 ? compact : compact.slice(0, 24);
}

async function main() {
  // Wipe all data (children first to satisfy FKs), reset cleanly.
  await db.execute(
    sql`TRUNCATE TABLE
      ${reportActivities},
      ${reportQaApprovals},
      ${reportAuthors},
      ${reportAttachments},
      ${reportFeedbacks},
  ${weeklyReports},
      ${projectMembers},
      ${projects},
      ${users}
      RESTART IDENTITY CASCADE`,
  );

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await db.insert(users).values({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: "ADMIN",
    passwordHash,
    mustChangePassword: true,
  });

  await db.insert(projects).values(
    PROJECT_NAMES.map((name) => ({
      name,
      code: deriveCode(name),
      status: "ACTIVE" as const,
    })),
  );

  console.log("Database cleaned. Super admin created:");
  console.log(`  email:${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log(`  role: ADMIN`);
  console.log(`Seeded ${PROJECT_NAMES.length} active projects.`);
}

main()
  .finally(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
