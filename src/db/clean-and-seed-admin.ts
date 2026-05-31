import { sql } from "drizzle-orm";
import { db, pool } from "./client";
import { hashPassword } from "@/lib/auth/password";
import {
  projectMembers,
  projects,
  reportAttachments,
  reportFeedbacks,
  users,
  weeklyReports,
} from "./schema";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin12345!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Super Admin";

async function main() {
  // Wipe all data (children first to satisfy FKs), reset cleanly.
  await db.execute(
    sql`TRUNCATE TABLE
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
    mustChangePassword: false,
  });

  console.log("Database cleaned. Super admin created:");
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log(`  role:     ADMIN`);
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
