export const ANNOUNCEMENT_TIMEZONE = 'Asia/Kolkata';

export interface AnnouncementWindow {
  enabled: boolean;
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  startAt: Date | string | null | undefined;
  endAt: Date | string | null | undefined;
  timezone?: string | null;
}

export type AnnouncementDisplayState = 'draft' | 'scheduled' | 'active' | 'expired' | 'disabled';

function toTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Fail-closed eligibility rule. The popup is visible only when it is enabled,
 * published, has a valid start and end time, and now is in [start, end).
 */
export function isAnnouncementActive(
  announcement: AnnouncementWindow,
  now: Date = new Date(),
): boolean {
  if (!announcement.enabled) return false;
  if (announcement.status !== 'PUBLISHED') return false;
  const start = toTime(announcement.startAt);
  const end = toTime(announcement.endAt);
  if (start === null || end === null) return false;
  if (end <= start) return false;
  const current = now.getTime();
  return start <= current && current < end;
}

export function announcementDisplayState(
  announcement: AnnouncementWindow,
  now: Date = new Date(),
): AnnouncementDisplayState {
  if (!announcement.enabled) return 'disabled';
  if (announcement.status !== 'PUBLISHED') return 'draft';
  const start = toTime(announcement.startAt);
  const end = toTime(announcement.endAt);
  if (start === null || end === null || end <= start) return 'disabled';
  const current = now.getTime();
  if (current < start) return 'scheduled';
  if (current >= end) return 'expired';
  return 'active';
}
