import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { PrimaryButton, SecondaryButton } from "./Buttons";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <SecondaryButton onClick={onClose} disabled={loading}>
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            onClick={onConfirm}
            loading={loading}
            className={isDestructive ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/40" : ""}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div
          className={`p-3 rounded-2xl shrink-0 ${
            isDestructive
              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-sm text-slate-300 leading-relaxed">{message}</div>
      </div>
    </Modal>
  );
};
