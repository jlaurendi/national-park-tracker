import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsPageContent } from '@/components/settings/SettingsPageContent';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Settings" description="Storage, backups, and data." />
      <SettingsPageContent />
    </PageContainer>
  );
}
