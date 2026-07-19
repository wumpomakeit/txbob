import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fetchFixtures } from '../api/client'
import MatchCard from './MatchCard'

export default function LiveMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchFixtures()
      .then((json) => {
        if (!cancelled) {
          setMatches(json.data || [])
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

  return (
    <section id="matches" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Live Matches</h2>
          <p className="section-subtitle">
            Real-time World Cup 2026 fixtures and prediction markets.
          </p>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading fixtures...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-400 font-medium text-lg">Failed to load fixtures</p>
            <pre className="text-gray-500 text-xs mt-3 bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 max-w-lg mx-auto whitespace-pre-wrap text-left">
              {error}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2.5 glass-hover text-gray-300 rounded-xl text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No fixtures available right now.</p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}