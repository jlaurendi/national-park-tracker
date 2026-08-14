import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { TripDetailContent } from '@/components/trips/TripDetailContent';

export const metadata: Metadata = { title: 'Trip' };

export default async function TripDetailPage({ params }: PageProps<'/trips/[tripId]'>) {
  const { tripId } = await params;
  return (
    <PageContainer>
      <TripDetailContent tripId={tripId} />
    </PageContainer>
  );
}
