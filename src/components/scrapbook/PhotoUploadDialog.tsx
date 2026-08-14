'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label, Select } from '@/components/ui/Input';
import { getPark } from '@/data/parks';
import { formatDateRange } from '@/lib/dates';
import { processImageFile, requestPersistentStorage } from '@/lib/images';
import { useAppStore } from '@/store';
import { cn } from '@/lib/cn';

interface PhotoUploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** Preselect this park's most recent visit. */
  initialParkId?: string;
}

export function PhotoUploadDialog({ open, onClose, initialParkId }: PhotoUploadDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Add photos">
      <UploadFields initialParkId={initialParkId} onClose={onClose} />
    </Dialog>
  );
}

function UploadFields({
  initialParkId,
  onClose,
}: {
  initialParkId?: string;
  onClose: () => void;
}) {
  const visits = useAppStore((s) => s.visits);
  const photos = useAppStore((s) => s.photos);
  const addPhoto = useAppStore((s) => s.addPhoto);

  const sortedVisits = useMemo(
    () => [...visits].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [visits],
  );

  const [visitId, setVisitId] = useState(() => {
    const preferred = initialParkId
      ? sortedVisits.find((v) => v.parkId === initialParkId)
      : sortedVisits[0];
    return preferred?.id ?? '';
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedVisit = visits.find((v) => v.id === visitId);

  if (sortedVisits.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Photos attach to a visit. Log a visit from a{' '}
          <Link href="/parks" className="font-medium text-primary hover:underline">
            park page
          </Link>{' '}
          first, then add your shots.
        </p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  async function handleFiles(files: FileList | File[]) {
    if (!selectedVisit || busy) return;
    const list = [...files].filter(
      (f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name),
    );
    if (list.length === 0) return;

    setBusy(true);
    let added = 0;
    const existingCount = photos.filter((p) => p.visitId === selectedVisit.id).length;
    for (const [i, file] of list.entries()) {
      setProgress(`Processing ${i + 1} of ${list.length}…`);
      try {
        const processed = await processImageFile(file);
        await addPhoto(
          {
            visitId: selectedVisit.id,
            parkId: selectedVisit.parkId,
            takenOn: selectedVisit.startDate,
            width: processed.width,
            height: processed.height,
            sizeBytes: processed.display.size,
            sortOrder: existingCount + i,
          },
          processed.display,
          processed.thumb,
        );
        added += 1;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Couldn't add ${file.name}.`);
      }
    }
    setBusy(false);
    setProgress('');
    if (added > 0) {
      void requestPersistentStorage();
      toast.success(
        `Added ${added} photo${added > 1 ? 's' : ''} to ${getPark(selectedVisit.parkId)?.name}.`,
      );
      onClose();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="upload-visit">Visit</Label>
        <Select
          id="upload-visit"
          value={visitId}
          onChange={(e) => setVisitId(e.target.value)}
          disabled={busy}
        >
          {sortedVisits.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {getPark(visit.parkId)?.name ?? visit.parkId} —{' '}
              {formatDateRange(visit.startDate, visit.endDate)}
            </option>
          ))}
        </Select>
      </div>

      <button
        type="button"
        disabled={busy || !selectedVisit}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/50',
          busy && 'pointer-events-none opacity-60',
        )}
      >
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
        ) : (
          <UploadCloud className="h-7 w-7 text-primary" aria-hidden />
        )}
        <span className="text-sm font-medium">
          {busy ? progress : 'Drop photos here or click to browse'}
        </span>
        <span className="text-xs text-muted-foreground">
          Images are resized to ~2000px JPEG before saving, so they stay light.
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          {busy ? 'Working…' : 'Done'}
        </Button>
      </div>
    </div>
  );
}
