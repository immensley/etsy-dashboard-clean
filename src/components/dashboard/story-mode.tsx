"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoryBeat } from "@/lib/dashboard-types";

const toneMap: Record<StoryBeat["tone"], { badge: string; gradient: string; accent: string }> = {
  celebrate: {
    badge: "text-emerald-200 bg-emerald-500/20 border-emerald-300/50",
    gradient: "from-emerald-500/20 via-transparent to-cyan-400/10",
    accent: "text-emerald-200",
  },
  alert: {
    badge: "text-rose-200 bg-rose-500/20 border-rose-300/40",
    gradient: "from-rose-500/20 via-transparent to-orange-400/10",
    accent: "text-rose-200",
  },
  insight: {
    badge: "text-sky-200 bg-sky-500/20 border-sky-300/40",
    gradient: "from-sky-500/20 via-transparent to-indigo-400/10",
    accent: "text-sky-200",
  },
};

export function StoryMode({ beats }: { beats: StoryBeat[] }) {
  const [index, setIndex] = useState(0);
  const activeBeat = beats[index % beats.length];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((value) => (value + 1) % beats.length);
    }, 6200);
    return () => window.clearInterval(interval);
  }, [beats.length]);

  const queued = useMemo(() => {
    const items: StoryBeat[] = [];
    for (let i = 1; i <= 2; i += 1) {
      items.push(beats[(index + i) % beats.length]);
    }
    return items;
  }, [beats, index]);

  const tone = toneMap[activeBeat.tone];

  return (
    <Card className="border-white/10 bg-slate-950/70 overflow-hidden">
      <div
        className={cn(
          "relative p-6 min-h-[240px] flex flex-col gap-6 transition-all duration-500",
          "shadow-[0_40px_120px_rgba(56,189,248,0.25)]",
          `bg-gradient-to-br ${tone.gradient}`,
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <Badge className={cn("uppercase tracking-[0.32em]", tone.badge)}>story mode</Badge>
            <p className="mt-2 text-sm text-white/60">An AI narrator weaving today&apos;s operational beats.</p>
          </div>
          <span className="text-xs text-white/50">{activeBeat.timestamp}</span>
        </div>
        <div className="space-y-3">
          <h3 className={cn("text-2xl font-semibold", tone.accent)}>{activeBeat.title}</h3>
          <p className="text-base text-white/80 leading-relaxed max-w-2xl">{activeBeat.copy}</p>
        </div>
        <div className="mt-auto grid gap-3">
          {queued.map((beat, idx) => (
            <div
              key={`${beat.title}-${idx}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
            >
              <div>
                <p className="text-sm font-medium text-white/80">{beat.title}</p>
                <p className="text-xs text-white/50">{beat.timestamp}</p>
              </div>
              <Badge className={cn("border-none uppercase tracking-[0.25em]", toneMap[beat.tone].badge)}>
                queued
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
