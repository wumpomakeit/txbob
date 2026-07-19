import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Matches', href: '/matches' },
  { label: 'SDK', href: '#sdk' },
  { label: 'Markets', href: '#markets' },
  { label: 'Developers', href: '/developers' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
]

function truncateAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { pathname } = useLocation()
  const { wallets, select, connected, publicKey, disconnect, connecting } = useWallet()

  const handleNav = (href) => {
    setOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleConnect = async (walletName) => {
    setWalletOpen(false)
    const wallet = wallets.find((w) => w.adapter.name === walletName)
    if (wallet) {
      try {
        await select(wallet.adapter.name)
      } catch (e) {
        console.error('Failed to connect wallet:', e)
      }
    }
  }

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    setWalletOpen(false)
    disconnect()
  }

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="relative">
              <img src="/txbob-logo.png" className="h-9 w-auto" alt="txBOB" />
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-red-500/20" />
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('#') && pathname === '/') {
                    e.preventDefault()
                    handleNav(link.href)
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Connect Wallet — Desktop */}
          <div className="hidden md:flex items-center gap-3 relative">
            {connected && publicKey ? (
              <div className="relative">
                <button
                  onClick={() => setWalletOpen(!walletOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] text-gray-200 text-sm font-medium transition-all duration-200"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span>{truncateAddress(publicKey.toBase58())}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {walletOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#121212] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-xs text-gray-500 mb-1">Connected</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-200">{truncateAddress(publicKey.toBase58())}</span>
                        <button onClick={handleCopy} className="p-1 rounded hover:bg-white/[0.06] transition-colors">
                          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setWalletOpen(!walletOpen)}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-red-600/20 hover:shadow-red-500/30 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-wait"
                >
                  {connecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
                {walletOpen && !connected && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#121212] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-xs text-gray-500">Select Wallet</p>
                    </div>
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.adapter.name}
                        onClick={() => handleConnect(wallet.adapter.name)}
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

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-white/[0.04]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('#') && pathname === '/') {
                    e.preventDefault()
                    handleNav(link.href)
                  }
                }}
                className="block px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                {link.label}
              </Link>
            ))}
            {connected && publicKey ? (
              <button onClick={handleDisconnect} className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm font-medium">
                <LogOut className="w-4 h-4" />
                <span>Disconnect {truncateAddress(publicKey.toBase58())}</span>
              </button>
            ) : (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-600 px-4 mb-1">Connect Wallet</p>
                {wallets.map((wallet) => (
                  <button
                    key={wallet.adapter.name}
                    onClick={() => handleConnect(wallet.adapter.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors text-sm"
                  >
                    <img src={wallet.adapter.icon} alt="" className="w-5 h-5 rounded" />
                    <span>{wallet.adapter.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}