'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { ParkImage } from './ParkImage';
import { ParkStatusChip } from './ParkStatusChip';
import { StarRating } from '@/components/ui/StarRating';
import { useVisitsForPark } from '@/store/selectors';
import type { Park } from '@/types/domain';

export function ParkCard({ park }: { park: Park }) {
  const visits = useVisitsForPark(park.id);
  const bestRating = visits.reduce<number | undefined>(
    (best, v) => (v.rating && (!best || v.rating > best) ? v.rating : best),
    undefined,
  );

  return (
    <Link
      href={`/parks/${park.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ParkImage
        src={park.imageUrl}
        alt={park.fullName}
        className="aspect-[3/2] w-full transition-transform duration-300 group-hover:scale-[1.01]"
      />
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{park.name}</h3>
          <ParkStatusChip parkId={park.id} />
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden />
          {park.states.join(' · ')}
          <span aria-hidden>·</span>
          Est. {park.establishedDate.slice(0, 4)}
        </p>
        {bestRating && <StarRating value={bestRating} size="sm" />}
      </div>
    </Link>
  );
}
