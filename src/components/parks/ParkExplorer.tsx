'use client';

import { useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { PARKS } from '@/data/parks';
import { ParkCard } from './ParkCard';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHydrated, useParkStatuses } from '@/store/selectors';
import { compareDateOnly } from '@/lib/dates';
import type { Park, ParkVisitStatus, Region, USState } from '@/types/domain';

type SortKey = 'name' | 'established' | 'area';

const REGIONS: Region[] = [
  'Alaska',
  'Pacific West',
  'Intermountain',
  'Midwest',
  'Southeast',
  'Northeast',
];

const ALL_STATES = [...new Set(PARKS.flatMap((p) => p.states))].sort() as USState[];

const SORTS: Record<SortKey, (a: Park, b: Park) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  established: (a, b) => compareDateOnly(a.establishedDate, b.establishedDate),
  area: (a, b) => b.areaAcres - a.areaAcres,
};

export function ParkExplorer() {
  const hydrated = useHydrated();
  const statuses = useParkStatuses();
  const [query, setQuery] = useState('');
  const [state, setState] = useState('all');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');

  const parks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PARKS.filter((park) => {
      if (q && !park.fullName.toLowerCase().includes(q)) return false;
      if (state !== 'all' && !park.states.includes(state as USState)) return false;
      if (region !== 'all' && park.region !== region) return false;
      if (status !== 'all' && (statuses.get(park.id) ?? 'unvisited') !== status) return false;
      return true;
    }).sort(SORTS[sort]);
  }, [query, state, region, status, sort, statuses]);

  const visitedCount = useMemo(
    () => [...statuses.values()].filter((s) => s === 'visited').length,
    [statuses],
  );

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parks…"
            aria-label="Search parks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ParkVisitStatus | 'all')}
          className="w-36"
        >
          <option value="all">Any status</option>
          <option value="visited">Visited</option>
          <option value="planned">Planned</option>
          <option value="unvisited">Not visited</option>
        </Select>
        <Select
          aria-label="Filter by state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-32"
        >
          <option value="all">Any state</option>
          {ALL_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-40"
        >
          <option value="all">Any region</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sort parks"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="w-40"
        >
          <option value="name">Sort: A–Z</option>
          <option value="established">Sort: Oldest first</option>
          <option value="area">Sort: Largest first</option>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {parks.length} of {PARKS.length} parks
        {hydrated && ` · ${visitedCount} visited`}
      </p>

      {parks.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No parks match"
          description="Try clearing a filter or changing your search."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parks.map((park) => (
            <ParkCard key={park.id} park={park} />
          ))}
        </div>
      )}
    </div>
  );
}
