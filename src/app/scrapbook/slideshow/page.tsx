import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SlideshowView } from '@/components/scrapbook/SlideshowView';

export const metadata: Metadata = { title: 'Slideshow' };

export default function SlideshowPage() {
  return (
    // useSearchParams requires a Suspense boundary during prerender.
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-black" />}>
      <SlideshowView />
    </Suspense>
  );
}
