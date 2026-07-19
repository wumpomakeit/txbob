import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Loader, Zap, Flag } from 'lucide-react'
import { fetchAllMarkets } from '../api/client'
import { generateQuestions } from '../utils/marketUtils'
import BetModal from './BetModal'

// ── small helpers ──

function matchIcon(status) {
  if (status === 'Live') return <Zap className="w-3 h-3" />
  return <Flag className="w-3 h-3" />
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'string' ? parseInt(ts) : ts)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Yes/No question card ──

function YesNoCard({ q, idx, onSelect }) {
  const handleClick = () => {
    onSelect?.({
      selection: q.selection,
      context: {
        label: q.question,
        matchName: `${q.homeTeam} vs ${q.awayTeam}`,
        prob: q.yesProb,
      },
    })
  }

  const yesPct = Math.min(99.9, Math.max(0.1, q.yesProb || 0)).toFixed(1)
  const noPct = (100 - parseFloat(yesPct)).toFixed(1)
  const color = parseFloat(yesPct) > 50 ? 'green' : 'red'

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.02 * idx }}
      onClick={handleClick}
      className="relative glass-hover rounded-2xl p-5 border border-white/[0.04] hover:border-red-500/20 transition-all duration-300 group text-left cursor-pointer w-full"
    >
      {/* LIVE badge */}
      {q.isLive && (
        <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-green-500 text-[10px] font-bold text-black uppercase tracking-wider shadow-lg shadow-green-500/30 animate-pulse">
          Live
        </span>
      )}

      {/* match header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`shrink-0 ${q.isLive ? 'text-green-400' : 'text-gray-600'}`}>
          {matchIcon(q.status)}
        </span>
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider truncate">
          {q.homeTeam} vs {q.awayTeam}
        </span>
        {!q.isLive && q.startTime && (
          <span className="ml-auto text-[10px] text-gray-600 shrink-0">
            <Clock className="w-3 h-3 inline mr-0.5" />
            {formatTime(q.startTime)}
          </span>
        )}
      </div>

      {/* question */}
      <p className="text-white font-bold text-sm leading-snug mb-4 min-h-[40px]">
        {q.question}
      </p>

      {/* Yes/No bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-green-400' : 'bg-red-400'}`} />
            Yes
          </span>
          <span className={`font-mono font-bold ${color === 'green' ? 'text-green-400' : 'text-red-400'}`}>{yesPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${yesPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 * idx, ease: 'easeOut' }}
            className={`h-full rounded-full ${color === 'green' ? 'bg-green-500/60' : 'bg-red-500/60'}`}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-700" />
            No
          </span>
          <span className="font-mono text-gray-600">{noPct}%</span>
        </div>
      </div>

      {/* hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/[0.03] group-hover:to-red-500/[0.06] transition-all duration-500 pointer-events-none" />
    </motion.button>
  )
}

// ── section component ──

export default function PredictionMarkets() {
  const [fixtureMarkets, setFixtureMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bet, setBet] = useState({ open: false, selection: null, context: {} })

  const handleSelect = ({ selection, context }) => {
    setBet({ open: true, selection, context })
  }
  const closeBet = () => setBet({ open: false, selection: null, context: {} })

  useEffect(() => {
    let cancelled = false
    fetchAllMarkets()
      .then((data) => {
        if (!cancelled) {
          setFixtureMarkets(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  // ── flat list of all Yes/No question cards across all fixtures ──
  const allQuestions = fixtureMarkets.flatMap((fm) =>
    generateQuestions(fm)
  )

  return (
    <section id="markets" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">Prediction Markets</h2>
          <p className="section-subtitle">
            Yes/No probability questions powered by TxLINE oracle. Trade across every World Cup 2026 match.
          </p>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader className="w-8 h-8 text-red-400 animate-spin" />
            <p className="text-gray-500 text-sm">Loading prediction markets...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-red-400 font-medium text-lg">Failed to load markets</p>
            <pre className="text-gray-500 text-xs mt-3 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 max-w-lg mx-auto whitespace-pre-wrap text-left">{error}</pre>
          </div>
        )}

        {!loading && !error && allQuestions.length === 0 && (
          <div className="text-center py-16">
            {fixtureMarkets.length > 0 ? (
              <>
                <p className="text-gray-400 text-lg font-medium">
                  {fixtureMarkets.length} fixture{fixtureMarkets.length > 1 ? 's' : ''} loaded · 0 prediction markets available
                </p>
                <p className="text-gray-600 text-xs mt-2 max-w-md mx-auto">
                  Fixtures exist but no full-time 1X2, Over/Under 2.5, or BTTS odds are available yet.
                  Markets populate closer to kick-off.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500">No fixtures available right now.</p>
                <p className="text-gray-600 text-xs mt-1">Check back closer to World Cup 2026 kick-off.</p>
              </>
            )}
          </div>
        )}

        {!loading && !error && allQuestions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allQuestions.map((q, idx) => (
              <YesNoCard key={`${q.fixtureId}-${q.question}`} q={q} idx={idx} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>

      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />
      <BetModal isOpen={bet.open} onClose={closeBet} selection={bet.selection} context={bet.context} />
    </section>
  )
}
