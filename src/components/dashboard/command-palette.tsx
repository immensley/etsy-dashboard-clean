"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Activity, Sparkles, Zap, RefreshCcw, TrendingUp, Eye, Star } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CommandAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof iconMap;
}

const iconMap = {
  Search,
  Activity,
  Sparkles,
  Zap,
  RefreshCcw,
  TrendingUp,
  Eye,
  Star,
};

interface CommandPaletteProps {
  onExecute: (action: CommandAction) => void;
}

const actions: CommandAction[] = [
  {
    id: "fetch-live-metrics",
    title: "Sync fresh live metrics",
    subtitle: "Pulls the latest zenrows snapshot across all MCPs",
    icon: "RefreshCcw",
  },
  {
    id: "highlight-spikes",
    title: "Show today’s breakout listings",
    subtitle: "Focus the explorer on listings spiking in conversion",
    icon: "TrendingUp",
  },
  {
    id: "low-stock",
    title: "Surface low inventory variants",
    subtitle: "Flag offerings falling below threshold",
    icon: "Activity",
  },
  {
    id: "review-triage",
    title: "Open review triage",
    subtitle: "Filter new 3-star reviews requiring response",
    icon: "Eye",
  },
  {
    id: "celebrate-win",
    title: "Trigger celebration",
    subtitle: "Launch the confetti pulse for a sales milestone",
    icon: "Sparkles",
  },
  {
    id: "favorites-wave",
    title: "Zoom to favorites wave",
    subtitle: "Animate analytics around admirer surges",
    icon: "Star",
  },
  {
    id: "toggle-story",
    title: "Narrate today’s story arc",
    subtitle: "Jump into immersive story mode",
    icon: "Zap",
  },
];

export function CommandPalette({ onExecute }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query) {
      return actions;
    }
    return actions.filter((action) =>
      `${action.title} ${action.subtitle}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  const handleKey = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handleExecute = useCallback(
    (action: CommandAction) => {
      onExecute(action);
      setOpen(false);
      setQuery("");
    },
    [onExecute],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/60 transition hover:text-white hover:border-white/30 backdrop-blur"
      >
        <Search className="size-4 text-white/50 transition group-hover:scale-110" />
        Quick actions
        <kbd className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.28em] text-white/40 group-hover:text-white/60">
          ⌘K
        </kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border-white/10 bg-slate-950/90 text-white backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Search className="size-4 text-white/50" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What do you want to orchestrate?"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
                  Nothing yet. Try “metrics” or “story”.
                </div>
              )}
              {filtered.map((action) => {
                const Icon = iconMap[action.icon];
                return (
                  <button
                    key={action.id}
                    onClick={() => handleExecute(action)}
                    className={cn(
                      "w-full text-left rounded-xl border border-transparent px-4 py-3 transition",
                      "hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:shadow-[0_18px_60px_rgba(16,185,129,0.35)]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-white/10 bg-white/5 p-2">
                        <Icon className="size-4 text-emerald-200" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{action.title}</p>
                        <p className="text-xs text-white/50">{action.subtitle}</p>
                      </div>
                      <Badge className="border-none bg-white/10 text-white/50 uppercase tracking-[0.28em]">run</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
