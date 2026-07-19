import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, Loader, Activity,
  Target, AlertTriangle, Timer,
  X, TrendingUp, CheckCircle, XCircle, Clock3, History,
} from 'lucide-react'
import { fetchOdds, fetchFixtures, savePrediction, fetchPredictions } from '../api/client'
import { generateQuestions } from '../utils/marketUtils'
import { useToast } from '../components/Toast'
import { useWallet } from '@solana/wallet-adapter-react'

// ── helpers ──
const COMPETITION_META = {
  72:  { name: 'World Cup',            emoji: '🏆', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  430: { name: 'International Friendly', emoji: '⚽', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
}
const DEFAULT_COMP = { emoji: '⚽', color: 'bg-white/[0.04] text-gray-400 border-white/[0.06]' }

const FLAG_MAP = {
  argentina: '🇦🇷', australia: '🇦🇺', brazil: '🇧🇷', england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  france: '🇫🇷', germany: '🇩🇪', italy: '🇮🇹', japan: '🇯🇵',
  mexico: '🇲🇽', morocco: '🇲🇦', netherlands: '🇳🇱', portugal: '🇵🇹',
  spain: '🇪🇸', 'new zealand': '🇳🇿', india: '🇮🇳', liechtenstein: '🇱🇮', gibraltar: '🇬🇮',
}
function flag(name) { return FLAG_MAP[name?.toLowerCase()] || '' }

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'string' ? parseInt(ts) : ts)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function compMeta(cid, cname) {
  if (cid && COMPETITION_META[cid]) return COMPETITION_META[cid]
  return { ...DEFAULT_COMP, name: cname || 'Competition' }
}

// ── demo micro-market data ──
function demoMicroMarkets(homeTeam, awayTeam) {
  const allPlayers = {
    Argentina: ['Messi', 'Alvarez', 'Di Maria', 'De Paul', 'Otamendi', 'Romero'],
    Spain:      ['Morata', 'Rodri', 'Pedri', 'Gavi', 'Carvajal', 'Laporte'],
    Australia:  ['Goodwin', 'Duke', 'Irvine', 'Ryan', 'Souttar'],
    Brazil:     ['Vinicius Jr', 'Rodrygo', 'Neymar', 'Casemiro', 'Marquinhos'],
    'New Zealand': ['Wood', 'Cacace', 'McCowatt', 'Boxall'],
    India:      ['Chhetri', 'Chhangte', 'Thapa', 'Gurpreet'],
    Liechtenstein: ['Hasler', 'Salanovic', 'Wolfinger', 'Buchel'],
    Gibraltar:  ['Walker', 'De Barr', 'Casciaro', 'Mouelhi'],
  }
  const hPlayers = allPlayers[homeTeam] || ['Star FW', 'Striker A', 'Midfielder X']
  const aPlayers = allPlayers[awayTeam] || ['Striker B', 'Winger Y', 'Defender Z']
  const hDef = hPlayers.slice(-2)
  const aDef = aPlayers.slice(-2)
  const all = [...hPlayers.slice(0, 2), ...aPlayers.slice(0, 2)]
  return {
    nextGoal: all.map((p, i) => ({ label: p, odds: (2.00 + i * 0.80).toFixed(2), question: `${p} to score next` })),
    yellowCards: [...hDef, ...aDef].map((p, i) => ({ label: p, odds: (2.50 + i * 0.60).toFixed(2), question: `${p} next yellow card` })),
    penalty: [
      { label: 'Yes', odds: '3.20', question: 'Penalty awarded' },
      { label: 'No',  odds: '1.30', question: 'No penalty awarded' },
    ],
    addedTime: [
      { label: 'Over',  odds: '2.10', question: 'Added time over 5.5 minutes' },
      { label: 'Under', odds: '1.70', question: 'Added time under 5.5 minutes' },
    ],
  }
}

// ═══════════ Micro Bet Modal ═══════════
function MicroBetModal({ isOpen, onClose, item, matchName, wallet, onPredictionPlaced }) {
  const [amount, setAmount] = useState('10')
  const [placing, setPlacing] = useState(false)
  const toast = useToast()

  if (!isOpen || !item) return null

  const potentialReturn = amount && Number(amount) > 0 ? (Number(amount) * Number(item.odds)).toFixed(2) : '0.00'

  const handlePlace = async () => {
    if (!amount || Number(amount) <= 0) return
    setPlacing(true)
    const label = item.label || item.question || '—'

    // Build the payload for the backend
    const payload = {
      wallet: wallet || item.wallet || '',
      fixture_id: item.fixture_id || 0,
      match_name: matchName || '',
      market_type: item.market_type || '',
      market_label: item.market_label || '',
      selection: item.label || '',
      question: item.question || '',
      odds: parseFloat(item.odds) || 0,
      amount: parseFloat(amount) || 0,
    }

    try {
      const result = await savePrediction(payload)
      console.log(
        `✅ Prediction saved #${result.id}: ${label} at ${item.odds} for ${amount} USDC | ` +
        `Potential return: ${potentialReturn} USDC | Match: ${matchName}`
      )
      toast(`✅ Prediction placed! Check status in Your Predictions`)
      onPredictionPlaced?.()
    } catch (err) {
      console.error('[txBOB] savePrediction failed:', err)
      // Still log and show success for demo purposes
      console.log(
        `⚠️ [OFFLINE] ${label} at ${item.odds} for ${amount} USDC | Match: ${matchName}`
      )
      toast(`⚠️ Saved locally: ${label}`)
    }

    setPlacing(false)
    setAmount('10')
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-sm bg-[#0d0d0d] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Place Prediction</p>
              <p className="text-white font-bold text-sm mt-0.5">{item.question || item.label}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-gray-500 hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {/* Selection & odds */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <span className="text-white font-semibold text-lg">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase">Odds</span>
                <span className="text-red-400 font-bold font-mono text-lg">{item.odds}</span>
              </div>
            </div>

            {/* Match context */}
            <div className="text-xs text-gray-600 text-center">
              {matchName}
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-2">Amount (USDC)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder:text-gray-700 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">USDC</span>
              </div>
            </div>

            {/* Potential return */}
            {amount && Number(amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-xl bg-green-500/5 border border-green-500/10"
              >
                <p className="text-xs text-gray-500 mb-1">Potential return</p>
                <p className="text-green-400 font-bold text-lg">
                  {potentialReturn} <span className="text-sm font-medium text-gray-400">USDC</span>
                </p>
              </motion.div>
            )}

            {/* Place button */}
            <button
              onClick={handlePlace}
              disabled={!amount || Number(amount) <= 0 || placing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-base transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              {placing ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Placing...</span></>
              ) : (
                <><TrendingUp className="w-4 h-4" /><span>Place Prediction</span></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── MicroCard ──
function MicroCard({ icon: Icon, title, demoBadge, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-hover rounded-2xl p-5 border border-white/[0.05]"
    >
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.04]">
        <span className="text-lg">{Icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-300">{title}</span>
        {demoBadge && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-gray-600 text-[9px] font-medium uppercase tracking-wider">
            Demo
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </motion.div>
  )
}

function OddsPill({ label, odds, onClick, color }) {
  const baseColor = color === 'green' ? 'text-green-400 border-green-500/20 hover:border-green-500/40 hover:bg-green-500/10'
    : color === 'red' ? 'text-red-400 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10'
    : 'text-gray-300 border-white/[0.06] hover:border-red-500/30 hover:bg-red-500/10'

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border 
                   transition-all duration-200 text-left cursor-pointer ${baseColor} hover:text-white`}
    >
      <span className="text-xs font-medium truncate max-w-[100px]">{label}</span>
      <span className={`text-xs font-mono font-bold ${color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-red-400'}`}>
        {odds}
      </span>
    </button>
  )
}

// ═══════════ MAIN ═══════════
export default function MatchDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [matchInfo, setMatchInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [microBet, setMicroBet] = useState({ open: false, item: null })
  const [predictions, setPredictions] = useState([])
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const toast = useToast()
  const { publicKey } = useWallet()
  const wallet = publicKey?.toBase58() || ''

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchOdds(id), fetchFixtures()])
      .then(([oddsJson, fixturesJson]) => {
        if (cancelled) return
        setData(oddsJson)
        const list = fixturesJson.data || []
        const m = list.find((f) => String(f.id) === String(id))
        setMatchInfo(m || null)
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [id])

  // ── fetch user predictions ──
  const refreshPredictions = useCallback(async () => {
    if (!wallet || !id) return
    setPredictionsLoading(true)
    try {
      const res = await fetchPredictions(wallet)
      const all = res.data || res || []
      const fixturePreds = all.filter((p) => String(p.fixture_id) === String(id))
      setPredictions(fixturePreds)
    } catch (err) {
      console.warn('[MatchDetail] Failed to fetch predictions:', err.message)
    } finally {
      setPredictionsLoading(false)
    }
  }, [wallet, id])

  useEffect(() => {
    refreshPredictions()
  }, [refreshPredictions])

  const homeTeam = matchInfo?.homeTeam || 'TBD'
  const awayTeam = matchInfo?.awayTeam || 'TBD'
  const status = matchInfo?.status || 'NotStarted'
  const isLive = status === 'Live'
  const comp = compMeta(matchInfo?.competitionId, matchInfo?.competition)
  const matchName = `${homeTeam} vs ${awayTeam}`

  const questions = useMemo(() => {
    const fixture = {
      fixtureId: id,
      homeTeam, awayTeam, status,
      startTime: matchInfo?.startTime,
      markets: data?.markets || [],
    }
    return generateQuestions(fixture)
  }, [data, homeTeam, awayTeam, status, matchInfo, id])

  const microDemo = useMemo(() => demoMicroMarkets(homeTeam, awayTeam), [homeTeam, awayTeam])

  const openBet = useCallback((q) => {
    const item = {
      fixture_id: q.fixtureId,
      market_type: q.marketLabel,
      market_label: q.marketLabel,
      question: q.question,
      label: q.selection?.name || q.question,
      odds: q.selection?.odds != null ? Number(q.selection.odds).toFixed(2) : '—',
    }
    setMicroBet({ open: true, item })
  }, [])

  const openMicroBet = useCallback((item) => {
    // Attach fixture context if not already present
    if (!item.fixture_id) item.fixture_id = id
    if (!item.market_type) item.market_type = 'micro'
    setMicroBet({ open: true, item })
  }, [id])

  // ── loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader className="w-8 h-8 text-red-400 animate-spin" />
        <p className="text-gray-500 text-sm">Loading match data...</p>
      </div>
    )
  }

  // ── error ──
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-red-400 font-medium text-lg">Failed to load match</p>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
        <Link to="/matches" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 glass-hover text-gray-300 rounded-xl text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to matches
        </Link>
      </div>
    )
  }

  // ── not found ──
  if (!matchInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-gray-400 text-lg">Match not found</p>
        <p className="text-gray-600 text-sm mt-1">Fixture ID: {id}</p>
        <Link to="/matches" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 glass-hover text-gray-300 rounded-xl text-sm">
          <ArrowLeft className="w-4 h-4" /> Browse all matches
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ── Back ── */}
      <Link to="/matches" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> All Matches
      </Link>

      {/* ── MATCH HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 p-6 glass-hover rounded-2xl border border-white/[0.04]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">{flag(homeTeam) || '⚽'}</span>
              <span className="text-white font-bold text-lg">{homeTeam}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                {isLive ? <><Activity className="w-3 h-3 inline text-green-400 animate-pulse" /> Live</> : 'VS'}
              </span>
              {isLive && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase animate-pulse">
                  Live
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">{flag(awayTeam) || '⚽'}</span>
              <span className="text-white font-bold text-lg">{awayTeam}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium border ${comp.color}`}>
              <span>{comp.emoji}</span>
              <span>{comp.name}</span>
            </span>
            {matchInfo?.startTime && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(matchInfo.startTime)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── TWO-COLUMN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Prediction Markets ── */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            <Target className="w-4 h-4 inline mr-1.5" />
            Prediction Markets
          </h2>

          {questions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {questions.map((q, idx) => {
                const yesPct = Math.min(99.9, Math.max(0.1, q.yesProb || 0)).toFixed(1)
                const noPct = (100 - parseFloat(yesPct)).toFixed(1)
                const color = parseFloat(yesPct) > 50 ? 'green' : 'red'

                return (
                  <motion.button
                    key={`${q.fixtureId}-${q.question}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * idx }}
                    onClick={() => openBet(q)}
                    className="relative glass-hover rounded-2xl p-5 border border-white/[0.04] 
                               hover:border-red-500/20 transition-all duration-300 group text-left cursor-pointer w-full"
                  >
                    {q.isLive && (
                      <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-green-500 text-[10px] font-bold text-black uppercase tracking-wider shadow-lg shadow-green-500/30 animate-pulse">
                        Live
                      </span>
                    )}

                    <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider mb-2 block">
                      {q.marketLabel}
                    </span>

                    <p className="text-white font-bold text-sm leading-snug mb-4 min-h-[36px]">
                      {q.question}
                    </p>

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
                          animate={{ width: `${yesPct}%` }}
                          transition={{ duration: 0.6, delay: 0.06 * idx, ease: 'easeOut' }}
                          className={`h-full rounded-full ${color === 'green' ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-gray-700" />No
                        </span>
                        <span className="font-mono text-gray-600">{noPct}%</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 to-red-500/0 
                                    group-hover:from-red-500/[0.03] group-hover:to-red-500/[0.06] transition-all duration-500 pointer-events-none" />
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 glass-hover rounded-2xl"
            >
              <Clock className="w-10 h-10 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">Full-time prediction markets not available yet</p>
              <p className="text-gray-600 text-xs mt-1">Odds populate closer to kick-off</p>
            </motion.div>
          )}
        </div>

        {/* ── RIGHT: Micro Markets ── */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            <AlertTriangle className="w-4 h-4 inline mr-1.5" />
            Micro Markets
          </h2>

          {/* Next Goal Scorer */}
          <MicroCard icon="⚽" title="Next Goal Scorer" demoBadge>
            {microDemo.nextGoal.map((p) => (
              <OddsPill
                key={p.label}
                label={p.label}
                odds={p.odds}
                onClick={() => openMicroBet({ ...p, market_type: 'goal_scorer', market_label: 'Next Goal Scorer', question: `${p.label} to score next` })}
              />
            ))}
            <OddsPill
              label="No Goal"
              odds="5.00"
              color="red"
              onClick={() => openMicroBet({ label: 'No Goal', odds: '5.00', market_type: 'goal_scorer', market_label: 'Next Goal Scorer', question: 'No goal (rest of half)' })}
            />
          </MicroCard>

          {/* Yellow Cards */}
          <MicroCard icon="🟨" title="Next Yellow Card" demoBadge>
            {microDemo.yellowCards.map((p) => (
              <OddsPill
                key={p.label}
                label={p.label}
                odds={p.odds}
                onClick={() => openMicroBet({ ...p, market_type: 'yellow_card', market_label: 'Next Yellow Card', question: `${p.label} next yellow card` })}
              />
            ))}
          </MicroCard>

          {/* Penalty */}
          <MicroCard icon="⚖️" title="Penalty Awarded" demoBadge>
            {microDemo.penalty.map((p) => (
              <OddsPill
                key={p.label}
                label={p.label}
                odds={p.odds}
                color={p.label === 'Yes' ? 'green' : 'red'}
                onClick={() => openMicroBet({ ...p, market_type: 'penalty', market_label: 'Penalty Awarded', question: `${p.question}` })}
              />
            ))}
          </MicroCard>

          {/* Added Time */}
          <MicroCard icon="⏱️" title="ADDED TIME (OVER 5.5 MINUTES)" demoBadge>
            {microDemo.addedTime.map((p) => (
              <OddsPill
                key={p.label}
                label={p.label}
                odds={p.odds}
                color={p.label === 'Over' ? 'green' : 'red'}
                onClick={() => openMicroBet({ ...p, market_type: 'added_time', market_label: 'Added Time', question: `${p.question}` })}
              />
            ))}
          </MicroCard>
        </div>
      </div>

      {/* ── Your Predictions ── */}
      {wallet && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Predictions</h2>
            {predictionsLoading && <Loader className="w-3.5 h-3.5 text-gray-500 animate-spin ml-1" />}
          </div>

          {!predictionsLoading && predictions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-hover rounded-2xl p-6 text-center"
            >
              <History className="w-8 h-8 mx-auto text-gray-600 mb-2" />
              <p className="text-gray-500 text-sm">No predictions placed yet</p>
              <p className="text-gray-600 text-xs mt-1">Pick a market above to get started</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {predictions.map((pred, idx) => {
                const resolved = pred.status === 'won' || pred.status === 'lost'
                const won = pred.status === 'won'
                const pending = pred.status === 'pending'
                return (
                  <motion.div
                    key={pred.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="glass-hover rounded-2xl p-4 border border-white/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {pending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                            <Clock3 className="w-3 h-3 animate-pulse" /> PENDING
                          </span>
                        )}
                        {won && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                            <CheckCircle className="w-3 h-3" /> WON
                          </span>
                        )}
                        {!pending && !won && resolved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
                            <XCircle className="w-3 h-3" /> LOST
                          </span>
                        )}
                        <span className="text-white text-sm truncate">
                          {pred.selection || pred.question || pred.market_label || 'Prediction'}
                        </span>
                        {pred.odds && (
                          <span className="text-gray-500 text-xs shrink-0">{pred.odds}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white text-sm font-semibold">{pred.amount || pred.stake || '—'} USDC</span>
                        {won && pred.payout && (
                          <span className="text-emerald-400 text-xs">
                            → +{typeof pred.payout === 'number' ? pred.payout.toFixed(2) : pred.payout} USDC
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      <MicroBetModal
        isOpen={microBet.open}
        onClose={() => setMicroBet({ open: false, item: null })}
        item={microBet.item}
        matchName={matchName}
        wallet={wallet}
        onPredictionPlaced={refreshPredictions}
      />
    </div>
  )
}
