import { useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Copy, Check, ExternalLink, ChevronRight } from 'lucide-react'

const codeSnippet = `from txbob import TxBob

client = TxBob()
fixtures = client.get_fixtures()       # World Cup matches
odds = client.get_odds(fixtures[0])    # Live odds for a match`

export default function SDKShowcase() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="sdk" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <Terminal className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Developer SDK</span>
          </div>
          <h2 className="section-title">
            <span className="text-white">Build in </span>
            <span className="text-red-400 neon-text">3 Lines</span>
          </h2>
          <p className="section-subtitle">
            The txBOB Python SDK gives you fixtures, odds, and market data with minimal code.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Code block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-hover rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-gray-400">example.py</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-white/[0.04] transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-6">
              <pre className="text-sm leading-relaxed overflow-x-auto">
                <code className="font-mono text-gray-300">
                  <span className="text-red-400">from</span>{' '}
                  <span className="text-txgold">txbob</span>{' '}
                  <span className="text-red-400">import</span>{' '}
                  <span className="text-txgold">TxBob</span>{'\n\n'}
                  <span className="text-gray-500">client</span> ={' '}
                  <span className="text-txgold">TxBob</span>
                  <span className="text-gray-500">()</span>{'\n'}
                  <span className="text-gray-500">fixtures</span> ={' '}
                  <span className="text-gray-400">client</span>
                  <span className="text-gray-500">.get_fixtures()</span>{' '}
                  <span className="text-gray-600"># World Cup matches</span>{'\n'}
                  <span className="text-gray-500">odds</span> ={' '}
                  <span className="text-gray-400">client</span>
                  <span className="text-gray-500">.get_odds(fixtures[</span>
                  <span className="text-txgold">0</span>
                  <span className="text-gray-500">])</span>{' '}
                  <span className="text-gray-600"># Live odds</span>
                </code>
              </pre>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Install command */}
            <div className="glass-hover rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Install in one command</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-sm bg-black/30 rounded-lg px-4 py-3 text-txgold border border-white/[0.04]">
                  pip install txbob
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('pip install txbob')
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="shrink-0 p-3 rounded-lg glass-hover text-gray-400 hover:text-red-400"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {[
                'Fixtures, odds, and market data in one SDK',
                'Async support for high-throughput agents',
                'Full type hints and documentation',
                'MIT licensed — use it anywhere',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-gray-400">
                  <ChevronRight className="w-4 h-4 text-red-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {/* GitHub CTA */}
            <a
              href="#"
              className="inline-flex items-center gap-2 px-5 py-3 glass-hover rounded-xl text-sm text-gray-300 hover:text-white group"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-4 h-4 group-hover:text-red-400 transition-colors" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}