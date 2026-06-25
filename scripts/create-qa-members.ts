import { eq } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

const qaMembers = [
  { name: "Ardhi", email: "ardhi@code.id" },
  { name: "Dania Rani", email: "dania3rani@gmail.com" },
  { name: "Ali Naufal", email: "alinaufal00@gmail.com" },
  { name: "Cut Syarifah Akbar", email: "cutsyarifahakbar@gmail.com" },
  { name: "Dswatans", email: "dswatans@gmail.com" },
  { name: "Mimi Aisyah", email: "mimi.aisyah@bening-semesta.com" },
  { name: "Nur Andia", email: "nur.andia95@gmail.com" },
  { name: "Ratna Ardina", email: "ratna.ardina@bening-semesta.com" },
  { name: "Septianar", email: "septianar997@gmail.com" },
  { name: "Teddy Ariansyah", email: "teddyariansyah29@gmail.com" },
] as const;

async function main() {
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD?.trim();
  if (!defaultPassword) {
    throw new Error("DEFAULT_USER_PASSWORD is required");
  }

  const passwordHash = await hashPassword(defaultPassword);
  const result = { created: 0, updated: 0 };

  for (const member of qaMembers) {
    const email = member.email.toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing) {
      await db
        .update(users)
        .set({
          name: member.name,
          role: "QA_MEMBER",
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
      result.updated += 1;
      console.log(`updated ${email}`);
      continue;
    }

    await db.insert(users).values({
      name: member.name,
      email,
      role: "QA_MEMBER",
      isActive: true,
      passwordHash,
      mustChangePassword: true,
    });
    result.created += 1;
    console.log(`created ${email}`);
  }

  console.log(`done: ${result.created} created, ${result.updated} updated`);
}

main()
  .finally(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
