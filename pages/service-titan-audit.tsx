/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const ServiceTitanAudit = () => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] font-mono">
      {/* Header */}
      <header className="bg-[#050505] text-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
          
          <div className="flex items-center gap-3">
            <img 
              src="/IronStampLogov3.png" 
              alt="IronStamp" 
              className="h-8 w-auto brightness-0 invert" 
            />
            <span className="font-display font-bold text-xl tracking-tighter hidden sm:inline">IRONSTAMP</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="bg-tech-grid min-h-[calc(100vh-64px)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Title Card */}
          <div className="bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-6 sm:p-8 mb-8">
            <p className="text-[#0038FF] font-mono text-xs mb-2 uppercase tracking-wider">{`/// STRATEGIC ANALYSIS ///`}</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase text-[#050505] mb-4">
              ServiceTitan Critical Fracture Point Audit
            </h1>
          </div>

          {/* Content */}
          <div className="bg-white border-2 border-[#050505] p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <p className="text-gray-700 font-mono text-sm leading-relaxed">
                ServiceTitan functions as the operational nervous system for HVAC and trade SMBs, centralizing dispatch, billing, payroll signals, compliance-adjacent documentation, and cash-flow timing into a single source of operational truth. In practice, it becomes the platform through which work is authorized, revenue is recognized, and labor is deployed, creating a de facto dependency where operational activity is assumed to be structurally sound if it executes cleanly inside the system.
              </p>

              <p className="text-gray-700 font-mono text-sm leading-relaxed">
                The load-bearing assumption underlying this architecture is that centralization of operational and credential data implicitly reduces regulatory and audit risk for the contractor. Contractors behave as though visibility equals validity, and that a well-instrumented operation is therefore an audit-resilient one.
              </p>

              <p className="text-gray-700 font-mono text-sm leading-relaxed">
                In reality, ServiceTitan does not own, validate, or enforce regulatory state. Licensing status, jurisdictional authorization, continuing education, bonding, and insurance coverage remain external, asynchronous, and human-maintained systems of record. This creates a false equilibrium in which uninterrupted operational execution masks latent non-compliance. The fracture occurs not during day-to-day operations, but at the moment of audit, incident, claim, or regulatory inquiry. At that point, a single expired license, lapsed certification, or jurisdictional mismatch can trigger immediate operational arrest: automatic insurance voidance, retroactive denial of coverage on active claims, freeze of receivables, suspension of permitted work, and exposure to statutory penalties or treble damages in consumer litigation. These consequences materialize regardless of flawless execution within ServiceTitan software itself.
              </p>

              <p className="text-gray-700 font-mono text-sm leading-relaxed">
                The critical insight is that operational excellence inside the platform does not mitigate regulatory failure; it accelerates the blast radius when that failure is discovered. This creates a strategic opening for a meta-layer that governs regulatory state as a first-class operational dependency rather than a peripheral administrative task. Control of that layer does not compete with ServiceTitan's workflow; it governs the conditions under which that workflow is legally survivable. The asymmetry is decisive: if ServiceTitan were removed tomorrow but regulatory state remained intact, firms would experience disruption yet continue operating; if regulatory state failed while ServiceTitan remained intact, firms would cease to exist overnight.
              </p>
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-block bg-[#050505] text-white px-8 py-4 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] hover:shadow-[4px_4px_0px_#050505]"
            >
              Back to IronStamp
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] text-white py-6 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-mono text-xs text-gray-500">© 2025 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
        </div>
      </footer>
    </div>
  )
}

export default ServiceTitanAudit

