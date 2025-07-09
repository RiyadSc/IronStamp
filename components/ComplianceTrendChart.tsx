import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertCircle, CheckCircle, Clock, TrendingUp } from '@/lib/icons';
import { getAllCertifications, getTeamMembersWithCerts, type CertificationDetails, type TeamMember } from '@/lib/data-service';

interface ComplianceCategory {
  name: string;
  shortName: string;
  compliantCount: number;
  totalCount: number;
  complianceRate: number;
  priority: 'critical' | 'high' | 'medium';
  description: string;
  upcomingRenewals: number;
}

export const ComplianceTrendChart: React.FC = () => {
  const [certifications, setCertifications] = useState<CertificationDetails[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [certs, team] = await Promise.all([
          getAllCertifications(),
          getTeamMembersWithCerts()
        ]);
        setCertifications(certs);
        setTeamMembers(team);
      } catch (error) {
        console.error('Error loading compliance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Categorize certifications based on Massachusetts HVAC requirements
  const categorizeCompliance = (): ComplianceCategory[] => {
    const activeTeamCount = teamMembers.filter(member => member.status === 'Active').length;
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const categories = [
      {
        name: 'EPA 608 Refrigerant',
        shortName: 'EPA 608',
        keywords: ['epa', '608', 'refrigerant', 'freon', 'coolant'],
        priority: 'critical' as const,
        description: 'Required for all HVAC technicians in MA'
      },
      {
        name: 'OSHA Safety Training',
        shortName: 'OSHA',
        keywords: ['osha', 'safety', '10-hour', '30-hour', 'construction'],
        priority: 'critical' as const,
        description: 'Mandatory safety certification for field work'
      },
      {
        name: 'Massachusetts HVAC License',
        shortName: 'State License',
        keywords: ['massachusetts', 'ma', 'state', 'license', 'hvac license', 'plumbing'],
        priority: 'high' as const,
        description: 'State-required licensing for HVAC work'
      },
      {
        name: 'Manufacturer Certifications',
        shortName: 'Manufacturer',
        keywords: ['carrier', 'trane', 'lennox', 'rheem', 'goodman', 'york', 'manufacturer'],
        priority: 'medium' as const,
        description: 'Brand-specific training and certifications'
      },
      {
        name: 'Emergency Response',
        shortName: 'Emergency',
        keywords: ['cpr', 'first aid', 'emergency', 'aed', 'medical'],
        priority: 'high' as const,
        description: 'CPR and First Aid for workplace safety'
      }
    ];

    return categories.map(category => {
      // Find certifications that match this category
      const matchingCerts = certifications.filter(cert => 
        category.keywords.some(keyword => 
          cert.type.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      // Get unique employees with this certification type
      const employeesWithCert = new Set(
        matchingCerts
          .filter(cert => cert.status === 'Active')
          .map(cert => cert.employee)
      );

      // Count upcoming renewals (next 30 days)
      const upcomingRenewals = matchingCerts.filter(cert => {
        const expirationDate = new Date(cert.expirationDate);
        return expirationDate >= today && expirationDate <= thirtyDaysFromNow;
      }).length;

      const compliantCount = employeesWithCert.size;
      const complianceRate = activeTeamCount > 0 ? Math.round((compliantCount / activeTeamCount) * 100) : 0;

      return {
        ...category,
        compliantCount,
        totalCount: activeTeamCount,
        complianceRate,
        upcomingRenewals
      };
    });
  };

  const complianceCategories = categorizeCompliance();
  const overallCompliance = complianceCategories.length > 0 
    ? Math.round(complianceCategories.reduce((sum, cat) => sum + cat.complianceRate, 0) / complianceCategories.length)
    : 0;

  // Calculate readiness metrics
  const totalUpcomingRenewals = complianceCategories.reduce((sum, cat) => sum + cat.upcomingRenewals, 0);
  const criticalGaps = complianceCategories.filter(cat => cat.priority === 'critical' && cat.complianceRate < 80).length;
  const readyForWork = complianceCategories.filter(cat => cat.priority === 'critical').every(cat => cat.complianceRate >= 80);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-bold tracking-tight flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Compliance Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold tracking-tight flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Compliance Health
          </CardTitle>
          <div className="flex items-center space-x-2">
            {readyForWork ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            <span className={`text-sm font-semibold ${readyForWork ? 'text-green-600' : 'text-orange-600'}`}>
              {overallCompliance}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Health Score */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Team Compliance Score</p>
            <p className="text-3xl font-bold text-blue-600">{overallCompliance}%</p>
            <p className="text-xs text-gray-500">
              {readyForWork ? 'Team ready for MA HVAC work' : 'Critical gaps need attention'}
            </p>
          </div>

          {/* Compliance by Category */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">MA HVAC Requirements</p>
            {complianceCategories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getPriorityColor(category.priority)}`}>
                      {category.shortName}
                    </span>
                    {category.priority === 'critical' && (
                      <Badge variant="outline" className="text-xs px-1 py-0 text-red-600 border-red-200">
                        Required
                      </Badge>
                    )}
                    {category.upcomingRenewals > 0 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 text-orange-600 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        {category.upcomingRenewals} due
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">
                    {category.compliantCount}/{category.totalCount} techs
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getComplianceColor(category.complianceRate)}`}
                      style={{ width: `${Math.min(category.complianceRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">
                    {category.complianceRate}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-2">{category.description}</p>
              </div>
            ))}
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                {criticalGaps === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                )}
                <p className="text-sm text-gray-600">Critical Gaps</p>
              </div>
              <p className={`text-lg font-bold ${criticalGaps === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {criticalGaps}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-orange-500 mr-1" />
                <p className="text-sm text-gray-600">Due in 30 Days</p>
              </div>
              <p className={`text-lg font-bold ${totalUpcomingRenewals > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {totalUpcomingRenewals}
              </p>
            </div>
          </div>

          {/* Action Recommendation */}
          {!readyForWork && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Action Required
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {criticalGaps > 0 
                  ? `${criticalGaps} critical certification${criticalGaps > 1 ? 's' : ''} below 80% compliance`
                  : 'Some team members may not be ready for all HVAC work'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 