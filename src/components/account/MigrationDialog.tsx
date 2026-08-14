'use client';

import { useState } from 'react';
import { CloudUpload } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { getLocalRepositories, getRepositories } from '@/lib/repositories';
import { useAppStore } from '@/store';

/**
 * Offered right after signing in to a fresh account when local data exists:
 * copies every record AND photo binary from IndexedDB into the account.
 * The local copy is left untouched (it's still there in signed-out mode).
 */
export function MigrationDialog() {
  const offer = useAppStore((s) => s.migrationOffer);
  const dismiss = useAppStore((s) => s.dismissMigrationOffer);
  const rehydrate = useAppStore((s) => s.rehydrate);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  if (!offer) return null;

  const parts = [
    offer.visits && `${offer.visits} visit${offer.visits > 1 ? 's' : ''}`,
    offer.trips && `${offer.trips} trip${offer.trips > 1 ? 's' : ''}`,
    offer.goals && `${offer.goals} goal${offer.goals > 1 ? 's' : ''}`,
    offer.photos && `${offer.photos} photo${offer.photos > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');

  async function migrate() {
    setBusy(true);
    try {
      const local = getLocalRepositories();
      const cloud = getRepositories();

      setProgress('Copying records…');
      const bundle = await local.exportAll();
      await cloud.importAll({ ...bundle, photos: [] });

      let done = 0;
      let skipped = 0;
      for (const photo of bundle.photos) {
        done += 1;
        setProgress(`Uploading photo ${done} of ${bundle.photos.length}…`);
        const [display, thumb] = await Promise.all([
          local.photos.getDisplayBlob(photo.id),
          local.photos.getThumbBlob(photo.id),
        ]);
        if (display && thumb) {
          await cloud.photos.putWithBlobs(photo, display, thumb);
        } else {
          skipped += 1;
        }
      }

      await rehydrate();
      dismiss();
      toast.success('Your data now lives in your account.');
      if (skipped > 0) toast(`${skipped} photo${skipped > 1 ? 's' : ''} had no local image file and were skipped.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Migration failed — nothing was lost.');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <Dialog open onClose={busy ? () => {} : dismiss} title="Move your data to this account?">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          This browser has <span className="font-medium text-foreground">{parts}</span> stored
          locally, and your account is empty. Move everything — photos included — into your
          account so it syncs across devices? The local copy stays on this browser as a
          fallback for signed-out use.
        </p>
        {busy && <p className="text-sm font-medium text-primary">{progress}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={dismiss} disabled={busy}>
            Not now
          </Button>
          <Button onClick={migrate} disabled={busy}>
            <CloudUpload className="h-4 w-4" aria-hidden />
            {busy ? 'Moving…' : 'Move my data'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
