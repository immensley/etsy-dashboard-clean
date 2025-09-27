"use client";

import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalyticsTabKey, HeatmapCell, MetricSparkline, SectionStrength } from "@/lib/dashboard-types";

export interface AnalyticsTabsProps {
  sparklineMetrics: MetricSparkline[];
  sectionStrengths: SectionStrength[];
  engagementHeatmap: HeatmapCell[];
  activeTab?: AnalyticsTabKey;
  onTabChange?: (value: AnalyticsTabKey) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = [8, 10, 12, 14, 16, 18, 20, 22];

function Sparkline({ values, accent }: { values: number[]; accent: string }) {
  const points = useMemo(() => {
    if (values.length === 0) {
      return "";
    }
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(max - min, 1);
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1 || 1)) * 120;
        const y = 40 - ((value - min) / range) * 40;
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  const gradientId = `spark-${accent.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg viewBox="0 0 120 40" className="w-full h-[70px] text-white/70">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity={0.7} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#${gradientId})`}
        stroke={accent}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={`${points} ${points ? "120,40 0,40" : ""}`.trim()}
      />
      <polyline
        fill="none"
        stroke={accent}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function RadarCell({ label, score, max = 100 }: { label: string; score: number; max?: number }) {
  const progress = Math.min(Math.max(score / max, 0), 1);
  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-400/25 via-emerald-500/20 to-cyan-400/30"
          style={{ transform: `scale(${progress})`, transformOrigin: "center" }}
        />
        <div className="absolute inset-[18%] rounded-full border border-white/10" />
        <div className="absolute inset-[38%] rounded-full border border-white/10" />
        <span className="absolute inset-0 grid place-content-center text-2xl font-semibold text-white">
          {Math.round(score)}
        </span>
      </div>
      <span className="text-xs uppercase tracking-widest text-white/70">{label}</span>
    </div>
  );
}

function Heatmap({ data }: { data: HeatmapCell[] }) {
  return (
    <div className="grid grid-cols-[auto_repeat(8,minmax(0,1fr))] gap-3">
      <div />
      {HOURS.map((hour) => (
        <span key={hour} className="text-xs text-white/60 text-center">
          {hour}
        </span>
      ))}
      {DAYS.map((day) => (
        <>
          <span key={day} className="text-xs text-white/60">
            {day}
          </span>
          {HOURS.map((hour) => {
            const cell = data.find((entry) => entry.day === day && entry.hour === hour);
            const intensity = cell ? Math.min(cell.value / 100, 1) : 0;
            return (
              <div
                key={`${day}-${hour}`}
                className="rounded-md h-10 transition-transform duration-150"
                style={{
                  background: `linear-gradient(135deg, rgba(56, 189, 248, ${0.15 + intensity * 0.5}), rgba(16, 185, 129, ${0.1 + intensity * 0.4}))`,
                  boxShadow: intensity > 0.2 ? `0 6px 18px rgba(16, 185, 129, ${intensity * 0.4})` : undefined,
                  transform: intensity > 0.3 ? `translateY(-${Math.round(intensity * 6)}px)` : undefined,
                }}
              />
            );
          })}
        </>
      ))}
    </div>
  );
}

export function AnalyticsTabs({
  sparklineMetrics,
  sectionStrengths,
  engagementHeatmap,
  activeTab = "overview",
  onTabChange,
}: AnalyticsTabsProps) {
  return (
    <Card className="bg-slate-950/70 border-white/10 backdrop-blur-2xl shadow-[0_40px_120px_rgba(15,118,110,0.25)]">
      <div className="p-6 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Pulse Analytics</h2>
            <p className="text-sm text-white/60">
              Live metrics synthesized from shop performance, section depth, and buyer energy.
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-300/40 uppercase tracking-widest">
            realtime sync
          </Badge>
        </div>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange?.((value as AnalyticsTabKey) ?? "overview")}
        className="px-6 pb-6"
      >
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="momentum">Momentum</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {sparklineMetrics.map((metric) => {
              const accent = metric.change >= 0 ? "#34d399" : "#f87171";
              return (
                <Card
                  key={metric.label}
                  className={cn(
                    "relative overflow-hidden border-white/10 bg-white/5",
                    "hover:border-emerald-400/40 hover:shadow-[0_20px_80px_rgba(52,211,153,0.25)] transition-all",
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/60">{metric.trendLabel}</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{metric.label}</h3>
                      </div>
                      <Badge
                        className={cn(
                          "border-none",
                          metric.change >= 0
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-rose-500/20 text-rose-200",
                        )}
                      >
                        {metric.change > 0 ? `+${metric.change.toFixed(1)}%` : `${metric.change.toFixed(1)}%`}
                      </Badge>
                    </div>
                    <Sparkline values={metric.values} accent={accent} />
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="sections" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sectionStrengths.map((section) => (
              <Card
                key={section.name}
                className="border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent p-6 flex flex-col gap-5 hover:shadow-[0_24px_80px_rgba(16,185,129,0.28)] transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{section.name}</h3>
                  <Badge className="bg-white/10 text-white/70 border-white/10">
                    {section.velocity >= 0 ? `+${section.velocity.toFixed(1)}%` : `${section.velocity.toFixed(1)}%`} flow
                  </Badge>
                </div>
                <div className="flex justify-center gap-6">
                  <RadarCell label="Strength" score={section.score} />
                  <div className="flex flex-col justify-center gap-2 text-white/80">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/50">Momentum</p>
                      <p className="text-2xl font-semibold text-white">
                        {section.velocity >= 0 ? `+${section.velocity.toFixed(1)}` : section.velocity.toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-xs text-white/60 max-w-[160px]">
                      Real-time sentiment weaving inventory depth with review velocity.
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="momentum" className="mt-6">
          <Card className="border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Buyer Energy Heatmap</h3>
                <p className="text-sm text-white/60">Every flare is a micro-spike in conversions across the week.</p>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-100 border-cyan-400/30">zenrows synced</Badge>
            </div>
            <div className="mt-6 overflow-x-auto">
              <Heatmap data={engagementHeatmap} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
