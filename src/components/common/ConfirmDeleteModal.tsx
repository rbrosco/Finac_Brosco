"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  itemName?: string;
  itemDetails?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Exclusão",
  description = "Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.",
  itemName,
  itemDetails
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-white">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Highlighted item summary if provided */}
        {(itemName || itemDetails) && (
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            {itemName && (
              <p className="font-bold text-xs text-slate-200 truncate">{itemName}</p>
            )}
            {itemDetails && (
              <p className="text-[11px] text-slate-400 font-mono">{itemDetails}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-600/30"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir Definitivamente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
