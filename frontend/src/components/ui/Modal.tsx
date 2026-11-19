import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass =
    size === "lg" ? "cimas-modal--lg" : size === "xl" ? "cimas-modal--xl" : "";

  return (
    <div className="cimas-modal-overlay" onClick={onClose}>
      <div
        className={`cimas-modal ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cimas-modal__header">
          <h3 className="cimas-modal__title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="cimas-modal__body">{children}</div>

        {footer && <div className="cimas-modal__footer">{footer}</div>}
      </div>
    </div>
  );
};
