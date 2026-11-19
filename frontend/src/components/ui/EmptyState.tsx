import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { PrimaryButton } from "./Buttons";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#263653] rounded-3xl bg-[#17233B]/40">
      <div className="w-14 h-14 rounded-2xl bg-[#1E2C47] text-purple-400 border border-[#263653] flex items-center justify-center mb-4 shadow-lg shadow-purple-500/5">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
      )}
    </div>
  );
};
