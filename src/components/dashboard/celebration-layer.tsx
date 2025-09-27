"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface CelebrationLayerProps {
  triggerKey: number;
}

interface BurstShard {
  id: string;
  delay: number;
  left: string;
  background: string;
  duration: number;
}

export function CelebrationLayer({ triggerKey }: CelebrationLayerProps) {
  const shards = useMemo(() => {
    return Array.from({ length: 42 }).map((_, index) => {
      const hue = Math.round(140 + Math.random() * 120);
      return {
        id: `${triggerKey}-${index}`,
        delay: Math.random() * 80,
        left: `${Math.random() * 100}%`,
        background: `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${(hue + 40) % 360}, 90%, 65%))`,
        duration: 6 + Math.random() * 4,
      } satisfies BurstShard;
    });
  }, [triggerKey]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--celebration", "1");
    const timeout = window.setTimeout(() => {
      root.style.removeProperty("--celebration");
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [triggerKey]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {shards.map((shard) => (
        <span
          key={shard.id}
          className={cn(
            "absolute top-[-10%] h-10 w-2 origin-center rounded-full opacity-0 animate-[fall_3s_ease-in-out_forwards]",
            "shadow-[0_8px_16px_rgba(15,118,110,0.35)]",
          )}
          style={{
            left: shard.left,
            animationDelay: `${shard.delay}ms`,
            animationDuration: `${shard.duration}s`,
            background: shard.background,
          }}
        />
      ))}
    </div>
  );
}
