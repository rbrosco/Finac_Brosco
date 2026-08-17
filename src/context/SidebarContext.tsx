"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("finac_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to read sidebar preference", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("finac_sidebar_collapsed", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save sidebar preference", e);
      }
      return next;
    });
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem("finac_sidebar_collapsed", JSON.stringify(collapsed));
    } catch (e) {
      console.error("Failed to save sidebar preference", e);
    }
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
