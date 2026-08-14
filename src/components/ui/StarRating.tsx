'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StarRatingProps {
  value?: number;
  /** When provided, stars are interactive. */
  onChange?: (value: 1 | 2 | 3 | 4 | 5 | undefined) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRating({ value, onChange, size = 'md', className }: StarRatingProps) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role={onChange ? 'radiogroup' : 'img'}
      aria-label={value ? `Rated ${value} of 5 stars` : 'Not rated'}
    >
      {([1, 2, 3, 4, 5] as const).map((star) => {
        const filled = value !== undefined && star <= value;
        const icon = (
          <Star
            className={cn(
              dim,
              filled ? 'fill-accent text-accent' : 'fill-transparent text-muted-foreground/50',
            )}
          />
        );
        if (!onChange) return <span key={star}>{icon}</span>;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(value === star ? undefined : star)}
            className="rounded p-0.5 hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
