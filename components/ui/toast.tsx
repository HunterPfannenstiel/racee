"use client";

import { XIcon } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 bg-elevated border border-state-error/40 rounded-sm px-4 py-3 animate-in slide-in-from-bottom-2 fade-in duration-[240ms] ease-out"
        >
          <p className="text-xs font-mono text-state-error">{toast.message}</p>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
