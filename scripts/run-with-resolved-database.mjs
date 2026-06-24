import { spawn } from "node:child_process";
import { Client } from "pg";

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: run-with-resolved-database.mjs <command> [...args]");
  process.exit(1);
}

const targets = [
  { name: "explicit", url: process.env.DATABASE_URL },
  { name: "tailscale", url: process.env.DATABASE_URL_TAILSCALE },
  { name: "lan", url: process.env.DATABASE_URL_LAN },
];

async function canConnect(connectionString) {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 3_000,
  });

  try {
    await client.connect();
    await client.query("select 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function resolveDatabaseUrl() {
  for (const target of targets) {
    if (!target.url) continue;

    if (await canConnect(target.url)) {
      console.error(`Using ${target.name} database`);
      return target.url;
    }
  }

  throw new Error("No database connection available via DATABASE_URL, DATABASE_URL_TAILSCALE, or DATABASE_URL_LAN");
}

try {
  process.env.DATABASE_URL = await resolveDatabaseUrl();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const child = spawn(command, args, {
  env: {
    ...process.env,
    PATH: `node_modules/.bin${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}`,
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
