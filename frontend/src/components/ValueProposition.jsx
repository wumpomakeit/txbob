import { motion } from 'framer-motion'
import { TrendingUp, Shield, Clock, Terminal, Code2, BookOpen, ArrowRight } from 'lucide-react'

const traderFeatures = [
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Real-time Odds', desc: 'Live World Cup odds powered by txLINE oracle, updated every second during matches.' },
  { icon: <Clock className="w-5 h-5" />, title: 'Micro-markets', desc: 'Trade next goal, next corner, exact score — hundreds of markets per match.' },
  { icon: <Shield className="w-5 h-5" />, title: 'On-chain Settlement', desc: 'All trades settle transparently on Solana. No counterparty risk.' },
]

const builderFeatures = [
  { icon: <Terminal className="w-5 h-5" />, title: 'Python SDK', desc: 'pip install txbob — one command and you are ready to build.' },
  { icon: <Code2 className="w-5 h-5" />, title: 'Simple API', desc: 'Clean, documented API for fixtures, odds, and market data. Build in minutes.' },
  { icon: <BookOpen className="w-5 h-5" />, title: 'Open Source', desc: 'Everything on GitHub. Fork it, extend it, contribute back.' },
]

export default function ValueProposition() {
  return (
    <section id="value-prop" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">
            <span className="text-white">Built for </span>
            <span className="text-red-400 neon-text">Everyone</span>
          </h2>
          <p className="section-subtitle">
            Whether you are trading World Cup markets or building the next-gen prediction app, txBOB has you covered.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* For Traders */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-red-500/5 to-transparent rounded-2xl" />
            <div className="glass-hover rounded-2xl p-8 h-full relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">For Traders</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Prediction Markets</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Trade on World Cup 2026 outcomes with real-time odds, instant settlement, and zero counterparty risk.
              </p>
              <div className="space-y-5">
                {traderFeatures.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-0.5">{f.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* For Builders */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative group rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-bl from-red-600/10 via-red-500/5 to-transparent rounded-2xl" />
            <div className="glass-hover rounded-2xl p-8 h-full relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">For Builders</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Developer SDK</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Build autonomous agents, data pipelines, or full prediction dApps with our Python SDK.
              </p>
              <div className="space-y-5">
                {builderFeatures.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-0.5">{f.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />
    </section>
  )
}