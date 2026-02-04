import React from 'react'
import Link from 'next/link'
import { Rocket, Handshake, GraduationCap, Target, Network } from 'lucide-react'

export default function PitchDeck() {
  return (
    <div className="font-mono bg-[#F8FAFC] text-[#050505] min-h-screen">
      {/* Top Nav */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-[#0038FF]/10 bg-[#F8FAFC]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
            <span className="font-display text-lg font-bold tracking-tight md:text-xl text-[#050505]">
              IRONSTAMP
            </span>
          </div>

          <div className="hidden items-center gap-4 text-xs md:flex">
            <Link
              href="/DashboardV2"
              className="rounded-full border border-[#0038FF] bg-[#0038FF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#0038FF]/90 transition-colors"
            >
              View Product
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-tech-grid pt-20 pb-16 md:pt-24 md:pb-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <main className="space-y-12 md:space-y-16">
            {/* Slide 1: The Hook — headline + stat only */}
            <section
              id="headline"
              className="relative scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <span className="absolute top-3 left-3 text-xs font-mono font-bold text-gray-400" aria-hidden>1</span>
              <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase text-[#050505] leading-tight">
                  ONE EXPIRED LICENSE CAN SHUT DOWN AN ENTIRE BUSINESS.
                </h1>
                <div className="pt-8 border-t-2 border-[#050505]">
                  <div className="text-6xl md:text-8xl font-bold text-[#0038FF]">$7,000</div>
                </div>
              </div>
            </section>

            {/* Slide 2: The Problem — three labels + chaos visual */}
            <section
              id="problem"
              className="relative scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <span className="absolute top-3 left-3 text-xs font-mono font-bold text-gray-400" aria-hidden>2</span>
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-wrap gap-6 md:gap-10 justify-center">
                  <span className="font-display text-xl md:text-2xl font-bold uppercase text-[#050505] border-2 border-[#050505] px-4 py-2 bg-[#0038FF]/10">
                    $7,000 Fines
                  </span>
                  <span className="font-display text-xl md:text-2xl font-bold uppercase text-[#050505] border-2 border-[#050505] px-4 py-2 bg-[#0038FF]/10">
                    Denied Claims
                  </span>
                  <span className="font-display text-xl md:text-2xl font-bold uppercase text-[#050505] border-2 border-[#050505] px-4 py-2 bg-[#0038FF]/10">
                    Instant Shutdowns
                  </span>
                </div>
                <div className="relative overflow-hidden border-2 border-[#050505]">
                  <img
                    src="/Nightmare.png"
                    alt="Chaos of the current broken system"
                    className="w-full h-auto object-cover object-center"
                  />
                </div>
              </div>
            </section>

            {/* Slide 3: The Solution — UI only, no copy */}
            <section
              id="solution"
              className="relative scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <span className="absolute top-3 left-3 text-xs font-mono font-bold text-gray-400" aria-hidden>3</span>
              <div className="max-w-5xl mx-auto">
                <div className="border-2 border-[#050505] overflow-hidden">
                  <img
                    src="/Dashboardv2.png"
                    alt="IronStamp dashboard — see how easy it is to spot a problem"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </section>

            {/* Slide 4: Traction & Founder — timeline + Babson logo */}
            <section
              id="traction"
              className="relative scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <span className="absolute top-3 left-3 text-xs font-mono font-bold text-gray-400" aria-hidden>4</span>
              <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
                  <div className="flex-1">
                    <h2 className="font-display text-xl md:text-2xl font-bold uppercase text-[#050505] mb-6">
                      Traction
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="flex items-center gap-3 border-2 border-[#050505] px-4 py-3 bg-[#0038FF]/10 flex-1">
                        <Rocket className="w-5 h-5 text-[#0038FF] shrink-0" />
                        <div>
                          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-gray-500">Now</p>
                          <p className="font-display font-bold text-[#050505]">MVP LIVE</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-2 border-[#050505] px-4 py-3 bg-[#10B981]/10 flex-1">
                        <Rocket className="w-5 h-5 text-[#10B981] shrink-0" />
                        <div>
                          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-gray-500">Q2</p>
                          <p className="font-display font-bold text-[#050505]">Market Validation</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-2 border-[#050505] px-4 py-3 bg-[#FBBF24]/10 flex-1">
                        <Rocket className="w-5 h-5 text-[#FBBF24] shrink-0" />
                        <div>
                          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-gray-500">Q3</p>
                          <p className="font-display font-bold text-[#050505]">Scale</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-2">
                    <h2 className="font-display text-xl md:text-2xl font-bold uppercase text-[#050505]">
                      Founder
                    </h2>
                    <img
                      src="/Babson-College-2C.jpg"
                      alt="Babson College"
                      className="h-16 md:h-20 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Slide 5: eTower + vision */}
            <section
              id="etower"
              className="relative scroll-mt-24 bg-white border-2 border-[#0038FF] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <span className="absolute top-3 left-3 text-xs font-mono font-bold text-gray-400" aria-hidden>5</span>
              <div className="max-w-4xl mx-auto space-y-10">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Handshake className="w-6 h-6 text-[#0038FF]" />
                    <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-[#050505]">
                      How eTower Helps
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-4 md:gap-6">
                    <div className="flex items-center gap-2 border-2 border-[#050505] px-4 py-3 bg-[#0038FF]/10">
                      <GraduationCap className="w-5 h-5 text-[#0038FF] shrink-0" />
                      <span className="font-display font-bold uppercase text-[#050505]">Mentorship</span>
                    </div>
                    <div className="flex items-center gap-2 border-2 border-[#050505] px-4 py-3 bg-[#0038FF]/10">
                      <Target className="w-5 h-5 text-[#0038FF] shrink-0" />
                      <span className="font-display font-bold uppercase text-[#050505]">GTM Strategy</span>
                    </div>
                    <div className="flex items-center gap-2 border-2 border-[#050505] px-4 py-3 bg-[#0038FF]/10">
                      <Network className="w-5 h-5 text-[#0038FF] shrink-0" />
                      <span className="font-display font-bold uppercase text-[#050505]">Founder Network</span>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t-2 border-[#050505] text-center space-y-4">
                  <p className="text-sm md:text-base font-mono font-bold uppercase tracking-[0.2em] text-gray-500">
                    The IronStamp Vision
                  </p>
                  <p className="text-2xl md:text-4xl font-display font-bold text-[#0038FF] uppercase leading-tight max-w-3xl mx-auto">
                    Preventing compliance failures before they become business-ending problems.
                  </p>
                </div>
                <div className="pt-6 text-center">
                  <p className="text-base md:text-lg font-mono text-gray-600">
                    Thank you.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
