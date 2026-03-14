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

/**
 * 2-3 → 1 SP, 4-5 → 2 SP, 6-8 → 3 SP, 9+ → 5 SP
 */
function scoreToSP(total: number): number {
  if (total <= 3) return 1;
  if (total <= 5) return 2;
  if (total <= 8) return 3;
  return 5;
}

export function calculateEstimation(votes: VoteData[]): EstimationResult {
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

  const n = votes.length;
  const avgDevEffort = votes.reduce((s, v) => s + v.devEffort, 0) / n;
  const avgQaEffort = votes.reduce((s, v) => s + v.qaEffort, 0) / n;
  const avgRisk = votes.reduce((s, v) => s + v.risk, 0) / n;
  const avgUncertainty = votes.reduce((s, v) => s + v.uncertainty, 0) / n;

  const totalScore = avgDevEffort + avgQaEffort + avgRisk + avgUncertainty;
  const effortSum = avgDevEffort + avgQaEffort;
  const devProportion = effortSum > 0 ? avgDevEffort / effortSum : 0.5;

  return {
    avgDevEffort: round2(avgDevEffort),
    avgQaEffort: round2(avgQaEffort),
    avgRisk: round2(avgRisk),
    avgUncertainty: round2(avgUncertainty),
    totalScore: round2(totalScore),
    recommendedSp: scoreToSP(totalScore),
    devProportion: round2(devProportion),
  };
}
