"use client";

/**
 * Small dependency-free SVG charts for the admin dashboard.
 *
 * Every chart: exact values on hover AND keyboard focus, a table view for
 * screen readers and precise reading, thin marks, recessive grid. Series
 * colours are the validated Wisker categorical order (indigo, orange, green)
 * and never encode meaning by colour alone: with two or more series a legend
 * is always shown.
 */

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Granularity } from "@/lib/admin-range";
import { bucketLabel, bucketTitle, fmtInt } from "@/lib/admin-format";

/** Categorical order, validated for colour-blind separation on white. */
export const SERIES_COLORS = [
  "var(--color-indigo-600)", // #4c4ae6
  "var(--color-orange-600)", // #d97b18
  "var(--color-green-600)", // #237a48
] as const;

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
  /** Exact value, used in tooltips and the table view. */
  format?: (n: number) => string;
  /** Compact value for the y axis (defaults to 1.2k style numbers). */
  axisFormat?: (n: number) => string;
}

/** Numeric value of a series key on a data row (0 when absent). */
const val = (row: { t: string }, key: string) =>
  Number((row as unknown as Record<string, unknown>)[key]) || 0;

const PAD = { top: 10, right: 10, bottom: 26, left: 44 };

/** Track an element's content width so the SVG can be drawn 1:1 (crisp text, no overflow). */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Round `max` up to a tidy axis maximum with ~`count` intervals. */
export function niceScale(max: number, count = 4) {
  if (max <= 0) return { max: count, step: 1 };
  const rough = max / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const frac = rough / pow;
  const mult = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  const step = Math.max(mult * pow, max < count ? 1 : 0);
  return { max: Math.ceil(max / step) * step, step };
}

