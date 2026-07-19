const MARKET_LABELS = {
  '1X2': '1X2',
  'Match Odds': '1X2',
  'Over/Under': 'Over / Under',
  'OverUnder': 'Over / Under',
  'Asian Handicap': 'Asian Handicap',
  'AsianHandicap': 'Asian Handicap',
}

export default function OddsTable({ markets }) {
  if (!markets || markets.length === 0) {
    return (
      <div className="text-gray-500 text-center py-12">
        No odds available for this match.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {markets.map((market, i) => {
        const label = MARKET_LABELS[market.name] || market.name || `Market ${i + 1}`
        const selections = market.selections || []

        return (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-800/50 px-5 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                {label}
              </h3>
            </div>

            <div className="divide-y divide-gray-800/50">
              {selections.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-500">No selections</p>
              ) : (
                selections.map((sel, j) => (
                  <div key={j} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/30 transition-colors">
                    <span className="text-gray-300 text-sm">{sel.name || `Selection ${j + 1}`}</span>
                    <span className="text-emerald-400 font-mono font-semibold text-sm">
                      {sel.odds != null ? Number(sel.odds).toFixed(2) : '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
