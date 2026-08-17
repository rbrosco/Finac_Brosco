"use client";

import React, { useState } from "react";
import { HelpCircle, Check, X, Sparkles } from "lucide-react";
import { useTutorial } from "@/context/TutorialContext";

interface HelpTooltipProps {
  id: string;
  title: string;
  description: string;
  actionHint?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function HelpTooltip({
  id,
  title,
  description,
  actionHint,
  position = "top",
  className = "",
}: HelpTooltipProps) {
  const { completedHelpIds, dismissHelpMarker, isHelpGlobalEnabled } = useTutorial();
  const [isOpen, setIsOpen] = useState(false);

  // If globally disabled or user dismissed this specific marker, render nothing
  if (!isHelpGlobalEnabled || completedHelpIds.includes(id)) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    dismissHelpMarker(id);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full mt-2 left-1/2 -translate-x-1/2";
      case "left":
        return "right-full mr-2 top-1/2 -translate-y-1/2";
      case "right":
        return "left-full ml-2 top-1/2 -translate-y-1/2";
      case "top":
      default:
        return "bottom-full mb-2 left-1/2 -translate-x-1/2";
    }
  };

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Ajuda e Explicação (?)"
        className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-400 hover:text-white hover:bg-brand-500 hover:scale-110 flex items-center justify-center font-bold text-xs transition-all shadow-md group animate-pulse"
      >
        <span className="text-[11px]">?</span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-72 p-4 bg-slate-900/95 border border-brand-500/40 rounded-2xl shadow-2xl backdrop-blur-xl space-y-2.5 text-xs ${getPositionClasses()}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              {title}
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">{description}</p>

          {actionHint && (
            <div className="p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium">
              <span>💡 Dica de Ação:</span> {actionHint}
            </div>
          )}

          <div className="pt-1 flex items-center justify-end">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-[11px] flex items-center gap-1 transition-all shadow-md shadow-emerald-600/20"
            >
              <Check className="w-3 h-3" /> Entendi! (Ocultar)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
