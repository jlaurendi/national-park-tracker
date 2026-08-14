import { describe, expect, it } from 'vitest';
import { computeGoalProgress } from '@/lib/domain/goals';
import type { Goal } from '@/types/domain';
import { park, visit } from './fixtures';

const PARKS = [park({ id: 'a' }), park({ id: 'b' }), park({ id: 'c' }), park({ id: 'd' })];

function goal(overrides: Partial<Goal>): Goal {
  return {
    id: 'g1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    type: 'all-parks',
    name: 'Test goal',
    ...overrides,
  };
}

describe('computeGoalProgress', () => {
  it('tracks all-parks goals against the full dataset', () => {
    const g = goal({ type: 'all-parks' });
    const progress = computeGoalProgress(g, [visit('a'), visit('b')], PARKS);
    expect(progress.completedCount).toBe(2);
    expect(progress.targetCount).toBe(4);
    expect(progress.percent).toBe(50);
    expect(progress.remainingParkIds).toEqual(['c', 'd']);
    expect(progress.isComplete).toBe(false);
  });

  it('counts distinct parks, not visits, for park-count goals', () => {
    const g = goal({ type: 'park-count', targetCount: 2 });
    const progress = computeGoalProgress(g, [visit('a'), visit('a'), visit('b')], PARKS);
    expect(progress.completedCount).toBe(2);
    expect(progress.isComplete).toBe(true);
    expect(progress.percent).toBe(100);
  });

  it('tracks specific park-list goals and ignores non-member visits', () => {
    const g = goal({ type: 'park-list', parkIds: ['a', 'c'] });
    const progress = computeGoalProgress(g, [visit('b'), visit('c')], PARKS);
    expect(progress.completedCount).toBe(1);
    expect(progress.targetCount).toBe(2);
    expect(progress.remainingParkIds).toEqual(['a']);
    expect(progress.isComplete).toBe(false);
  });

  it('never reports 100% until actually complete', () => {
    const g = goal({ type: 'park-count', targetCount: 63 });
    const visits = Array.from({ length: 62 }, (_, i) => visit(`p${i}`));
    const progress = computeGoalProgress(g, visits, PARKS);
    expect(progress.percent).toBeLessThan(100);
  });

  it('handles degenerate goals safely', () => {
    const g = goal({ type: 'park-count', targetCount: 0 });
    const progress = computeGoalProgress(g, [visit('a')], PARKS);
    expect(progress.isComplete).toBe(false);
    expect(progress.percent).toBe(0);
  });
});
