import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { TripsPageContent } from '@/components/trips/TripsPageContent';

export const metadata: Metadata = { title: 'Trips' };

export default function TripsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Trips"
        description="Group parks into routes and set target dates."
      />
      <TripsPageContent />
    </PageContainer>
  );
}
