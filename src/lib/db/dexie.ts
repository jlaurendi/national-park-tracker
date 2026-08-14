// The only file that knows the IndexedDB table layout.

import Dexie, { type Table } from 'dexie';
import type {
  Visit,
  Trip,
  Goal,
  EarnedBadge,
  Photo,
  PhotoBlobRow,
} from '@/types/domain';

export class ParkTrackerDB extends Dexie {
  visits!: Table<Visit, string>;
  trips!: Table<Trip, string>;
  goals!: Table<Goal, string>;
  earnedBadges!: Table<EarnedBadge, string>;
  photos!: Table<Photo, string>;
  photoDisplayBlobs!: Table<PhotoBlobRow, string>;
  photoThumbBlobs!: Table<PhotoBlobRow, string>;

  constructor() {
    super('national-park-tracker');
    this.version(1).stores({
      visits: 'id, parkId, startDate',
      trips: 'id, status',
      goals: 'id, type',
      earnedBadges: 'id, badgeId',
      photos: 'id, visitId, parkId, createdAt',
      photoDisplayBlobs: 'photoId',
      photoThumbBlobs: 'photoId',
    });
  }
}

let db: ParkTrackerDB | undefined;

/** Lazy singleton so importing this module never touches IndexedDB during SSR. */
export function getDb(): ParkTrackerDB {
  if (!db) db = new ParkTrackerDB();
  return db;
}
