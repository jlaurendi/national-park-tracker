'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mountain } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ParkImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Remote park hero image with a graceful gradient fallback for dead links. */
export function ParkImage({ src, alt, className, sizes, priority }: ParkImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-primary-soft to-muted',
          className,
        )}
      >
        <Mountain className="h-8 w-8 text-primary/40" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        priority={priority}
        className="object-cover"
        onError={() => setFailed(true)}
        // Park heroes are pre-sized 960px CDN images; fetching them directly
        // avoids funneling 63 first-load requests through the image optimizer
        // (which Wikimedia rate-limits).
        unoptimized
      />
    </div>
  );
}
