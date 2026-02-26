import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Star, Shield, FileCheck, Users, BarChart3, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/')({ component: PatrioticHome })

function PatrioticHome() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-200">
      {/* Top Banner - Flag stripe */}
      <div className="h-2 bg-gradient-to-r from-red-600 via-red-600 to-red-600" />

      {/* Nav */}
      <nav className="border-b border-slate-200 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo5.png" alt="OmniBid logo" className="h-14 w-14 object-contain" />
            <div>
              <span className="font-extrabold text-xl tracking-tight text-blue-900">OmniBid</span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-slate-400 ml-2">Federal Proposal Platform</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#mission" className="hover:text-blue-900 transition-colors">Our Mission</a>
            <a href="#platform" className="hover:text-blue-900 transition-colors">Platform</a>
            <a href="#impact" className="hover:text-blue-900 transition-colors">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-slate-500 hover:text-blue-900 transition-colors hidden sm:block">Log In</button>
            <button className="bg-blue-900 text-white px-5 py-2 text-sm font-bold hover:bg-blue-800 transition-colors">
              Request Access
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero with flag motif */}
        <section className="relative overflow-hidden">
          {/* Background: subtle flag stripes */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 13 }).map((_, i) => (
              <div
                key={i}
                className={`h-[7.69%] ${i % 2 === 0 ? 'bg-red-600/[0.03]' : 'bg-transparent'}`}
              />
            ))}
          </div>
          {/* Blue canton */}
          <div className="absolute top-0 left-0 w-[40%] max-w-md h-[55%] bg-blue-900/[0.03] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-20 sm:pt-32 pb-20 sm:pb-28">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-blue-900 fill-blue-900" />
                  ))}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-900">Serving Those Who Serve</span>
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8">
                <span className="text-blue-900">Empowering American businesses</span>
                <br />
                <span className="text-red-700">to win federal contracts.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
                The U.S. Government spends over $700 billion annually on private contracts, but the proposal process shuts out
                thousands of qualified small businesses. OmniBid reduces proposal creation from 4 weeks to 4 hours — opening
                the federal market to the companies that built this country.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-red-700 text-white font-bold text-lg hover:bg-red-600 transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-red-700/20">
                  Book a Demo
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 bg-blue-900 text-white font-bold text-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
                  Explore Platform
                </button>
              </div>
            </div>
          </div>

          {/* Decorative bottom border: red-white-blue */}
          <div className="flex h-1.5">
            <div className="flex-1 bg-red-700" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-blue-900" />
          </div>
        </section>

        {/* Mission Statement */}
        <section id="mission" className="bg-blue-900 text-white py-16 sm:py-20 relative overflow-hidden">
          {/* Stars pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="grid grid-cols-12 gap-8 p-8">
              {Array.from({ length: 48 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-white" />
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-8 relative text-center">
            <Shield className="w-12 h-12 mx-auto mb-6 text-white/60" />
            <h2 className="text-3xl sm:text-4xl font-black mb-6 tracking-tight">
              40% of federal solicitations don't receive 3 qualified bids.
            </h2>
            <p className="text-lg text-blue-200 max-w-3xl mx-auto leading-relaxed mb-10">
              The government is desperate for competition. The barrier isn't that American businesses
              can't do the work — it's that the proposal process costs $20,000 to $80,000 and takes
              a month of manual labor. We're removing that barrier so every qualified company gets a fair shot.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { val: '$700B+', label: 'Annual federal procurement' },
                { val: '400,000', label: 'SAM.gov registered entities' },
                { val: '$178B+', label: 'Awarded to small businesses' },
                { val: '4.5', label: 'Average bids per solicitation' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/10 p-5">
                  <div className="text-2xl sm:text-3xl font-black mb-1">{stat.val}</div>
                  <div className="text-blue-300 text-xs uppercase tracking-wider font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it serves - features */}
        <section id="platform" className="py-16 sm:py-24 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-red-700 fill-red-700" />
                ))}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-blue-900 mb-4 tracking-tight">A platform built for the mission</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                OmniBid doesn't just speed up proposals. It levels the playing field between
                small businesses and billion-dollar primes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-slate-200">
              {[
                {
                  icon: <FileCheck className="w-6 h-6" />,
                  title: 'Instant Compliance Matrix',
                  desc: 'Paste a SAM.gov link. Every "shall" statement from a 200-page RFP extracted into a structured checklist. 30 hours of work in 10 minutes.',
                },
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: 'Continuous Compliance',
                  desc: 'Real-time scoring against Section M evaluation criteria. Delete a mandatory requirement and the warning appears before your next keystroke.',
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: 'Multiplayer War Room',
                  desc: 'Your entire proposal team in one real-time workspace. Technical writers, pricing analysts, and reviewers see each other\'s edits live.',
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: 'Company Knowledge Base',
                  desc: 'Past proposals, resumes, and capability statements ingested into a private knowledge graph. Agents write using your actual proof — not filler.',
                },
                {
                  icon: <Star className="w-6 h-6" />,
                  title: 'Multi-Agent Generation',
                  desc: 'Five specialized agents produce Technical, Management, Past Performance, Cost, and Graphics volumes simultaneously — all cross-referenced.',
                },
                {
                  icon: <CheckCircle className="w-6 h-6" />,
                  title: 'One-Click Submission',
                  desc: 'Export to the exact format the RFP requires. Font sizes, margins, page limits, file naming — all pre-validated. No white-glove panic.',
                },
              ].map((feat, i) => (
                <div key={i} className="p-8 border-b border-r border-slate-200 hover:bg-blue-50/50 transition-colors group">
                  <div className="w-11 h-11 bg-blue-900 text-white flex items-center justify-center mb-5 group-hover:bg-red-700 transition-colors">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">{feat.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Process Timeline */}
        <section className="bg-slate-50 border-y border-slate-200 py-16 sm:py-24 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-blue-900 tracking-tight mb-4">From RFP to ready in hours</h2>
              <p className="text-slate-500 text-lg">The same quality. A fraction of the time and cost.</p>
            </div>
            <div className="space-y-0">
              {[
                { phase: 'Bid/No-Bid Analysis', before: '8-15 hours of reading', after: '5 minutes with AI fit scoring' },
                { phase: 'Compliance Matrix', before: '15-30 hours, error-prone', after: '10 minutes, near-zero errors' },
                { phase: 'First Draft', before: '200-400 person-hours across 2-3 weeks', after: '30-60 min generation + human review' },
                { phase: 'Review Cycles', before: '40-80 person-hours over days', after: '4-8 hours of real-time collaboration' },
                { phase: 'Production & Submit', before: '10-20 hours of formatting', after: '15 minutes, one-click export' },
              ].map((row, i) => (
                <div key={i} className="grid md:grid-cols-3 border-b border-slate-200 last:border-0">
                  <div className="p-5 font-bold text-blue-900 border-r border-slate-200 flex items-center">
                    <span className="w-7 h-7 bg-blue-900 text-white text-xs font-black flex items-center justify-center mr-3 shrink-0">{i + 1}</span>
                    {row.phase}
                  </div>
                  <div className="p-5 text-red-700/70 text-sm border-r border-slate-200 flex items-center line-through decoration-red-300">
                    {row.before}
                  </div>
                  <div className="p-5 text-blue-900 text-sm font-semibold flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 shrink-0" />
                    {row.after}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid sm:grid-cols-3 gap-6 text-center">
              <div className="bg-white border border-slate-200 p-6">
                <div className="text-3xl font-black text-red-700 mb-1">80-90%</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Time Saved</div>
              </div>
              <div className="bg-white border border-slate-200 p-6">
                <div className="text-3xl font-black text-blue-900 mb-1">85-94%</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Cost Reduction</div>
              </div>
              <div className="bg-white border border-slate-200 p-6">
                <div className="text-3xl font-black text-blue-900 mb-1">Near Zero</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Compliance Risk</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who we serve */}
        <section id="impact" className="py-16 sm:py-24 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-blue-900 tracking-tight mb-4">Built for those who build America</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { group: '8(a) Small Businesses', desc: 'Set-aside advantages, but no proposal team. OmniBid is your proposal team.' },
                { group: 'SDVOSBs', desc: 'Veteran-owned businesses that served the country and deserve to serve it again through contracts.' },
                { group: 'Mid-Market Contractors', desc: '$10M-$100M firms that want to bid on 3x more contracts without 3x the headcount.' },
                { group: 'GovCon Consultants', desc: 'Solo consultants who can now handle 15-25 clients per year instead of 4-6.' },
              ].map((seg, i) => (
                <div key={i} className="border-t-4 border-red-700 bg-white shadow-sm p-6">
                  <h3 className="font-bold text-blue-900 mb-2">{seg.group}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{seg.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA with flag aesthetic */}
        <section className="relative overflow-hidden">
          {/* Red-white stripes background */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 13 }).map((_, i) => (
              <div
                key={i}
                className={`h-[7.69%] ${i % 2 === 0 ? 'bg-red-700' : 'bg-white'}`}
              />
            ))}
          </div>
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-blue-900/95 pointer-events-none" />

          <div className="relative py-16 sm:py-24 px-4 sm:px-8 text-center text-white">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-white text-white" />
              ))}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight max-w-3xl mx-auto">
              Every qualified American business deserves a shot at a federal contract.
            </h2>
            <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">
              The $700 billion federal market shouldn't be gated by a $30,000 paperwork tax.
              OmniBid puts the power of a full proposal team into every contractor's hands.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-red-700 text-white font-bold text-lg hover:bg-red-600 transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-red-900/30">
                Start Winning
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white text-blue-900 font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg">
                Talk to Our Team
              </button>
            </div>
          </div>

          {/* Bottom tricolor */}
          <div className="relative flex h-1.5">
            <div className="flex-1 bg-red-700" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-blue-900" />
          </div>
        </section>
      </main>

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
  )
}
