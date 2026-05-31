import type { SpScaleEntry } from "./sp-scale";

// =====================================================================
// Метод эстимации
// =====================================================================

export type EstimationMethod =
  | "COMPOSITE_SP" // 4-факторный (Dev/QA/Risk/Uncertainty → медиана → SP)
  | "FIBONACCI_SP" // одно число: 1,2,3,5,8,13,21
  | "HOURS" // одно число в часах: 1,2,4,8,16,24,40
  | "DAYS"; // одно число в днях: 0.5,1,2,3,5,8,13

export const ESTIMATION_METHODS: EstimationMethod[] = [
  "COMPOSITE_SP",
  "FIBONACCI_SP",
  "HOURS",
  "DAYS",
];

export function isEstimationMethod(value: unknown): value is EstimationMethod {
  return typeof value === "string" && ESTIMATION_METHODS.includes(value as EstimationMethod);
}

// Захардкоженные шкалы для single-value методов (Phase 2 — настраиваемые)
export const FIBONACCI_SHAPE = [1, 2, 3, 5, 8, 13, 21];
export const HOURS_SHAPE = [1, 2, 4, 8, 16, 24, 40];
export const DAYS_SHAPE = [0.5, 1, 2, 3, 5, 8, 13];

export function getShapeForMethod(method: EstimationMethod): number[] {
  switch (method) {
    case "FIBONACCI_SP":
      return FIBONACCI_SHAPE;
    case "HOURS":
      return HOURS_SHAPE;
    case "DAYS":
      return DAYS_SHAPE;
    case "COMPOSITE_SP":
      return [];
  }
}

// =====================================================================
// 4-факторный режим (COMPOSITE_SP) — оригинальная логика
// =====================================================================

export interface VoteData {
  devEffort: number;
  qaEffort: number;
  risk: number;
  uncertainty: number;
}

