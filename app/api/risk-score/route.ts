import { NextResponse } from 'next/server';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import { calculatePortfolioRisk } from '@/lib/risk-calculator';
import Groq from 'groq-sdk';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

type SuggestionCacheEntry = {
  suggestions: string[];
  createdAt: number;
};

const MIN_SUGGESTIONS = 3;
const MAX_SUGGESTIONS = 4;
const SUGGESTION_CACHE_TTL_MS = 120_000;
const QWEN_RATE_WINDOW_MS = 60_000;
const QWEN_MAX_CALLS_PER_WINDOW = 54;

declare global {
  var __riskSuggestionCache: Map<string, SuggestionCacheEntry> | undefined;
  var __riskSuggestionQwenCalls: number[] | undefined;
}

function getSuggestionCache() {
  if (!globalThis.__riskSuggestionCache) {
    globalThis.__riskSuggestionCache = new Map<string, SuggestionCacheEntry>();
  }
  return globalThis.__riskSuggestionCache;
}

function getQwenCallsWindow() {
  if (!globalThis.__riskSuggestionQwenCalls) {
    globalThis.__riskSuggestionQwenCalls = [];
  }
  return globalThis.__riskSuggestionQwenCalls;
}

function canCallQwenNow(): boolean {
  const now = Date.now();
  const calls = getQwenCallsWindow();
  const recentCalls = calls.filter((ts) => now - ts < QWEN_RATE_WINDOW_MS);
  globalThis.__riskSuggestionQwenCalls = recentCalls;
  return recentCalls.length < QWEN_MAX_CALLS_PER_WINDOW;
}

function recordQwenCall() {
  const calls = getQwenCallsWindow();
  calls.push(Date.now());
}

function uniqueItems(items: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of items) {
    const normalized = item.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(item.trim());
  }

  return unique;
}

function parseSuggestions(raw: string): string[] {
  if (!raw) return [];

  const cleaned = raw
    .replace(/```[a-zA-Z]*\s*/g, '')
    .replace(/```/g, '')
    .trim();

  let chunks = cleaned
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  // If model returns a single paragraph, split into sentence-like chunks.
  if (chunks.length <= 1) {
    chunks = cleaned
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const parsed = chunks
    .map((line) => line.replace(/^[\s•●\-–—\d\.)\]]+\s*/, '').trim())
    .filter((line) => line.length >= 16 && line.length <= 160);

  return uniqueItems(parsed).slice(0, MAX_SUGGESTIONS);
}

function buildContextualFallbackSuggestions(
  riskWatchlist: Array<{
    symbol: string;
    stock: { sector: string };
  }>,
  riskLevel: RiskLevel
): string[] {
  if (!riskWatchlist.length) {
    return [
      'Add at least 3 stocks from different sectors for better risk insights.',
      'Start with one defensive stock (Utilities or Consumer Staples).',
      'Avoid putting over 35% of your portfolio in a single sector.'
    ];
  }

  const sectorCounts = new Map<string, number>();
  for (const item of riskWatchlist) {
    const sector = item.stock.sector || 'Unknown';
    sectorCounts.set(sector, (sectorCounts.get(sector) || 0) + 1);
  }

  const sortedSectors = Array.from(sectorCounts.entries()).sort((a, b) => b[1] - a[1]);
  const [topSector = 'Unknown', topSectorCount = 0] = sortedSectors[0] || [];
  const topSectorPct = Math.round((topSectorCount / riskWatchlist.length) * 100);
  const topSymbols = riskWatchlist.slice(0, 2).map((s) => s.symbol).join(' and ');

  const base: string[] = [];

  if (topSectorCount > 0) {
    base.push(`${topSector} is ${topSectorPct}% of your watchlist; trim toward 35-40%.`);
  }

  if (riskLevel === 'HIGH') {
    base.push(`Set stop-loss alerts for ${topSymbols || 'your top holdings'} this week.`);
    base.push('Add one defensive stock to offset high-volatility names.');
  } else if (riskLevel === 'MEDIUM') {
    base.push('Add one stock from a missing sector to improve diversification.');
    base.push('Rebalance the largest position if it keeps outperforming peers.');
  } else {
    base.push('Maintain current balance and review sector weights weekly.');
    base.push('Consider one international ETF to reduce single-market risk.');
  }

  base.push('Avoid adding stocks that mirror your top sector exposure.');

  return uniqueItems(base).slice(0, MAX_SUGGESTIONS);
}

