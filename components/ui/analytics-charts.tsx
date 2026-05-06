"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toDecimal, type DecimalInput } from "@/lib/calculations";

type ChartPoint = {
  label: string;
  value: DecimalInput;
  tooltipLabel?: string;
  tooltipValue?: string;
  tooltipLines?: string[];
};

type DonutItem = {
  label: string;
  value: DecimalInput;
  caption?: string;
};

const palette = ["#0f8f62", "#d99a17", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

const compactFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
  numberingSystem: "latn",
});

function toChartNumber(value: DecimalInput) {
  return toDecimal(value).abs().toNumber();
}

function formatCompact(value: number) {
  return compactFormatter.format(value);
}

function buildChartData(points: ChartPoint[]) {
  return points.map((point) => ({
    name: point.label,
    value: toChartNumber(point.value),
    tooltipLabel: point.tooltipLabel,
    tooltipValue: point.tooltipValue,
    tooltipLines: point.tooltipLines,
  }));
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      tooltipLabel?: string;
      tooltipValue?: string;
      tooltipLines?: string[];
    };
  }>;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;
  const label = item.tooltipLabel ?? item.name;
  const value = item.tooltipValue ?? formatCompact(item.value);
  const lines = item.tooltipLines ?? [];

  return (
    <div className="rounded-lg border border-line/80 bg-white px-3 py-2 text-xs shadow-soft">
      <p className="text-muted">{label}</p>
      {lines.length > 0 ? (
        <div className="mt-2 grid gap-1">
          {lines.map((line) => (
            <p key={line} className="text-sm font-semibold text-ink">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
      )}
    </div>
  );
}

export function MiniLineChart({
  title,
  subtitle,
  points,
  tone = "green",
  hoverable = false,
}: {
  title: string;
  subtitle?: string;
  points: ChartPoint[];
  tone?: "green" | "gold";
  hoverable?: boolean;
}) {
  const color = tone === "gold" ? "#d99a17" : "#0f8f62";
  const chartData = buildChartData(points.length > 0 ? points : [{ label: "-", value: 0 }]);
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
        </div>
        <span className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
          {formatCompact(total)}
        </span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${tone}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e4e1da" strokeDasharray="4 6" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#6f7d78", fontSize: 11 }} />
            <YAxis hide domain={[0, "dataMax + 2"]} />
            {hoverable ? (
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#d8d2c5", strokeDasharray: "4 6" }} />
            ) : null}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fill={`url(#${tone}-area)`}
              dot={{ r: 4, strokeWidth: 2, stroke: color, fill: "#ffffff" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: color, fill: "#ffffff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BarChart({
  title,
  subtitle,
  points,
  tone = "gold",
  hoverable = false,
  summary,
  highlightIndex,
  mutedColorClassName = "#d7dadd",
}: {
  title: string;
  subtitle?: string;
  points: ChartPoint[];
  tone?: "gold" | "red";
  hoverable?: boolean;
  summary?: string;
  highlightIndex?: number;
  mutedColorClassName?: string;
}) {
  const color = tone === "red" ? "#ef4444" : "#d99a17";
  const chartData = buildChartData(points.length > 0 ? points : [{ label: "-", value: 0 }]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const effectiveHighlightIndex = typeof highlightIndex === "number" ? highlightIndex : activeIndex;

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {summary ? (
          <span className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
            {summary}
          </span>
        ) : null}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eceae4" strokeDasharray="4 6" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#6f7d78", fontSize: 11 }} />
            <YAxis hide />
            {hoverable ? (
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f3f1ec" }} />
            ) : null}
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              onMouseLeave={() => setActiveIndex(null)}
              style={hoverable ? { cursor: "pointer" } : undefined}
            >
              {chartData.map((entry, index) => {
                const isHighlighted = typeof effectiveHighlightIndex === "number" ? effectiveHighlightIndex === index : true;
                const fill = isHighlighted ? color : mutedColorClassName;
                const opacity = typeof effectiveHighlightIndex === "number" ? (isHighlighted ? 1 : 0.45) : 1;

                return (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={fill}
                    fillOpacity={opacity}
                    onMouseEnter={hoverable ? () => setActiveIndex(index) : undefined}
                  />
                );
              })}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DonutChart({
  title,
  subtitle,
  items,
  centerLabel,
  centerValue,
}: {
  title: string;
  subtitle?: string;
  items: DonutItem[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const baseData = useMemo(
    () =>
      items.map((item, index) => ({
        name: item.label,
        value: toChartNumber(item.value),
        caption: item.caption,
        color: palette[index % palette.length],
      })),
    [items],
  );
  const total = useMemo(() => baseData.reduce((sum, entry) => sum + entry.value, 0), [baseData]);
  const chartData = useMemo(
    () =>
      baseData.map((entry) => {
        const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
        return {
          ...entry,
          tooltipLabel: entry.name,
          tooltipValue: `${formatCompact(entry.value)} (${percent}%)`,
        };
      }),
    [baseData, total],
  );

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <div className="mb-4">
        <h3 className="font-bold text-ink">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
        <div className="relative h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={4}
                onMouseLeave={() => setActiveIndex(null)}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                style={{ cursor: "pointer" }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted">{centerLabel ?? "الإجمالي"}</span>
            <strong className="mt-1 text-xl text-ink">{centerValue ?? formatCompact(total)}</strong>
          </div>
        </div>
        <div className="grid gap-3">
          {chartData.map((item, index) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const isActive = activeIndex === index;
            return (
              <div
                key={item.name}
                className={`grid gap-1 rounded-lg p-2 transition ${isActive ? "bg-mint/40" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                style={{ cursor: "pointer" }}
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 font-semibold text-ink">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-muted">{percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-paper">
                  <div className="h-2 rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color }} />
                </div>
                {item.caption ? <p className="text-xs text-muted">{item.caption}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RankingChart({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: DecimalInput; caption?: string }>;
}) {
  const chartData = rows.map((row) => ({
    name: row.label,
    value: toChartNumber(row.value),
    caption: row.caption,
  }));

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <h3 className="mb-4 font-bold text-ink">{title}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <CartesianGrid stroke="#eceae4" strokeDasharray="4 6" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fill: "#6f7d78", fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#0f8f62" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
      {rows.some((row) => row.caption) ? (
        <div className="mt-3 grid gap-1 text-xs text-muted">
          {rows.map((row) =>
            row.caption ? (
              <div key={row.label} className="flex items-center justify-between">
                <span>{row.label}</span>
                <span>{row.caption}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
