'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';
import { getPark } from '@/data/parks';
import { formatDateOnly } from '@/lib/dates';
import { useAppStore } from '@/store';
import type { Photo } from '@/types/domain';

interface LightboxProps {
  photos: Photo[];
  /** Index into `photos`; null = closed. */
  index: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/** Preloads a neighbor's display blob into the object-URL cache. */
function Preload({ photoId }: { photoId: string }) {
  usePhotoUrl(photoId, 'display');
  return null;
}

/** Own component (remounted per photo via key) so edit state resets at mount. */
function CaptionEditor({ photo }: { photo: Photo }) {
  const updatePhoto = useAppStore((s) => s.updatePhoto);
  const [caption, setCaption] = useState(photo.caption ?? '');

  async function save() {
    const next = caption.trim();
    if (next !== (photo.caption ?? '')) {
      await updatePhoto(photo.id, { caption: next || undefined });
    }
  }

  return (
    <input
      value={caption}
      onChange={(e) => setCaption(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        e.stopPropagation();
      }}
      placeholder="Add a caption…"
      aria-label="Photo caption"
      className="mx-auto block w-full max-w-xl rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-sm text-white placeholder:text-white/50 focus:border-white/50 focus:outline-none"
    />
  );
}

export function Lightbox({ photos, index, onNavigate, onClose }: LightboxProps) {
  const deletePhoto = useAppStore((s) => s.deletePhoto);
  const photo = index === null ? undefined : photos[index];
  const displayUrl = usePhotoUrl(photo?.id ?? '', 'display');
  const thumbUrl = usePhotoUrl(photo?.id ?? '', 'thumb');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (photo) closeButtonRef.current?.focus();
  }, [photo?.id, photo]);

  const goto = useCallback(
    (delta: number) => {
      if (index === null || photos.length === 0) return;
      onNavigate((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onNavigate],
  );

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goto(1);
      else if (e.key === 'ArrowLeft') goto(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, goto, onClose]);

  if (!photo || index === null) return null;

  const park = getPark(photo.parkId);
  const url = displayUrl ?? thumbUrl;

  async function handleDelete() {
    if (window.confirm('Delete this photo permanently?')) {
      const wasLast = photos.length === 1;
      await deletePhoto(photo!.id);
      if (wasLast) onClose();
      else onNavigate(index! % (photos.length - 1));
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption || `Photo from ${park?.name ?? 'a park'}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-2 p-3 text-white">
        <p className="text-sm">
          <span className="font-semibold">{park?.name}</span>
          {photo.takenOn && (
            <span className="text-white/70"> · {formatDateOnly(photo.takenOn)}</span>
          )}
          <span className="text-white/50">
            {' '}
            · {index + 1} / {photos.length}
          </span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            aria-label="Delete photo"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-14">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- object URL from IndexedDB; next/image can't optimize it
          <img
            src={url}
            alt={photo.caption || `Photo from ${park?.name ?? 'a park'}`}
            className="max-h-full max-w-full rounded-md object-contain"
          />
        ) : (
          <div className="h-64 w-64 animate-pulse rounded-lg bg-white/10" />
        )}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => goto(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => goto(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <div className="p-4">
        <CaptionEditor key={photo.id} photo={photo} />
      </div>

      {/* Warm the cache for neighbors so arrows feel instant. */}
      {photos.length > 1 && <Preload photoId={photos[(index + 1) % photos.length].id} />}
      {photos.length > 2 && (
        <Preload photoId={photos[(index - 1 + photos.length) % photos.length].id} />
      )}
    </div>
  );
}
