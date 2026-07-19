import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Code2, Cpu, Zap, Database, Shield,
  GitBranch, ExternalLink, Terminal, Copy, Check, Package,
} from 'lucide-react'
import { useState } from 'react'

const PY_SNIPPET = `from txbob import TxLINE

client = TxLINE()
odds = client.get_odds(18257739)
print(odds)`

const NODE_SNIPPET = `import { TxLINE } from 'txbob-sdk'

const client = new TxLINE()
const odds = await client.getOdds(18257739)
console.log(odds)`

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] bg-[#111]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs text-gray-500 font-mono tracking-wide">{lang}</span>
        </div>
        <button onClick={copy} className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 hover:text-gray-200 transition-colors" title="Copy code">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-6 text-sm font-mono text-gray-200 leading-relaxed overflow-x-auto selection:bg-red-500/30">
        <code>{code}</code>
      </pre>
    </div>
  )
}

const features = [
  { icon: <Zap className="w-6 h-6" />, title: 'Real-time Data', desc: 'Live odds, scores, and market data streamed from TxLINE oracle.' },
  { icon: <Shield className="w-6 h-6" />, title: 'On-chain Verification', desc: 'All data is cryptographically signed on Solana for trustless settlement.' },
  { icon: <Cpu className="w-6 h-6" />, title: 'AI Agents Ready', desc: 'Build autonomous trading agents that respond to live market conditions.' },
  { icon: <Database className="w-6 h-6" />, title: 'Open Source', desc: 'MIT licensed. Contribute, fork, and build on GitHub.' },
]

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="glass-hover rounded-2xl p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 mb-5 group-hover:scale-110 transition-transform duration-300 shrink-0">{icon}</div>
      <h3 className="text-white font-bold text-base mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed flex-1">{desc}</p>
    </motion.div>
  )
}

function Section({ children, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }} className={`py-16 ${className}`}>
      {children}
    </motion.div>
  )
}

export default function Developers() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors mb-16">
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>

      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-8">
          <Terminal className="w-4 h-4 text-red-400" />
          <span className="text-xs font-medium text-gray-300 tracking-wide">txBOB SDK</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6">
          <span className="text-white">Build with</span>{' '}
          <span className="gradient-text">txBOB SDK</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Python, JavaScript, Rust — fetch World Cup 2026 odds in 3 lines.
          Dead simple, lightning fast, on-chain ready.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="https://github.com/txbob/txbob-sdk" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold text-base transition-all duration-300 shadow-xl shadow-red-600/15 hover:shadow-red-500/25 hover:scale-[1.02]">
            <GitBranch className="w-5 h-5" />
            <span>View on GitHub</span>
            <ExternalLink className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
          <a href="https://docs.txbob.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-gray-300 hover:text-white font-semibold text-base transition-all duration-200">
            <span>View Full Docs</span>
          </a>
        </div>
      </motion.div>

      {/* ── Installation ── */}
      <Section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 text-center">Installation</h2>
        <p className="text-gray-500 text-sm text-center mb-10">Get started with a single command</p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
          <div className="glass-hover rounded-2xl p-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-4 text-red-400" />
            <p className="text-gray-400 text-xs font-mono mb-4 uppercase tracking-wider">Python</p>
            <code className="inline-block px-5 py-3 rounded-lg bg-[#0d0d0d] border border-white/[0.05] text-green-400 font-mono text-sm font-semibold select-all">pip install txbob</code>
          </div>
          <div className="glass-hover rounded-2xl p-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-4 text-red-400" />
            <p className="text-gray-400 text-xs font-mono mb-4 uppercase tracking-wider">Node.js</p>
            <code className="inline-block px-5 py-3 rounded-lg bg-[#0d0d0d] border border-white/[0.05] text-green-400 font-mono text-sm font-semibold select-all">npm install txbob</code>
          </div>
        </div>
      </Section>

      {/* ── Code examples ── */}
      <Section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 text-center">Fetch odds in 3 lines</h2>
        <p className="text-gray-500 text-sm text-center mb-10">No boilerplate. Just connect and query.</p>
        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#306998]/15 border border-[#306998]/20 flex items-center justify-center text-[10px] text-[#FFD43B] font-bold">PY</span> Python
            </h3>
            <CodeBlock code={PY_SNIPPET} lang="python" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#339933]/15 border border-[#339933]/20 flex items-center justify-center text-[10px] text-[#339933] font-bold">JS</span> JavaScript / TypeScript
            </h3>
            <CodeBlock code={NODE_SNIPPET} lang="javascript" />
          </div>
        </div>
      </Section>

      {/* ── Features ── */}
      <Section>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 text-center">Why txBOB SDK?</h2>
        <p className="text-gray-500 text-sm text-center mb-12">Built for traders and developers who demand speed and trust</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </Section>

      {/* ── Bottom CTA ── */}
      <Section className="pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="glass-hover rounded-2xl p-10 sm:p-12 text-center relative overflow-hidden border border-white/[0.04]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-red-600/5 blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mx-auto mb-6">
                <Code2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to build?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Start building prediction markets, trading bots, and data apps with the txBOB SDK. Open source, MIT licensed.
              </p>
              <a href="https://github.com/txbob/txbob-sdk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold text-base transition-all duration-300 shadow-xl shadow-red-600/15 hover:shadow-red-500/25 hover:scale-[1.02]">
                <GitBranch className="w-5 h-5" />
                <span>Get Started on GitHub</span>
                <ExternalLink className="w-4 h-4 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}