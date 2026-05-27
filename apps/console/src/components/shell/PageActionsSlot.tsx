"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Slot = ReactNode | null;

interface Ctx {
  slot: Slot;
  setSlot: (s: Slot) => void;
}

const PageActionsContext = createContext<Ctx | null>(null);

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [slot, setSlotState] = useState<Slot>(null);
  const setSlot = useCallback((s: Slot) => setSlotState(s), []);
  const value = useMemo(() => ({ slot, setSlot }), [slot, setSlot]);
  return (
    <PageActionsContext.Provider value={value}>
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActionsSlot() {
  const ctx = useContext(PageActionsContext);
  if (!ctx)
    throw new Error("usePageActionsSlot must be used within PageActionsProvider");
  return ctx;
}

// Helper component pages can render to register topbar CTAs.
export function PageActions({ children }: { children: ReactNode }) {
  const { setSlot } = usePageActionsSlot();

  useEffect(() => {
    setSlot(children);
    return () => setSlot(null);
  }, [children, setSlot]);

  return null;
}
