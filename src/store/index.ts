// App store: an in-memory cache over the repositories. Components subscribe
// here and never touch persistence directly; actions persist first, then
// update state, then re-evaluate badges and goal completion.

import { create } from 'zustand';
import { toast } from 'sonner';
import { getRepositories } from '@/lib/repositories';
import { baseRecord, nowIso, touched } from '@/lib/records';
import { evaluateBadges } from '@/lib/domain/badges';
import { computeGoalProgress } from '@/lib/domain/goals';
import { BADGES, BADGES_BY_ID } from '@/data/badges';
import { PARKS } from '@/data/parks';
import type {
  EarnedBadge,
  ExportBundle,
  Goal,
  GoalType,
  Photo,
  Trip,
  TripStatus,
  TripStop,
  Visit,
} from '@/types/domain';

export interface VisitInput {
  parkId: string;
  startDate: string;
  endDate?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface TripInput {
  name: string;
  notes?: string;
  status: TripStatus;
  startDate?: string;
  endDate?: string;
  stops?: TripStop[];
}

export interface GoalInput {
  type: GoalType;
  name: string;
  targetCount?: number;
  parkIds?: string[];
  targetDate?: string;
}

export interface PhotoInput {
  visitId: string;
  parkId: string;
  caption?: string;
  takenOn?: string;
  width: number;
  height: number;
  sizeBytes: number;
  sortOrder: number;
}

interface AppState {
  hydrated: boolean;
  visits: Visit[];
  trips: Trip[];
  goals: Goal[];
  earnedBadges: EarnedBadge[];
  photos: Photo[];

  hydrate: () => Promise<void>;

  addVisit: (input: VisitInput) => Promise<Visit>;
  updateVisit: (id: string, patch: Partial<VisitInput>) => Promise<void>;
  deleteVisit: (id: string) => Promise<void>;

