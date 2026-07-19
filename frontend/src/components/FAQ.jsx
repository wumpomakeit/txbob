import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'What is txBOB?',
    a: 'txBOB is an autonomous prediction market platform built on Solana for World Cup 2026. It combines real-time odds from txLINE oracle with on-chain settlement. Users trade micro-markets, developers build on the Python SDK.',
  },
  {
    q: 'How do trades settle?',
    a: 'All trades settle fully on-chain using Solana smart contracts. When a match ends, the oracle posts verified results and winning payouts are distributed automatically to your wallet — no manual claims needed.',
  },
  {
    q: 'What are micro-markets?',
    a: 'Micro-markets are granular prediction markets within a match. Trade on: next goal scorer, total corners, exact score, Asian handicap, yellow cards, and dozens more per match.',
  },
  {
    q: 'Do I need KYC?',
    a: 'No. txBOB is fully permissionless. Connect your Solana wallet and start trading. No email, phone, or identity verification required — true DeFi.',
  },
  {
    q: 'How do I use the Python SDK?',
    a: 'Install with pip install txbob, import TxBob, and you have fixtures, odds, and market data in 3 lines of code. Full async support for building trading agents. Check GitHub for docs.',
  },
  {
    q: 'Can I run a trading bot?',
    a: 'Yes. The txBOB SDK supports async operations so you can build autonomous agents that monitor odds, place trades, and manage risk 24/7. Deploy anywhere Python runs.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'Phantom, Backpack, Solflare, Glow, and any wallet compatible with the Solana Wallet Adapter standard.',
  },
  {
    q: 'What are the fees?',
    a: '0.3% platform fee on winning trades. Solana network fees are typically under $0.01 per transaction.',
  },
  {
    q: 'Is the SDK open source?',
    a: 'Yes. The txBOB Python SDK is MIT licensed and available on GitHub. Fork it, extend it, contribute back — PRs welcome.',
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null)

  const toggle = (i) => setOpenIdx(openIdx === i ? null : i)

  return (
    <section id="faq" className="py-24 px-4 relative">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">
            <span className="text-white">Frequently Asked </span>
            <span className="text-red-400 neon-text">Questions</span>
          </h2>
          <p className="section-subtitle">
            For traders and builders alike.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-hover rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-white font-medium pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className={`w-5 h-5 transition-colors ${openIdx === i ? 'text-red-400' : 'text-gray-500'}`} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}