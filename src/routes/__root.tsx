import { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { Link, Outlet, useMatches } from '@tanstack/react-router'
import { Star } from 'lucide-react'

import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'OmniBid',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/logo5.png',
        type: 'image/png',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const matches = useMatches()
  const isHome = matches[matches.length - 1]?.fullPath === '/'

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-200 flex flex-col">
          {/* Top Banner - Flag stripe */}
          <div className="h-2 bg-gradient-to-r from-red-600 via-red-600 to-red-600" />

          {/* Nav */}
          <nav className="border-b border-slate-200 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/">
                  <img src="/logo5.png" alt="OmniBid logo" className="h-14 w-14 object-contain" />
                </Link>
                <div>
                  <Link to="/" className="font-extrabold text-xl tracking-tight text-blue-900 hover:text-blue-800 transition-colors">OmniBid</Link>
                  <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-slate-400 ml-2">Federal Proposal Platform</span>
                </div>
              </div>
              {isHome ? (
                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                  <a href="#mission" className="hover:text-blue-900 transition-colors">Our Mission</a>
                  <a href="#platform" className="hover:text-blue-900 transition-colors">Platform</a>
                  <a href="#impact" className="hover:text-blue-900 transition-colors">Impact</a>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <Link to="/proposals" className="text-sm font-semibold text-slate-500 hover:text-blue-900 transition-colors hidden sm:block">Proposals</Link>
                <Link to="/proposals/new" className="bg-blue-900 text-white px-5 py-2 text-sm font-bold hover:bg-blue-800 transition-colors">
                  New Proposal
                </Link>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-white py-10 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="font-bold tracking-tight">OmniBid</span>
              </div>
              <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} OmniBid. All rights reserved. Made in the U.S.A.</p>
            </div>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
