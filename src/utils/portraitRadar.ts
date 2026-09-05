import type { PortraitDimension } from "@/services/portraitApi";

export interface PortraitRadarDatum {
  label: string;
  score: number;
}

export function getPortraitRadarData(dimensions: PortraitDimension[]): PortraitRadarDatum[] {
  return dimensions
    .filter((dimension) => typeof dimension.score === "number" && Number.isFinite(dimension.score))
    .sort((a, b) => a.display_order - b.display_order)
    .map((dimension) => ({
      label: dimension.dimension_label || dimension.dimension_code,
      score: Math.max(0, Math.min(100, dimension.score as number)),
    }));
}
