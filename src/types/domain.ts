// Domain types for the National Park Tracker.
//
// Sync-readiness rules (part 2 will move these records to a server DB):
// - User records carry client-generated UUID v4 ids and ISO 8601 UTC
//   createdAt/updatedAt timestamps.
// - Calendar dates ("the day I visited") are 'YYYY-MM-DD' strings, never Date
//   objects, to avoid timezone drift.
// - No browser types (Blob/File) appear in synced schemas; photo binaries live
//   in separate IndexedDB-only tables keyed by photoId.

export type USState =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'AS' | 'VI'; // territories: American Samoa, US Virgin Islands

export type Region =
  | 'Alaska'
  | 'Pacific West'
  | 'Intermountain'
  | 'Midwest'
  | 'Southeast'
  | 'Northeast';

/** Static reference data — checked in, never persisted per-user. */
export interface Park {
  /** Canonical slug, used as route param and foreign key: 'yellowstone'. */
  id: string;
  /** Official NPS unit code for future NPS API joins: 'yell', 'jeff'. */
  npsCode: string;
  /** Short display name: 'Yellowstone'. */
  name: string;
  /** Official full name: 'Yellowstone National Park'. */
  fullName: string;
  states: USState[];
  region: Region;
  latitude: number;
  longitude: number;
  /** 'YYYY-MM-DD' date the unit was (re)designated a National Park. */
  establishedDate: string;
  areaAcres: number;
  /** 1–2 sentence description. */
  description: string;
  /** Remote hero image (public-domain / freely licensed). May be ''. */
  imageUrl: string;
}

/** Common shape of every user-owned, persisted record. */
export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visit extends BaseRecord {
  parkId: string;
  /** First day of the visit, 'YYYY-MM-DD'. */
  startDate: string;
  /** Last day (inclusive) for multi-day visits. */
  endDate?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type TripStatus = 'idea' | 'scheduled' | 'completed';

export interface TripStop {
  /** Stable identity so stops survive reordering; a trip_stops row in part 2. */
  id: string;
  parkId: string;
  /** 0-based position in the route. */
  sortOrder: number;
  targetDate?: string;
  notes?: string;
}

export interface Trip extends BaseRecord {
  name: string;
  notes?: string;
  status: TripStatus;
  startDate?: string;
  endDate?: string;
  /** Embedded, ordered by sortOrder; normalizes to a child table in part 2. */
  stops: TripStop[];
}

export type GoalType = 'all-parks' | 'park-count' | 'park-list';

export interface Goal extends BaseRecord {
  type: GoalType;
  name: string;
  /** 'park-count' goals only. */
  targetCount?: number;
  /** 'park-list' goals only. */
  parkIds?: string[];
  /** Optional aspirational deadline, display only. */
  targetDate?: string;
  /** Set the first time progress reaches 100%. */
  achievedAt?: string;
}

export interface EarnedBadge extends BaseRecord {
  /** FK to a static BadgeDefinition. */
  badgeId: string;
  earnedAt: string;
}

export interface Photo extends BaseRecord {
  visitId: string;
  /** Denormalized from the visit so per-park galleries need no join. */
  parkId: string;
  caption?: string;
  /** Optional day the photo was taken, 'YYYY-MM-DD'. */
  takenOn?: string;
  /** Dimensions of the stored display variant. */
  width: number;
  height: number;
  /** JPEG only — Safari cannot canvas-encode WebP. */
  mimeType: 'image/jpeg';
  sizeBytes: number;
  /** Order within its visit. */
  sortOrder: number;
}

/** IndexedDB-only blob rows. Never enter the store; never synced as-is. */
export interface PhotoBlobRow {
  photoId: string;
  blob: Blob;
}

export type ParkVisitStatus = 'visited' | 'planned' | 'unvisited';

/** Badge criteria are declarative so evaluation stays a pure function. */
export type BadgeCriteria =
  | { kind: 'park-count'; count: number }
  | { kind: 'all-parks' }
  | { kind: 'specific-parks'; parkIds: readonly string[] }
  | { kind: 'state-complete'; state: USState }
  | { kind: 'region-complete'; region: Region }
  | { kind: 'distinct-states'; count: number };

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  /** Name of a lucide-react icon. */
  icon: string;
  criteria: BadgeCriteria;
}

/** Serializable backup of all user data (photo metadata only, no blobs). */
export interface ExportBundle {
  formatVersion: 1;
  exportedAt: string;
  visits: Visit[];
  trips: Trip[];
  goals: Goal[];
  earnedBadges: EarnedBadge[];
  photos: Photo[];
}
