import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

try {
  process.loadEnvFile('.env');
} catch {
  // Environment variables may already be provided by the shell.
}

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !name || !password) {
    throw new Error(
      'Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD before running npm run admin:create.',
    );
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  }
  const categories = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  if (categories < 3) {
    throw new Error(
      'ADMIN_PASSWORD must contain at least three of: lowercase, uppercase, numbers and symbols.',
    );
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const existing = await prisma.user.findUnique({ where: { email }, include: { roles: true } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          roles: {
            upsert: {
              where: { userId_role: { userId: existing.id, role: 'SUPER_ADMIN' } },
              create: { role: 'SUPER_ADMIN' },
              update: {},
            },
          },
        },
      })
    : await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          roles: { create: { role: 'SUPER_ADMIN' } },
        },
      });

  console.log(`${existing ? 'Updated' : 'Created'} SUPER_ADMIN account: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
