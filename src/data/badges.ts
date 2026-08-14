import type { BadgeDefinition } from '@/types/domain';

/**
 * Achievement badges. Earned state is recomputed from visits, so deleting a
 * qualifying visit revokes the badge — no phantom achievements.
 */
export const BADGES: BadgeDefinition[] = [
  {
    id: 'first-park',
    name: 'First Footprints',
    description: 'Visit your first national park.',
    icon: 'Footprints',
    criteria: { kind: 'park-count', count: 1 },
  },
  {
    id: 'five-parks',
    name: 'Trail Legs',
    description: 'Visit 5 national parks.',
    icon: 'TentTree',
    criteria: { kind: 'park-count', count: 5 },
  },
  {
    id: 'ten-parks',
    name: 'Double Digits',
    description: 'Visit 10 national parks.',
    icon: 'Signpost',
    criteria: { kind: 'park-count', count: 10 },
  },
  {
    id: 'twentyfive-parks',
    name: 'Silver Compass',
    description: 'Visit 25 national parks.',
    icon: 'Compass',
    criteria: { kind: 'park-count', count: 25 },
  },
  {
    id: 'halfway',
    name: 'Over the Ridge',
    description: 'Visit 32 parks — more than half of them.',
    icon: 'MountainSnow',
    criteria: { kind: 'park-count', count: 32 },
  },
  {
    id: 'fifty-parks',
    name: 'Golden Compass',
    description: 'Visit 50 national parks.',
    icon: 'Award',
    criteria: { kind: 'park-count', count: 50 },
  },
  {
    id: 'all-parks',
    name: 'The Grand Completionist',
    description: 'Visit every US national park.',
    icon: 'Trophy',
    criteria: { kind: 'all-parks' },
  },
  {
    id: 'mighty-five',
    name: 'Utah Mighty 5',
    description: 'Visit all five of Utah’s national parks.',
    icon: 'Landmark',
    criteria: {
      kind: 'specific-parks',
      parkIds: ['arches', 'bryce-canyon', 'canyonlands', 'capitol-reef', 'zion'],
    },
  },
  {
    id: 'where-it-began',
    name: 'Where It All Began',
    description: 'Visit Yellowstone, the world’s first national park.',
    icon: 'Flame',
    criteria: { kind: 'specific-parks', parkIds: ['yellowstone'] },
  },
  {
    id: 'golden-state',
    name: 'Golden State Grand Tour',
    description: 'Visit all nine national parks in California.',
    icon: 'Sun',
    criteria: { kind: 'state-complete', state: 'CA' },
  },
  {
    id: 'last-frontier',
    name: 'The Last Frontier',
    description: 'Visit all eight national parks in Alaska.',
    icon: 'Snowflake',
    criteria: { kind: 'state-complete', state: 'AK' },
  },
  {
    id: 'heartland',
    name: 'Heartland Wanderer',
    description: 'Visit every park in the Midwest region.',
    icon: 'Wheat',
    criteria: { kind: 'region-complete', region: 'Midwest' },
  },
  {
    id: 'desert-rat',
    name: 'Desert Rat',
    description: 'Visit five iconic desert parks.',
    icon: 'ThermometerSun',
    criteria: {
      kind: 'specific-parks',
      parkIds: ['death-valley', 'joshua-tree', 'saguaro', 'big-bend', 'white-sands'],
    },
  },
  {
    id: 'island-hopper',
    name: 'Island Hopper',
    description: 'Visit the island parks across both oceans and the Great Lakes.',
    icon: 'Sailboat',
    criteria: {
      kind: 'specific-parks',
      parkIds: [
        'channel-islands',
        'dry-tortugas',
        'haleakala',
        'hawaii-volcanoes',
        'isle-royale',
        'american-samoa',
        'virgin-islands',
      ],
    },
  },
  {
    id: 'ten-states',
    name: 'Coast to Coast',
    description: 'Visit parks in 10 different states.',
    icon: 'Globe',
    criteria: { kind: 'distinct-states', count: 10 },
  },
];

export const BADGES_BY_ID: ReadonlyMap<string, BadgeDefinition> = new Map(
  BADGES.map((b) => [b.id, b]),
);
