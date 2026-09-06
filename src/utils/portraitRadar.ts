import type { PortraitDimension } from "@/services/portraitApi";

export interface PortraitRadarDatum {
  label: string;
  score: number;
}

export function getPortraitRadarData(dimensions: PortraitDimension[]): PortraitRadarDatum[] {
  return dimensions
    .map((dimension) => {
      const rawScore: unknown = dimension.score;
      const score = typeof rawScore === "number"
        ? rawScore
        : typeof rawScore === "string" && rawScore.trim()
          ? Number(rawScore)
          : Number.NaN;
      return { dimension, score };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => a.dimension.display_order - b.dimension.display_order)
    .map(({ dimension, score }) => ({
      label: dimension.dimension_label || dimension.dimension_code,
      score: Math.max(0, Math.min(100, score)),
    }));
}
