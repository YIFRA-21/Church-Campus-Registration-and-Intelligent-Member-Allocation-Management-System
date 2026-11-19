import React from "react";
import { LucideIcon } from "lucide-react";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  children,
  className = "",
}) => {
  return (
    <div className={`cimas-card ${className}`}>
      <div className="cimas-card__header">
        <div className="flex flex-col">
          <div className="cimas-card__title">
            {Icon && (
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Icon className="w-4 h-4" />
              </span>
            )}
            <span>{title}</span>
            {badge}
          </div>
          {subtitle && <span className="cimas-card__subtitle">{subtitle}</span>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="cimas-card__body">{children}</div>
    </div>
  );
};
