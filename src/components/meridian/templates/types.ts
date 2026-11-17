import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';

export interface ContentPageData {
  locale: LocaleCode;
  dict: Dictionary;
  path: string;
  title: string;
  summary?: string;
  bodyHtml: string;
  coverKey: string | null;
  updatedAt: Date;
  isFallback: boolean;
  sectionLabel: string;
  sectionKey: string;
  crumbs: Array<{ label: string; href?: string }>;
  siblings: Array<{ id: string; path: string; title: string }>;
  children: Array<{ id: string; path: string; title: string; summary: string | null; coverKey: string | null }>;
}