export interface EstimationResult {
  avgDevEffort: number;
  avgQaEffort: number;
  avgRisk: number;
  avgUncertainty: number;
  totalScore: number;
  recommendedSp: number;
  devProportion: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const DEFAULT_SP_VALUES = [1, 2, 3, 5, 8, 13];

function scoreToSP(total: number, availableValues?: number[]): number {
  const values =
    availableValues && availableValues.length > 0
      ? [...availableValues].sort((a, b) => a - b)
      : DEFAULT_SP_VALUES;

  if (total <= 3) return values[0] ?? 1;
  if (total <= 5) return values[Math.min(1, values.length - 1)];
  if (total <= 8) return values[Math.min(2, values.length - 1)];
  return values[Math.min(3, values.length - 1)];
}

export function calculateEstimation(
  votes: VoteData[],
  availableSpValues?: number[],
): EstimationResult {
  if (votes.length === 0) {
    return {
      avgDevEffort: 0,
      avgQaEffort: 0,
      avgRisk: 0,
      avgUncertainty: 0,
      totalScore: 0,
      recommendedSp: 1,
      devProportion: 0.5,
    };
  }

  const avgDevEffort = median(votes.map((v) => v.devEffort));
  const avgQaEffort = median(votes.map((v) => v.qaEffort));
  const avgRisk = median(votes.map((v) => v.risk));
  const avgUncertainty = median(votes.map((v) => v.uncertainty));

  const totalScore = avgDevEffort + avgQaEffort + avgRisk + avgUncertainty;
  const effortSum = avgDevEffort + avgQaEffort;
  const devProportion = effortSum > 0 ? avgDevEffort / effortSum : 0.5;

  return {
    avgDevEffort: round2(avgDevEffort),
    avgQaEffort: round2(avgQaEffort),
    avgRisk: round2(avgRisk),
    avgUncertainty: round2(avgUncertainty),
    totalScore: round2(totalScore),
    recommendedSp: scoreToSP(totalScore, availableSpValues),
    devProportion: round2(devProportion),
  };
}

// =====================================================================
// Single-value режимы (FIBONACCI_SP / HOURS / DAYS)
// =====================================================================

export interface SimpleVoteData {
  value: number;
}

export interface SimpleEstimationResult {
  method: EstimationMethod;
  medianValue: number;
  /**
   * Рекомендованное round-up значение из шкалы метода.
   * Для FIBONACCI_SP равно medianValue (голосуют сразу значениями шкалы).
   * Для HOURS/DAYS — ближайшее большее значение из шкалы.
   */
  roundedValue: number;
  minValue: number;
  maxValue: number;
  voteCount: number;
  /**
   * SP-эквивалент для записи в `Ticket.storyPoints` после accept.
   * Подбирается ближайшим значением из проектной SpScale по длительности в днях.
   */
  recommendedSp: number;
  /**
   * Длительность задачи в рабочих днях, рассчитанная из rounded value
   * (нужно для соотнесения с SpScale).
   */
  durationDays: number;
}

/**
 * Round-up к ближайшему большему значению из отсортированной по возрастанию шкалы.
 * Если значение больше максимума шкалы — возвращаем максимум.
 */
export function roundUpToShape(value: number, shape: number[]): number {
  if (shape.length === 0) return value;
  const sorted = [...shape].sort((a, b) => a - b);
  for (const v of sorted) {
    if (v >= value) return v;
  }
  return sorted[sorted.length - 1];
}

/**
 * Перевод rounded value в длительность задачи в рабочих днях.
 * - DAYS → значение и есть длительность
 * - HOURS → значение / workingHoursPerDay (округление вверх до целого дня)
 * - FIBONACCI_SP → длительность из проектной SpScale (если есть) или fallback
 */
function durationDaysForSimple(
  method: EstimationMethod,
  roundedValue: number,
  spScale: SpScaleEntry[],
  workingHoursPerDay: number,
): number {
  if (method === "DAYS") return Math.max(1, Math.ceil(roundedValue));
  if (method === "HOURS") {
    const hpd = workingHoursPerDay > 0 ? workingHoursPerDay : 8;
    return Math.max(1, Math.ceil(roundedValue / hpd));
  }
  // FIBONACCI_SP
  const entry = spScale.find((s) => s.value === roundedValue);
  if (entry) return Math.max(1, entry.durationDays);
  // fallback: примерное соотношение SP↔дни как в DEFAULT_SP_SCALE
  if (roundedValue <= 1) return 2;
  if (roundedValue <= 2) return 3;
  if (roundedValue <= 3) return 5;
  if (roundedValue <= 5) return 8;
  if (roundedValue <= 8) return 13;
  return 20;
}

/**
 * Подобрать SP-значение из проектной шкалы по длительности задачи в днях.
 * Берётся ближайшее значение, у которого durationDays >= требуемому (round-up по дням).
 * Если таких нет — берём максимальное доступное.
 */
function spByDurationDays(durationDays: number, spScale: SpScaleEntry[]): number {
  if (spScale.length === 0) {
    // fallback на DEFAULT_SP_VALUES, грубое приближение
    if (durationDays <= 2) return 1;
    if (durationDays <= 3) return 2;
    if (durationDays <= 5) return 3;
    if (durationDays <= 8) return 5;
    if (durationDays <= 13) return 8;
    return 13;
  }
  const sorted = [...spScale].sort((a, b) => a.durationDays - b.durationDays);
  for (const entry of sorted) {
    if (entry.durationDays >= durationDays) return entry.value;
  }
  return sorted[sorted.length - 1].value;
}

export function calculateSimpleEstimation(
  votes: SimpleVoteData[],
  method: EstimationMethod,
  spScale: SpScaleEntry[] = [],
  workingHoursPerDay = 8,
): SimpleEstimationResult {
  if (votes.length === 0) {
    return {
      method,
      medianValue: 0,
      roundedValue: 0,
      minValue: 0,
      maxValue: 0,
      voteCount: 0,
      recommendedSp: spScale[0]?.value ?? 1,
      durationDays: 1,
    };
  }

  const values = votes.map((v) => v.value);
  const medianValue = median(values);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const shape = getShapeForMethod(method);
  const roundedValue = roundUpToShape(medianValue, shape);

  const durationDays = durationDaysForSimple(
    method,
    roundedValue,
    spScale,
    workingHoursPerDay,
  );
  const recommendedSp = spByDurationDays(durationDays, spScale);

  return {
    method,
    medianValue: round2(medianValue),
    roundedValue: round2(roundedValue),
    minValue: round2(minValue),
    maxValue: round2(maxValue),
    voteCount: votes.length,
    recommendedSp,
    durationDays,
  };
}
