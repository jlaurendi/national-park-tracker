'use client';

import { useState } from 'react';
import { CloudUpload, LogOut, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { SignInDialog } from './SignInDialog';
import { signOut } from '@/lib/auth';
import { useAppStore } from '@/store';

export function AccountCard() {
  const auth = useAppStore((s) => s.auth);
  const [signInOpen, setSignInOpen] = useState(false);

  if (auth.status === 'disabled') return null;

  async function handleSignOut() {
    try {
      await signOut();
      toast('Signed out — back to local-only mode.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign out failed.');
    }
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" aria-hidden />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auth.status === 'loading' && <Skeleton className="h-10" />}
        {auth.status === 'signed-out' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              You&apos;re in local-only mode — data lives in this browser. Sign in to sync
              visits, trips, and photos across devices.
            </p>
            <Button onClick={() => setSignInOpen(true)}>
              <CloudUpload className="h-4 w-4" aria-hidden />
              Sign in to sync
            </Button>
          </div>
        )}
        {auth.status === 'signed-in' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-medium">{auth.email}</span>
              <span className="text-muted-foreground">
                {' '}
                — your data syncs to your account on every change.
              </span>
            </p>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </Button>
          </div>
        )}
      </CardContent>
      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </Card>
  );
}
