// Factories for user-owned records. Repositories stay dumb persistence;
// all id/timestamp generation happens here, called from store actions.

import type { BaseRecord } from '@/types/domain';

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function baseRecord(): BaseRecord {
  const now = nowIso();
  return { id: newId(), createdAt: now, updatedAt: now };
}

/** Return a copy with a fresh updatedAt. */
export function touched<T extends BaseRecord>(record: T): T {
  return { ...record, updatedAt: nowIso() };
}