function buildCacheKey(
  userKey: string,
  riskLevel: RiskLevel,
  riskScoreValue: number,
  riskWatchlist: Array<{
    symbol: string;
    stock: { sector: string };
    currentData: { c?: number } | null;
  }>
) {
  const signature = riskWatchlist
    .map((item) => {
      const px = item.currentData?.c ? Number(item.currentData.c).toFixed(2) : 'na';
      return `${item.symbol}:${item.stock.sector || 'Unknown'}:${px}`;
    })
    .sort()
    .join('|');

  return `${userKey}:${riskLevel}:${riskScoreValue.toFixed(2)}:${signature}`;
}

// Initialize Groq client — safe even if API key is missing (handled below)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'missing-key'
});

export async function GET() {
  try {
    // Fetch user's watchlist with current data
    const watchlist = await getWatchlistWithData();

    // Format for risk calculator
    const riskWatchlist = watchlist.map(item => ({
      symbol: item.symbol,
      company: item.company,
      stock: { sector: item.stock.sector || 'Unknown' },
      currentData: item.currentData 
    }));

    // Calculate base risk metrics
    const riskScore = calculatePortfolioRisk(riskWatchlist);

    // --- Generate AI Quick Suggestions ---
    let suggestions: string[] = [];
    const userKey = watchlist[0]?.userId ? String(watchlist[0].userId) : 'anonymous';
    const cacheKey = buildCacheKey(
      userKey,
      riskScore.level as RiskLevel,
      riskScore.score,
      riskWatchlist
    );
    const cache = getSuggestionCache();

    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.createdAt < SUGGESTION_CACHE_TTL_MS) {
      suggestions = cachedEntry.suggestions;
    }

    try {
      if (suggestions.length >= MIN_SUGGESTIONS) {
        return NextResponse.json({
          score: riskScore.score,
          level: riskScore.level,
          volatility: riskScore.volatility,
          suggestions
        });
      }

      // Only proceed if Groq API key is available
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
      }

      if (!canCallQwenNow()) {
        throw new Error('Qwen rate guard active');
      }

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Build contextual prompt
      const prompt = `
You are a concise financial assistant. Based on the user's watchlist and today's market conditions (${today}), provide 2-3 actionable quick suggestions to reduce risk and improve diversification and also suggest whether to add a similar stock or remove a specific stock by giving specific reason.

Watchlist:
${riskWatchlist.length > 0 ? riskWatchlist.map(w => 
  `${w.symbol} (${w.stock.sector}) - ${w.currentData?.c ? `Current: $${w.currentData.c.toFixed(2)}` : 'No price'}`
).join('\n') : 'Empty'}

Risk Score: ${riskScore.score.toFixed(1)}/10 (${riskScore.level})

Rules:
- Use the exact symbols/sectors from the watchlist context.
- Prefer concrete actions (add, trim, rebalance, hedge, set alert) with a reason.
- Keep each suggestion to one short sentence.
- Return one suggestion per line, plain text only.
`;

      // Call Groq 
      recordQwenCall();
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt.trim() }],
        model: 'qwen/qwen3-32b',
        temperature: 0.3,
        max_tokens: 250,
        top_p: 0.9
      });

      // Parse response
      const raw = chatCompletion.choices[0]?.message?.content?.trim() || '';
      const aiSuggestions = parseSuggestions(raw);
      const fallbackSuggestions = buildContextualFallbackSuggestions(
        riskWatchlist,
        riskScore.level as RiskLevel
      );

      suggestions = uniqueItems([...aiSuggestions, ...fallbackSuggestions]).slice(0, MAX_SUGGESTIONS);

      if (suggestions.length < MIN_SUGGESTIONS) {
        suggestions = fallbackSuggestions.slice(0, MIN_SUGGESTIONS);
      }

      cache.set(cacheKey, {
        suggestions,
        createdAt: Date.now()
      });

    } catch (groqError) {
      console.warn('Groq suggestion generation failed:', groqError);
      suggestions = buildContextualFallbackSuggestions(
        riskWatchlist,
        riskScore.level as RiskLevel
      ).slice(0, MIN_SUGGESTIONS);
    }

    // Ensure at least 3 suggestions in all code paths.
    if (suggestions.length < MIN_SUGGESTIONS) {
      const fallbackSuggestions = buildContextualFallbackSuggestions(
        riskWatchlist,
        riskScore.level as RiskLevel
      );
      suggestions = uniqueItems([...suggestions, ...fallbackSuggestions]).slice(0, MIN_SUGGESTIONS);
    }

    // Return full response
    return NextResponse.json({
      score: riskScore.score,
      level: riskScore.level,
      volatility: riskScore.volatility,
      suggestions
    });

  } catch (error) {
    console.error('Risk score API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate risk score',
        score: 0,
        level: 'LOW',
        volatility: 0,
        suggestions: ['Enable watchlist to get personalized tips']
      },
      { status: 500 }
    );
  }
}