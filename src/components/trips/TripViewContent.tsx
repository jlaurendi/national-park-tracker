'use client';

// Trip ids are user-generated UUIDs living in IndexedDB, so the trip detail
// page reads `?id=` instead of a dynamic route segment — dynamic segments
// can't be pre-rendered under static export (GitHub Pages).

import { useSearchParams } from 'next/navigation';
import { TripDetailContent } from './TripDetailContent';

export function TripViewContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('id') ?? '';
  return <TripDetailContent tripId={tripId} />;
}
