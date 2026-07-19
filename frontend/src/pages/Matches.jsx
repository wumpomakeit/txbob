import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Clock, Loader, Zap, Globe,
  Filter, ChevronDown, Activity,
} from 'lucide-react'
import { fetchAllMarkets } from '../api/client'

// ── competition id → display name + emoji + color class ──
const COMPETITION_META = {
  72:  { name: 'World Cup',            emoji: '🏆', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  430: { name: 'International Friendly', emoji: '⚽', color: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
}
const DEFAULT_COMP_META = { emoji: '⚽', color: 'bg-white/[0.04] text-gray-400 border-white/[0.06]' }

function compMeta(cid, cname) {
  if (cid && COMPETITION_META[cid]) return COMPETITION_META[cid]
  const label = cname || `Competition ${cid || ''}`
  return { ...DEFAULT_COMP_META, name: label }
}

// ── format time with full year ──
function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'string' ? parseInt(ts) : ts)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── country flag emoji from team name ──
const FLAG_MAP = {
  argentina: '🇦🇷', australia: '🇦🇺', brazil: '🇧🇷', england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  france: '🇫🇷', germany: '🇩🇪', italy: '🇮🇹', japan: '🇯🇵',
  mexico: '🇲🇽', morocco: '🇲🇦', netherlands: '🇳🇱', portugal: '🇵🇹',
  saudi: '🇸🇦', 'saudi arabia': '🇸🇦', senegal: '🇸🇳', spain: '🇪🇸',
  switzerland: '🇨🇭', usa: '🇺🇸', 'united states': '🇺🇸',
  croatia: '🇭🇷', belgium: '🇧🇪', denmark: '🇩🇰', serbia: '🇷🇸',
  poland: '🇵🇱', 'south korea': '🇰🇷', korea: '🇰🇷', canada: '🇨🇦',
  cameroon: '🇨🇲', ghana: '🇬🇭', tunisia: '🇹🇳', nigeria: '🇳🇬',
  egypt: '🇪🇬', qatar: '🇶🇦', ecuador: '🇪🇨', peru: '🇵🇪',
  chile: '🇨🇱', colombia: '🇨🇴', 'costa rica': '🇨🇷', panama: '🇵🇦',
  'new zealand': '🇳🇿', india: '🇮🇳', liechtenstein: '🇱🇮', gibraltar: '🇬🇮',
}
function flagEmoji(name) {
  if (!name) return ''
  return FLAG_MAP[name.toLowerCase()] || ''
}

function getRelativeTime(ts) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'string' ? parseInt(ts) : ts)
  const diff = d - Date.now()
  if (diff < 0) return 'Kick-off TBD'
  const days = Math.floor(diff / 86400000)
  if (days > 1) return `${days} days`
  if (days === 1) return 'Tomorrow'
  const hrs = Math.floor(diff / 3600000)
  if (hrs > 1) return `${hrs} hrs`
  if (hrs === 1) return '1 hr'
  const mins = Math.floor(diff / 60000)
  return `${mins} min`
}

