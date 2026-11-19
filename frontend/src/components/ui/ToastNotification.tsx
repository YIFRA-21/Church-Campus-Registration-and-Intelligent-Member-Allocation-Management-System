import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastNotificationProps {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  type = "info",
  title,
  message,
  onClose,
}) => {
  const config = {
    success: {
      icon: CheckCircle2,
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      iconColor: "text-emerald-400",
    },
    warning: {
      icon: AlertTriangle,
      style: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      iconColor: "text-amber-400",
    },
    error: {
      icon: AlertCircle,
      style: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      iconColor: "text-rose-400",
    },
    info: {
      icon: Info,
      style: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      iconColor: "text-purple-400",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-xl bg-[#1E2C47]/95 ${config.style} max-w-sm w-full animate-in slide-in-from-top-2 duration-200`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 overflow-hidden">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        {message && (
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-white p-1 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
