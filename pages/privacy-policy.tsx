import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'

const PrivacyPolicy = () => {
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
              Privacy Policy
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Last updated: July 17, 2025
            </p>
          </div>

          {/* Policy Content */}
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-8">
              IronStamp ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SaaS platform, IronStamp, and related services. IronStamp is registered in Massachusetts and complies with applicable state and federal privacy laws.
            </p>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">We collect the following types of information:</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">A. Account and Profile Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Name, email address, and password (for account creation and authentication)</li>
                <li>Company name, license number, business address, phone number, business email, team size, business focus</li>
                <li>Notification preferences and designated notification email addresses</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">B. Team and Employee Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Team member names, email addresses, and roles</li>
                <li>Employee names and email addresses (for certification tracking)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">C. Certification and Document Data</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Certification names, numbers, issue and expiration dates</li>
                <li>Uploaded files (PDFs, images, documents) and associated metadata (file name, size, type)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">D. Technical and Usage Data</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>IP address (for security and rate limiting)</li>
                <li>Device/browser information (for troubleshooting and security)</li>
                <li>Session data (cookies or localStorage used for authentication)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">E. Communications</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Emails, reminders, and notifications sent to you or your team</li>
              </ul>

              <p className="text-gray-700 font-medium">We do <strong>not</strong> knowingly collect information from children under 13.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Create and manage your account</li>
                <li>Authenticate users and teams</li>
                <li>Onboard users and organizations</li>
                <li>Track certifications, compliance, and team data</li>
                <li>Generate and store documents (e.g., PDFs)</li>
                <li>Send notifications and reminders (email, SMS)</li>
                <li>Provide customer support</li>
                <li>Improve and secure our services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2A. Legal Basis for Processing (for EEA Users)</h2>
              <p className="text-gray-700 mb-4">If you are located in the European Economic Area (EEA), we process your personal information on the following legal bases:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Consent</strong> (e.g., for marketing communications)</li>
                <li><strong>Contractual necessity</strong> (e.g., to deliver IronStamp services)</li>
                <li><strong>Legitimate interests</strong> (e.g., product improvement, fraud prevention)</li>
                <li><strong>Legal obligation</strong> (e.g., tax and regulatory compliance)</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Share Your Information</h2>
              <p className="text-gray-700 mb-4">We do <strong>not</strong> sell your personal information.</p>
              <p className="text-gray-700 mb-4">We may share it with:</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Providers:</h3>
              <p className="text-gray-700 mb-4">Including but not limited to Supabase (database, auth, storage), Resend (email delivery), Stripe (billing), and other subprocessors strictly required to operate IronStamp. All subprocessors are contractually obligated to protect your data and process it only on our instructions.</p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Authorities:</h3>
              <p className="text-gray-700 mb-4">When required to comply with legal obligations, court orders, or government requests.</p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Transfers:</h3>
              <p className="text-gray-700 mb-4">In the event of a merger, acquisition, restructuring, or sale of all or part of our assets.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">We use cookies and localStorage to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Maintain your authentication session</li>
                <li>Store user preferences</li>
              </ul>
              <p className="text-gray-700 font-medium">We do <strong>not</strong> use third-party advertising or analytics cookies.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">We implement technical and organizational safeguards to protect your information, including:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Data encryption in transit and at rest (AES-256)</li>
                <li>Role-based access controls and authentication</li>
                <li>Regular monitoring and backups</li>
              </ul>
              <p className="text-gray-700">As required by Massachusetts law (201 CMR 17.00), we maintain a Written Information Security Program (WISP) to safeguard personal information of Massachusetts residents.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">We retain your information as long as your account is active or as needed to deliver our services.</p>
              <p className="text-gray-700 mb-4">You may:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Close your account at any time</li>
                <li>Request deletion of your personal data by contacting us below</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Access and review your data</li>
                <li>Correct inaccuracies</li>
                <li>Delete your personal information</li>
                <li>Export your data (PDF, CSV, ZIP)</li>
                <li>Opt out of non-essential emails</li>
              </ul>
              <p className="text-gray-700">To exercise your rights, contact us at the address below.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700">IronStamp is not intended for children under 13. We do not knowingly collect data from individuals under 13 years of age. If we become aware that such data has been collected, we will delete it promptly.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">We may update this Privacy Policy from time to time. Material changes will be posted on our website, and the "Last updated" date above will be revised. We encourage you to review this policy regularly.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700">If you use IronStamp from outside the United States, your information may be transferred to and processed in the U.S. We take steps to ensure appropriate safeguards are in place for such transfers in accordance with applicable law.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Notice for California Residents (CCPA)</h2>
              <p className="text-gray-700 mb-4">If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Right to know what data we collect</li>
                <li>Right to request deletion</li>
                <li>Right to opt out of the sale of personal data (we do not sell data)</li>
              </ul>
              <p className="text-gray-700">You can exercise these rights by contacting us below.</p>
            </section>

            <hr className="my-8 border-gray-200" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">IronStamp Privacy Team</h3>
                <p className="text-gray-700 mb-2">IronStamp®</p>
                <p className="text-gray-700">📧 <a href="mailto:ironstamp.team@gmail.com" className="text-blue-600 hover:text-blue-700 underline">ironstamp.team@gmail.com</a></p>
              </div>
            </section>
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

export default PrivacyPolicy 