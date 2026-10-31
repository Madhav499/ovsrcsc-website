import 'server-only';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { clientIpFromHeaders, hashIp } from '@/server/auth/crypto';

interface AuditInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditInput): Promise<void> {
  let ipHash: string | null = null;
  try {
    const headerStore = await headers();
    ipHash = hashIp(clientIpFromHeaders(headerStore));
  } catch {
    ipHash = null;
  }

  try {
    await db.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary.slice(0, 500),
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        ipHash,
      },
    });
  } catch (error) {
    console.error('[audit-log-write-failed]', error instanceof Error ? error.message : 'unknown');
  }
}
