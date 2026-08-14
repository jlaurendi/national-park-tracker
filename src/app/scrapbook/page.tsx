import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ScrapbookPageContent } from '@/components/scrapbook/ScrapbookPageContent';

export const metadata: Metadata = { title: 'Scrapbook' };

export default function ScrapbookPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Scrapbook"
        description="Your park memories, arranged by park."
      />
      <ScrapbookPageContent />
    </PageContainer>
  );
}
