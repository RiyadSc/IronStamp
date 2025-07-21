import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <img 
              src="/IronStampLogov3.png" 
              alt="IronStamp" 
              className="w-8 h-8" 
            />
            <span className="text-lg font-bold text-gray-900">IronStamp</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-12">
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Last updated: July 21, 2025
            </p>
          </div>

          {/* TOS Content */}
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-8">
              Welcome to IronStamp, a certification‑tracking software‑as‑a‑service (the “Service”) provided by IronStamp, Inc., a Massachusetts corporation (“IronStamp,” “we,” “us,” or “our”). By accessing or using the Service in any manner, you (“Customer,” “you,” or “user”) agree to be bound by these Terms of Service (the “Terms”). If you do not agree, do not use the Service.
            </p>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p>Using the Service constitutes acceptance of and agreement to these Terms, our Privacy Policy, any Order Form, and all additional policies posted on our site (collectively, the “Agreement”).</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
              <p>You must be at least 18 years old, capable of forming a binding contract, and not barred from using the Service under applicable law.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration & Security</h2>
              <p>You must create an account and provide accurate information. You are responsible for safeguarding credentials, for all activity under your account, and for maintaining current, accurate certification data. Notify IronStamp immediately of any unauthorized use or security breach.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Service Description; Modifications; Availability</h2>
              <p>The Service assists HVAC companies in tracking employee certifications and sending reminder notifications. IronStamp is an assistive tool—not a compliance service provider, legal advisor, or insurer. We may modify, suspend, or discontinue any feature at any time without liability. We do not guarantee uninterrupted availability.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Free Trial</h2>
              <p>We may offer a 14‑day trial (the “Trial”). Trial access is provided “as‑is,” with limited or no support. IronStamp may terminate the Trial at any time.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Fees, Payment & Refund Policy</h2>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6.1 Fees</h3>
              <p>Paid plans, usage limits, and prices are described on our website or an Order Form. Fees are billed in advance via Stripe.</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6.2 Refunds</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Verified Blocking Bugs:</strong> If system logs confirm a bug preventing core usage and no workaround exists, we will provide a pro‑rata credit or refund at our discretion.</li>
                <li><strong>Early Cancellation (First 7 Days):</strong> Customers who cancel within seven (7) days of first payment may receive a full refund.</li>
                <li><strong>Prorated Annual Refunds:</strong> Annual subscribers who cancel mid‑term may receive a refund proportional to unused months.</li>
                <li><strong>Abuse Prevention:</strong> One refund per account lifetime.</li>
              </ul>
              <p>Refund requests must be submitted in writing within thirty (30) days of the event. Refund requests submitted after thirty (30) days of the event will be automatically denied.</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6.3 Taxes & Chargebacks</h3>
              <p>Fees exclude taxes. You are responsible for all applicable taxes. Chargebacks will incur a $25 administrative fee.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Responsibilities</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>IronStamp is not a certified compliance advisor. You are solely responsible for ensuring your operations and certifications comply with applicable laws and regulations.</li>
                <li><strong>Accuracy:</strong> You are solely responsible for entering, reviewing, and maintaining correct certification data (names, numbers, expiration dates, etc.).</li>
                <li><strong>Compliance:</strong> You retain full responsibility for compliance with all local, state, and federal regulations, including renewed certifications and inspections.</li>
                <li><strong>Verification:</strong> You must verify reminders and notifications; the Service is a supplemental aid only.</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Prohibited Activities</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Use the Service for unlawful purposes;</li>
                <li>Scrape, reverse engineer, or attempt to access source code;</li>
                <li>Upload malware or infringing content;</li>
                <li>Interfere with network operations;</li>
                <li>Misuse support channels.</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Ownership & License</h2>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">9.1 Customer Data</h3>
              <p>“Customer Data” means data you upload or generate. You retain ownership. You grant IronStamp a worldwide, non‑exclusive license to host, process, transmit, and display Customer Data solely to provide the Service.</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">9.2 Aggregate Data</h3>
              <p>We may compile anonymized, aggregated statistics for analytics and product improvement.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Intellectual Property</h2>
              <p>IronStamp owns all intellectual‑property rights in the Service, including software, UI, logos, and documentation. Except for the limited right to use the Service, no license is granted.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Third‑Party Services & Open Source</h2>
              <p>The Service integrates with third‑party providers (e.g., Supabase, Resend, Stripe). IronStamp is not liable for third‑party failures, acts, or omissions. The Service may include open‑source components; use is subject to their licenses.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Support; Right to Refuse Service</h2>
              <p>Support channels and SLAs are specified in your plan. IronStamp reserves the right to limit or deny support to abusive, disrespectful, or non‑paying users.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Disclaimers</h2>
              <p>THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” IRONSTAMP DISCLAIMS ALL WARRANTIES—EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE—including implied warranties of merchantability, fitness for a particular purpose, accuracy, or non‑infringement. Without limitation:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>We do not guarantee that notifications will be sent, received, or acted upon.</li>
                <li>We do not guarantee that the Service will prevent fines, penalties, or inspection failures.</li>
                <li>We do not warrant that data, dates, or calculations are error‑free.</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IRONSTAMP’S TOTAL LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE AMOUNTS PAID BY CUSTOMER TO IRONSTAMP IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM. IRONSTAMP SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING FINES, LOST PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR COST OF SUBSTITUTE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Indemnification</h2>
              <p>Customer shall defend, indemnify, and hold harmless IronStamp, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys’ fees) arising from or relating to: (a) Customer’s misuse of the Service; (b) Customer Data; (c) Customer’s violation of laws or regulations; (d) disputes between Customer and any third party.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Force Majeure</h2>
              <p>IronStamp is not liable for failure to perform due to events beyond reasonable control, including natural disasters, war, terrorism, strikes, power outages, or third‑party service interruptions.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Termination & Suspension</h2>
              <p>IronStamp may suspend or terminate access immediately for breach, illegal activity, or to protect the Service. Customer may cancel at any time. Upon termination, Customer Data may be deleted after thirty (30) days. IronStamp is not responsible for backing up or exporting Customer Data after termination.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Governing Law</h2>
              <p>These Terms are governed by the laws of the Commonwealth of Massachusetts, excluding its conflict‑of‑law rules.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Dispute Resolution</h2>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">19.1 Mandatory Arbitration</h3>
              <p>Except for claims qualifying for small‑claims court or as otherwise stated, any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) in Boston, Massachusetts, under the Commercial Arbitration Rules. The award may be entered in any court with jurisdiction.</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">19.2 Opt‑Out & Exceptions</h3>
              <p>Either party may seek injunctive or equitable relief in Massachusetts state or federal courts for intellectual‑property infringement or breach of confidentiality.</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">19.3 Jury & Class‑Action Waiver</h3>
              <p>Both parties waive the right to a jury trial or to participate in class actions.</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">19.4 Fallback to Litigation</h3>
              <p>If arbitration is found unenforceable, disputes shall be litigated exclusively in the state or federal courts located in Suffolk County, Massachusetts, and the parties consent to personal jurisdiction.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">20. Changes to Terms</h2>
              <p>IronStamp may amend these Terms by posting a revised version and indicating the “Last updated” date. Material changes become effective thirty (30) days after posting. Continued use after that constitutes acceptance.</p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">21. Miscellaneous</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Entire Agreement:</strong> This Agreement supersedes all prior agreements.</li>
                <li><strong>Severability:</strong> If any provision is unenforceable, the remainder remains in effect.</li>
                <li><strong>Assignment:</strong> Customer may not assign this Agreement without IronStamp’s prior written consent; IronStamp may assign freely as part of a merger or sale.</li>
                <li><strong>Headings:</strong> Headings are for convenience only.</li>
              </ul>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">22. Contact</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-2">IronStamp, Inc.</p>
                <p className="text-gray-700">Email: <a href="mailto:Ironstamp.team@gmail.com" className="text-blue-600 hover:text-blue-700 underline">Ironstamp.team@gmail.com</a></p>
              </div>
            </section>
            <p className="text-gray-700 mt-8">By continuing to use IronStamp, you acknowledge that you have read, understood, and agree to these Terms of Service.</p>
          </div>

          {/* Back to Home Button */}
          <div className="text-center mt-12">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:shadow-lg"
            >
              <Link href="/">
                Back to IronStamp
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService 