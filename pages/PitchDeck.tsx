import React from 'react'
import Link from 'next/link'
import { Rocket, Handshake } from 'lucide-react'

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
            {/* Slide 1: Compliance failure headline + stat */}
            <section
              id="headline"
              className="scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase text-[#050505] leading-tight">
                  When an HVAC technician's license expires in Massachusetts, it doesn't just affect the technician - it can shut down an entire business.
                </h1>
                <div className="pt-8 border-t-2 border-[#050505]">
                  <div className="text-6xl md:text-8xl font-bold text-[#0038FF] mb-3">$7,000</div>
                  <div className="text-xl md:text-2xl font-bold text-gray-700 font-mono">
                    Per instance found during audit
                  </div>
                </div>
                <p className="text-base md:text-lg text-gray-700 font-mono pt-2">
                  My name is <span className="font-bold text-[#050505]">Riyad Scally</span>, and I'm building{' '}
                  <span className="font-bold text-[#050505]">IronStamp</span> to solve this compliance risk.
                </p>
              </div>
            </section>

            {/* Slide 2: Problem bullets */}
            <section
              id="problem"
              className="scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-[#050505]">
                  The Problem
                </h2>
                <p className="text-base md:text-lg text-gray-700 font-mono">
                  HVAC companies manage teams of <span className="font-bold">5 to 50 technicians</span>, and every technician must maintain active state licenses to legally work. If even one license expires, business owners face:
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-700 font-mono list-none">
                  <li className="flex items-start gap-3">
                    <span className="text-[#0038FF] font-bold mt-1">•</span>
                    <span>Fines up to <span className="font-bold">$7,000 per instance found during audit</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#0038FF] font-bold mt-1">•</span>
                    <span>Denied insurance claims</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#0038FF] font-bold mt-1">•</span>
                    <span>Job sites shut down instantly</span>
                  </li>
                </ul>
                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-base md:text-lg text-gray-700 font-mono font-bold mb-3">Right now, companies rely on broken systems:</p>
                  <ul className="space-y-2 text-sm md:text-base text-gray-600 font-mono list-none">
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold mt-1">•</span>
                      <span>State reminders go only to technicians, not owners</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold mt-1">•</span>
                      <span>Spreadsheets become outdated instantly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold mt-1">•</span>
                      <span>Physical license cards can be lost or expired without warning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Slide 3: IronStamp dashboard screenshot */}
            <section
              id="solution"
              className="scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <div className="max-w-5xl mx-auto space-y-6">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-[#050505]">
                  The Solution: IronStamp
                </h2>
                <p className="text-base md:text-lg text-gray-700 font-mono">
                  IronStamp centralizes all technician licenses into one dashboard and actively monitors expiration dates and compliance requirements. Instead of reacting to violations, owners get proactive alerts and audit-ready verification tools.
                </p>
                <div className="mt-8 border-2 border-[#050505] overflow-hidden">
                  <div className="bg-[#050505] px-4 py-2 border-b-2 border-[#050505]">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white">
                      Live MVP Dashboard
                    </p>
                  </div>
                  <img
                    src="/Dashboardv2.png"
                    alt="IronStamp dashboard"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </section>

            {/* Slide 4: MVP + timeline */}
            <section
              id="traction"
              className="scroll-mt-24 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-[#050505]">
                  MVP & Timeline
                </h2>
                <p className="text-base md:text-lg text-gray-700 font-mono">
                  We currently have a <span className="font-bold">live MVP</span> and are preparing for launch while validating the market directly with HVAC business owners.
                </p>
                <div className="grid md:grid-cols-3 gap-4 pt-4">
                  <div className="border-2 border-[#050505] p-4 bg-[#0038FF]/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-[#0038FF]" />
                      <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#050505]">
                        Today · 2026
                      </p>
                    </div>
                    <p className="text-sm font-mono text-gray-700">
                      Live MVP with full onboarding, dashboard, and notifications
                    </p>
                  </div>
                  <div className="border-2 border-[#050505] p-4 bg-[#10B981]/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                      <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#050505]">
                        Next 3–6 Months
                      </p>
                    </div>
                    <p className="text-sm font-mono text-gray-700">
                      Design partners, refine licensing rules, prove retention
                    </p>
                  </div>
                  <div className="border-2 border-[#050505] p-4 bg-[#FBBF24]/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-[#FBBF24]" />
                      <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#050505]">
                        Next 6–12 Months
                      </p>
                    </div>
                    <p className="text-sm font-mono text-gray-700">
                      Scale, expand beyond MA, formalize partnerships
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-sm md:text-base text-gray-600 font-mono">
                    I'm building this because I focus on regulatory-driven SaaS solutions and am developing IronStamp while studying entrepreneurship at <span className="font-bold">Babson College</span>, giving me access to strong startup mentorship and operator networks.
                  </p>
                </div>
              </div>
            </section>

            {/* Slide 5: eTower + vision */}
            <section
              id="etower"
              className="scroll-mt-24 bg-white border-2 border-[#0038FF] shadow-[8px_8px_0px_#0038FF] p-8 md:p-12"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Handshake className="w-6 h-6 text-[#0038FF]" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-[#050505]">
                    How eTower Helps
                  </h2>
                </div>
                <p className="text-base md:text-lg text-gray-700 font-mono">
                  eTower would help accelerate IronStamp through mentorship, go-to-market strategy, and founder network support as we prepare for market entry.
                </p>
                <div className="pt-6 border-t-2 border-[#050505]">
                  <p className="text-xl md:text-2xl font-display font-bold text-[#050505] mb-4">
                    IronStamp's goal is simple:
                  </p>
                  <p className="text-2xl md:text-3xl font-display font-bold text-[#0038FF] uppercase">
                    Prevent compliance failures before they become business-ending problems.
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
