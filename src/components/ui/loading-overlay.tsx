"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
  className?: string;
}

export function LoadingOverlay({ show, label = "Syncing data…", className }: LoadingOverlayProps) {
  if (!show) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-4 shadow-[0_20px_80px_rgba(56,189,248,0.35)]">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-200" />
        <span className="text-xs uppercase tracking-[0.32em] text-white/80">{label}</span>
      </div>
    </div>
  );
}
