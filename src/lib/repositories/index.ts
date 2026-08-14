// Single construction point for persistence. Part 2 swaps the implementation
// returned here (e.g. API-backed repositories) without touching UI or store
// call sites.

import { createDexieRepositories } from './dexie';
import type { Repositories } from './types';

let repositories: Repositories | undefined;

export function getRepositories(): Repositories {
  if (!repositories) repositories = createDexieRepositories();
  return repositories;
}

export type { Repositories } from './types';
