import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.prod", quiet: true });
config({ path: ".env.local", quiet: true });
config({ quiet: true });

const targets = [
  { name: "explicit", url: process.env.DATABASE_URL },
  { name: "tailscale", url: process.env.DATABASE_URL_TAILSCALE },
  { name: "lan", url: process.env.DATABASE_URL_LAN },
];

async function canConnect(connectionString: string) {
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

async function main() {
  for (const target of targets) {
    if (!target.url) continue;

    if (await canConnect(target.url)) {
      console.error(`Using ${target.name} database`);
      console.log(target.url);
      process.exit(0);
    }
  }

  console.error("No database connection available via Tailscale or LAN");
  process.exit(1);
}

void main();
