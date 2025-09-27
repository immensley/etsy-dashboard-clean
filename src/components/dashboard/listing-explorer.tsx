"use client";

import { useId, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingExplorerItem } from "@/lib/dashboard-types";

export function ListingExplorer({ items }: { items: ListingExplorerItem[] }) {
  const [activeIndex, setActiveIndex] = useState(1);
  const clipPathId = useId();

  const arranged = useMemo(() => {
    const middle = activeIndex % items.length;
    const before = items[(middle - 1 + items.length) % items.length];
    const after = items[(middle + 1) % items.length];
    const focus = items[middle];
    return { before, focus, after };
  }, [activeIndex, items]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent)]" />
      <div className="relative flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Immersive Listing Explorer</h2>
            <p className="text-sm text-white/60 max-w-2xl">
              Hover to orbit. Each panel fuses live inventory with review energy, revealing how variants resonate right now.
            </p>
          </div>
          <Badge className="border border-white/15 bg-white/10 text-white/70 uppercase tracking-[0.28em]">3d orbit</Badge>
        </div>
        <div className="relative h-[420px] perspective-[1600px]">
          <div className="absolute inset-0" style={{ perspective: "1600px" }}>
            {[arranged.before, arranged.focus, arranged.after].map((item, idx) => {
              const position = idx - 1; // -1, 0, 1
              const isActive = position === 0;
              const rotate = position * 24;
              const translateZ = isActive ? 160 : 40;
              const translateX = position * 220;
              const opacity = isActive ? 1 : 0.45;

              return (
                <Card
                  key={item.id}
                  onMouseEnter={() => setActiveIndex(items.findIndex((candidate) => candidate.id === item.id))}
                  className={cn(
                    "absolute top-10 left-1/2 w-[320px] -translate-x-1/2 border-white/10",
                    "bg-gradient-to-br from-white/10 via-slate-900/50 to-slate-950/60 backdrop-blur-xl",
                    "transition-all duration-500 ease-out cursor-pointer",
                    isActive && "shadow-[0_30px_120px_rgba(56,189,248,0.45)]",
                  )}
                  style={{
                    transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotate}deg)` +
                      (isActive ? " scale(1.06)" : " scale(0.94)"),
                    opacity,
                  }}
                >
                  <div className="overflow-hidden rounded-t-2xl">
                    <div
                      className={cn(
                        "relative h-48 transition-transform duration-500",
                        isActive ? "scale-[1.015]" : "scale-100",
                      )}
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(2,6,23,0.9), rgba(2,6,23,0.4)), url(${item.hero})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                        <Badge className="border-none bg-emerald-500/25 text-emerald-100/90">
                          {item.stats.conversions.toFixed(1)}% convert
                        </Badge>
                        <p className="text-sm text-white/80 max-w-[220px]">{item.highlight}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4 text-white/80">
                    <h3 className="text-lg font-semibold text-white/90">{item.title}</h3>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex flex-col">
                        <span className="text-xs text-white/50">Views</span>
                        <span className="text-base font-semibold text-white">{item.stats.views.toLocaleString()}</span>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-xs text-white/50">Favorites</span>
                        <span className="text-base font-semibold text-white">{item.stats.favorites.toLocaleString()}</span>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-xs text-white/50">Conversion</span>
                        <span className="text-base font-semibold text-emerald-200">
                          {item.stats.conversions.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-white/50 mb-3">Variant pulse</p>
                      <div className="space-y-3 text-sm">
                        {item.variants.map((variant) => (
                          <div key={variant.option} className="flex items-center justify-between text-white/70">
                            <span className="font-medium text-white/80">{variant.option}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-white/50">{variant.stock} in stock</span>
                              <span className="text-sm font-semibold text-white/90">{variant.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 opacity-0" style={{ clipPath: `url(#${clipPathId})` }} />
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <svg width="0" height="0">
        <clipPath id={clipPathId}>
          <rect rx="24" ry="24" width="100%" height="100%" />
        </clipPath>
      </svg>
    </div>
  );
}
