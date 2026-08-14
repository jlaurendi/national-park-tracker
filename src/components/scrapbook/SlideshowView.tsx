'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Pause, Play, X } from 'lucide-react';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';
import { getPark } from '@/data/parks';
import { formatMonthYear } from '@/lib/dates';
import { useAppStore } from '@/store';
import { useHydrated } from '@/store/selectors';
import { cn } from '@/lib/cn';
import type { Photo } from '@/types/domain';

const SLIDE_MS = 5000;
const TITLE_SLIDE_MS = 2600;
const CONTROLS_HIDE_MS = 3000;

type Slide =
  | { kind: 'title'; id: string; title: string; subtitle?: string }
  | { kind: 'photo'; id: string; photo: Photo };

function PhotoSlide({ photo }: { photo: Photo }) {
  const url = usePhotoUrl(photo.id, 'display');
  const park = getPark(photo.parkId);
  if (!url) return null;
  return (
    <figure className="absolute inset-0 m-0 flex items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- object URL from IndexedDB */}
      <img
        src={url}
        alt={photo.caption || `Photo from ${park?.name ?? 'a park'}`}
        className="slide-photo max-h-full max-w-full object-contain"
      />
      {photo.caption && (
        <figcaption className="absolute inset-x-0 bottom-16 text-center">
          <span className="rounded-full bg-black/60 px-4 py-1.5 text-sm text-white/95 backdrop-blur">
            {photo.caption}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

function Preload({ photoId }: { photoId: string }) {
  usePhotoUrl(photoId, 'display');
  return null;
}

export function SlideshowView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const photos = useAppStore((s) => s.photos);
  const visits = useAppStore((s) => s.visits);
  const trips = useAppStore((s) => s.trips);

  const parkFilter = searchParams.get('park');
  const tripFilter = searchParams.get('trip');

  const slides = useMemo<Slide[]>(() => {
    let pool = photos;
    if (parkFilter) pool = pool.filter((p) => p.parkId === parkFilter);
    if (tripFilter) {
      const trip = trips.find((t) => t.id === tripFilter);
      const tripParks = new Set(trip?.stops.map((s) => s.parkId) ?? []);
      pool = pool.filter((p) => tripParks.has(p.parkId));
    }
    if (pool.length === 0) return [];

    const visitById = new Map(visits.map((v) => [v.id, v]));
    const byVisit = new Map<string, Photo[]>();
    for (const photo of pool) {
      const list = byVisit.get(photo.visitId) ?? [];
      list.push(photo);
      byVisit.set(photo.visitId, list);
    }

    const groups = [...byVisit.entries()].sort(([a], [b]) => {
      const va = visitById.get(a)?.startDate ?? '';
      const vb = visitById.get(b)?.startDate ?? '';
      return va.localeCompare(vb);
    });

    const result: Slide[] = [];
    for (const [visitId, groupPhotos] of groups) {
      const visit = visitById.get(visitId);
      const park = visit ? getPark(visit.parkId) : getPark(groupPhotos[0].parkId);
      result.push({
        kind: 'title',
        id: `title-${visitId}`,
        title: park?.name ?? 'Unknown park',
        subtitle: visit ? formatMonthYear(visit.startDate) : undefined,
      });
      const ordered = [...groupPhotos].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      );
      for (const photo of ordered) result.push({ kind: 'photo', id: photo.id, photo });
    }
    return result;
  }, [photos, visits, trips, parkFilter, tripFilter]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);

  const slide = slides[index];
  const photoCount = slides.filter((s) => s.kind === 'photo').length;
  const photoNumber =
    slide === undefined
      ? 0
      : slides.slice(0, index + 1).filter((s) => s.kind === 'photo').length;

  const goto = useCallback(
    (delta: number) => {
      if (slides.length === 0) return;
      setIndex((i) => (i + delta + slides.length) % slides.length);
    },
    [slides.length],
  );

  const exit = useCallback(() => router.push('/scrapbook'), [router]);

  // Autoplay.
  useEffect(() => {
    if (!playing || slides.length === 0 || !slide) return;
    const duration = slide.kind === 'title' ? TITLE_SLIDE_MS : SLIDE_MS;
    const timer = window.setTimeout(() => goto(1), duration);
    return () => window.clearTimeout(timer);
  }, [playing, slide, slides.length, goto]);

  // Keyboard controls.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') exit();
      else if (e.key === 'ArrowRight') goto(1);
      else if (e.key === 'ArrowLeft') goto(-1);
      else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exit, goto]);

  // Auto-hide controls while playing. Controls start visible; the mount
  // effect only schedules the first hide (async), and pointer activity
  // re-shows them via the event handler.
  const poke = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
  }, []);
  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const showControls = controlsVisible || !playing;

  if (!hydrated) return <div className="fixed inset-0 z-50 bg-black" />;

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black text-white">
        <ImageOff className="h-10 w-10 text-white/50" aria-hidden />
        <p className="text-sm text-white/80">No photos to show for this selection.</p>
        <Link href="/scrapbook" className="text-sm font-medium text-white underline">
          Back to scrapbook
        </Link>
      </div>
    );
  }

  const nextPhotoSlide = slides
    .slice(index + 1)
    .concat(slides.slice(0, index + 1))
    .find((s): s is Extract<Slide, { kind: 'photo' }> => s.kind === 'photo');

  return (
    <div
      className={cn('fixed inset-0 z-50 bg-black', !showControls && 'cursor-none')}
      onMouseMove={poke}
      onTouchStart={poke}
    >
      {slide.kind === 'title' ? (
        <div key={slide.id} className="slide-title absolute inset-0 flex flex-col items-center justify-center gap-2">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            {slide.title}
          </h2>
          {slide.subtitle && <p className="text-lg text-white/60">{slide.subtitle}</p>}
        </div>
      ) : (
        <div key={slide.id} className="absolute inset-0">
          <PhotoSlide photo={slide.photo} />
        </div>
      )}

      {nextPhotoSlide && nextPhotoSlide.id !== slide.id && (
        <Preload photoId={nextPhotoSlide.photo.id} />
      )}

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-10 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <span className="w-20 text-xs tabular-nums text-white/70">
          {photoNumber} / {photoCount}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goto(-1)}
            aria-label="Previous slide"
            className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
            className="rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button
            onClick={() => goto(1)}
            aria-label="Next slide"
            className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex w-20 justify-end">
          <button
            onClick={exit}
            aria-label="Exit slideshow"
            className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
