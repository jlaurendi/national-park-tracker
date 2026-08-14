'use client';

import { useCallback, useEffect, useState } from 'react';

interface StorageInfo {
  usage?: number;
  quota?: number;
  persisted?: boolean;
  supported: boolean;
}

async function readStorageInfo(): Promise<StorageInfo> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { supported: false };
  }
  try {
    const [estimate, persisted] = await Promise.all([
      navigator.storage.estimate(),
      navigator.storage.persisted?.() ?? Promise.resolve(undefined),
    ]);
    return { usage: estimate.usage, quota: estimate.quota, persisted, supported: true };
  } catch {
    return { supported: false };
  }
}

export function useStorageEstimate(): StorageInfo & { refresh: () => Promise<void> } {
  const [info, setInfo] = useState<StorageInfo>({ supported: true });

  useEffect(() => {
    let active = true;
    void readStorageInfo().then((next) => {
      if (active) setInfo(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setInfo(await readStorageInfo());
  }, []);

  return { ...info, refresh };
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
