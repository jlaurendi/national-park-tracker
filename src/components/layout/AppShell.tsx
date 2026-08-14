import Link from 'next/link';
import { MountainSnow } from 'lucide-react';
import { SidebarNav, MobileNav } from './SidebarNav';
import { SyncStatusFooter } from '@/components/account/SyncStatusFooter';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-6 py-5">
          <span className="rounded-lg bg-primary p-1.5">
            <MountainSnow className="h-5 w-5 text-primary-foreground" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Park Tracker</span>
        </Link>
        <SidebarNav />
        <SyncStatusFooter />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="rounded-md bg-primary p-1">
          <MountainSnow className="h-4 w-4 text-primary-foreground" aria-hidden />
        </span>
        <span className="text-sm font-semibold">Park Tracker</span>
      </header>

      <main className="min-w-0 flex-1 pb-20 pt-14 md:ml-60 md:pb-0 md:pt-0">
        {children}
      </main>

      <MobileNav />
    </div>
  );
}
