"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LiveOpsEvent } from "@/lib/dashboard-types";

const severityStyles: Record<LiveOpsEvent["severity"], string> = {
  info: "bg-sky-500/20 text-sky-100 border-sky-400/30",
  warning: "bg-amber-500/20 text-amber-100 border-amber-400/40",
  success: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
};

export function LiveOpsDashboard({ events }: { events: LiveOpsEvent[] }) {
  const [feed, setFeed] = useState(events);

  useEffect(() => {
    const pulse = window.setInterval(() => {
      setFeed((prev) => {
        const rotated = [...prev.slice(1), prev[0]];
        return rotated.map((item, index) => ({
          ...item,
          timestamp: index === 0 ? "just now" : item.timestamp,
        }));
      });
    }, 9000);

    return () => window.clearInterval(pulse);
  }, []);

  return (
    <Card className="border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Live Ops War-Room</h2>
            <p className="text-sm text-white/60">
              Streaming high-signal events across reviews, inventory, and revenue.
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/40 uppercase tracking-[0.28em]">
            always on
          </Badge>
        </div>
        <div className="space-y-3">
          {feed.map((event, index) => (
            <div
              key={event.id}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition-all",
                index === 0 && "border-emerald-400/40 bg-emerald-500/10 shadow-[0_20px_80px_rgba(16,185,129,0.3)]",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.28em]", severityStyles[event.severity])}>
                    {event.severity}
                  </span>
                  <p className="text-sm font-semibold text-white/90">{event.title}</p>
                </div>
                <span className="text-xs text-white/50">{event.timestamp}</span>
              </div>
              <p className="mt-2 text-sm text-white/60">{event.message}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
