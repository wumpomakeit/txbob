import { Link } from 'react-router-dom'
import { Globe, Code2, MessageCircle, ArrowUpRight } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Matches', href: '/matches' },
    { label: 'Markets', href: '#markets' },
    { label: 'SDK', href: '#sdk' },
    { label: 'How It Works', href: '#how-it-works' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'SDK (Python)', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Risk Disclaimer', href: '#' },
  ],
}

const socials = [
  { icon: <Globe className="w-5 h-5" />, label: 'Twitter', href: '#' },
  { icon: <Code2 className="w-5 h-5" />, label: 'GitHub', href: '#' },
  { icon: <MessageCircle className="w-5 h-5" />, label: 'Discord', href: '#' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#060606]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <img src="/txbob-logo.png" className="h-8 w-auto" alt="txBOB" />
            </Link>
            <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
              Autonomous prediction markets for World Cup 2026. Trade micro-markets, settle on-chain, deploy AI agents.
            </p>

            {/* Built on Solana badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-green-400" />
              <span className="text-xs font-medium text-gray-400">Built on <span className="text-white">Solana</span></span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.href}
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 group"
                    >
                      {l.label}
                      {l.href.startsWith('http') && (
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} txBOB. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/[0.03] transition-all"
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}