/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const TermsOfService = () => {
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
            <p className="text-[#0038FF] font-mono text-xs mb-2 uppercase tracking-wider">{`/// LEGAL DOCUMENTATION ///`}</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase text-[#050505] mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600 font-mono text-sm">
              Last updated: July 21, 2025
            </p>
          </div>

          {/* TOS Content */}
          <div className="bg-white border-2 border-[#050505] p-6 sm:p-8 lg:p-10">
            <p className="text-gray-700 font-mono text-sm leading-relaxed mb-8">
              {`Welcome to IronStamp, a certification‑tracking software‑as‑a‑service (the "Service") provided by IronStamp, Inc., a Massachusetts corporation ("IronStamp," "we," "us," or "our"). By accessing or using the Service in any manner, you ("Customer," "you," or "user") agree to be bound by these Terms of Service (the "Terms"). If you do not agree, do not use the Service.`}
            </p>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">01</span> Acceptance of Terms
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">Using the Service constitutes acceptance of and agreement to these Terms, our Privacy Policy, any Order Form, and all additional policies posted on our site (collectively, the "Agreement").</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">02</span> Eligibility
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">You must be at least 18 years old, capable of forming a binding contract, and not barred from using the Service under applicable law.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">03</span> Account Registration & Security
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">You must create an account and provide accurate information. You are responsible for safeguarding credentials, for all activity under your account, and for maintaining current, accurate certification data. Notify IronStamp immediately of any unauthorized use or security breach.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">04</span> Service Description
              </h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                <p className="text-gray-700 font-mono text-xs font-bold">⚠️ IMPORTANT NOTICE</p>
                <p className="text-gray-700 font-mono text-xs mt-1">IronStamp is an assistive tool—NOT a compliance service provider, legal advisor, or insurer.</p>
              </div>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">The Service assists HVAC companies in tracking employee certifications and sending reminder notifications. We may modify, suspend, or discontinue any feature at any time without liability. We do not guarantee uninterrupted availability.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">05</span> Free Trial
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">We may offer a 14‑day trial (the "Trial"). Trial access is provided "as‑is," with limited or no support. IronStamp may terminate the Trial at any time.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">06</span> Fees, Payment & Refunds
              </h2>
              
              <div className="space-y-4">
                <div className="bg-[#F8FAFC] border-l-4 border-[#0038FF] p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">6.1 Fees</h3>
                  <p className="text-gray-700 font-mono text-xs">Paid plans, usage limits, and prices are described on our website or an Order Form. Fees are billed in advance via Stripe.</p>
                </div>

                <div className="bg-[#F8FAFC] border-l-4 border-green-500 p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">6.2 Refunds</h3>
                  <ul className="text-gray-700 font-mono text-xs space-y-2">
                    <li><strong>Verified Blocking Bugs:</strong> Pro‑rata credit or refund at our discretion.</li>
                    <li><strong>Early Cancellation (First 7 Days):</strong> Full refund available.</li>
                    <li><strong>Prorated Annual Refunds:</strong> Proportional to unused months.</li>
                <li><strong>Abuse Prevention:</strong> One refund per account lifetime.</li>
              </ul>
                  <p className="text-gray-600 font-mono text-xs mt-2">Refund requests must be submitted within 30 days of the event.</p>
                </div>

                <div className="bg-[#F8FAFC] border-l-4 border-red-500 p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">6.3 Taxes & Chargebacks</h3>
                  <p className="text-gray-700 font-mono text-xs">Fees exclude taxes. Chargebacks will incur a $25 administrative fee.</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">07</span> User Responsibilities
              </h2>
              <div className="bg-red-50 border-2 border-red-200 p-4 mb-4">
                <p className="text-red-800 font-mono text-xs font-bold uppercase">⚠️ Critical Notice</p>
                <p className="text-red-700 font-mono text-xs mt-1">IronStamp is NOT a certified compliance advisor. You are solely responsible for ensuring your operations and certifications comply with applicable laws and regulations.</p>
              </div>
              <ul className="space-y-2">
                {[
                  { label: 'Accuracy', desc: 'You are solely responsible for entering, reviewing, and maintaining correct certification data.' },
                  { label: 'Compliance', desc: 'You retain full responsibility for compliance with all local, state, and federal regulations.' },
                  { label: 'Verification', desc: 'You must verify reminders and notifications; the Service is a supplemental aid only.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 font-mono text-xs">
                    <span className="bg-[#0038FF] text-white px-2 py-0.5 text-[10px] font-bold uppercase flex-shrink-0">{item.label}</span>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">08</span> Prohibited Activities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Use for unlawful purposes',
                  'Scrape or reverse engineer',
                  'Upload malware or infringing content',
                  'Interfere with network operations',
                  'Misuse support channels'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-700 font-mono text-xs border border-red-200 bg-red-50 p-2">
                    <span className="text-red-600 font-bold">✕</span>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">09</span> Data Ownership & License
              </h2>
              <div className="space-y-4">
                <div className="bg-[#050505] text-white p-4">
                  <h3 className="font-mono text-xs font-bold uppercase mb-2">9.1 Customer Data</h3>
                  <p className="font-mono text-xs opacity-80">"Customer Data" means data you upload or generate. You retain ownership. You grant IronStamp a worldwide, non‑exclusive license to host, process, transmit, and display Customer Data solely to provide the Service.</p>
                </div>
                <div className="border-2 border-[#050505] p-4">
                  <h3 className="font-mono text-xs font-bold uppercase mb-2">9.2 Aggregate Data</h3>
                  <p className="text-gray-700 font-mono text-xs">We may compile anonymized, aggregated statistics for analytics and product improvement.</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">10</span> Intellectual Property
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">IronStamp owns all intellectual‑property rights in the Service, including software, UI, logos, and documentation. Except for the limited right to use the Service, no license is granted.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">11</span> Third‑Party Services
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">The Service integrates with third‑party providers (e.g., Supabase, Resend, Stripe). IronStamp is not liable for third‑party failures, acts, or omissions. The Service may include open‑source components; use is subject to their licenses.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">12</span> Support
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">Support channels and SLAs are specified in your plan. IronStamp reserves the right to limit or deny support to abusive, disrespectful, or non‑paying users.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">13</span> Disclaimers
              </h2>
              <div className="bg-gray-100 border-2 border-gray-300 p-4">
                <p className="text-gray-800 font-mono text-xs uppercase font-bold mb-3">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE"</p>
                <p className="text-gray-700 font-mono text-xs leading-relaxed mb-3">IRONSTAMP DISCLAIMS ALL WARRANTIES—EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE—including implied warranties of merchantability, fitness for a particular purpose, accuracy, or non‑infringement.</p>
                <ul className="space-y-1 text-gray-700 font-mono text-xs">
                  <li>• We do not guarantee notifications will be sent, received, or acted upon.</li>
                  <li>• We do not guarantee the Service will prevent fines, penalties, or inspection failures.</li>
                  <li>• We do not warrant that data, dates, or calculations are error‑free.</li>
              </ul>
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">14</span> Limitation of Liability
              </h2>
              <div className="bg-[#0038FF] text-white p-4">
                <p className="font-mono text-xs uppercase leading-relaxed">TO THE MAXIMUM EXTENT PERMITTED BY LAW, IRONSTAMP'S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM. IRONSTAMP SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">15</span> Indemnification
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">Customer shall defend, indemnify, and hold harmless IronStamp from any claims arising from: (a) misuse of the Service; (b) Customer Data; (c) violation of laws; (d) disputes with third parties.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">16</span> Force Majeure
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">IronStamp is not liable for failure to perform due to events beyond reasonable control, including natural disasters, war, terrorism, strikes, power outages, or third‑party service interruptions.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">17</span> Termination
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">IronStamp may suspend or terminate access immediately for breach, illegal activity, or to protect the Service. Customer may cancel at any time. Upon termination, Customer Data may be deleted after thirty (30) days.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">18</span> Governing Law
              </h2>
              <div className="flex items-center gap-3 bg-[#F8FAFC] p-4 border-l-4 border-[#0038FF]">
                <span className="text-2xl">⚖️</span>
                <p className="text-gray-700 font-mono text-sm">These Terms are governed by the laws of the <strong>Commonwealth of Massachusetts</strong>, excluding its conflict‑of‑law rules.</p>
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">19</span> Dispute Resolution
              </h2>
              <div className="space-y-3">
                {[
                  { num: '19.1', title: 'Mandatory Arbitration', desc: 'Disputes shall be resolved by binding arbitration administered by the AAA in Boston, Massachusetts.' },
                  { num: '19.2', title: 'Opt‑Out & Exceptions', desc: 'Either party may seek injunctive relief in Massachusetts courts for IP infringement or breach of confidentiality.' },
                  { num: '19.3', title: 'Jury & Class‑Action Waiver', desc: 'Both parties waive the right to a jury trial or to participate in class actions.' },
                  { num: '19.4', title: 'Fallback to Litigation', desc: 'If arbitration is unenforceable, disputes shall be litigated in Suffolk County, Massachusetts courts.' }
                ].map((item, i) => (
                  <div key={i} className="border border-gray-200 p-3">
                    <span className="font-mono text-[10px] text-[#0038FF] font-bold">{item.num}</span>
                    <span className="font-mono text-xs font-bold text-[#050505] ml-2">{item.title}</span>
                    <p className="font-mono text-xs text-gray-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">20</span> Changes to Terms
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">IronStamp may amend these Terms by posting a revised version. Material changes become effective thirty (30) days after posting. Continued use constitutes acceptance.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">21</span> Miscellaneous
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { title: 'Entire Agreement', desc: 'This Agreement supersedes all prior agreements.' },
                  { title: 'Severability', desc: 'If any provision is unenforceable, the remainder remains in effect.' },
                  { title: 'Assignment', desc: 'Customer may not assign without consent; IronStamp may assign freely.' },
                  { title: 'Headings', desc: 'Headings are for convenience only.' }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 p-3">
                    <span className="font-mono text-xs font-bold text-[#050505] uppercase">{item.title}</span>
                    <p className="font-mono text-xs text-gray-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section>
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">22</span> Contact
              </h2>
              <div className="bg-[#0038FF] text-white p-6">
                <h3 className="font-display text-lg font-bold uppercase mb-3">IronStamp, Inc.</h3>
                <p className="font-mono text-sm">📧 <a href="mailto:ironstamp.team@gmail.com" className="underline hover:no-underline">ironstamp.team@gmail.com</a></p>
              </div>
              <p className="text-gray-600 font-mono text-xs mt-4 text-center">By continuing to use IronStamp, you acknowledge that you have read, understood, and agree to these Terms of Service.</p>
            </section>
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

export default TermsOfService 
