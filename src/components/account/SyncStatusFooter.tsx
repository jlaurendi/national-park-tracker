'use client';

import Link from 'next/link';
import { Cloud, CloudOff } from 'lucide-react';
import { useAppStore } from '@/store';

export function SyncStatusFooter() {
  const auth = useAppStore((s) => s.auth);

  return (
    <div className="mt-auto flex flex-col gap-1.5 px-6 py-4">
      {auth.status === 'signed-in' && (
        <p className="flex items-center gap-1.5 truncate text-xs font-medium text-primary">
          <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">Synced · {auth.email}</span>
        </p>
      )}
      {auth.status === 'signed-out' && (
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Local only — sign in to sync
        </Link>
      )}
      <p className="text-xs text-muted-foreground">63 national parks, one checklist.</p>
    </div>
  );
}
