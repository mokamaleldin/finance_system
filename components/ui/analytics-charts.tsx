import { toDecimal, type DecimalInput } from "@/lib/calculations";

type ChartPoint = {
  label: string;
  value: DecimalInput;
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

function normalizedMax(values: number[]) {
  return Math.max(...values, 1);
}

export function MiniLineChart({
  title,
  subtitle,
  points,
  tone = "green",
}: {
  title: string;
  subtitle?: string;
  points: ChartPoint[];
  tone?: "green" | "gold";
}) {
  const color = tone === "gold" ? "#d99a17" : "#0f8f62";
  const values = points.map((point) => toChartNumber(point.value));
  const max = normalizedMax(values);
  const width = 520;
  const height = 210;
  const padding = 26;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const plotted = points.length > 0 ? points : [{ label: "-", value: 0 }];
  const coordinates = plotted.map((point, index) => {
    const x = plotted.length === 1 ? width / 2 : padding + (index / (plotted.length - 1)) * plotWidth;
    const y = padding + plotHeight - (toChartNumber(point.value) / max) * plotHeight;
    return { x, y, label: point.label };
  });
  const linePath = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1]?.x ?? padding} ${height - padding} L ${coordinates[0]?.x ?? padding} ${height - padding} Z`;

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
        </div>
        <span className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
          {formatCompact(values.reduce((total, value) => total + value, 0))}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-hidden" role="img" aria-label={title}>
        <defs>
          <linearGradient id={`${tone}-chart-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + (line / 3) * plotHeight;
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e4e1da" strokeDasharray="4 5" />;
        })}
        <path d={areaPath} fill={`url(#${tone}-chart-fill)`} />
        <path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {coordinates.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke={color} strokeWidth="3" />
            <text x={point.x} y={height - 6} textAnchor="middle" className="fill-muted text-[13px]">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function BarChart({
  title,
  subtitle,
  points,
  tone = "gold",
}: {
  title: string;
  subtitle?: string;
  points: ChartPoint[];
  tone?: "gold" | "red";
}) {
  const values = points.map((point) => toChartNumber(point.value));
  const max = normalizedMax(values);
  const colorClassName = tone === "red" ? "from-red-400 to-red-500" : "from-gold to-amber-400";

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <div className="mb-4">
        <h3 className="font-bold text-ink">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex h-56 items-end gap-3 border-b border-line/80 px-2 pb-3">
        {points.map((point, index) => {
          const height = Math.max((toChartNumber(point.value) / max) * 100, 4);
          return (
            <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-44 w-full items-end justify-center rounded-lg bg-paper/70 px-1">
                <div
                  className={`w-full max-w-9 rounded-t-lg bg-gradient-to-t ${colorClassName} shadow-sm`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="w-full truncate text-center text-xs text-muted">{point.label}</span>
            </div>
          );
        })}
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
  const values = items.map((item) => toChartNumber(item.value));
  const total = values.reduce((sum, value) => sum + value, 0);
  let current = 0;
  const gradient =
    total > 0
      ? items
          .map((item, index) => {
            const value = toChartNumber(item.value);
            const start = current;
            const end = current + (value / total) * 100;
            current = end;
            return `${palette[index % palette.length]} ${start}% ${end}%`;
          })
          .join(", ")
      : "#e4e1da 0% 100%";

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <div className="mb-4">
        <h3 className="font-bold text-ink">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
        <div className="relative mx-auto h-44 w-44 rounded-full shadow-sm" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-9 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
            <span className="text-xs text-muted">{centerLabel ?? "الإجمالي"}</span>
            <strong className="mt-1 text-xl text-ink">{centerValue ?? formatCompact(total)}</strong>
          </div>
        </div>
        <div className="grid gap-3">
          {items.map((item, index) => {
            const value = toChartNumber(item.value);
            const percent = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={item.label} className="grid gap-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 font-semibold text-ink">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                    {item.label}
                  </span>
                  <span className="text-muted">{percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-paper">
                  <div className="h-2 rounded-full" style={{ width: `${percent}%`, backgroundColor: palette[index % palette.length] }} />
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
  const values = rows.map((row) => toChartNumber(row.value));
  const max = normalizedMax(values);

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft">
      <h3 className="mb-4 font-bold text-ink">{title}</h3>
      <div className="grid gap-3">
        {rows.map((row, index) => {
          const width = Math.max((toChartNumber(row.value) / max) * 100, 4);
          return (
            <div key={`${row.label}-${index}`} className="grid gap-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-ink">{row.label}</span>
                <span className="text-muted">{formatCompact(toChartNumber(row.value))}</span>
              </div>
              <div className="h-2.5 rounded-full bg-paper">
                <div className="h-2.5 rounded-full bg-olive" style={{ width: `${width}%` }} />
              </div>
              {row.caption ? <p className="text-xs text-muted">{row.caption}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
