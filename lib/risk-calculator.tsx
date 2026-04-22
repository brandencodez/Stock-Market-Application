export interface RuntimeWatchlistItem {
  symbol: string;
  company: string;
  stock: {
    sector: string;
  };
  currentData: {
    c: number;
    h: number;
    l: number;
  } | null;
}

export type HealthLevel = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'WEAK';

const HEALTH_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  MODERATE: 50,
};

const sectorRiskWeights = {
  Technology: 1.2,
  Healthcare: 1.0,
  Energy: 1.3,
  Finance: 1.1,
  Consumer: 0.9,
  default: 1.0,
} as const;

const sectorMap: Record<string, string> = {
  Banking: 'Finance',
  'Financial Services': 'Finance',
  Banks: 'Finance',
  Software: 'Technology',
  Semiconductors: 'Technology',
  'Oil & Gas E&P': 'Energy',
  'Oil & Gas Integrated': 'Energy',
  Pharmaceuticals: 'Healthcare',
  Biotechnology: 'Healthcare',
  Retail: 'Consumer',
};

const getHealthLevel = (score: number): HealthLevel => {
  if (score >= HEALTH_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= HEALTH_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= HEALTH_THRESHOLDS.MODERATE) return 'MODERATE';
  return 'WEAK';
};

const getSectorRiskWeight = (sector: string) => {
  const category = sectorMap[sector] || 'default';
  return sectorRiskWeights[category as keyof typeof sectorRiskWeights] ?? 1.0;
};

const calculateConcentrationRisk = (watchlist: RuntimeWatchlistItem[]) => {
  if (watchlist.length < 3) return 0.8;
  if (watchlist.length > 10) return 0.2;

  const sectorCounts = watchlist.reduce((acc, item) => {
    const sector = item.stock?.sector || 'Unknown';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = watchlist.length;
  const hhi = Object.values(sectorCounts).reduce((sum, count) => {
    const p = count / total;
    return sum + p * p;
  }, 0);

  return Math.min(hhi * 2, 1);
};

export const calculatePortfolioHealth = (watchlist: RuntimeWatchlistItem[]) => {
  if (watchlist.length === 0) {
    return { score: 0, level: 'WEAK' as HealthLevel, volatility: 0 };
  }

  const volScores = watchlist.map(item => {
    const q = item.currentData;
    if (!q || q.h <= 0 || q.l <= 0 || q.c <= 0) return 0;

    const intradayVol = (q.h - q.l) / q.c;
    const sectorWeight = getSectorRiskWeight(item.stock.sector);

    return intradayVol * sectorWeight;
  });

  const avgVol = volScores.reduce((a, b) => a + b, 0) / watchlist.length;
  const concentrationRisk = calculateConcentrationRisk(watchlist);

  const risk01 = Math.min(Math.max(avgVol * 0.7 + concentrationRisk * 0.3, 0), 1);
  const score = Math.round((1 - risk01) * 100);
  const level = getHealthLevel(score);

  return {
    score,
    level,
    volatility: avgVol,
  };
};