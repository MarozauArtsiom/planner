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
  const values = availableValues && availableValues.length > 0
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
