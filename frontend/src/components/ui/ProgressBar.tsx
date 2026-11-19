import React from "react";

export interface ProgressBarProps {
  percentage: number;
  label?: string;
  subLabel?: string;
  color?: "purple" | "blue" | "cyan" | "green" | "orange";
  height?: number;
  showPercentText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  subLabel,
  color = "purple",
  height = 8,
  showPercentText = true,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  const gradientMap = {
    purple: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
    blue: "linear-gradient(90deg, #3B82F6, #60A5FA)",
    cyan: "linear-gradient(90deg, #06B6D4, #22D3EE)",
    green: "linear-gradient(90deg, #10B981, #34D399)",
    orange: "linear-gradient(90deg, #F59E0B, #FBBF24)",
  };

  return (
    <div className="w-full">
      {(label || showPercentText) && (
        <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
          <span className="text-slate-300">{label}</span>
          {showPercentText && <span className="text-white">{clamped}%</span>}
        </div>
      )}

      <div
        className="w-full bg-[#111A2E] border border-[#263653] rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clamped}%`,
            background: gradientMap[color],
            boxShadow: `0 0 10px rgba(139, 92, 246, 0.5)`,
          }}
        />
      </div>

      {subLabel && (
        <span className="text-[11px] text-slate-500 mt-1 block">{subLabel}</span>
      )}
    </div>
  );
};
