'use client';

import { NewsArticle } from '@/lib/actions/finnhub.actions';

interface WatchlistNewsProps {
  newsData: Record<string, NewsArticle[]>;
  watchlist: Array<{ symbol: string; company: string }>;
}

export default function WatchlistNews({ newsData, watchlist }: WatchlistNewsProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) {
      return 'Just now';
    } else if (diffHrs < 24) {
      return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
      });
    }
  };

  // Get 2 news articles per stock, maintaining stock order
  const allNews = watchlist
    .flatMap(item => {
      const stockNews = (newsData[item.symbol] || [])
        .slice(0, 2) 
        .map(article => ({
          ...article,
          symbol: item.symbol,
          company: item.company
        }));
      return stockNews;
    })
    .sort((a, b) => b.datetime - a.datetime); // Sort by most recent

  // Calculate grid layout based on number of articles
  const totalArticles = allNews.length;
  const gridCols = totalArticles <= 3 ? 'lg:grid-cols-3' : 
                   totalArticles <= 4 ? 'lg:grid-cols-2' :
                   totalArticles <= 6 ? 'lg:grid-cols-3' :
                   'lg:grid-cols-4';

  // Show a friendly message if no news is available
  if (allNews.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">What's New</h2>
          <p className="text-sm text-gray-400">Powered by Finnhub</p>
        </div>
        <p className="text-gray-400 italic">No new information available at this time.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">What's New</h2>
        <p className="text-sm text-gray-400">Powered by Finnhub </p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}>
        {allNews.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-gray-800 rounded-lg p-5
                       hover:border-gray-600
                       hover:shadow-2xl
                       hover:-translate-y-2
                       hover:scale-[1.03]
                       transition-all duration-300 ease-out
                       will-change-transform"
          >
            <div className="mb-3">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded"
                style={{
                  backgroundColor: article.source.toLowerCase().includes('cnbc') ? '#0d7a5f' :
                                 article.source.toLowerCase().includes('yahoo') ? '#6b21a8' :
                                 '#1e40af',
                  color: 'white'
                }}
              >
                {article.source}
              </span>
            </div>

            <h3 className="text-base font-medium text-white mb-3 line-clamp-2 group-hover:text-gray-300 transition-colors">
              {article.headline}
            </h3>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <span>{formatDate(article.datetime)}</span>
              <span>•</span>
              <span className="font-medium text-gray-300">{article.symbol}</span>
            </div>

            {article.summary && (
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                {article.summary}
              </p>
            )}

            <div className="text-sm text-yellow-500 group-hover:text-yellow-400 transition-colors">
              Read article →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}