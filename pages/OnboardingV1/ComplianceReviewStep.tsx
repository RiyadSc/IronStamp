import { useState, useMemo } from 'react'
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Users, 
  Shield, 
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  FileCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  Sparkles
} from 'lucide-react'
import type { OnboardingData } from './index'
import type { CertificationAssignment } from './CertificationAssignmentStep'
import { isDevModeEnabled } from '@/lib/dev-mode'

interface ComplianceReviewStepProps {
  initialData: OnboardingData
  onComplete: () => void
  onBack: () => void
  saving: boolean
}

// Certification metadata
interface CertInfo {
  id: string
  name: string
  shortName: string
  isLifetime: boolean
  category: 'federal' | 'state' | 'safety' | 'industry'
}

const certificationInfo: Record<string, CertInfo> = {
  // Federal
  'epa_608': { id: 'epa_608', name: 'EPA Section 608 Certification', shortName: 'EPA 608', isLifetime: true, category: 'federal' },
  'epa_609': { id: 'epa_609', name: 'EPA Section 609 Certification', shortName: 'EPA 609', isLifetime: true, category: 'federal' },
  // State (Massachusetts)
  'ma_refrigeration': { id: 'ma_refrigeration', name: 'Massachusetts Refrigeration License', shortName: 'MA Refrigeration', isLifetime: false, category: 'state' },
  'ma_oil_burner': { id: 'ma_oil_burner', name: 'Massachusetts Oil Burner License', shortName: 'MA Oil Burner', isLifetime: false, category: 'state' },
  'ma_sheet_metal': { id: 'ma_sheet_metal', name: 'Massachusetts Sheet Metal License', shortName: 'MA Sheet Metal', isLifetime: false, category: 'state' },
  'ma_gas_fitter': { id: 'ma_gas_fitter', name: 'Massachusetts Gas Fitter License', shortName: 'MA Gas Fitter', isLifetime: false, category: 'state' },
  // Safety
  'osha_10': { id: 'osha_10', name: 'OSHA 10-Hour Construction', shortName: 'OSHA 10', isLifetime: true, category: 'safety' },
  'osha_30': { id: 'osha_30', name: 'OSHA 30-Hour Construction', shortName: 'OSHA 30', isLifetime: true, category: 'safety' },
  'first_aid_cpr': { id: 'first_aid_cpr', name: 'First Aid/CPR/AED', shortName: 'First Aid/CPR', isLifetime: false, category: 'safety' },
  // Industry
  'nate': { id: 'nate', name: 'NATE Certification', shortName: 'NATE', isLifetime: false, category: 'industry' },
  'bpi': { id: 'bpi', name: 'BPI Building Analyst', shortName: 'BPI', isLifetime: false, category: 'industry' },
}

type AlertSeverity = 'critical' | 'warning' | 'info'

interface ComplianceAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  memberName?: string
  certName?: string
}

