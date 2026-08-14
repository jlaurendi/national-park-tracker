import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'visited' | 'planned' | 'unvisited' | 'neutral' | 'accent';

const tones: Record<Tone, string> = {
  visited: 'bg-primary-soft text-primary',
  planned: 'bg-accent-soft text-accent-foreground',
  unvisited: 'bg-muted text-muted-foreground',
  neutral: 'bg-muted text-foreground',
  accent: 'bg-accent-soft text-accent-foreground',
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Chip({ className, tone = 'neutral', ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