export default function Matches() {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeFilter = searchParams.get('competition') || 'all'

  useEffect(() => {
    let cancelled = false
    fetchAllMarkets()
      .then((data) => { if (!cancelled) { setFixtures(data); setLoading(false) } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const filters = useMemo(() => {
    const seen = new Map()
    for (const f of fixtures) {
      const key = f.competitionId ? String(f.competitionId) : (f.competition || 'unknown')
      if (!seen.has(key)) seen.set(key, { id: f.competitionId, name: f.competition })
    }
    return [...seen.values()]
  }, [fixtures])

  const filtered = useMemo(() => {
    let list = [...fixtures]
    if (activeFilter !== 'all') {
      list = list.filter((f) => {
        const key = f.competitionId ? String(f.competitionId) : (f.competition || 'unknown')
        return key === activeFilter
      })
    }
    list.sort((a, b) => {
      if (a.status === 'Live' && b.status !== 'Live') return -1
      if (b.status === 'Live' && a.status !== 'Live') return 1
      return (a.startTime ? parseInt(a.startTime) : 0) - (b.startTime ? parseInt(b.startTime) : 0)
    })
    return list
  }, [fixtures, activeFilter])

  const live = filtered.filter((f) => f.status === 'Live')
  const upcoming = filtered.filter((f) => f.status !== 'Live')

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader className="w-8 h-8 text-red-400 animate-spin" />
        <p className="text-gray-500 text-sm">Loading fixtures...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-red-400 font-medium text-lg">Failed to load fixtures</p>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
        <Link to="/" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 glass-hover text-gray-300 rounded-xl text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Live Matches</h1>
            <p className="text-gray-500 mt-1.5">
              All competitions · {filtered.length} fixture{filtered.length !== 1 ? 's' : ''}
              {live.length > 0 && <span className="text-green-400"> · {live.length} live</span>}
            </p>
          </div>

          {filters.length > 1 && (
            <div className="relative inline-flex items-center gap-2 group">
              <Filter className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
              <select
                value={activeFilter}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'all') setSearchParams({})
                  else setSearchParams({ competition: v })
                }}
                className="appearance-none bg-[#0d0d0d] border border-white/[0.06] rounded-xl px-4 py-2 pr-8 text-sm text-gray-300 
                           focus:outline-none focus:border-red-500/30 transition-colors cursor-pointer"
              >
                <option value="all">All Competitions</option>
                {filters.map((f) => {
                  const key = f.id ? String(f.id) : (f.name || 'unknown')
                  const m = compMeta(f.id, f.name)
                  return <option key={key} value={key}>{m.emoji} {m.name || key}</option>
                })}
              </select>
              <ChevronDown className="absolute right-2 w-4 h-4 text-gray-600 pointer-events-none" />
            </div>
          )}
        </div>
      </motion.div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 glass-hover rounded-2xl">
          <Globe className="w-14 h-14 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No fixtures available</p>
          <p className="text-gray-600 text-sm mt-1">
            {activeFilter !== 'all' ? 'No fixtures found for this competition. Try another filter.' : 'Check back closer to the tournament.'}
          </p>
        </motion.div>
      )}

      {live.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live
            </span>
            <span className="text-gray-600 text-xs">{live.length} match{live.length !== 1 ? 'es' : ''} in progress</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {live.map((m, idx) => <MatchCard key={m.fixtureId} match={m} idx={idx} live />)}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-400 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Upcoming
            </span>
            <span className="text-gray-600 text-xs">{upcoming.length} match{upcoming.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcoming.map((m, idx) => <MatchCard key={m.fixtureId} match={m} idx={idx} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MatchCard component ──
function MatchCard({ match, idx, live: isLive }) {
  const m = compMeta(match.competitionId, match.competition)
  const hf = flagEmoji(match.homeTeam)
  const af = flagEmoji(match.awayTeam)
  const timeStr = formatTime(match.startTime)

  return (
    <Link to={`/match/${match.fixtureId}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 * idx }}
        whileHover={{ scale: 1.01, y: -2 }}
        className="relative glass-hover rounded-2xl p-5 border border-white/[0.04] 
                   hover:border-red-500/20 transition-all duration-300 group cursor-pointer overflow-hidden"
      >
        {isLive && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full 
                           bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
          </span>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-2xl">{hf || '⚽'}</span>
            <span className="text-white font-bold text-sm text-center leading-tight">{match.homeTeam || 'TBD'}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">VS</span>
            {isLive && <Zap className="w-3.5 h-3.5 text-green-400 animate-pulse" />}
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-2xl">{af || '⚽'}</span>
            <span className="text-white font-bold text-sm text-center leading-tight">{match.awayTeam || 'TBD'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${m.color}`}>
            <span>{m.emoji}</span>
            <span className="truncate max-w-[140px]">{m.name}</span>
          </span>
          <span className="text-[11px] text-gray-500 shrink-0 flex items-center gap-1">
            {!isLive && <Clock className="w-3 h-3" />}
            {isLive ? 'Tap to trade' : timeStr}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-between">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Prediction Markets →</span>
          {!isLive && <span className="text-[10px] text-gray-700">{getRelativeTime(match.startTime)}</span>}
        </div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 to-red-500/0 
                        group-hover:from-red-500/[0.03] group-hover:to-red-500/[0.06] transition-all duration-500 pointer-events-none" />
      </motion.div>
    </Link>
  )
}