const axisNumber = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${+(n / 1_000_000).toFixed(1)}M`
    : Math.abs(n) >= 1_000
      ? `${+(n / 1_000).toFixed(1)}k`
      : String(+n.toFixed(2));

// --------------------------------------------------------------- time chart

interface TimeChartProps {
  title: string;
  subtitle?: string;
  data: readonly { t: string }[];
  series: ChartSeries[];
  kind?: "line" | "bar";
  /** Stack the series in bars (all series share one unit). */
  stacked?: boolean;
  granularity: Granularity;
  height?: number;
  /** Shown instead of the plot when every value is zero. */
  emptyText?: string;
  className?: string;
}

export function TimeChart({
  title,
  subtitle,
  data,
  series,
  kind = "line",
  stacked = false,
  granularity,
  height = 240,
  emptyText = "Nothing recorded in this period.",
  className,
}: TimeChartProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const descId = useId();

  const n = data.length;
  const colors = series.map((s, i) => s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]);
  const fmt = (s: ChartSeries, v: number) => (s.format ?? fmtInt)(v);

  const totals = data.map((d) =>
    stacked
      ? series.reduce((a, s) => a + (val(d, s.key)), 0)
      : Math.max(0, ...series.map((s) => val(d, s.key))),
  );
  const rawMax = Math.max(0, ...totals);
  const isEmpty = rawMax === 0;
  const { max: yMax, step } = niceScale(rawMax);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-9; v += step) ticks.push(+v.toFixed(6));

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const band = n > 0 ? plotW / n : 0;
  const xAt = (i: number) =>
    kind === "bar" ? PAD.left + band * (i + 0.5) : n <= 1 ? PAD.left + plotW / 2 : PAD.left + (plotW / (n - 1)) * i;
  const yAt = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

  const indexFromPointer = useCallback(
    (clientX: number) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect || n === 0) return null;
      const x = clientX - rect.left - PAD.left;
      const raw = kind === "bar" ? Math.floor(x / band) : Math.round(x / (n <= 1 ? 1 : plotW / (n - 1)));
      return Math.min(n - 1, Math.max(0, raw));
    },
    [band, kind, n, plotW, wrapRef],
  );

  // Thin the x labels so they never collide.
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 64))));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return;
    if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const linePath = (key: string) =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(val(d, key)).toFixed(1)}`)
      .join(" ");

  const tip = active !== null ? data[active] : null;
  const tipLeft = active !== null ? Math.min(Math.max(xAt(active), 92), Math.max(92, width - 92)) : 0;

  return (
    <section className={cn("card min-w-0 p-4 sm:p-5", className)} aria-labelledby={`${descId}-t`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 id={`${descId}-t`} className="text-base font-bold text-ink">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-gray-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className="rounded-lg px-2 py-1 text-xs font-bold text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-ink"
        >
          {asTable ? "View chart" : "View table"}
        </button>
      </div>

      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
          {series.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1.5 text-[13px] text-gray-600">
              <span
                aria-hidden
                className={cn("inline-block", kind === "bar" ? "h-2.5 w-2.5 rounded-[3px]" : "h-[3px] w-4 rounded-full")}
                style={{ background: colors[i] }}
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {asTable ? (
        <div className="mt-3 max-h-[320px] overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-sand text-gray-600">
              <tr>
                <th className="px-3 py-2 font-bold">Period</th>
                {series.map((s) => (
                  <th key={s.key} className="px-3 py-2 text-right font-bold">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.t} className="border-t border-line">
                  <td className="whitespace-nowrap px-3 py-1.5 text-gray-600">{bucketTitle(d.t, granularity)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right font-semibold tabular-nums text-ink">
                      {fmt(s, val(d, s.key))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={wrapRef}
          className="relative mt-2 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
          style={{ height, touchAction: "pan-y" }}
          tabIndex={0}
          role="group"
          aria-label={`${title}. Use left and right arrow keys to read each period.`}
          onPointerMove={(e) => setActive(indexFromPointer(e.clientX))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? Math.max(0, n - 1))}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          {/* The SVG is absolutely positioned so it never sets the container's minimum
              width (otherwise the container could not shrink after being wide). */}
          {width > 0 && (
            <svg width={width} height={height} className="absolute left-0 top-0 block overflow-visible" aria-hidden>
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={yAt(v)} y2={yAt(v)} stroke="var(--line)" strokeWidth={1} />
                  <text x={PAD.left - 8} y={yAt(v) + 4} textAnchor="end" fontSize={11} fill="var(--color-gray-500)">
                    {(series[0].axisFormat ?? axisNumber)(v)}
                  </text>
                </g>
              ))}
              {data.map((d, i) =>
                i % labelEvery === 0 ? (
                  <text key={d.t} x={xAt(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--color-gray-500)">
                    {bucketLabel(d.t, granularity)}
                  </text>
                ) : null,
              )}

              {kind === "bar"
                ? data.map((d, i) => {
                    // Stacked: one column per bucket. Grouped: side-by-side within the band.
                    const groupW = Math.max(2, Math.min(band * 0.7, stacked ? 32 : 32 * series.length));
                    const w = stacked ? groupW : Math.max(2, groupW / series.length - 1);
                    let acc = 0;
                    return series.map((s, si) => {
                      const v = val(d, s.key);
                      if (v <= 0) return null;
                      const start = stacked ? acc : 0;
                      acc += v;
                      const top = yAt(start + v);
                      // 2px surface gap between stacked segments
                      const h = Math.max(1, yAt(start) - top - (stacked && start > 0 ? 2 : 0));
                      const x = stacked ? xAt(i) - w / 2 : xAt(i) - groupW / 2 + (w + 1) * si;
                      return (
                        <rect
                          key={`${d.t}-${s.key}`}
                          x={x}
                          y={top}
                          width={w}
                          height={h}
                          rx={Math.min(4, w / 2)}
                          fill={colors[si]}
                          opacity={active === null || active === i ? 1 : 0.55}
                        />
                      );
                    });
                  })
                : series.map((s, si) => (
                    <g key={s.key}>
                      {series.length === 1 && n > 1 && (
                        <path
                          d={`${linePath(s.key)} L${xAt(n - 1).toFixed(1)},${yAt(0)} L${xAt(0).toFixed(1)},${yAt(0)} Z`}
                          fill={colors[si]}
                          opacity={0.1}
                        />
                      )}
                      <path d={linePath(s.key)} fill="none" stroke={colors[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                      {n === 1 && <circle cx={xAt(0)} cy={yAt(val(data[0], s.key))} r={4} fill={colors[si]} />}
                    </g>
                  ))}

              {active !== null && (
                <g>
                  {kind === "line" && (
                    <line x1={xAt(active)} x2={xAt(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--color-gray-400)" strokeWidth={1} strokeDasharray="3 3" />
                  )}
                  {kind === "line" &&
                    series.map((s, si) => (
                      <circle
                        key={s.key}
                        cx={xAt(active)}
                        cy={yAt(val(data[active], s.key))}
                        r={4.5}
                        fill={colors[si]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                </g>
              )}
            </svg>
          )}

          {isEmpty && width > 0 && (
            <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-8 text-center text-sm font-semibold text-gray-500">
              {emptyText}
            </p>
          )}

          {tip && (
            <div
              role="status"
              className="pointer-events-none absolute top-1 z-10 w-[176px] -translate-x-1/2 rounded-xl border border-line bg-white p-2.5 shadow-lg"
              style={{ left: tipLeft }}
            >
              <p className="text-[12px] font-bold text-gray-600">{bucketTitle(tip.t, granularity)}</p>
              <ul className="mt-1 space-y-0.5">
                {series.map((s, si) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex min-w-0 items-center gap-1.5 text-gray-600">
                      <span aria-hidden className="h-[3px] w-3 shrink-0 rounded-full" style={{ background: colors[si] }} />
                      <span className="truncate">{s.label}</span>
                    </span>
                    <strong className="tabular-nums text-ink">{fmt(s, val(tip, s.key))}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// --------------------------------------------------------------- sparkline

export function Sparkline({
  values,
  className,
  color = SERIES_COLORS[0],
}: {
  values: number[];
  className?: string;
  color?: string;
}) {
  const w = 96;
  const h = 28;
  const max = Math.max(...values, 1);
  if (values.length < 2 || values.every((v) => v === 0)) {
    return <div aria-hidden className={cn("h-7 w-24", className)} />;
  }
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - (v / max) * (h - 6)).toFixed(1)}`);
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} className={cn("h-7 w-24", className)}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ------------------------------------------------------------ ranked bars

export interface BarItem {
  label: string;
  value: number;
  /** Optional comparison value shown as text. */
  previous?: number;
  hint?: string;
}

/** Horizontal ranked bars. Values are always printed, so nothing depends on hover. */
export function RankedBars({
  items,
  format = fmtInt,
  color = SERIES_COLORS[0],
  showPrevious = false,
}: {
  items: BarItem[];
  format?: (n: number) => string;
  color?: string;
  showPrevious?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} title={item.hint}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-ink">{item.label}</span>
            <span className="shrink-0 tabular-nums text-ink">
              <strong>{format(item.value)}</strong>
              {showPrevious && item.previous !== undefined && (
                <span className="ml-1.5 text-xs font-medium text-gray-500">prev {format(item.previous)}</span>
              )}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: color, minWidth: item.value > 0 ? 4 : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
