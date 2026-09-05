import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PortraitDimension } from "@/services/portraitApi";
import { cn } from "@/utils/cn";
import { getPortraitRadarData } from "@/utils/portraitRadar";

interface PortraitRadarChartProps {
  dimensions: PortraitDimension[];
  compact?: boolean;
  className?: string;
}

export function PortraitRadarChart({ dimensions, compact = false, className }: PortraitRadarChartProps) {
  const data = getPortraitRadarData(dimensions);
  if (data.length < 3) {
    return (
      <div className={cn("flex h-full min-h-20 items-center justify-center text-center text-xs text-[#8a9994]", className)}>
        证据不足
      </div>
    );
  }

  return (
    <div
      className={cn(compact ? "h-20 w-28" : "h-64 w-full min-w-[280px]", className)}
      role="img"
      aria-label={`画像能力雷达图，包含${data.length}个有效维度`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={compact ? "62%" : "72%"}>
          <PolarGrid stroke="#d8e6e1" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "#60706b", fontSize: compact ? 8 : 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={3}
            tick={{ fill: "#8a9994", fontSize: compact ? 8 : 10 }}
            axisLine={false}
          />
          <Radar
            name="分数"
            dataKey="score"
            stroke="#146d68"
            fill="#70aaa4"
            fillOpacity={0.36}
            strokeWidth={compact ? 1.5 : 2}
            isAnimationActive={!compact}
          />
          <Tooltip
            formatter={(value) => [`${value} 分`, "分数"]}
            contentStyle={{
              border: "1px solid #d9e5e1",
              borderRadius: 8,
              color: "#263b35",
              fontSize: 12,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
