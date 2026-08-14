'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { requestOtp, verifyOtp } from '@/lib/auth';

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SignInDialog({ open, onClose }: SignInDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Sign in to sync">
      <SignInFields onClose={onClose} />
    </Dialog>
  );
}

function SignInFields({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await requestOtp(email.trim());
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sending the code failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyOtp(email.trim(), code.trim());
      toast.success('Signed in — your data now syncs to your account.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work.');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleEmail} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a one-time code. No password needed — a new
          account is created automatically on first sign-in.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !email.trim()}>
            {busy ? 'Sending…' : 'Send code'}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleCode} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signin-code">Code</Label>
        <Input
          id="signin-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="text-center text-lg tracking-[0.4em]"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => setStep('email')} disabled={busy}>
          Different email
        </Button>
        <Button type="submit" disabled={busy || code.trim().length < 6}>
          {busy ? 'Verifying…' : 'Sign in'}
        </Button>
      </div>
    </form>
  );
}
