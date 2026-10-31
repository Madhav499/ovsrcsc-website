import 'server-only';
import { cookies, headers } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_HOURS,
  SESSION_IDLE_REFRESH_MINUTES,
} from '@/lib/constants';
import { db } from '@/lib/db';
import { generateToken, hashIp, sha256, clientIpFromHeaders } from './crypto';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  roles: Array<
    | 'SUPER_ADMIN'
    | 'SECTION_EDITOR'
    | 'CONTENT_CONTRIBUTOR'
    | 'EVENTS_MANAGER'
  >;
  sections: Array<{ sectionId: string; canPublish: boolean }>;
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const userAgent = headerStore.get('user-agent')?.slice(0, 300) ?? null;
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt,
      ipHash: hashIp(ip),
      userAgent,
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return { token, expiresAt };
}

export async function readSession(): Promise<{
  user: SessionUser;
  sessionId: string;
  expiresAt: Date;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        include: {
          roles: true,
          sections: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt <= new Date()) return null;
  if (session.user.status !== 'ACTIVE') return null;

  if (Date.now() - session.lastUsedAt.getTime() > SESSION_IDLE_REFRESH_MINUTES * 60 * 1000) {
    await db.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => undefined);
  }

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      mustChangePassword: session.user.mustChangePassword,
      roles: session.user.roles.map((role) => role.role),
      sections: session.user.sections.map((section) => ({
        sectionId: section.sectionId,
        canPublish: section.canPublish,
      })),
    },
  };
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await db.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
