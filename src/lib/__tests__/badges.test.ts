import { describe, expect, it } from 'vitest';
import { badgeProgress, evaluateBadges, qualifiesFor } from '@/lib/domain/badges';
import { statesCovered, visitedParkIds } from '@/lib/domain/parkStatus';
import type { BadgeDefinition, EarnedBadge, Visit } from '@/types/domain';
import { park, visit } from './fixtures';

const PARKS = [
  park({ id: 'arches', states: ['UT'] }),
  park({ id: 'zion', states: ['UT'] }),
  park({ id: 'yosemite', states: ['CA'], region: 'Pacific West' }),
  park({ id: 'gateway-arch', states: ['MO'], region: 'Midwest' }),
  park({ id: 'cuyahoga-valley', states: ['OH'], region: 'Midwest' }),
];

function def(id: string, criteria: BadgeDefinition['criteria']): BadgeDefinition {
  return { id, name: id, description: id, icon: 'Award', criteria };
}

function ctx(visits: Visit[]) {
  return {
    visited: visitedParkIds(visits),
    states: statesCovered(visits, PARKS),
  };
}

describe('qualifiesFor', () => {
  it('park-count counts distinct parks', () => {
    const { visited, states } = ctx([visit('arches'), visit('arches'), visit('zion')]);
    expect(qualifiesFor({ kind: 'park-count', count: 2 }, visited, PARKS, states)).toBe(true);
    expect(qualifiesFor({ kind: 'park-count', count: 3 }, visited, PARKS, states)).toBe(false);
  });

  it('all-parks requires every park', () => {
    const all = PARKS.map((p) => visit(p.id));
    const { visited, states } = ctx(all);
    expect(qualifiesFor({ kind: 'all-parks' }, visited, PARKS, states)).toBe(true);
    const { visited: v2, states: s2 } = ctx(all.slice(1));
    expect(qualifiesFor({ kind: 'all-parks' }, v2, PARKS, s2)).toBe(false);
  });

  it('specific-parks requires the full list', () => {
    const criteria = { kind: 'specific-parks', parkIds: ['arches', 'zion'] } as const;
    const one = ctx([visit('arches')]);
    expect(qualifiesFor(criteria, one.visited, PARKS, one.states)).toBe(false);
    const both = ctx([visit('arches'), visit('zion')]);
    expect(qualifiesFor(criteria, both.visited, PARKS, both.states)).toBe(true);
  });

  it('state-complete requires every park in the state', () => {
    const criteria = { kind: 'state-complete', state: 'UT' } as const;
    const one = ctx([visit('arches')]);
    expect(qualifiesFor(criteria, one.visited, PARKS, one.states)).toBe(false);
    const both = ctx([visit('arches'), visit('zion')]);
    expect(qualifiesFor(criteria, both.visited, PARKS, both.states)).toBe(true);
  });

  it('region-complete requires every park in the region', () => {
    const criteria = { kind: 'region-complete', region: 'Midwest' } as const;
    const one = ctx([visit('gateway-arch')]);
    expect(qualifiesFor(criteria, one.visited, PARKS, one.states)).toBe(false);
    const both = ctx([visit('gateway-arch'), visit('cuyahoga-valley')]);
    expect(qualifiesFor(criteria, both.visited, PARKS, both.states)).toBe(true);
  });

  it('distinct-states counts states across visited parks', () => {
    const criteria = { kind: 'distinct-states', count: 2 } as const;
    const utahOnly = ctx([visit('arches'), visit('zion')]);
    expect(qualifiesFor(criteria, utahOnly.visited, PARKS, utahOnly.states)).toBe(false);
    const twoStates = ctx([visit('arches'), visit('yosemite')]);
    expect(qualifiesFor(criteria, twoStates.visited, PARKS, twoStates.states)).toBe(true);
  });
});

describe('badgeProgress', () => {
  it('reports partial progress for locked badges', () => {
    const { visited, states } = ctx([visit('arches')]);
    expect(
      badgeProgress({ kind: 'specific-parks', parkIds: ['arches', 'zion'] }, visited, PARKS, states),
    ).toEqual({ done: 1, total: 2 });
    expect(badgeProgress({ kind: 'park-count', count: 5 }, visited, PARKS, states)).toEqual({
      done: 1,
      total: 5,
    });
  });
});

describe('evaluateBadges', () => {
  const defs = [
    def('first', { kind: 'park-count', count: 1 }),
    def('utah', { kind: 'specific-parks', parkIds: ['arches', 'zion'] }),
  ];

  function earnedRecord(badgeId: string): EarnedBadge {
    return {
      id: `earned-${badgeId}`,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      badgeId,
      earnedAt: '2026-01-01T00:00:00.000Z',
    };
  }

  it('earns newly-qualified badges once', () => {
    const diff = evaluateBadges(defs, [visit('arches')], PARKS, []);
    expect(diff.newlyEarned.map((d) => d.id)).toEqual(['first']);
    expect(diff.revokedEarnedIds).toEqual([]);
  });

  it('does not re-earn already-earned badges', () => {
    const diff = evaluateBadges(defs, [visit('arches')], PARKS, [earnedRecord('first')]);
    expect(diff.newlyEarned).toEqual([]);
  });

  it('revokes badges whose criteria no longer hold', () => {
    const diff = evaluateBadges(defs, [], PARKS, [earnedRecord('first')]);
    expect(diff.revokedEarnedIds).toEqual(['earned-first']);
  });
});
