import React from "react";
import { LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  icon: Icon,
  iconPosition = "left",
  loading = false,
  size = "md",
  className = "",
  disabled,
  ...props
}) => {
  const sizeClass = size === "sm" ? "cimas-btn--sm" : size === "lg" ? "cimas-btn--lg" : "";
  return (
    <button
      className={`cimas-btn cimas-btn--primary ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        Icon && iconPosition === "left" && <Icon className="w-4 h-4 shrink-0" />
      )}
      {children}
      {!loading && Icon && iconPosition === "right" && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  icon: Icon,
  iconPosition = "left",
  loading = false,
  size = "md",
  className = "",
  disabled,
  ...props
}) => {
  const sizeClass = size === "sm" ? "cimas-btn--sm" : size === "lg" ? "cimas-btn--lg" : "";
  return (
    <button
      className={`cimas-btn cimas-btn--secondary ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      ) : (
        Icon && iconPosition === "left" && <Icon className="w-4 h-4 shrink-0" />
      )}
      {children}
      {!loading && Icon && iconPosition === "right" && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: "secondary" | "primary";
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = "secondary",
  className = "",
  tooltip,
  ...props
}) => {
  return (
    <button
      className={`cimas-icon-btn ${
        variant === "primary" ? "cimas-icon-btn--primary" : ""
      } ${className}`}
      title={tooltip}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};
