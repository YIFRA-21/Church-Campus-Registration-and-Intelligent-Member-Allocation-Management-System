import React from "react";
import { LucideIcon } from "lucide-react";

export type StatCardColor = "blue" | "purple" | "cyan" | "green" | "orange" | "pink" | "indigo";

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: StatCardColor;
  badge?: {
    text: string;
    variant?: "positive" | "negative" | "neutral";
  };
  sparklineData?: number[];
  onClick?: () => void;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  badge,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`cimas-stat-card cimas-stat-card--${color} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="cimas-stat-card__top">
        <span className="cimas-stat-card__title">{title}</span>
        <div className="cimas-stat-card__icon-box">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="cimas-stat-card__value">{value}</div>

      <div className="cimas-stat-card__footer">
        {badge && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              badge.variant === "negative"
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                : badge.variant === "neutral"
                ? "bg-slate-700/40 text-slate-300 border border-slate-600/30"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {badge.text}
          </span>
        )}
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
    </div>
  );
};
