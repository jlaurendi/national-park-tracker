// Supabase-backed implementations of the repository interfaces (cloud mode).
// Same contracts as the Dexie versions; RLS scopes every query to the
// signed-in user, so no user_id filters are needed here.

import type { SupabaseClient } from '@supabase/supabase-js';
import { nowIso } from '@/lib/records';
import type {
  EarnedBadge,
  ExportBundle,
  Goal,
  Photo,
  Trip,
  Visit,
} from '@/types/domain';
import type { CrudRepository, PhotoRepository, Repositories } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any -- row mappers bridge untyped PostgREST rows */

// ---------- row mappers (snake_case rows ↔ camelCase domain records) ----------

/** Normalize Postgres timestamptz ('...+00:00') to the app's '...Z' format. */
function iso(value: string): string {
  return new Date(value).toISOString();
}

function omitNulls<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null)) as T;
}

const visitMap = {
  toRow: (v: Visit) => ({
    id: v.id,
    park_id: v.parkId,
    start_date: v.startDate,
    end_date: v.endDate ?? null,
    rating: v.rating ?? null,
    notes: v.notes ?? null,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  }),
  fromRow: (r: any): Visit =>
    omitNulls({
      id: r.id,
      parkId: r.park_id,
      startDate: r.start_date,
      endDate: r.end_date,
      rating: r.rating,
      notes: r.notes,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }) as Visit,
};

const tripMap = {
  toRow: (t: Trip) => ({
    id: t.id,
    name: t.name,
    notes: t.notes ?? null,
    status: t.status,
    start_date: t.startDate ?? null,
    end_date: t.endDate ?? null,
    stops: t.stops,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }),
  fromRow: (r: any): Trip =>
    omitNulls({
      id: r.id,
      name: r.name,
      notes: r.notes,
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date,
      stops: r.stops ?? [],
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }) as Trip,
};

const goalMap = {
  toRow: (g: Goal) => ({
    id: g.id,
    type: g.type,
    name: g.name,
    target_count: g.targetCount ?? null,
    park_ids: g.parkIds ?? null,
    target_date: g.targetDate ?? null,
    achieved_at: g.achievedAt ?? null,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  }),
  fromRow: (r: any): Goal =>
    omitNulls({
      id: r.id,
      type: r.type,
      name: r.name,
      targetCount: r.target_count,
      parkIds: r.park_ids,
      targetDate: r.target_date,
      achievedAt: r.achieved_at ? iso(r.achieved_at) : null,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }) as Goal,
};

const earnedBadgeMap = {
  toRow: (e: EarnedBadge) => ({
    id: e.id,
    badge_id: e.badgeId,
    earned_at: e.earnedAt,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  }),
  fromRow: (r: any): EarnedBadge => ({
    id: r.id,
    badgeId: r.badge_id,
    earnedAt: iso(r.earned_at),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  }),
};

const photoMap = {
  toRow: (p: Photo) => ({
    id: p.id,
    visit_id: p.visitId,
    park_id: p.parkId,
    caption: p.caption ?? null,
    taken_on: p.takenOn ?? null,
    width: p.width,
    height: p.height,
    mime_type: p.mimeType,
    size_bytes: p.sizeBytes,
    sort_order: p.sortOrder,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }),
  fromRow: (r: any): Photo =>
    omitNulls({
      id: r.id,
      visitId: r.visit_id,
      parkId: r.park_id,
      caption: r.caption,
      takenOn: r.taken_on,
      width: r.width,
      height: r.height,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
      sortOrder: r.sort_order,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }) as Photo,
};

/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- generic table repo ----------

interface RowMap<T> {
  toRow: (record: T) => Record<string, unknown>;
  fromRow: (row: unknown) => T;
}

function tableRepo<T extends { id: string }>(
  client: SupabaseClient,
  table: string,
  map: RowMap<T>,
): CrudRepository<T> {
  return {
    async getAll() {
      const { data, error } = await client.from(table).select('*');
      if (error) throw new Error(`Loading ${table} failed: ${error.message}`);
      return (data ?? []).map(map.fromRow);
    },
    async getById(id) {
      const { data, error } = await client.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(`Loading ${table} failed: ${error.message}`);
      return data ? map.fromRow(data) : undefined;
    },
    async put(record) {
      const { error } = await client.from(table).upsert(map.toRow(record));
      if (error) throw new Error(`Saving to ${table} failed: ${error.message}`);
    },
    async delete(id) {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw new Error(`Deleting from ${table} failed: ${error.message}`);
    },
  };
}

// ---------- photos (rows + storage objects) ----------

const BUCKET = 'photos';

