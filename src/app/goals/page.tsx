import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { GoalsPageContent } from '@/components/goals/GoalsPageContent';

export const metadata: Metadata = { title: 'Goals & Badges' };

export default function GoalsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Goals & Badges"
        description="Set targets, track progress, and collect achievements."
      />
      <GoalsPageContent />
    </PageContainer>
  );
}