  addTrip: (input: TripInput) => Promise<Trip>;
  updateTrip: (id: string, patch: Partial<TripInput>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;

  addGoal: (input: GoalInput) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<GoalInput>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addPhoto: (input: PhotoInput, display: Blob, thumb: Blob) => Promise<Photo>;
  updatePhoto: (id: string, patch: Partial<Pick<Photo, 'caption' | 'takenOn' | 'sortOrder'>>) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  importBundle: (bundle: ExportBundle) => Promise<void>;
  clearAll: () => Promise<void>;
}

function replaceById<T extends { id: string }>(list: T[], next: T): T[] {
  return list.map((item) => (item.id === next.id ? next : item));
}

export const useAppStore = create<AppState>()((set, get) => {
  /**
   * Re-evaluate badges and goal completion after any visit change.
   * Persists earned/revoked badge records and goal achievedAt snapshots.
   */
  async function reactToVisitChange(): Promise<void> {
    const repos = getRepositories();
    const { visits, earnedBadges, goals } = get();

    const diff = evaluateBadges(BADGES, visits, PARKS, earnedBadges);
    if (diff.newlyEarned.length > 0 || diff.revokedEarnedIds.length > 0) {
      const revoked = new Set(diff.revokedEarnedIds);
      const kept = earnedBadges.filter((e) => !revoked.has(e.id));
      const added: EarnedBadge[] = diff.newlyEarned.map((def) => ({
        ...baseRecord(),
        badgeId: def.id,
        earnedAt: nowIso(),
      }));
      await Promise.all([
        ...added.map((e) => repos.earnedBadges.put(e)),
        ...diff.revokedEarnedIds.map((id) => repos.earnedBadges.delete(id)),
      ]);
      set({ earnedBadges: [...kept, ...added] });
      for (const def of diff.newlyEarned) {
        toast.success(`Badge earned: ${def.name}`, { description: def.description });
      }
    }

    // Snapshot first-time goal completions.
    let nextGoals = get().goals;
    for (const goal of goals) {
      if (goal.achievedAt) continue;
      const progress = computeGoalProgress(goal, visits, PARKS);
      if (progress.isComplete) {
        const achieved = touched({ ...goal, achievedAt: nowIso() });
        await repos.goals.put(achieved);
        nextGoals = replaceById(nextGoals, achieved);
        toast.success(`Goal complete: ${goal.name}`);
      }
    }
    if (nextGoals !== get().goals) set({ goals: nextGoals });
  }

  return {
    hydrated: false,
    visits: [],
    trips: [],
    goals: [],
    earnedBadges: [],
    photos: [],

    async hydrate() {
      if (get().hydrated) return;
      const repos = getRepositories();
      const [visits, trips, goals, earnedBadges, photos] = await Promise.all([
        repos.visits.getAll(),
        repos.trips.getAll(),
        repos.goals.getAll(),
        repos.earnedBadges.getAll(),
        repos.photos.getAll(),
      ]);
      set({ hydrated: true, visits, trips, goals, earnedBadges, photos });
    },

    async addVisit(input) {
      const visit: Visit = { ...baseRecord(), ...input };
      await getRepositories().visits.put(visit);
      set({ visits: [...get().visits, visit] });
      await reactToVisitChange();
      return visit;
    },

    async updateVisit(id, patch) {
      const existing = get().visits.find((v) => v.id === id);
      if (!existing) return;
      const next = touched({ ...existing, ...patch });
      await getRepositories().visits.put(next);
      set({ visits: replaceById(get().visits, next) });
      await reactToVisitChange();
    },

    async deleteVisit(id) {
      const repos = getRepositories();
      const deletedPhotoIds = await repos.photos.deleteByVisit(id);
      await repos.visits.delete(id);
      const gone = new Set(deletedPhotoIds);
      set({
        visits: get().visits.filter((v) => v.id !== id),
        photos: get().photos.filter((p) => !gone.has(p.id)),
      });
      await reactToVisitChange();
    },

    async addTrip(input) {
      const trip: Trip = { ...baseRecord(), stops: [], ...input };
      await getRepositories().trips.put(trip);
      set({ trips: [...get().trips, trip] });
      return trip;
    },

    async updateTrip(id, patch) {
      const existing = get().trips.find((t) => t.id === id);
      if (!existing) return;
      const next = touched({ ...existing, ...patch });
      await getRepositories().trips.put(next);
      set({ trips: replaceById(get().trips, next) });
    },

    async deleteTrip(id) {
      await getRepositories().trips.delete(id);
      set({ trips: get().trips.filter((t) => t.id !== id) });
    },

    async addGoal(input) {
      const goal: Goal = { ...baseRecord(), ...input };
      await getRepositories().goals.put(goal);
      set({ goals: [...get().goals, goal] });
      // A goal can be born complete (e.g. "visit 5" when 6 are already logged).
      await reactToVisitChange();
      return goal;
    },

    async updateGoal(id, patch) {
      const existing = get().goals.find((g) => g.id === id);
      if (!existing) return;
      const next = touched({ ...existing, ...patch });
      await getRepositories().goals.put(next);
      set({ goals: replaceById(get().goals, next) });
      await reactToVisitChange();
    },

    async deleteGoal(id) {
      await getRepositories().goals.delete(id);
      set({ goals: get().goals.filter((g) => g.id !== id) });
    },

    async addPhoto(input, display, thumb) {
      const photo: Photo = {
        ...baseRecord(),
        ...input,
        mimeType: 'image/jpeg',
      };
      await getRepositories().photos.putWithBlobs(photo, display, thumb);
      set({ photos: [...get().photos, photo] });
      return photo;
    },

    async updatePhoto(id, patch) {
      const existing = get().photos.find((p) => p.id === id);
      if (!existing) return;
      const next = touched({ ...existing, ...patch });
      await getRepositories().photos.put(next);
      set({ photos: replaceById(get().photos, next) });
    },

    async deletePhoto(id) {
      await getRepositories().photos.deleteWithBlobs(id);
      set({ photos: get().photos.filter((p) => p.id !== id) });
    },

    async importBundle(bundle) {
      const repos = getRepositories();
      await repos.importAll(bundle);
      const [visits, trips, goals, earnedBadges, photos] = await Promise.all([
        repos.visits.getAll(),
        repos.trips.getAll(),
        repos.goals.getAll(),
        repos.earnedBadges.getAll(),
        repos.photos.getAll(),
      ]);
      set({ visits, trips, goals, earnedBadges, photos });
      await reactToVisitChange();
    },

    async clearAll() {
      await getRepositories().clearAll();
      set({ visits: [], trips: [], goals: [], earnedBadges: [], photos: [] });
    },
  };
});

export { BADGES_BY_ID };