function photoRepo(client: SupabaseClient, userId: string): PhotoRepository {
  const rows = tableRepo<Photo>(client, 'photos', photoMap);
  const path = (photoId: string, variant: 'display' | 'thumb') =>
    `${userId}/${photoId}/${variant}.jpg`;

  async function download(photoId: string, variant: 'display' | 'thumb') {
    const { data, error } = await client.storage.from(BUCKET).download(path(photoId, variant));
    if (error) return undefined;
    return data;
  }

  async function removeObjects(photoIds: string[]) {
    if (photoIds.length === 0) return;
    const paths = photoIds.flatMap((id) => [path(id, 'display'), path(id, 'thumb')]);
    const { error } = await client.storage.from(BUCKET).remove(paths);
    if (error) throw new Error(`Deleting photo files failed: ${error.message}`);
  }

  return {
    ...rows,
    async putWithBlobs(meta, display, thumb) {
      const displayUp = await client.storage
        .from(BUCKET)
        .upload(path(meta.id, 'display'), display, { contentType: 'image/jpeg', upsert: true });
      if (displayUp.error) throw new Error(`Uploading photo failed: ${displayUp.error.message}`);
      const thumbUp = await client.storage
        .from(BUCKET)
        .upload(path(meta.id, 'thumb'), thumb, { contentType: 'image/jpeg', upsert: true });
      if (thumbUp.error) throw new Error(`Uploading photo failed: ${thumbUp.error.message}`);
      try {
        await rows.put(meta);
      } catch (err) {
        // Don't leave orphaned files if the row insert failed.
        await removeObjects([meta.id]).catch(() => {});
        throw err;
      }
    },
    getDisplayBlob: (photoId) => download(photoId, 'display'),
    getThumbBlob: (photoId) => download(photoId, 'thumb'),
    async deleteWithBlobs(photoId) {
      await rows.delete(photoId);
      await removeObjects([photoId]);
    },
    async deleteByVisit(visitId) {
      const { data, error } = await client
        .from('photos')
        .select('id')
        .eq('visit_id', visitId);
      if (error) throw new Error(`Loading photos failed: ${error.message}`);
      const ids = (data ?? []).map((r) => r.id as string);
      if (ids.length > 0) {
        const del = await client.from('photos').delete().eq('visit_id', visitId);
        if (del.error) throw new Error(`Deleting photos failed: ${del.error.message}`);
        await removeObjects(ids);
      }
      return ids;
    },
  };
}

// ---------- bundle ops ----------

export function createSupabaseRepositories(
  client: SupabaseClient,
  userId: string,
): Repositories {
  const visits = tableRepo<Visit>(client, 'visits', visitMap);
  const trips = tableRepo<Trip>(client, 'trips', tripMap);
  const goals = tableRepo<Goal>(client, 'goals', goalMap);
  const earnedBadges = tableRepo<EarnedBadge>(client, 'earned_badges', earnedBadgeMap);
  const photos = photoRepo(client, userId);

  async function bulkUpsert(table: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    const { error } = await client.from(table).upsert(rows);
    if (error) throw new Error(`Importing ${table} failed: ${error.message}`);
  }

  async function deleteAllRows(table: string) {
    // RLS restricts this to the user's own rows.
    const { error } = await client.from(table).delete().neq('id', crypto.randomUUID());
    if (error) throw new Error(`Clearing ${table} failed: ${error.message}`);
  }

  /** Ids of photos that actually have a display file in storage. */
  async function storedPhotoIds(): Promise<Set<string>> {
    const { data, error } = await client.storage
      .from(BUCKET)
      .list(userId, { limit: 1000 });
    if (error) return new Set();
    return new Set((data ?? []).map((entry) => entry.name));
  }

  return {
    visits,
    trips,
    goals,
    earnedBadges,
    photos,

    async exportAll(): Promise<ExportBundle> {
      const [v, t, g, e, p] = await Promise.all([
        visits.getAll(),
        trips.getAll(),
        goals.getAll(),
        earnedBadges.getAll(),
        photos.getAll(),
      ]);
      return {
        formatVersion: 1,
        exportedAt: nowIso(),
        visits: v,
        trips: t,
        goals: g,
        earnedBadges: e,
        photos: p,
      };
    },

    async importAll(bundle) {
      // Keep photo records only when their image file already exists in this
      // account's storage (JSON backups don't carry binaries).
      const available = await storedPhotoIds();
      const keptPhotos = bundle.photos.filter((p) => available.has(p.id));

      // photos cascade from visits; delete children first anyway for clarity.
      await deleteAllRows('photos');
      await deleteAllRows('visits');
      await deleteAllRows('trips');
      await deleteAllRows('goals');
      await deleteAllRows('earned_badges');

      await bulkUpsert('visits', bundle.visits.map(visitMap.toRow));
      await bulkUpsert('trips', bundle.trips.map(tripMap.toRow));
      await bulkUpsert('goals', bundle.goals.map(goalMap.toRow));
      await bulkUpsert('earned_badges', bundle.earnedBadges.map(earnedBadgeMap.toRow));
      await bulkUpsert('photos', keptPhotos.map(photoMap.toRow));
    },

    async clearAll() {
      const ids = await storedPhotoIds();
      await deleteAllRows('photos');
      await deleteAllRows('visits');
      await deleteAllRows('trips');
      await deleteAllRows('goals');
      await deleteAllRows('earned_badges');
      if (ids.size > 0) {
        const paths = [...ids].flatMap((id) => [
          `${userId}/${id}/display.jpg`,
          `${userId}/${id}/thumb.jpg`,
        ]);
        await client.storage.from(BUCKET).remove(paths);
      }
    },
  };
}
