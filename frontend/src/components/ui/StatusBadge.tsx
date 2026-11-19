import React from "react";

export type BadgeVariant = "active" | "inactive" | "pending" | "danger" | "blue" | "purple" | "neutral";

export interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = "active",
  showDot = true,
  className = "",
}) => {
  return (
    <span className={`cimas-badge cimas-badge--${variant} ${className}`}>
      {showDot && <span className="badge-dot" />}
      {label}
    </span>
  );
};
