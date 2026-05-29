import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({ connectionString });
  await client.connect();
  await client.query("drop schema if exists public cascade");
  await client.query("drop schema if exists drizzle cascade");
  await client.query("create schema public");
  await client.query("grant all on schema public to postgres");
  await client.query("grant all on schema public to public");
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
