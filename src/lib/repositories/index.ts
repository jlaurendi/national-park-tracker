// Single construction point for persistence. The active implementation
// switches with auth state: signed out = Dexie/IndexedDB (local-only, v1
// behavior), signed in = Supabase (cloud sync). UI and store code never know
// which is active.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createDexieRepositories } from './dexie';
import { createSupabaseRepositories } from './supabase';
import type { Repositories } from './types';

let active: Repositories | undefined;
let localRepos: Repositories | undefined;

/** The local (IndexedDB) repositories, regardless of the active mode. */
export function getLocalRepositories(): Repositories {
  return (localRepos ??= createDexieRepositories());
}

export function getRepositories(): Repositories {
  return (active ??= getLocalRepositories());
}

export function activateCloudRepositories(client: SupabaseClient, userId: string): void {
  active = createSupabaseRepositories(client, userId);
}

export function activateLocalRepositories(): void {
  active = getLocalRepositories();
}

export type { Repositories } from './types';
