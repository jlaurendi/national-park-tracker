import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, Landmark, Map as MapIcon, Ruler } from 'lucide-react';
import { PARKS, getPark } from '@/data/parks';
import { PageContainer } from '@/components/layout/PageContainer';
import { ParkImage } from '@/components/parks/ParkImage';
import { ParkStatusChip } from '@/components/parks/ParkStatusChip';
import { AddParkToTripMenu } from '@/components/trips/AddParkToTripMenu';
import { VisitList } from '@/components/visits/VisitList';
import { ParkPhotosSection } from '@/components/scrapbook/ParkPhotosSection';
import { formatDateOnly } from '@/lib/dates';

export function generateStaticParams() {
  return PARKS.map((park) => ({ parkId: park.id }));
}

export async function generateMetadata({
  params,
}: PageProps<'/parks/[parkId]'>): Promise<Metadata> {
  const { parkId } = await params;
  const park = getPark(parkId);
  return { title: park?.fullName ?? 'Park not found' };
}

const acresFormat = new Intl.NumberFormat('en-US');

export default async function ParkDetailPage({ params }: PageProps<'/parks/[parkId]'>) {
  const { parkId } = await params;
  const park = getPark(parkId);
  if (!park) notFound();

  const facts = [
    { icon: CalendarDays, label: 'Established', value: formatDateOnly(park.establishedDate) },
    { icon: Ruler, label: 'Area', value: `${acresFormat.format(park.areaAcres)} acres` },
    { icon: MapIcon, label: 'States', value: park.states.join(', ') },
    { icon: Landmark, label: 'Region', value: park.region },
  ];

  return (
    <>
      <div className="relative">
        <ParkImage
          src={park.imageUrl}
          alt={park.fullName}
          sizes="100vw"
          priority
          className="h-56 w-full md:h-80"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl px-4 pb-5 md:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow md:text-4xl">
            {park.name}
          </h1>
          <p className="text-sm font-medium text-white/85">{park.fullName}</p>
        </div>
      </div>

      <PageContainer className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ParkStatusChip parkId={park.id} />
          <AddParkToTripMenu parkId={park.id} parkName={park.name} />
        </div>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <p className="max-w-3xl text-[15px] leading-relaxed text-foreground/90">
          {park.description}
        </p>

        <section>
          <VisitList park={park} />
        </section>

        <section>
          <ParkPhotosSection park={park} />
        </section>
      </PageContainer>
    </>
  );
}
