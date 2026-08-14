'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ImagePlus, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Lightbox } from './Lightbox';
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { PhotoCard } from './ScrapbookGallery';
import { useHydrated, usePhotosForPark } from '@/store/selectors';
import type { Park } from '@/types/domain';

export function ParkPhotosSection({ park }: { park: Park }) {
  const hydrated = useHydrated();
  const photos = usePhotosForPark(park.id);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!hydrated) return <Skeleton className="h-32" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Photos
          {photos.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {photos.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <Link
              href={`/scrapbook/slideshow?park=${park.id}`}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Play className="h-3 w-3" aria-hidden />
              Slideshow
            </Link>
          )}
          <Button size="sm" variant="secondary" onClick={() => setUploadOpen(true)}>
            <ImagePlus className="h-3.5 w-3.5" aria-hidden />
            Add photos
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No photos yet — add shots from your visits to build the scrapbook.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.slice(0, 6).map((photo, i) => (
            <PhotoCard key={photo.id} photo={photo} onClick={() => setLightboxIndex(i)} />
          ))}
        </div>
      )}
      {photos.length > 6 && (
        <Link
          href="/scrapbook"
          className="self-start text-xs font-medium text-primary hover:underline"
        >
          See all {photos.length} in the scrapbook →
        </Link>
      )}

      <PhotoUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        initialParkId={park.id}
      />
      <Lightbox
        photos={photos}
        index={lightboxIndex}
        onNavigate={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
