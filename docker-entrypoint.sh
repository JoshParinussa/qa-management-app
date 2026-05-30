#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

# Apply pending Drizzle migrations.
echo "Running database migrations..."
npx drizzle-kit migrate

# Optionally seed the database (set SEED_ON_START=true).
if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding database..."
  npx tsx src/db/seed.ts
fi

echo "Starting application..."
exec "$@"
