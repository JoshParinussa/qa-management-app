import { config } from "dotenv";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import { uuidv7 } from "uuidv7";
import { STABLE_PASSWORD } from "./helpers";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const candidates = [
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_TAILSCALE,
  process.env.DATABASE_URL_LAN,
].filter((v): v is string => Boolean(v));

async function pickConnectionString() {
  for (const url of candidates) {
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 3_000 });
    try {
      await client.connect();
      await client.query("select 1");
      await client.end();
      return url;
    } catch {
      await client.end().catch(() => undefined);
    }
  }
  throw new Error("E2E global-setup: no reachable DATABASE_URL candidate");
}

const SEED_USERS = [
  { name: "Jopa", email: "jopa@example.com", role: "ADMIN" as const },
  { name: "QA Lead", email: "lead@example.com", role: "QA_LEAD" as const },
  { name: "QA Member 1", email: "qa1@example.com", role: "QA_MEMBER" as const },
  { name: "QA Member 2", email: "qa2@example.com", role: "QA_MEMBER" as const },
];

const SEED_PROJECTS = [
  { code: "UHF", name: "UHealth Frontend", description: "Frontend QA coverage" },
  { code: "UHB", name: "UHealth Backend", description: "Backend QA coverage" },
  { code: "AUTOPIPE", name: "Automation Pipeline", description: "Automation pipeline coverage" },
];

export default async function globalSetup() {
  const url = await pickConnectionString();
  process.env.DATABASE_URL = url;

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    // Wipe semua data app, bukan struktur. RESTART IDENTITY tidak diperlukan
    // (PK pakai uuid), CASCADE memastikan FK tertangani.
    await client.query(`
      TRUNCATE TABLE
        report_attachments,
        report_feedbacks,
        weekly_reports,
        project_members,
        projects,
        users
      CASCADE
    `);

    // Seed users dengan password stabil + bypass forced-change-password.
    // Catatan: ini override khusus fixture E2E. db:seed produksi tetap
    // mengikuti PRD (mustChangePassword=true).
    const passwordHash = await bcrypt.hash(STABLE_PASSWORD, 12);

    const userIds: Record<string, string> = {};

    for (const u of SEED_USERS) {
      const id = uuidv7();
      userIds[u.email] = id;
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, is_active, must_change_password)
         VALUES ($1,$2,$3,$4,$5,true,false)`,
        [id, u.name, u.email, passwordHash, u.role],
      );
    }

    const projectIds: Record<string, string> = {};
    for (const p of SEED_PROJECTS) {
      const id = uuidv7();
      projectIds[p.code] = id;
      await client.query(
        `INSERT INTO projects (id, code, name, description, status)
         VALUES ($1,$2,$3,$4,'ACTIVE')`,
        [id, p.code, p.name, p.description],
      );
    }

    const memberships: Array<{ project: string; email: string; role: "QA_PIC" | "QA_MEMBER" }> = [
      { project: "UHF", email: "lead@example.com", role: "QA_PIC" },
      { project: "UHB", email: "lead@example.com", role: "QA_PIC" },
      { project: "AUTOPIPE", email: "lead@example.com", role: "QA_PIC" },
      { project: "UHF", email: "qa1@example.com", role: "QA_MEMBER" },
      { project: "UHB", email: "qa2@example.com", role: "QA_MEMBER" },
    ];

    for (const m of memberships) {
      await client.query(
        `INSERT INTO project_members (id, project_id, user_id, assignment_role)
         VALUES ($1,$2,$3,$4)`,
        [uuidv7(), projectIds[m.project], userIds[m.email], m.role],
      );
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}
