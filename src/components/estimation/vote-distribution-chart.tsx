"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

interface VoteEntry {
  value: number;
  name: string;
}

interface Props {
  /** Голоса (value + имя для tooltip). */
  votes: VoteEntry[];
  /** Опциональная фиксированная шкала (для FIBONACCI/HOURS/DAYS). Если не передана — берём уникальные значения из votes. */
  shape?: number[];
  /** Медиана команды — подсвечивается синим. */
  median: number;
  /** Среднее арифметическое команды. */
  average?: number;
  /** Округлённое значение (рекомендация). Если совпадает с медианой — не выделяется отдельно. */
  recommended?: number;
  /** Единица измерения для подписи: "h", "d", "SP" или пусто. */
  unit?: string;
  /** Заголовок блока (опционально). */
  title?: string;
  /** Дополнительный контент в шапке блока (например чекбокс «показать всем»). */
  headerSlot?: React.ReactNode;
}

interface ColumnData {
  value: number;
  count: number;
  voters: string[];
  isOutlier: boolean;
}

/** IQR-метод для выявления выбросов. */
function detectOutlierBounds(values: number[]): { lower: number; upper: number } {
  if (values.length < 4) return { lower: -Infinity, upper: Infinity };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr };
}

/** Форматирование значения в подпись с unit. */
function formatLabel(value: number, unit: string): string {
  if (Number.isInteger(value)) return `${value}${unit}`;
  return `${value}${unit}`;
}

export function VoteDistributionChart({
  votes,
  shape,
  median,
  average,
  recommended,
  unit = "",
  title,
  headerSlot,
}: Props) {
  const t = useTranslations("voteDetails");

  const { columns, maxCount } = useMemo(() => {
    const values = votes.map((v) => v.value);
    const bounds = detectOutlierBounds(values);

    // Категории: или фиксированная шкала, или уникальные значения из голосов
    const categoriesSet = new Set<number>();
    if (shape && shape.length > 0) {
      shape.forEach((v) => categoriesSet.add(v));
    }
    values.forEach((v) => categoriesSet.add(v));
    const categories = Array.from(categoriesSet).sort((a, b) => a - b);

    const cols: ColumnData[] = categories.map((value) => {
      const matching = votes.filter((v) => v.value === value);
      const isOutlier = value < bounds.lower || value > bounds.upper;
      return {
        value,
        count: matching.length,
        voters: matching.map((v) => v.name),
        isOutlier,
      };
    });

    const max = Math.max(1, ...cols.map((c) => c.count));
    return { columns: cols, maxCount: max };
  }, [votes, shape]);

  if (votes.length < 3) return null;

  // Геометрия SVG
  const PADDING = { top: 24, right: 16, bottom: 36, left: 16 };
  const BAR_GAP = 8;
  const CHART_HEIGHT = 140;
  const BAR_MAX_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  // Динамическая ширина — больше колонок = шире, но в разумных пределах
  const MIN_BAR_WIDTH = 28;
  const MAX_BAR_WIDTH = 60;
  const ideal = 480 / Math.max(1, columns.length);
  const BAR_WIDTH = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, ideal));
  const totalWidth =
    PADDING.left + PADDING.right + columns.length * BAR_WIDTH + (columns.length - 1) * BAR_GAP;

  const colorForBar = (col: ColumnData): { fill: string; stroke: string } => {
    if (col.isOutlier) {
      return {
        fill: "fill-red-200 dark:fill-red-900/40",
        stroke: "stroke-red-500 dark:stroke-red-400",
      };
    }
    if (col.value === median) {
      return {
        fill: "fill-blue-500 dark:fill-blue-400",
        stroke: "stroke-blue-600 dark:stroke-blue-500",
      };
    }
    if (recommended != null && col.value === recommended && recommended !== median) {
      return {
        fill: "fill-amber-400 dark:fill-amber-500",
        stroke: "stroke-amber-500 dark:stroke-amber-400",
      };
    }
    return {
      fill: "fill-zinc-300 dark:fill-zinc-600",
      stroke: "stroke-zinc-400 dark:stroke-zinc-500",
    };
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          {title ?? t("distributionTitle")}
        </h3>
        <div className="flex items-center gap-3">
          {headerSlot}
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("voteCount", { count: votes.length })}
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${CHART_HEIGHT}`}
          className="block h-auto w-full min-w-[280px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t("distributionTitle")}
        >
          {/* Базовая линия */}
          <line
            x1={PADDING.left}
            x2={totalWidth - PADDING.right}
            y1={CHART_HEIGHT - PADDING.bottom}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth={1}
          />

          {columns.map((col, i) => {
            const x = PADDING.left + i * (BAR_WIDTH + BAR_GAP);
            const barHeight = (col.count / maxCount) * BAR_MAX_HEIGHT;
            const y = CHART_HEIGHT - PADDING.bottom - barHeight;
            const colors = colorForBar(col);
            const isHighlighted =
              col.value === median ||
              (recommended != null && col.value === recommended);
            const tooltip =
              col.count === 0
                ? formatLabel(col.value, unit)
                : `${formatLabel(col.value, unit)} — ${t("voteCount", { count: col.count })}: ${col.voters.join(", ")}`;

            return (
              <g key={col.value}>
                <title>{tooltip}</title>
                {col.count > 0 ? (
                  <>
                    <rect
                      x={x}
                      y={y}
                      width={BAR_WIDTH}
                      height={barHeight}
                      rx={4}
                      className={`${colors.fill} ${colors.stroke}`}
                      strokeWidth={col.isOutlier ? 2 : 1}
                    />
                    <text
                      x={x + BAR_WIDTH / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className={`text-[11px] font-semibold ${
                        isHighlighted
                          ? "fill-zinc-900 dark:fill-zinc-50"
                          : "fill-zinc-600 dark:fill-zinc-300"
                      }`}
                    >
                      {col.count}
                    </text>
                  </>
                ) : (
                  // Пустая категория — тонкая линия для масштаба
                  <rect
                    x={x}
                    y={CHART_HEIGHT - PADDING.bottom - 2}
                    width={BAR_WIDTH}
                    height={2}
                    rx={1}
                    className="fill-zinc-100 dark:fill-zinc-800"
                  />
                )}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT - PADDING.bottom + 18}
                  textAnchor="middle"
                  className={`text-[11px] ${
                    isHighlighted
                      ? "fill-zinc-900 font-semibold dark:fill-zinc-50"
                      : "fill-zinc-500 dark:fill-zinc-400"
                  }`}
                >
                  {formatLabel(col.value, unit)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Легенда */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500 dark:bg-blue-400" />
          {t("legendMedian")}: {formatLabel(median, unit)}
        </span>
        {average != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500 dark:bg-indigo-400" />
            {t("average")}: {formatLabel(average, unit)}
          </span>
        )}
        {recommended != null && recommended !== median && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400 dark:bg-amber-500" />
            {t("legendRecommended")}: {formatLabel(recommended, unit)}
          </span>
        )}
        {columns.some((c) => c.isOutlier && c.count > 0) && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border-2 border-red-500 bg-red-200 dark:border-red-400 dark:bg-red-900/40" />
            {t("legendOutlier")}
          </span>
        )}
      </div>
    </div>
  );
}
