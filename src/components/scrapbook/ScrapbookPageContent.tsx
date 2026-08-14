'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookImage, ImagePlus, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { ScrapbookGallery } from './ScrapbookGallery';
import { useAppStore } from '@/store';
import { useHydrated } from '@/store/selectors';

export function ScrapbookPageContent() {
  const hydrated = useHydrated();
  const photos = useAppStore((s) => s.photos);
  const [uploadOpen, setUploadOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={i % 2 ? 'h-40' : 'h-56'} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        {photos.length > 0 && (
          <Link
            href="/scrapbook/slideshow"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium shadow-sm hover:bg-muted"
          >
            <Play className="h-4 w-4" aria-hidden />
            Play slideshow
          </Link>
        )}
        <Button onClick={() => setUploadOpen(true)}>
          <ImagePlus className="h-4 w-4" aria-hidden />
          Add photos
        </Button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={BookImage}
          title="Your scrapbook is empty"
          description="Add photos from your park visits and they'll be arranged here by park, ready for the slideshow."
          action={<Button onClick={() => setUploadOpen(true)}>Add your first photos</Button>}
        />
      ) : (
        <ScrapbookGallery photos={photos} />
      )}

      <PhotoUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
