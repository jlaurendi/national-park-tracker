// Minimal fixtures so domain tests don't depend on the real 63-park dataset.

import type { Park, Visit } from '@/types/domain';

export function park(overrides: Partial<Park> & Pick<Park, 'id'>): Park {
  return {
    npsCode: overrides.id.slice(0, 4),
    name: overrides.id,
    fullName: `${overrides.id} National Park`,
    states: ['UT'],
    region: 'Intermountain',
    latitude: 40,
    longitude: -111,
    establishedDate: '1950-01-01',
    areaAcres: 100_000,
    description: 'A test park.',
    imageUrl: '',
    ...overrides,
  };
}

let visitCounter = 0;

export function visit(parkId: string, overrides: Partial<Visit> = {}): Visit {
  visitCounter += 1;
  return {
    id: `visit-${visitCounter}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    parkId,
    startDate: '2026-01-01',
    ...overrides,
  };
}
