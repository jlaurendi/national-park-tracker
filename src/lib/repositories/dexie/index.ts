// IndexedDB-backed implementations of the repository interfaces (v1).

import type { Table } from 'dexie';
import { getDb } from '@/lib/db/dexie';
import { nowIso } from '@/lib/records';
import type { ExportBundle, Photo } from '@/types/domain';
import type { CrudRepository, PhotoRepository, Repositories } from '../types';

function crudRepo<T extends { id: string }>(table: () => Table<T, string>): CrudRepository<T> {
  return {
    getAll: () => table().toArray(),
    getById: (id) => table().get(id),
    put: async (record) => {
      await table().put(record);
    },
    delete: async (id) => {
      await table().delete(id);
    },
  };
}

function photoRepo(): PhotoRepository {
  const db = getDb();
  return {
    ...crudRepo<Photo>(() => getDb().photos),
    async putWithBlobs(meta, display, thumb) {
      await db.transaction('rw', [db.photos, db.photoDisplayBlobs, db.photoThumbBlobs], async () => {
        await db.photos.put(meta);
        await db.photoDisplayBlobs.put({ photoId: meta.id, blob: display });
        await db.photoThumbBlobs.put({ photoId: meta.id, blob: thumb });
      });
    },
    async getDisplayBlob(photoId) {
      return (await db.photoDisplayBlobs.get(photoId))?.blob;
    },
    async getThumbBlob(photoId) {
      return (await db.photoThumbBlobs.get(photoId))?.blob;
    },
    async deleteWithBlobs(photoId) {
      await db.transaction('rw', [db.photos, db.photoDisplayBlobs, db.photoThumbBlobs], async () => {
        await db.photos.delete(photoId);
        await db.photoDisplayBlobs.delete(photoId);
        await db.photoThumbBlobs.delete(photoId);
      });
    },
    async deleteByVisit(visitId) {
      const ids = (await db.photos.where('visitId').equals(visitId).primaryKeys()) as string[];
      await db.transaction('rw', [db.photos, db.photoDisplayBlobs, db.photoThumbBlobs], async () => {
        await db.photos.bulkDelete(ids);
        await db.photoDisplayBlobs.bulkDelete(ids);
        await db.photoThumbBlobs.bulkDelete(ids);
      });
      return ids;
    },
  };
}

export function createDexieRepositories(): Repositories {
  const photos = photoRepo();
  return {
    visits: crudRepo(() => getDb().visits),
    trips: crudRepo(() => getDb().trips),
    goals: crudRepo(() => getDb().goals),
    earnedBadges: crudRepo(() => getDb().earnedBadges),
    photos,
    async exportAll(): Promise<ExportBundle> {
      const db = getDb();
      const [visits, trips, goals, earnedBadges, photoRows] = await Promise.all([
        db.visits.toArray(),
        db.trips.toArray(),
        db.goals.toArray(),
        db.earnedBadges.toArray(),
        db.photos.toArray(),
      ]);
      return {
        formatVersion: 1,
        exportedAt: nowIso(),
        visits,
        trips,
        goals,
        earnedBadges,
        photos: photoRows,
      };
    },
    async importAll(bundle) {
      const db = getDb();
      // The JSON bundle carries photo *metadata* only. Keep a photo record
      // only if its image blob is still in this browser; otherwise it would
      // render as a permanent gray ghost.
      const availableBlobIds = new Set(
        (await db.photoDisplayBlobs.toCollection().primaryKeys()) as string[],
      );
      const keptPhotos = bundle.photos.filter((p) => availableBlobIds.has(p.id));
      await db.transaction(
        'rw',
        [db.visits, db.trips, db.goals, db.earnedBadges, db.photos],
        async () => {
          await Promise.all([
            db.visits.clear(),
            db.trips.clear(),
            db.goals.clear(),
            db.earnedBadges.clear(),
            db.photos.clear(),
          ]);
          await Promise.all([
            db.visits.bulkPut(bundle.visits),
            db.trips.bulkPut(bundle.trips),
            db.goals.bulkPut(bundle.goals),
            db.earnedBadges.bulkPut(bundle.earnedBadges),
            db.photos.bulkPut(keptPhotos),
          ]);
        },
      );
      // Sweep blobs whose metadata didn't survive the import.
      const validIds = new Set(keptPhotos.map((p) => p.id));
      const sweep = async (table: Table<{ photoId: string }, string>) => {
        const keys = (await table.toCollection().primaryKeys()) as string[];
        await table.bulkDelete(keys.filter((k) => !validIds.has(k)));
      };
      await sweep(db.photoDisplayBlobs);
      await sweep(db.photoThumbBlobs);
    },
    async clearAll() {
      const db = getDb();
      await db.transaction('rw', db.tables, async () => {
        await Promise.all(db.tables.map((t) => t.clear()));
      });
    },
  };
}
