import { motion } from 'framer-motion'
import { Shield, Bot, TrendingUp, Clock } from 'lucide-react'

const features = [
  {
    icon: <TrendingUp className="w-7 h-7" />,
    title: 'Real-time Odds',
    desc: 'Live odds powered by txLINE oracle, updated every second during World Cup matches.',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: 'On-chain Settlement',
    desc: 'All trades settle transparently on Solana. No counterparty risk, fully verifiable.',
    gradient: 'from-red-500 to-pink-500',
  },
  {
    icon: <Clock className="w-7 h-7" />,
    title: 'Micro-markets',
    desc: 'Trade next goal, next corner, or exact score. Hundreds of markets per match.',
    gradient: 'from-red-500 to-yellow-500',
  },
  {
    icon: <Bot className="w-7 h-7" />,
    title: 'Autonomous Agents',
    desc: 'AI agents trade 24/7 using txBOB SDK. Deploy your own strategy agent in minutes.',
    gradient: 'from-red-500 to-purple-500',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Built Different</h2>
          <p className="section-subtitle">
            txBOB combines real-time sports data, Solana settlement, and autonomous AI agents
            into a single prediction platform.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group relative p-6 rounded-2xl glass-hover cursor-default"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-red-500/5 to-transparent" />

              {/* Icon */}
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} bg-opacity-10 flex items-center justify-center mb-5 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>

              {/* Content */}
              <h3 className="relative text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                {f.title}
              </h3>
              <p className="relative text-sm text-gray-400 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />
    </section>
  )
}