import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ParkExplorer } from '@/components/parks/ParkExplorer';

export const metadata: Metadata = { title: 'Parks' };

export default function ParksPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Parks"
        description="All 63 US national parks — search, filter, and track your progress."
      />
      <ParkExplorer />
    </PageContainer>
  );
}