export default function ComplianceReviewStep({ 
  initialData, 
  onComplete, 
  onBack, 
  saving 
}: ComplianceReviewStepProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('alerts')
  
  // Analyze compliance data — use ACTUAL assignments (from spreadsheet/grid), not just Step 2 selection
  const analysis = useMemo(() => {
    const teamMembers = initialData.team_members || []
    const requiredCerts = initialData.required_certifications || []
    const assignments = initialData.certification_assignments || []
    
    // Cert types actually present in the data (not just Step 2 selection)
    const certTypesInData = [...new Set(assignments.filter(a => a.hasCert).map(a => a.certificationId))]
    const certificationTypesCount = certTypesInData.length
    
    // Total cert records (member+cert pairs) and assignment lookup
    const totalCertsTracked = assignments.filter(a => a.hasCert).length
    const assignmentMap = new Map<string, CertificationAssignment>()
    assignments.forEach(a => {
      const key = `${a.memberId}-${a.certificationId}`
      assignmentMap.set(key, a)
    })
    
    // Member compliance from ACTUAL assignments (what they have), not from requiredCerts
    const memberCompliance = teamMembers.map(member => {
      const memberAssignments = assignments.filter(a => a.memberId === member.id && a.hasCert)
      const memberCerts = memberAssignments.map(a => {
        const info = certificationInfo[a.certificationId] || { shortName: a.certificationName || a.certificationId, isLifetime: a.isLifetime }
        const isExpired = !a.isLifetime && a.expirationDate ? new Date(a.expirationDate) < new Date() : false
        const isExpiringSoon = !a.isLifetime && a.expirationDate
          ? (new Date(a.expirationDate) > new Date() && new Date(a.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
          : false
        return {
          certId: a.certificationId,
          certName: info.shortName,
          hasCert: true,
          expirationDate: a.expirationDate,
          isLifetime: a.isLifetime || false,
          isExpired,
          isExpiringSoon
        }
      })
      
      const certsHeld = memberCerts.length
      const certsExpired = memberCerts.filter(c => c.isExpired).length
      const certsExpiringSoon = memberCerts.filter(c => c.isExpiringSoon).length
      const certsMissing: typeof memberCerts = []
      
      const hasExpiredCerts = certsExpired > 0
      const hasExpiringCerts = certsExpiringSoon > 0
      const certTypesCount = certificationTypesCount || 1
      
      return {
        member,
        memberCerts,
        certsHeld,
        certsExpired,
        certsExpiringSoon,
        certsMissing,
        isFullyCompliant: certsHeld > 0 && certsExpired === 0,
        hasIssues: hasExpiredCerts || hasExpiringCerts,
        coveragePercent: certTypesCount > 0 ? Math.round((certsHeld / certTypesCount) * 100) : (certsHeld > 0 ? 100 : 0),
        status: hasExpiredCerts ? 'critical' : hasExpiringCerts ? 'warning' : certsHeld > 0 ? 'good' : 'no_certs'
      }
    })
    
    const alerts: ComplianceAlert[] = []
    memberCompliance.forEach(mc => {
      mc.memberCerts.filter(c => c.isExpired && !c.isLifetime).forEach(cert => {
        alerts.push({
          id: `expired-${mc.member.id}-${cert.certId}`,
          severity: 'critical',
          title: 'Expired Certification',
          description: `${cert.certName} expired on ${cert.expirationDate ? new Date(cert.expirationDate).toLocaleDateString() : 'unknown'}`,
          memberName: mc.member.name,
          certName: cert.certName
        })
      })
      mc.memberCerts.filter(c => c.isExpiringSoon && !c.isLifetime).forEach(cert => {
        alerts.push({
          id: `expiring-${mc.member.id}-${cert.certId}`,
          severity: 'warning',
          title: 'Expiring Soon',
          description: `${cert.certName} expires on ${cert.expirationDate ? new Date(cert.expirationDate).toLocaleDateString() : 'unknown'}`,
          memberName: mc.member.name,
          certName: cert.certName
        })
      })
    })
    
    const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    
    const expiredCount = alerts.filter(a => a.severity === 'critical').length
    const warningCount = alerts.filter(a => a.severity === 'warning').length
    const fullyCompliantCount = memberCompliance.filter(mc => mc.isFullyCompliant).length
    const membersWithIssues = memberCompliance.filter(mc => mc.hasIssues).length
    const membersWithCerts = memberCompliance.filter(mc => mc.certsHeld > 0)
    const overallCompliancePercent = membersWithCerts.length > 0 
      ? Math.round((membersWithCerts.filter(mc => !mc.hasIssues).length / membersWithCerts.length) * 100)
      : 100
    const overallCoveragePercent = memberCompliance.length > 0 
      ? Math.round(memberCompliance.reduce((sum, mc) => sum + mc.coveragePercent, 0) / memberCompliance.length)
      : 0
    
    return {
      teamMembers,
      requiredCerts,
      assignments,
      memberCompliance,
      alerts,
      certificationTypesCount,
      certTypesTracked: certTypesInData,
      stats: {
        totalMembers: teamMembers.length,
        totalCertsTracked,
        certificationTypesCount,
        expiredCount,
        warningCount,
        fullyCompliantCount,
        membersWithIssues,
        overallCompliancePercent,
        overallCoveragePercent
      }
    }
  }, [initialData])

  const getCertInfo = (certId: string): CertInfo => {
    return certificationInfo[certId] || { 
      id: certId, 
      name: certId, 
      shortName: certId, 
      isLifetime: false,
      category: 'industry' as const
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleComplete = () => {
    onComplete()
  }

  // Determine overall status
  const overallStatus = analysis.stats.expiredCount > 0 ? 'critical' : 
                        analysis.stats.warningCount > 0 ? 'warning' : 'good'

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
      {/* Left Side - Compliance Summary Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#050505] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundSize: '40px 40px',
            backgroundImage: 'linear-gradient(to right, #0038FF 1px, transparent 1px), linear-gradient(to bottom, #0038FF 1px, transparent 1px)'
          }} />
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-32 h-32">
          <div className="absolute top-8 right-8 w-full h-full border-t-2 border-r-2 border-[#0038FF]/30" />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32">
          <div className="absolute bottom-8 left-8 w-full h-full border-b-2 border-l-2 border-[#0038FF]/30" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="h-10 w-auto brightness-0 invert" />
            <span className="font-display font-bold text-3xl tracking-tighter">IRONSTAMP</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {overallStatus === 'good' ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 flex items-center justify-center">
                  <PartyPopper className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold uppercase">
                  Ready to Go!
                </h2>
              </div>
              <p className="text-gray-400 font-mono text-sm mb-8">
                Your team is set up and compliant. You&apos;re ready to start managing certifications.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold mb-2 uppercase">
                Compliance<br />
                <span className={overallStatus === 'critical' ? 'text-red-500' : 'text-yellow-500'}>
                  Review
                </span>
              </h2>
              <p className="text-gray-400 font-mono text-sm mb-8">
                {overallStatus === 'critical' 
                  ? 'Some certifications need immediate attention.'
                  : 'Minor issues found. Review before continuing.'}
              </p>
            </>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-[10px] text-gray-400 uppercase">Team Size</span>
              </div>
              <div className="font-display text-3xl font-bold">{analysis.stats.totalMembers}</div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-[10px] text-gray-400 uppercase">Cert Types</span>
              </div>
              <div className="font-display text-3xl font-bold">{analysis.stats.certificationTypesCount}</div>
              <div className="font-mono text-[10px] text-gray-500 mt-1">{analysis.stats.totalCertsTracked} recorded</div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-[10px] text-gray-400 uppercase">Compliance</span>
              </div>
              <div className={`font-display text-3xl font-bold ${
                analysis.stats.overallCompliancePercent >= 90 ? 'text-green-500' :
                analysis.stats.overallCompliancePercent >= 70 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {analysis.stats.overallCompliancePercent}%
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-[10px] text-gray-400 uppercase">Compliant</span>
              </div>
              <div className="font-display text-3xl font-bold text-green-500">
                {analysis.stats.fullyCompliantCount}/{analysis.stats.totalMembers}
              </div>
            </div>
          </div>

          {/* Alert Summary */}
          {(analysis.stats.expiredCount > 0 || analysis.stats.warningCount > 0) && (
            <div className="space-y-2">
              {analysis.stats.expiredCount > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{analysis.stats.expiredCount} expired certification(s)</span>
                </div>
              )}
              {analysis.stats.warningCount > 0 && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{analysis.stats.warningCount} expiring soon</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
        </div>
      </div>

      {/* Right Side - Detailed Review */}
      <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
        {/* Desktop back button (floats over content) */}
        <div className="hidden lg:block absolute top-6 left-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Mobile header: back + centered logo */}
        <div className="lg:hidden pt-4 px-4 pb-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="mt-3 flex justify-center">
            <div className="flex items-center gap-2">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
              <span className="font-display font-bold text-xl tracking-tighter text-[#050505]">IRONSTAMP</span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="px-6 md:px-12 pt-8 md:pt-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-2">
                <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
              </div>
              <span className="font-mono text-xs text-gray-500 ml-2">Step 4 of 4</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 md:px-12 py-6 md:py-8">
          <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6">
              <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// FINAL REVIEW ///`}</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[#050505]">
                Compliance Summary
              </h1>
              <p className="text-gray-600 font-mono text-sm mt-2">
                Review your setup before launching your dashboard.
              </p>
            </div>

            {/* Company Summary Card */}
            <div className="mb-6 p-5 border-2 border-gray-200 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-5 h-5 text-[#0038FF]" />
                <h3 className="font-display font-bold text-lg text-[#050505] uppercase">Company Setup</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[10px] text-gray-400 uppercase mb-1">Company</div>
                  <div className="font-display font-bold">{initialData.company_name || 'Not set'}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-gray-400 uppercase mb-1">Location</div>
                  <div className="font-display font-bold">{initialData.city || 'Massachusetts'}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-gray-400 uppercase mb-1">Services</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(initialData.services || []).map(service => (
                      <span key={service} className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 uppercase">
                        {service.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-gray-400 uppercase mb-1">Tracking</div>
                  <div className="font-display font-bold">
                    {analysis.stats.certificationTypesCount} cert types
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts Section */}
            {analysis.alerts.length > 0 && (
              <div className="mb-6 border-2 border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => toggleSection('alerts')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center ${
                      analysis.stats.expiredCount > 0 ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {analysis.stats.expiredCount > 0 ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[#050505] uppercase">
                        {analysis.alerts.length} Alert{analysis.alerts.length !== 1 ? 's' : ''} Found
                      </h3>
                      <p className="font-mono text-xs text-gray-500">
                        Review and address after setup
                      </p>
                    </div>
                  </div>
                  {expandedSection === 'alerts' ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedSection === 'alerts' && (
                  <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
                    {analysis.alerts.slice(0, 10).map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3 border-b border-gray-100 last:border-0 flex items-start gap-3 ${
                          alert.severity === 'critical' ? 'bg-red-50' :
                          alert.severity === 'warning' ? 'bg-yellow-50' :
                          'bg-gray-50'
                        }`}
                      >
                        {alert.severity === 'critical' ? (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : alert.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-mono text-xs font-bold text-[#050505]">
                            {alert.memberName}: {alert.title}
                          </div>
                          <div className="font-mono text-[10px] text-gray-500">
                            {alert.description}
                          </div>
                        </div>
                      </div>
                    ))}
                    {analysis.alerts.length > 10 && (
                      <div className="p-3 text-center font-mono text-xs text-gray-500">
                        +{analysis.alerts.length - 10} more alerts (view in dashboard)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Team Compliance Section */}
            <div className="mb-6 border-2 border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => toggleSection('team')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0038FF]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#0038FF]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-[#050505] uppercase">
                      Team Compliance
                    </h3>
                    <p className="font-mono text-xs text-gray-500">
                      {analysis.stats.fullyCompliantCount} of {analysis.stats.totalMembers} fully compliant
                    </p>
                  </div>
                </div>
                {expandedSection === 'team' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedSection === 'team' && (
                <div className="border-t border-gray-200">
                  {analysis.memberCompliance.map((mc) => (
                    <div 
                      key={mc.member.id}
                      className="p-3 border-b border-gray-100 last:border-0 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center ${
                          mc.isFullyCompliant ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {mc.isFullyCompliant ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <span className="font-mono text-[10px] font-bold text-gray-600">
                              {mc.member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-display font-bold text-sm">{mc.member.name}</div>
                          <div className="font-mono text-[10px] text-gray-500">{mc.member.role}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {mc.certsExpired > 0 && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-mono font-bold px-2 py-0.5">
                            {mc.certsExpired} EXPIRED
                          </span>
                        )}
                        {mc.certsExpiringSoon > 0 && (
                          <span className="bg-yellow-100 text-yellow-700 text-[10px] font-mono font-bold px-2 py-0.5">
                            {mc.certsExpiringSoon} EXPIRING
                          </span>
                        )}
                        <div className={`font-mono text-sm font-bold ${
                          mc.isFullyCompliant ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {mc.certsHeld}/{analysis.stats.certificationTypesCount}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {analysis.memberCompliance.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="font-mono text-sm text-gray-500">No team members added</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div className="mb-8 border-2 border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => toggleSection('certs')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0038FF]/10 flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-[#0038FF]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-[#050505] uppercase">
                      Certifications Tracked
                    </h3>
                    <p className="font-mono text-xs text-gray-500">
                      {analysis.stats.certificationTypesCount} certification type{analysis.stats.certificationTypesCount !== 1 ? 's' : ''} · {analysis.stats.totalCertsTracked} total
                    </p>
                  </div>
                </div>
                {expandedSection === 'certs' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedSection === 'certs' && (
                <div className="border-t border-gray-200 p-3">
                  <div className="flex flex-wrap gap-2">
                    {analysis.certTypesTracked.map(certId => {
                      const info = getCertInfo(certId)
                      return (
                        <span 
                          key={certId}
                          className={`text-xs font-mono font-bold px-3 py-1.5 ${
                            info.category === 'federal' ? 'bg-purple-100 text-purple-700' :
                            info.category === 'state' ? 'bg-blue-100 text-blue-700' :
                            info.category === 'safety' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {info.shortName}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Stats */}
            <div className="lg:hidden bg-[#050505] text-white p-4 -mx-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-xs text-gray-400 uppercase">Team</div>
                  <div className="font-display text-2xl font-bold">{analysis.stats.totalMembers}</div>
                </div>
                <div>
                  <div className="font-mono text-xs text-gray-400 uppercase">Compliance</div>
                  <div className={`font-display text-2xl font-bold ${
                    analysis.stats.overallCompliancePercent >= 90 ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {analysis.stats.overallCompliancePercent}%
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="mb-8 p-5 border-2 border-[#0038FF] bg-[#0038FF]/5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#0038FF]" />
                <h3 className="font-display font-bold text-[#050505] uppercase">What&apos;s Next?</h3>
              </div>
              <ul className="space-y-2 font-mono text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Your dashboard is ready with real-time compliance tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#0038FF] flex-shrink-0 mt-0.5" />
                  <span>Automatic expiration alerts will be sent before certs expire</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#0038FF] flex-shrink-0 mt-0.5" />
                  <span>Upload actual cert documents to the Vault for storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-[#0038FF] flex-shrink-0 mt-0.5" />
                  <span>Add more team members and certifications anytime</span>
                </li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="text-gray-600 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleComplete}
                disabled={saving}
                className="bg-[#050505] text-white px-8 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] hover:shadow-[4px_4px_0px_#050505] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    Launch Dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
