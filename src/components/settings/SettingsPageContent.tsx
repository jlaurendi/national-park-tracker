'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Download,
  HardDrive,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';
import { AccountCard } from '@/components/account/AccountCard';
import { formatBytes, useStorageEstimate } from '@/hooks/useStorageEstimate';
import { requestPersistentStorage } from '@/lib/images';
import { getRepositories } from '@/lib/repositories';
import { todayDateOnly } from '@/lib/dates';
import { useAppStore } from '@/store';
import type { ExportBundle } from '@/types/domain';

function isExportBundle(value: unknown): value is ExportBundle {
  if (typeof value !== 'object' || value === null) return false;
  const bundle = value as Record<string, unknown>;
  return (
    bundle.formatVersion === 1 &&
    Array.isArray(bundle.visits) &&
    Array.isArray(bundle.trips) &&
    Array.isArray(bundle.goals) &&
    Array.isArray(bundle.earnedBadges) &&
    Array.isArray(bundle.photos)
  );
}

export function SettingsPageContent() {
  const storage = useStorageEstimate();
  const importBundle = useAppStore((s) => s.importBundle);
  const clearAll = useAppStore((s) => s.clearAll);
  const photoCount = useAppStore((s) => s.photos.length);
  const visitCount = useAppStore((s) => s.visits.length);
  const auth = useAppStore((s) => s.auth);
  const cloudMode = auth.status === 'signed-in';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const usagePercent =
    storage.usage !== undefined && storage.quota ? (storage.usage / storage.quota) * 100 : 0;

  async function handlePersist() {
    const granted = await requestPersistentStorage();
    await storage.refresh();
    if (granted) toast.success('Storage is now protected from automatic cleanup.');
    else toast('The browser declined for now — it usually grants this once you use the app more.');
  }

  async function handleExport() {
    const bundle = await getRepositories().exportAll();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `park-tracker-backup-${todayDateOnly()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded.');
  }

  async function handleImportFile(file: File) {
    setBusy(true);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isExportBundle(parsed)) {
        toast.error("That file doesn't look like a Park Tracker backup.");
        return;
      }
      const ok = window.confirm(
        'Importing replaces all current data with the backup. Continue?',
      );
      if (!ok) return;
      await importBundle(parsed);
      const dropped = parsed.photos.length - useAppStore.getState().photos.length;
      toast.success(
        `Backup restored: ${parsed.visits.length} visits, ${parsed.trips.length} trips, ${parsed.goals.length} goals.`,
      );
      if (dropped > 0) {
        toast(
          `${dropped} photo record${dropped > 1 ? 's' : ''} skipped — image files aren't part of JSON backups.`,
        );
      }
      await storage.refresh();
    } catch {
      toast.error("Couldn't read that file as JSON.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    const scope = cloudMode ? 'from your account' : 'from this browser';
    const first = window.confirm(
      `Delete ALL data ${scope} — visits, trips, goals, badges, and photos? This cannot be undone.`,
    );
    if (!first) return;
    const second = window.confirm('Last check: really erase everything?');
    if (!second) return;
    try {
      await clearAll();
      await storage.refresh();
      toast.success('All data cleared.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Clearing data failed.');
    }
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <AccountCard />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" aria-hidden />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {storage.supported ? (
            <>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatBytes(storage.usage)} used of {formatBytes(storage.quota)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {visitCount} visits · {photoCount} photos
                </span>
              </div>
              <ProgressBar percent={usagePercent} label="Storage used" />
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-3">
                <p className="flex items-center gap-2 text-sm">
                  <ShieldCheck
                    className={`h-4 w-4 ${storage.persisted ? 'text-primary' : 'text-muted-foreground'}`}
                    aria-hidden
                  />
                  {storage.persisted
                    ? 'Protected from automatic cleanup'
                    : 'Storage is best-effort — the browser may reclaim it'}
                </p>
                {!storage.persisted && (
                  <Button size="sm" variant="secondary" onClick={handlePersist}>
                    Protect
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Everything lives in this browser. Export a backup before clearing site data or
                switching devices.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This browser doesn&apos;t report storage usage.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" aria-hidden />
            Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Download your visits, trips, goals, and badges as JSON. Photo image files stay in the
            browser and aren&apos;t included.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} disabled={busy}>
              <Download className="h-4 w-4" aria-hidden />
              Export backup
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {busy ? 'Importing…' : 'Import backup'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-danger/30 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Erase every visit, trip, goal, badge, and photo{' '}
            {cloudMode ? 'from your account' : 'from this browser'}.
          </p>
          <Button variant="danger" onClick={handleClear}>
            Clear all data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
