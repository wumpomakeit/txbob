import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Trophy, Terminal, Database, Package } from 'lucide-react'

const userSteps = [
  { step: '01', icon: <Wallet className="w-6 h-6" />, title: 'Connect Wallet', desc: 'Link your Solana wallet in one click. Funds stay self-custodied.' },
  { step: '02', icon: <TrendingUp className="w-6 h-6" />, title: 'Choose Market', desc: 'Browse 1X2, Over/Under, Asian Handicap, and micro-markets.' },
  { step: '03', icon: <Trophy className="w-6 h-6" />, title: 'Trade & Win', desc: 'Place trades on-chain. Payouts settle instantly to your wallet.' },
]

const devSteps = [
  { step: '01', icon: <Terminal className="w-6 h-6" />, title: 'Install SDK', desc: 'pip install txbob — one command to get started.' },
  { step: '02', icon: <Database className="w-6 h-6" />, title: 'Fetch Data', desc: 'Pull fixtures, odds, and market data with 3 lines of code.' },
  { step: '03', icon: <Package className="w-6 h-6" />, title: 'Build App', desc: 'Ship prediction dApps, bots, or dashboards on Solana.' },
]

function StepCard({ step }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: parseInt(step.step) * 0.12 }}
      className="glass-hover rounded-2xl p-6 text-center relative"
    >
      <span className="absolute -top-2 -right-2 text-6xl font-black text-white/[0.02] select-none pointer-events-none">
        {step.step}
      </span>
      <div className="relative w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-red-600/20 to-red-500/10 flex items-center justify-center mb-4 text-red-400">
        {step.icon}
      </div>
      <h4 className="text-white font-bold mb-2">{step.title}</h4>
      <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
    </motion.div>
  )
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Two paths, one platform. Start trading or start building in minutes.
          </p>
        </motion.div>

        {/* For Users */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white">For Users</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {userSteps.map((s) => (
              <StepCard key={s.step} step={s} />
            ))}
          </div>
        </div>

        {/* For Developers */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white">For Developers</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {devSteps.map((s) => (
              <StepCard key={s.step} step={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}