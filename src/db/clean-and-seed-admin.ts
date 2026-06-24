import { config } from "dotenv";
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

config({ path: ".env.prod", quiet: true });
config({ path: ".env.local", quiet: true });
config({ quiet: true });

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const ADMIN_EMAIL = requiredEnv("ADMIN_EMAIL");
const ADMIN_NAME = requiredEnv("ADMIN_NAME");
const DEFAULT_USER_PASSWORD = requiredEnv("DEFAULT_USER_PASSWORD");

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

  const passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);

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
