import type { Metadata } from 'next';
import { MapPageContent } from '@/components/map/MapPageContent';

export const metadata: Metadata = { title: 'Map' };

export default function MapPage() {
  return <MapPageContent />;
}
