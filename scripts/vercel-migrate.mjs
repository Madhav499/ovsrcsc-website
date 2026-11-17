/*
 * Applies pending Prisma migrations and the idempotent seed during Vercel
 * production builds, so the deployed code never runs against a database
 * that is missing its schema.
 *
 * Preview deployments share the production database, so they are skipped:
 * an unmerged branch must never migrate production. Any failure fails the
 * build, which keeps the previous healthy deployment live.
 */
import { execSync } from 'node:child_process';

if (process.env.VERCEL_ENV !== 'production') {
  console.log(`[vercel-migrate] Skipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}).`);
  process.exit(0);
}

execSync('npx prisma migrate deploy', { stdio: 'inherit' });
execSync('npx prisma db seed', { stdio: 'inherit' });
