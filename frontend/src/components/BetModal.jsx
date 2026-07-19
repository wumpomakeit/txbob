import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, TrendingUp, Zap, Wallet } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useToast } from './Toast'

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toFixed(2)
}

export default function BetModal({ isOpen, onClose, selection, context }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USDC')
  const [placing, setPlacing] = useState(false)
  const [walletMenu, setWalletMenu] = useState(false)
  const toast = useToast()
  const { wallets, select, connected, publicKey, connecting } = useWallet()

  if (!isOpen || !selection) return null

  const prob = context?.prob != null ? Number(context.prob).toFixed(1) : null
  const headline = context?.label || selection.name || '—'
  // In prediction-market mode, the question IS the headline
  const subtext = selection.name && selection.name !== headline
    ? `Betting: ${selection.name}`
    : ''

  const potentialReturn = amount ? (Number(amount) * Number(selection.odds)).toFixed(2) : '0.00'

  const handleConnectWallet = async (walletName) => {
    setWalletMenu(false)
    const wallet = wallets.find((w) => w.adapter.name === walletName)
    if (wallet) {
      try {
        await select(wallet.adapter.name)
      } catch (e) {
        console.error('Failed to connect wallet:', e)
      }
    }
  }

  const handlePlace = () => {
    if (!amount || Number(amount) <= 0) return
    if (!connected || !publicKey) return
    setPlacing(true)
    setTimeout(() => {
      console.log(
        `✅ Bet placed: ${headline} | ` +
        `Odds: ${fmt(selection.odds)} | Amount: ${amount} ${currency} | ` +
        `Potential return: ${potentialReturn} ${currency} | Wallet: ${publicKey.toBase58()}`
      )
      toast(`✅ Bet placed: ${headline}`)
      setPlacing(false)
      onClose()
    }, 800)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative z-10 w-full max-w-sm bg-[#0d0d0d] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Place Bet</p>
              <p className="text-white font-bold text-sm mt-0.5">{headline}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-gray-500 hover:text-gray-200 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          {/* Body */}
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <span className="text-xs text-gray-500">{subtext}</span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <span className="text-white font-semibold text-lg">{selection.name}</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 font-bold text-lg">{prob != null ? `${prob}%` : fmt(selection.odds)}</span>
                </div>
              </div>
            </div>
            {/* Currency */}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-2 block">Currency</label>
              <div className="flex gap-2">
                {['USDC', 'SOL'].map((c) => (
                  <button key={c} onClick={() => setCurrency(c)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${currency === c ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-white/[0.02] border border-white/[0.04] text-gray-400 hover:text-gray-200'}`}>
                    {c === 'USDC' ? <span className="flex items-center justify-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> USDC</span> : <span className="flex items-center justify-center gap-1.5"><Zap className="w-3.5 h-3.5" /> SOL</span>}
                  </button>
                ))}
              </div>
            </div>
            {/* Amount */}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-2 block">Amount</label>
              <div className="relative">
                <input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder:text-gray-700 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all" autoFocus />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">{currency}</span>
              </div>
            </div>
            {/* Return */}
            {amount && Number(amount) > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <p className="text-xs text-gray-500 mb-1">Potential return</p>
                <p className="text-green-400 font-bold text-lg">{potentialReturn} <span className="text-sm font-medium text-gray-400">{currency}</span></p>
              </motion.div>
            )}
            {/* Place / Wallet */}
            {connected && publicKey ? (
              <button
                onClick={handlePlace}
                disabled={!amount || Number(amount) <= 0 || placing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-base transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                {placing ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Placing bet...</span></>
                ) : (
                  <><TrendingUp className="w-4 h-4" /><span>Place Bet</span></>
                )}
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setWalletMenu(!walletMenu)}
                  disabled={connecting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {connecting ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Connecting...</span></>
                  ) : (
                    <><Wallet className="w-4 h-4" /><span>Connect Wallet to Bet</span></>
                  )}
                </button>
                {walletMenu && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 bg-[#121212] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.adapter.name}
                        onClick={() => handleConnectWallet(wallet.adapter.name)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <img src={wallet.adapter.icon} alt="" className="w-5 h-5 rounded" />
                        <span>{wallet.adapter.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
