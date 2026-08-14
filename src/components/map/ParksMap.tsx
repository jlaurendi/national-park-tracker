'use client';

// Real leaflet map. Never import this module directly from a page — leaflet
// touches `window` at import time, so it must come through ParksMapLazy
// (next/dynamic with ssr: false).

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { Expand } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Park, ParkVisitStatus } from '@/types/domain';

export interface MapPin {
  park: Park;
  status: ParkVisitStatus;
  /** Replaces the pin dot with a number/letter (trip stop order). */
  label?: string;
}

interface ParksMapProps {
  pins: MapPin[];
  /** Draw a route line through the pins in the given order. */
  showRoute?: boolean;
  className?: string;
  interactive?: boolean;
  /** Show the "all parks" fit-bounds button. */
  showAllControl?: boolean;
  showLegend?: boolean;
  /** 'continental' centers on the lower 48; 'fit' fits all pins. */
  defaultView?: 'continental' | 'fit';
}

const CONTINENTAL_CENTER: [number, number] = [39, -98];
const CONTINENTAL_ZOOM = 4;

const STATUS_COLORS: Record<ParkVisitStatus, string> = {
  visited: 'var(--status-visited)',
  planned: 'var(--status-planned)',
  unvisited: 'var(--status-unvisited)',
};

const iconCache = new Map<string, L.DivIcon>();

function pinIcon(status: ParkVisitStatus, label?: string): L.DivIcon {
  const key = `${status}:${label ?? ''}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const color = STATUS_COLORS[status];
  const center = label
    ? `<text x="15" y="19.5" text-anchor="middle" font-size="12" font-weight="700" fill="white" font-family="system-ui">${label}</text>`
    : '<circle cx="15" cy="15" r="4.5" fill="white"/>';
  const icon = L.divIcon({
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.35))">
      <path d="M15 1C7.3 1 1 7.3 1 15c0 10.5 14 24 14 24s14-13.5 14-24C29 7.3 22.7 1 15 1z" fill="${color}" stroke="white" stroke-width="1.5"/>
      ${center}
    </svg>`,
    className: '',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
  iconCache.set(key, icon);
  return icon;
}

const STATUS_LABELS: Record<ParkVisitStatus, string> = {
  visited: 'Visited',
  planned: 'Planned',
  unvisited: 'Not visited',
};

export function MapLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-md backdrop-blur',
        className,
      )}
    >
      {(Object.keys(STATUS_LABELS) as ParkVisitStatus[]).map((status) => (
        <span key={status} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: STATUS_COLORS[status] }}
            aria-hidden
          />
          {STATUS_LABELS[status]}
        </span>
      ))}
    </div>
  );
}

/** Re-fits the view when the pin set changes (MapContainer bounds only apply at init). */
function FitOnChange({ bounds, enabled }: { bounds?: L.LatLngBounds; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled && bounds) map.fitBounds(bounds.pad(0.2), { animate: false, maxZoom: 9 });
  }, [map, bounds, enabled]);
  return null;
}

export default function ParksMap({
  pins,
  showRoute = false,
  className,
  interactive = true,
  showAllControl = false,
  showLegend = false,
  defaultView = 'continental',
}: ParksMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);

  const bounds = useMemo(() => {
    if (pins.length === 0) return undefined;
    return L.latLngBounds(pins.map((p) => [p.park.latitude, p.park.longitude]));
  }, [pins]);

  const routePositions = useMemo(
    () => pins.map((p): [number, number] => [p.park.latitude, p.park.longitude]),
    [pins],
  );

  const fitProps =
    defaultView === 'fit' && bounds
      ? { bounds: bounds.pad(0.2) }
      : { center: CONTINENTAL_CENTER, zoom: CONTINENTAL_ZOOM };

  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <MapContainer
        ref={setMap}
        {...fitProps}
        minZoom={2}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        attributionControl
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitOnChange bounds={bounds} enabled={defaultView === 'fit'} />
        {showRoute && routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: 'var(--status-planned)', weight: 3, dashArray: '6 8' }}
          />
        )}
        {pins.map(({ park, status, label }) => (
          <Marker
            key={park.id}
            position={[park.latitude, park.longitude]}
            icon={pinIcon(status, label)}
            alt={park.fullName}
          >
            {interactive && (
              <Popup>
                <div className="flex min-w-40 flex-col gap-1 py-0.5">
                  <p className="font-semibold leading-tight">{park.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {park.states.join(' · ')} — {STATUS_LABELS[status]}
                  </p>
                  {/* Link (not <a>) so the href picks up basePath on GitHub Pages. */}
                  <Link
                    href={`/parks/${park.id}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View park →
                  </Link>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {showAllControl && map && bounds && (
        <button
          onClick={() => map.fitBounds(bounds.pad(0.1))}
          className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur hover:bg-muted"
        >
          <Expand className="h-3.5 w-3.5" aria-hidden />
          Show all parks
        </button>
      )}
      {showLegend && <MapLegend className="absolute bottom-6 left-3 z-[1000]" />}
    </div>
  );
}
