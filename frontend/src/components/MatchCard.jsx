import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ChevronRight } from 'lucide-react'

const statusColors = {
  Live: 'bg-green-500',
  NotStarted: 'bg-yellow-500',
  Finished: 'bg-gray-500',
  Postponed: 'bg-orange-500',
  Cancelled: 'bg-red-500',
}

function formatTime(ts) {
  if (!ts) return 'TBD'
  const d = new Date(typeof ts === 'string' ? parseInt(ts) : ts)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MatchCard({ match }) {
  const isLive = match.status === 'Live'
  const statusColor = statusColors[match.status] || 'bg-gray-500'

  return (
    <Link to={`/match/${match.id}`}>
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        className={`group relative p-6 rounded-2xl glass-hover transition-all duration-300 ${
          isLive ? 'neon-border animate-pulse-red' : ''
        }`}
      >
        {/* Status badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor} ${isLive ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              isLive ? 'text-green-400' : 'text-gray-400'
            }`}>
              {match.status || 'Scheduled'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(match.startTime)}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-white group-hover:text-red-400 transition-colors truncate">
              {match.homeTeam || 'TBD'}
            </p>
          </div>
          <div className="shrink-0">
            <span className="text-sm font-bold text-gray-500">VS</span>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-white group-hover:text-red-400 transition-colors truncate">
              {match.awayTeam || 'TBD'}
            </p>
          </div>
        </div>

        {/* Hover arrow */}
        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <ChevronRight className="w-5 h-5 text-red-400" />
        </div>
      </motion.div>
    </Link>
  )
}
