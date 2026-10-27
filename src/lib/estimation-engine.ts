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

// Базовые шкалы для single-value методов (могут дополняться кастомными значениями комнаты)
export const FIBONACCI_SHAPE = [0, 1, 2, 3, 5, 8, 13, 21];
export const HOURS_SHAPE = [0, 1, 2, 4, 8, 16, 24, 40];
export const DAYS_SHAPE = [0, 0.5, 1, 2, 3, 5, 8, 13];

export function parseCustomShape(customShapeJson?: string | null): number[] {
  if (!customShapeJson) return [];
  try {
    const parsed = JSON.parse(customShapeJson);
    if (!Array.isArray(parsed)) return [];
    const nums = parsed
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v >= 0 && v <= 10000)
      .map((v) => Math.round(v * 100) / 100);
    return Array.from(new Set(nums)).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function getBaseShapeForMethod(method: EstimationMethod): number[] {
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

export function getShapeForMethod(
  method: EstimationMethod,
  customValues?: number[],
): number[] {
  const base = getBaseShapeForMethod(method);
  if (method === "COMPOSITE_SP") return [];
  if (!customValues || customValues.length === 0) return base;
  return Array.from(new Set([...base, ...customValues])).sort((a, b) => a - b);
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
  meanDevEffort: number;
  meanQaEffort: number;
  meanRisk: number;
  meanUncertainty: number;
  meanTotalScore: number;
  averageSp: number;
  exactAverageSp: number;
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

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

const DEFAULT_SP_VALUES = [0, 1, 2, 3, 5, 8, 13];

function scoreToSP(total: number, availableValues?: number[]): number {
  const values =
    availableValues && availableValues.length > 0
      ? [...availableValues].sort((a, b) => a - b)
      : DEFAULT_SP_VALUES;

  if (total <= 0) {
    return values.includes(0) ? 0 : (values[0] ?? 0);
  }

  const positiveValues = values.filter((v) => v > 0);
  if (positiveValues.length === 0) return values[0] ?? 0;

  if (total <= 3) return positiveValues[0] ?? 1;
  if (total <= 5) return positiveValues[Math.min(1, positiveValues.length - 1)];
  if (total <= 8) return positiveValues[Math.min(2, positiveValues.length - 1)];
  if (total <= 11) return positiveValues[Math.min(3, positiveValues.length - 1)];
  if (total <= 14) return positiveValues[Math.min(4, positiveValues.length - 1)];
  return positiveValues[Math.min(5, positiveValues.length - 1)];
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
      meanDevEffort: 0,
      meanQaEffort: 0,
      meanRisk: 0,
      meanUncertainty: 0,
      meanTotalScore: 0,
      averageSp: 1,
      exactAverageSp: 1,
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

  const meanDevEffort = mean(votes.map((v) => v.devEffort));
  const meanQaEffort = mean(votes.map((v) => v.qaEffort));
  const meanRisk = mean(votes.map((v) => v.risk));
  const meanUncertainty = mean(votes.map((v) => v.uncertainty));
  const meanTotalScore = meanDevEffort + meanQaEffort + meanRisk + meanUncertainty;
  const individualSps = votes.map((v) =>
    scoreToSP(v.devEffort + v.qaEffort + v.risk + v.uncertainty, availableSpValues),
  );
  const exactAverageSp = mean(individualSps);

  return {
    avgDevEffort: round2(avgDevEffort),
    avgQaEffort: round2(avgQaEffort),
    avgRisk: round2(avgRisk),
    avgUncertainty: round2(avgUncertainty),
    totalScore: round2(totalScore),
    recommendedSp: scoreToSP(totalScore, availableSpValues),
    meanDevEffort: round2(meanDevEffort),
    meanQaEffort: round2(meanQaEffort),
    meanRisk: round2(meanRisk),
    meanUncertainty: round2(meanUncertainty),
    meanTotalScore: round2(meanTotalScore),
    averageSp: scoreToSP(meanTotalScore, availableSpValues),
    exactAverageSp: round2(exactAverageSp),
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
   * Рекомендованное round-up значение из шкалы метода (по медиане).
   * Для FIBONACCI_SP равно medianValue (голосуют сразу значениями шкалы).
   * Для HOURS/DAYS — ближайшее большее значение из шкалы.
   */
  roundedValue: number;
  /**
   * Точное среднее арифметическое голосов команды.
   */
  averageValue: number;
  /**
   * Рекомендованное round-up значение из шкалы метода (по среднему).
   */
  averageRoundedValue: number;
  minValue: number;
  maxValue: number;
  voteCount: number;
  /**
   * SP-эквивалент для записи в `Ticket.storyPoints` после accept (по медиане).
   * Подбирается ближайшим значением из проектной SpScale по длительности в днях.
   */
  recommendedSp: number;
  /**
   * SP-эквивалент по среднему значению.
   */
  averageSp: number;
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
  if (roundedValue <= 0) return 0;
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
  if (durationDays <= 0) return 0;
  if (spScale.length === 0) {
    // fallback на DEFAULT_SP_VALUES, грубое приближение
    if (durationDays <= 2) return 1;
    if (durationDays <= 3) return 2;
    if (durationDays <= 5) return 3;
    if (durationDays <= 8) return 5;
    if (durationDays <= 13) return 8;
    return 13;
  }
  const positiveScale = spScale.filter((s) => s.value > 0);
  if (positiveScale.length === 0) return spScale[0]?.value ?? 0;
  const sorted = [...positiveScale].sort((a, b) => a.durationDays - b.durationDays);
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
  customValues?: number[],
): SimpleEstimationResult {
  if (votes.length === 0) {
    const defaultSp = spScale[0]?.value ?? 0;
    return {
      method,
      medianValue: 0,
      roundedValue: 0,
      averageValue: 0,
      averageRoundedValue: 0,
      minValue: 0,
      maxValue: 0,
      voteCount: 0,
      recommendedSp: defaultSp,
      averageSp: defaultSp,
      durationDays: 1,
    };
  }

  const values = votes.map((v) => v.value);
  const medianValue = median(values);
  const averageValue = mean(values);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const shape = getShapeForMethod(method, customValues);
  const roundedValue = roundUpToShape(medianValue, shape);
  const averageRoundedValue = roundUpToShape(averageValue, shape);

  const durationDays = durationDaysForSimple(
    method,
    roundedValue,
    spScale,
    workingHoursPerDay,
  );
  const recommendedSp =
    method === "FIBONACCI_SP"
      ? Math.round(roundedValue)
      : spByDurationDays(durationDays, spScale);

  const avgDurationDays = durationDaysForSimple(
    method,
    averageRoundedValue,
    spScale,
    workingHoursPerDay,
  );
  const averageSp =
    method === "FIBONACCI_SP"
      ? Math.round(averageRoundedValue)
      : spByDurationDays(avgDurationDays, spScale);

  return {
    method,
    medianValue: round2(medianValue),
    roundedValue: round2(roundedValue),
    averageValue: round2(averageValue),
    averageRoundedValue: round2(averageRoundedValue),
    minValue: round2(minValue),
    maxValue: round2(maxValue),
    voteCount: votes.length,
    recommendedSp,
    averageSp,
    durationDays: Math.max(1, durationDays),
  };
}
