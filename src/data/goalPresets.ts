import type { GoalType } from '@/types/domain';

export interface GoalPreset {
  id: string;
  name: string;
  type: GoalType;
  targetCount?: number;
  parkIds?: string[];
  description: string;
}

export const GOAL_PRESETS: GoalPreset[] = [
  {
    id: 'all-63',
    name: 'See all 63 parks',
    type: 'all-parks',
    description: 'The full checklist — every US national park.',
  },
  {
    id: 'any-10',
    name: 'Visit 10 parks',
    type: 'park-count',
    targetCount: 10,
    description: 'A solid start: any ten parks count.',
  },
  {
    id: 'any-25',
    name: 'Visit 25 parks',
    type: 'park-count',
    targetCount: 25,
    description: 'Serious traveler territory.',
  },
  {
    id: 'mighty-5',
    name: 'Utah Mighty 5',
    type: 'park-list',
    parkIds: ['arches', 'bryce-canyon', 'canyonlands', 'capitol-reef', 'zion'],
    description: 'Utah’s five red-rock icons.',
  },
  {
    id: 'crown-jewels',
    name: 'The Crown Jewels',
    type: 'park-list',
    parkIds: ['yellowstone', 'yosemite', 'grand-canyon', 'zion', 'great-smoky-mountains'],
    description: 'The five most-visited classics.',
  },
  {
    id: 'california-9',
    name: 'California Nine',
    type: 'park-list',
    parkIds: [
      'channel-islands',
      'death-valley',
      'joshua-tree',
      'kings-canyon',
      'lassen-volcanic',
      'pinnacles',
      'redwood',
      'sequoia',
      'yosemite',
    ],
    description: 'Every park in the Golden State.',
  },
];
