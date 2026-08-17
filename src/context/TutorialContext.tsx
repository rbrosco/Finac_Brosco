"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface TutorialContextType {
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  completedHelpIds: string[];
  dismissHelpMarker: (id: string) => void;
  resetHelpMarkers: () => void;
  isHelpGlobalEnabled: boolean;
  toggleHelpGlobal: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [completedHelpIds, setCompletedHelpIds] = useState<string[]>([]);
  const [isHelpGlobalEnabled, setIsHelpGlobalEnabled] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("finac_dismissed_help_ids");
      if (stored) {
        setCompletedHelpIds(JSON.parse(stored));
      }
      const storedGlobal = localStorage.getItem("finac_help_global_enabled");
      if (storedGlobal !== null) {
        setIsHelpGlobalEnabled(JSON.parse(storedGlobal));
      }
    } catch (e) {
      console.error("Error reading tutorial state from localStorage", e);
    }
  }, []);

  const openTutorial = () => setIsTutorialOpen(true);
  const closeTutorial = () => setIsTutorialOpen(false);

  const dismissHelpMarker = (id: string) => {
    setCompletedHelpIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem("finac_dismissed_help_ids", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving tutorial state to localStorage", e);
      }
      return updated;
    });
  };

  const resetHelpMarkers = () => {
    setCompletedHelpIds([]);
    try {
      localStorage.removeItem("finac_dismissed_help_ids");
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHelpGlobal = () => {
    setIsHelpGlobalEnabled((prev) => {
      const updated = !prev;
      try {
        localStorage.setItem("finac_help_global_enabled", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  return (
    <TutorialContext.Provider
      value={{
        isTutorialOpen,
        openTutorial,
        closeTutorial,
        completedHelpIds,
        dismissHelpMarker,
        resetHelpMarkers,
        isHelpGlobalEnabled,
        toggleHelpGlobal,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
