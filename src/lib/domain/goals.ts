// Goal progress is computed from visits, never stored (except the achievedAt
// snapshot the store writes on first completion).

import type { Goal, Park, Visit } from '@/types/domain';
import { visitedParkIds } from './parkStatus';

export interface GoalProgress {
  goalId: string;
  completedCount: number;
  targetCount: number;
  /** 0–100, rounded down so 62/63 doesn't read as 100%. */
  percent: number;
  completedParkIds: string[];
  /** For list/all goals: which parks are still missing. Empty for count goals. */
  remainingParkIds: string[];
  isComplete: boolean;
}

export function computeGoalProgress(goal: Goal, visits: Visit[], parks: Park[]): GoalProgress {
  const visited = visitedParkIds(visits);

  let targetIds: string[] | undefined;
  let targetCount: number;
  switch (goal.type) {
    case 'all-parks':
      targetIds = parks.map((p) => p.id);
      targetCount = targetIds.length;
      break;
    case 'park-list':
      targetIds = goal.parkIds ?? [];
      targetCount = targetIds.length;
      break;
    case 'park-count':
      targetCount = goal.targetCount ?? 0;
      break;
  }

  const completedParkIds = targetIds
    ? targetIds.filter((id) => visited.has(id))
    : [...visited];
  const completedCount = Math.min(completedParkIds.length, Math.max(targetCount, 0));
  const remainingParkIds = targetIds ? targetIds.filter((id) => !visited.has(id)) : [];
  const isComplete = targetCount > 0 && completedCount >= targetCount;
  const percent =
    targetCount <= 0 ? 0 : isComplete ? 100 : Math.floor((completedCount / targetCount) * 100);

  return {
    goalId: goal.id,
    completedCount,
    targetCount,
    percent,
    completedParkIds,
    remainingParkIds,
    isComplete,
  };
}
