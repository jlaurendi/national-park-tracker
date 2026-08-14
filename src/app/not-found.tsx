import Link from 'next/link';
import { Compass } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        icon={Compass}
        title="Off the trail"
        description="This page doesn't exist. Let's get you back to familiar ground."
        action={
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Back to dashboard
          </Link>
        }
      />
    </PageContainer>
  );
}
