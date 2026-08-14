import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { TripViewContent } from '@/components/trips/TripViewContent';

export const metadata: Metadata = { title: 'Trip' };

export default function TripViewPage() {
  return (
    <PageContainer>
      {/* useSearchParams requires a Suspense boundary during prerender. */}
      <Suspense fallback={null}>
        <TripViewContent />
      </Suspense>
    </PageContainer>
  );
}
