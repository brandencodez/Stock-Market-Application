import { NextResponse } from 'next/server';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import { calculatePortfolioRisk } from '@/lib/risk-calculator';
import Groq from 'groq-sdk';

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

    try {
      // Only proceed if Groq API key is available
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
      }

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Build contextual prompt
      const prompt = `
You are a concise financial assistant. Based on the user's watchlist and today's market conditions (${today}), provide 2–3 actionable, short "quick suggestions" to reduce portfolio risk , improve diversification and also suggest whether to add a similar stock or remove a specific stock by giving specific reason.

Watchlist:
${riskWatchlist.length > 0 ? riskWatchlist.map(w => 
  `${w.symbol} (${w.stock.sector}) - ${w.currentData?.c ? `Current: $${w.currentData.c.toFixed(2)}` : 'No price'}`
).join('\n') : 'Empty'}

Risk Score: ${riskScore.score.toFixed(1)}/10 (${riskScore.level})

Rules:
- Be specific (e.g., "Consider reducing exposure to Tech if >40%").
- Mention sectors and stocks.
- Keep each suggestion under 80 characters.
- No markdown, no bullet points—just plain lines.
`;

      // Call Groq 
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt.trim() }],
        model: 'qwen/qwen3-32b',
        temperature: 0.3,
        max_tokens: 250,
        top_p: 0.9
      });

      // Parse response
      const raw = chatCompletion.choices[0]?.message?.content?.trim() || '';
      
      // Split into lines, clean, and filter
      const lines = raw
        .split('\n')
        .map(line => line.trim().replace(/^[\s•●\-–—\d\.]+\s*/, '')) // remove bullets/numbers
        .filter(line => line.length >= 8 && line.length <= 100);

      suggestions = lines.slice(0, 3); // max 3

    } catch (groqError) {
      console.warn('Groq suggestion generation failed:', groqError);
      // Fallback suggestions based on risk level
      if (riskScore.level === 'HIGH') {
        suggestions = [
          'Reduce concentration in top sector',
          'Add defensive assets (Utilities, Staples)',
          'Set stop-loss on volatile holdings'
        ];
      } else if (riskScore.level === 'MEDIUM') {
        suggestions = [
          'Rebalance overweight positions',
          'Diversify across 2+ new sectors',
          'Monitor earnings dates closely'
        ];
      } else {
        suggestions = [
          'Portfolio is well-diversified',
          'Continue regular monitoring',
          'Consider adding international exposure'
        ];
      }
    }

    // Ensure suggestions is never empty
    if (suggestions.length === 0) {
      suggestions = ['Review asset allocation monthly'];
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