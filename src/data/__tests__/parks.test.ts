import { describe, expect, it } from 'vitest';
import { PARKS, PARKS_BY_ID, getPark } from '@/data/parks';
import { BADGES } from '@/data/badges';
import { GOAL_PRESETS } from '@/data/goalPresets';

describe('parks dataset', () => {
  it('contains exactly the 63 national parks', () => {
    expect(PARKS).toHaveLength(63);
  });

  it('has unique ids, sorted ascending', () => {
    const ids = PARKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(63);
    expect(ids).toEqual([...ids].sort());
  });

  it('uses unique NPS codes except seki (Sequoia + Kings Canyon)', () => {
    const codes = PARKS.map((p) => p.npsCode);
    expect(codes.filter((c) => c === 'seki')).toHaveLength(2);
    const nonSeki = codes.filter((c) => c !== 'seki');
    expect(new Set(nonSeki).size).toBe(nonSeki.length);
    expect(getPark('gateway-arch')?.npsCode).toBe('jeff');
  });

  it('has sane coordinates', () => {
    for (const p of PARKS) {
      expect(p.longitude, p.id).toBeLessThan(0);
      expect(p.latitude, p.id).toBeGreaterThan(-15);
      expect(p.latitude, p.id).toBeLessThan(68.5);
    }
    expect(getPark('american-samoa')!.latitude).toBeLessThan(0);
    for (const p of PARKS.filter((p) => p.region === 'Alaska')) {
      expect(p.latitude, p.id).toBeGreaterThan(58);
    }
  });

  it('has well-formed dates, areas, descriptions, and images', () => {
    for (const p of PARKS) {
      expect(p.establishedDate, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.areaAcres, p.id).toBeGreaterThan(0);
      expect(p.description.length, p.id).toBeGreaterThan(20);
      expect(p.imageUrl, p.id).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
      expect(p.states.length, p.id).toBeGreaterThan(0);
    }
  });

  it('matches known facts', () => {
    const yellowstone = getPark('yellowstone')!;
    expect(yellowstone.establishedDate).toBe('1872-03-01');
    expect(yellowstone.states).toEqual(['WY', 'MT', 'ID']);
    const largest = [...PARKS].sort((a, b) => b.areaAcres - a.areaAcres)[0];
    expect(largest.id).toBe('wrangell-st-elias');
    const smallest = [...PARKS].sort((a, b) => a.areaAcres - b.areaAcres)[0];
    expect(smallest.id).toBe('gateway-arch');
    expect(getPark('new-river-gorge')!.establishedDate).toBe('2020-12-27');
  });

  it('has expected state park-counts used by badges', () => {
    expect(PARKS.filter((p) => p.states.includes('CA'))).toHaveLength(9);
    expect(PARKS.filter((p) => p.states.includes('AK'))).toHaveLength(8);
    expect(PARKS.filter((p) => p.states.includes('UT'))).toHaveLength(5);
  });

  it('lookup map covers all parks', () => {
    expect(PARKS_BY_ID.size).toBe(63);
    expect(getPark('nope')).toBeUndefined();
  });
});

describe('badge and preset references', () => {
  it('every park id referenced by badges exists', () => {
    for (const badge of BADGES) {
      if (badge.criteria.kind === 'specific-parks') {
        for (const id of badge.criteria.parkIds) {
          expect(getPark(id), `${badge.id} → ${id}`).toBeDefined();
        }
      }
    }
  });

  it('every park id referenced by goal presets exists', () => {
    for (const preset of GOAL_PRESETS) {
      for (const id of preset.parkIds ?? []) {
        expect(getPark(id), `${preset.id} → ${id}`).toBeDefined();
      }
    }
  });
});
