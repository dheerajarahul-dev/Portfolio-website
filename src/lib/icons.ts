import {
  CheckCircle,
  Sparkles,
  FastForward,
  Film,
  Globe,
  PlayCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./types";

const iconMap: Record<IconName, LucideIcon> = {
  CheckCircle,
  Sparkles,
  FastForward,
  Film,
  Globe,
  PlayCircle,
  Settings,
};

export function getIcon(name: IconName): LucideIcon {
  return iconMap[name] ?? Sparkles;
}
