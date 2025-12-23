/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const PrivacyPolicy = () => {
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
              Privacy Policy
            </h1>
            <p className="text-gray-600 font-mono text-sm">
              Last updated: July 17, 2025
            </p>
          </div>

          {/* Policy Content */}
          <div className="bg-white border-2 border-[#050505] p-6 sm:p-8 lg:p-10">
            <p className="text-gray-700 font-mono text-sm leading-relaxed mb-8">
              {`IronStamp ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SaaS platform, IronStamp, and related services. IronStamp is registered in Massachusetts and complies with applicable state and federal privacy laws.`}
            </p>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">01</span> Information We Collect
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">We collect the following types of information:</p>
              
              <div className="space-y-4">
                <div className="bg-[#F8FAFC] border-l-4 border-[#0038FF] p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">A. Account and Profile Information</h3>
                  <ul className="list-disc list-inside text-gray-700 font-mono text-xs space-y-1">
                <li>Name, email address, and password (for account creation and authentication)</li>
                <li>Company name, license number, business address, phone number, business email, team size, business focus</li>
                <li>Notification preferences and designated notification email addresses</li>
              </ul>
                </div>

                <div className="bg-[#F8FAFC] border-l-4 border-[#0038FF] p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">B. Team and Employee Information</h3>
                  <ul className="list-disc list-inside text-gray-700 font-mono text-xs space-y-1">
                <li>Team member names, email addresses, and roles</li>
                <li>Employee names and email addresses (for certification tracking)</li>
              </ul>
                </div>

                <div className="bg-[#F8FAFC] border-l-4 border-[#0038FF] p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">C. Certification and Document Data</h3>
                  <ul className="list-disc list-inside text-gray-700 font-mono text-xs space-y-1">
                <li>Certification names, numbers, issue and expiration dates</li>
                <li>Uploaded files (PDFs, images, documents) and associated metadata (file name, size, type)</li>
              </ul>
                </div>

                <div className="bg-[#F8FAFC] border-l-4 border-[#0038FF] p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">D. Technical and Usage Data</h3>
                  <ul className="list-disc list-inside text-gray-700 font-mono text-xs space-y-1">
                <li>IP address (for security and rate limiting)</li>
                <li>Device/browser information (for troubleshooting and security)</li>
                <li>Session data (cookies or localStorage used for authentication)</li>
              </ul>
                </div>

                <div className="bg-[#F8FAFC] border-l-4 border-[#0038FF] p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">E. Communications</h3>
                  <ul className="list-disc list-inside text-gray-700 font-mono text-xs space-y-1">
                <li>Emails, reminders, and notifications sent to you or your team</li>
              </ul>
                </div>
              </div>

              <p className="text-gray-700 font-mono text-sm mt-4 font-bold">We do NOT knowingly collect information from children under 13.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">02</span> How We Use Your Information
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">We use your information to:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Create and manage your account',
                  'Authenticate users and teams',
                  'Onboard users and organizations',
                  'Track certifications and compliance',
                  'Generate and store documents',
                  'Send notifications and reminders',
                  'Provide customer support',
                  'Improve and secure our services',
                  'Comply with legal obligations'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                    <span className="w-1.5 h-1.5 bg-[#0038FF]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">02A</span> Legal Basis (EEA Users)
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">If you are located in the European Economic Area (EEA), we process your personal information on the following legal bases:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Consent', desc: 'For marketing communications' },
                  { title: 'Contract', desc: 'To deliver IronStamp services' },
                  { title: 'Legitimate Interest', desc: 'Product improvement, fraud prevention' },
                  { title: 'Legal Obligation', desc: 'Tax and regulatory compliance' }
                ].map((item, i) => (
                  <div key={i} className="border border-gray-200 p-3">
                    <span className="font-mono text-xs font-bold text-[#0038FF] uppercase">{item.title}</span>
                    <p className="font-mono text-xs text-gray-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">03</span> How We Share Your Information
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4 font-bold">We do NOT sell your personal information.</p>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">We may share it with:</p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">Service Providers</h3>
                  <p className="text-gray-700 font-mono text-xs">Including Supabase (database, auth, storage), Resend (email delivery), Stripe (billing), and other subprocessors strictly required to operate IronStamp.</p>
                </div>
                <div className="border-l-4 border-red-500 bg-red-50 p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">Legal Authorities</h3>
                  <p className="text-gray-700 font-mono text-xs">When required to comply with legal obligations, court orders, or government requests.</p>
                </div>
                <div className="border-l-4 border-gray-500 bg-gray-50 p-4">
                  <h3 className="font-mono text-xs font-bold text-[#050505] uppercase mb-2">Business Transfers</h3>
                  <p className="text-gray-700 font-mono text-xs">In the event of a merger, acquisition, restructuring, or sale of all or part of our assets.</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">04</span> Cookies & Tracking
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">We use cookies and localStorage to:</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                  <span className="w-1.5 h-1.5 bg-[#0038FF]" /> Maintain your authentication session
                </li>
                <li className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                  <span className="w-1.5 h-1.5 bg-[#0038FF]" /> Store user preferences
                </li>
              </ul>
              <p className="text-gray-700 font-mono text-sm font-bold">We do NOT use third-party advertising or analytics cookies.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">05</span> Data Security
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">We implement technical and organizational safeguards:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: '🔐', text: 'AES-256 encryption in transit and at rest' },
                  { icon: '👤', text: 'Role-based access controls' },
                  { icon: '📊', text: 'Regular monitoring and backups' }
                ].map((item, i) => (
                  <div key={i} className="bg-[#050505] text-white p-4 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="font-mono text-xs">{item.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 font-mono text-xs mt-4">As required by Massachusetts law (201 CMR 17.00), we maintain a Written Information Security Program (WISP) to safeguard personal information of Massachusetts residents.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">06</span> Data Retention
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">We retain your information as long as your account is active or as needed to deliver our services. You may:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                  <span className="w-1.5 h-1.5 bg-[#0038FF]" /> Close your account at any time
                </li>
                <li className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                  <span className="w-1.5 h-1.5 bg-[#0038FF]" /> Request deletion of your personal data
                </li>
              </ul>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">07</span> Your Rights
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">You have the right to:</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['Access', 'Correct', 'Delete', 'Export', 'Opt-out'].map((right, i) => (
                  <div key={i} className="border-2 border-[#050505] p-3 text-center hover:bg-[#0038FF] hover:text-white hover:border-[#0038FF] transition-colors">
                    <span className="font-mono text-xs font-bold uppercase">{right}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 font-mono text-xs mt-4">To exercise your rights, contact us at the address below.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">08</span> Children's Privacy
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">IronStamp is not intended for children under 13. We do not knowingly collect data from individuals under 13 years of age. If we become aware that such data has been collected, we will delete it promptly.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">09</span> Policy Changes
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">We may update this Privacy Policy from time to time. Material changes will be posted on our website, and the "Last updated" date above will be revised. We encourage you to review this policy regularly.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">10</span> International Transfers
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed">If you use IronStamp from outside the United States, your information may be transferred to and processed in the U.S. We take steps to ensure appropriate safeguards are in place for such transfers in accordance with applicable law.</p>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">11</span> California Residents (CCPA)
              </h2>
              <p className="text-gray-700 font-mono text-sm leading-relaxed mb-4">If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA):</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                  <span className="w-1.5 h-1.5 bg-[#0038FF]" /> Right to know what data we collect
                </li>
                <li className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                  <span className="w-1.5 h-1.5 bg-[#0038FF]" /> Right to request deletion
                </li>
                <li className="flex items-center gap-2 text-gray-700 font-mono text-xs">
                  <span className="w-1.5 h-1.5 bg-[#0038FF]" /> Right to opt out of data sale (we do not sell data)
                </li>
              </ul>
            </section>

            <div className="h-px bg-gray-200 my-8" />

            <section>
              <h2 className="font-display text-2xl font-bold text-[#050505] uppercase mb-4 flex items-center gap-2">
                <span className="text-[#0038FF]">12</span> Contact Us
              </h2>
              <div className="bg-[#0038FF] text-white p-6">
                <h3 className="font-display text-lg font-bold uppercase mb-3">IronStamp Privacy Team</h3>
                <p className="font-mono text-sm mb-2">IronStamp®</p>
                <p className="font-mono text-sm">📧 <a href="mailto:ironstamp.team@gmail.com" className="underline hover:no-underline">ironstamp.team@gmail.com</a></p>
              </div>
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

export default PrivacyPolicy 
