// Persistence interfaces — the seam where part 2 swaps IndexedDB for an API.
// UI code must never import a concrete repository; it goes through the store,
// which talks only to these interfaces.

import type {
  Visit,
  Trip,
  Goal,
  EarnedBadge,
  Photo,
  ExportBundle,
} from '@/types/domain';

export interface CrudRepository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  /** Full-record upsert; maps 1:1 to `PUT /api/<entity>/:id` in part 2. */
  put(record: T): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface PhotoRepository extends CrudRepository<Photo> {
  /** Store metadata + both image variants atomically. */
  putWithBlobs(meta: Photo, display: Blob, thumb: Blob): Promise<void>;
  getDisplayBlob(photoId: string): Promise<Blob | undefined>;
  getThumbBlob(photoId: string): Promise<Blob | undefined>;
  deleteWithBlobs(photoId: string): Promise<void>;
  /** Cascade used when a visit is deleted. Returns deleted photo ids. */
  deleteByVisit(visitId: string): Promise<string[]>;
}

export interface Repositories {
  visits: CrudRepository<Visit>;
  trips: CrudRepository<Trip>;
  goals: CrudRepository<Goal>;
  earnedBadges: CrudRepository<EarnedBadge>;
  photos: PhotoRepository;
  /** Metadata-only backup (photo binaries stay local in v1). */
  exportAll(): Promise<ExportBundle>;
  /** Replace all user data with the bundle's contents. */
  importAll(bundle: ExportBundle): Promise<void>;
  clearAll(): Promise<void>;
}
