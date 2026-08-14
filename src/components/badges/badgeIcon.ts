// Explicit icon lookup so the bundle only carries the icons badges use
// (importing lucide's full `icons` map would ship the entire icon set).

import {
  Award,
  Compass,
  Flame,
  Footprints,
  Globe,
  Landmark,
  MountainSnow,
  Sailboat,
  Signpost,
  Snowflake,
  Sun,
  TentTree,
  ThermometerSun,
  Trophy,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

const BADGE_ICONS: Record<string, LucideIcon> = {
  Award,
  Compass,
  Flame,
  Footprints,
  Globe,
  Landmark,
  MountainSnow,
  Sailboat,
  Signpost,
  Snowflake,
  Sun,
  TentTree,
  ThermometerSun,
  Trophy,
  Wheat,
};

export function badgeIcon(name: string): LucideIcon {
  return BADGE_ICONS[name] ?? Award;
}
