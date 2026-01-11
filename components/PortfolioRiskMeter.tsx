'use client';

import { useEffect, useState, useRef } from 'react';
import type { RuntimeWatchlistItem } from '@/lib/risk-calculator';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

const RISK_COLORS = {
  LOW: 'text-green-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-red-500'
};

const RISK_MESSAGES = {
  LOW: 'Your portfolio is well-diversified with low volatility',
  MEDIUM: 'Moderate risk detected - consider rebalancing',
  HIGH: 'High concentration risk - immediate attention recommended'
};

const DonutChart = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
};

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  return `${Math.floor(diffInSeconds / 86400)} day ago`;
};

const formatExactTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function PortfolioRiskMeter({ watchlist }: { watchlist: RuntimeWatchlistItem[] }) {
  const [riskData, setRiskData] = useState({
    score: 0,
    level: 'LOW' as RiskLevel,
    volatility: 0,
    suggestions: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const lastFetchTime = useRef<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/risk-score');
      if (!response.ok) throw new Error('Failed to fetch risk data');
      
      const data = await response.json();
      setRiskData({
        score: data.score ?? 0,
        level: (data.level as RiskLevel) ?? 'LOW',
        volatility: data.volatility ?? 0,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
      });
      lastFetchTime.current = Date.now();
      setError(null);
    } catch (err) {
      setError('Unable to calculate risk score');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6 border rounded-lg bg-card shadow-sm w-full max-w-xs animate-pulse">
        <div className="h-6 bg-muted rounded w-3/4"></div>
        <div className="flex justify-center">
          <div className="h-32 w-32 rounded-full bg-muted"></div>
        </div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-3/4 mx-auto mt-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg max-w-xs">
      {error}
    </div>
    );
  }

  const colorClass = RISK_COLORS[riskData.level];
  const timeAgo = lastFetchTime.current ? formatTimeAgo(lastFetchTime.current) : null;
  const exactTime = lastFetchTime.current ? formatExactTime(lastFetchTime.current) : null;

  return (
    <>
      {/* Main Risk Meter Card */}
      <div className="border rounded-lg p-6 shadow-sm bg-card max-w-xs">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-medium text-foreground">Portfolio Health Score</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass.replace('text-', 'bg-')} text-white`}>
            {riskData.level} RISK
          </span>
        </div>

        <div className={`flex justify-center mb-4 ${colorClass}`}>
          <DonutChart score={riskData.score} size={120} />
        </div>

        <p className="text-sm text-muted-foreground mb-3 text-center">
          {RISK_MESSAGES[riskData.level]}
        </p>

        <div className="flex justify-between text-sm mb-4">
          <span className="text-muted-foreground">Volatility Index:</span>
          <span className="font-medium">{(riskData.volatility * 100).toFixed(1)}%</span>
        </div>

        {/* CLICKABLE QUICK SUGGESTIONS LINK */}
        <div className="mt-3 pt-3 border-t border-gray-200/20">
          <button
            onClick={() => setShowSuggestions(true)}
            className="text-sm text-blue-500 hover:underline w-full text-center font-medium"
          >
            💡 View Quick Suggestions
          </button>
        </div>

        {/* Timestamp */}
        {timeAgo && exactTime && (
          <div className="mt-3 pt-3 border-t border-gray-200/20">
            <p className="text-xs text-muted-foreground text-center">
              Last updated: {timeAgo} ({exactTime})
            </p>
          </div>
        )}
      </div>

      {/* MODAL POPUP FOR SUGGESTIONS */}
      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-11/12 max-w-md mx-auto shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-foreground">AI Quick Suggestions</h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {riskData.suggestions.length > 0 ? (
                riskData.suggestions.map((sugg, i) => (
                  <div
                    key={i}
                    className="p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg text-sm text-foreground"
                  >
                    {sugg}
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground">
                  No suggestions available at this time.
                </div>
              )}
            </div>

            {/* structured footer with disclaimer */}
            <div className="text-xs text-center space-y-2 pt-4 border-t border-gray-200/20">
              <p className="text-muted-foreground">
                Generated on {new Date().toLocaleDateString()} based on your watchlist and market conditions.
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 font-medium bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded inline-block">
                ⚠️ Not financial advice. Investments carry risk. AI content is informational only — do your own research.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}