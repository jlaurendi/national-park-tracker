'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';
import { getPark } from '@/data/parks';
import { useAppStore } from '@/store';
import { cn } from '@/lib/cn';
import { Lightbox } from './Lightbox';
import type { Photo } from '@/types/domain';

function photoOrder(a: Photo, b: Photo): number {
  return (
    (a.takenOn ?? '').localeCompare(b.takenOn ?? '') ||
    a.sortOrder - b.sortOrder ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

export function PhotoCard({
  photo,
  onClick,
  className,
}: {
  photo: Photo;
  onClick: () => void;
  className?: string;
}) {
  const url = usePhotoUrl(photo.id, 'thumb');
  const park = getPark(photo.parkId);
  const alt = photo.caption || `Photo from ${park?.name ?? 'a park'}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group block w-full overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <div
        className="w-full bg-muted"
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- object URL from IndexedDB
          <img
            src={url}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
      </div>
      {photo.caption && (
        <p className="truncate px-2.5 py-1.5 text-xs text-muted-foreground">{photo.caption}</p>
      )}
    </button>
  );
}

interface ScrapbookGalleryProps {
  photos: Photo[];
}

export function ScrapbookGallery({ photos }: ScrapbookGalleryProps) {
  const visits = useAppStore((s) => s.visits);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Group by park; groups ordered by most recent activity, photos in
  // taken-date order. `flat` is the single ordering the lightbox walks.
  const { groups, flat } = useMemo(() => {
    const byPark = new Map<string, Photo[]>();
    for (const photo of photos) {
      const list = byPark.get(photo.parkId) ?? [];
      list.push(photo);
      byPark.set(photo.parkId, list);
    }
    const groups = [...byPark.entries()]
      .map(([parkId, list]) => ({ parkId, photos: [...list].sort(photoOrder) }))
      .sort((a, b) => {
        const lastA = a.photos[a.photos.length - 1]?.takenOn ?? '';
        const lastB = b.photos[b.photos.length - 1]?.takenOn ?? '';
        return lastB.localeCompare(lastA);
      });
    return { groups, flat: groups.flatMap((g) => g.photos) };
  }, [photos]);

  const indexOf = useMemo(() => new Map(flat.map((p, i) => [p.id, i])), [flat]);

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ parkId, photos: groupPhotos }) => {
        const park = getPark(parkId);
        const visitCount = visits.filter((v) => v.parkId === parkId).length;
        return (
          <section key={parkId} aria-label={park?.fullName}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/parks/${parkId}`}
                  className="text-lg font-semibold hover:text-primary"
                >
                  {park?.name ?? parkId}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {groupPhotos.length} {groupPhotos.length === 1 ? 'photo' : 'photos'}
                  {visitCount > 1 && ` · ${visitCount} visits`}
                </span>
              </div>
              <Link
                href={`/scrapbook/slideshow?park=${parkId}`}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Play className="h-3 w-3" aria-hidden />
                Slideshow
              </Link>
            </div>
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
              {groupPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={() => setLightboxIndex(indexOf.get(photo.id) ?? 0)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <Lightbox
        photos={flat}
        index={lightboxIndex}
        onNavigate={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
