/**
 * Certification Types Configuration
 * 
 * This file defines which certifications are lifetime (never expire) vs. expiring.
 * Based on federal regulations and Massachusetts state requirements.
 */

/**
 * Patterns to identify lifetime certifications that never expire.
 * These are matched case-insensitively against certification names.
 */
export const LIFETIME_CERTIFICATION_PATTERNS = [
  // EPA Section 608 - Federal refrigerant handling, never expires
  'epa 608',
  'epa-608',
  'epa608',
  'section 608',
  '608 universal',
  '608 type i',
  '608 type ii',
  '608 type iii',
  
  // EPA Section 609 - MVAC (Motor Vehicle AC), never expires
  'epa 609',
  'epa-609',
  'epa609',
  'section 609',
  'mvac certification',
  
  // OSHA 10-Hour - Federal, never expires (MA 5-year rule is for public works only)
  'osha 10',
  'osha-10',
  'osha10',
  '10-hour osha',
  '10 hour osha',
  
  // OSHA 30-Hour - Federal, never expires
  'osha 30',
  'osha-30',
  'osha30',
  '30-hour osha',
  '30 hour osha',
  
  // HVAC Excellence Employment Ready - Entry-level, never expires
  'hvac excellence employment',
  'employment ready',
] as const;

/**
 * Patterns to identify certifications that expire and need renewal.
 * These typically require Continuing Education (CE) and periodic renewal.
 */
export const EXPIRING_CERTIFICATION_PATTERNS = {
  // Massachusetts State Licenses - Renew every 2 years
  MASSACHUSETTS_LICENSES: [
    'massachusetts refrigeration technician',
    'massachusetts refrigeration contractor',
    'massachusetts sheet metal',
    'massachusetts oil burner',
    'massachusetts pipefitter',
    'massachusetts gas fitter',
    'massachusetts hoisting',
    'ma refrigeration',
    'ma sheet metal',
    'ma oil burner',
    'ma pipefitter',
    'ma gas fitter',
    'ma hoisting',
  ],
  
  // State Licenses (generic) - Typically renew every 1-2 years
  STATE_LICENSES: [
    'state hvac license',
    'state license',
    'contractor license',
  ],
  
  // NATE Certification - Renews every 2 years
  NATE: [
    'nate',
    'north american technician excellence',
  ],
  
  // BPI Certification - Renews every 3 years
  BPI: [
    'bpi',
    'building performance institute',
  ],
  
  // NFPA Hot Works - Renews every 3 years
  NFPA: [
    'nfpa 51b',
    'hot works',
  ],
  
  // Construction Supervisor License - Renews every 2 years
  CSL: [
    'construction supervisor',
    'csl',
  ],
} as const;

/**
 * Check if a certification name matches a lifetime (non-expiring) certification.
 * @param certificationName - The name of the certification to check
 * @returns true if the certification never expires
 */
export function isLifetimeCertification(certificationName: string): boolean {
  const lowerName = certificationName.toLowerCase();
  
  return LIFETIME_CERTIFICATION_PATTERNS.some(pattern => 
    lowerName.includes(pattern.toLowerCase())
  );
}

/**
 * Get the renewal period for an expiring certification.
 * @param certificationName - The name of the certification
 * @returns Renewal period in years, or null for lifetime certifications
 */
export function getRenewalPeriodYears(certificationName: string): number | null {
  if (isLifetimeCertification(certificationName)) {
    return null; // Lifetime, no renewal needed
  }
  
  const lowerName = certificationName.toLowerCase();
  
  // BPI and NFPA Hot Works - 3 years
  if (EXPIRING_CERTIFICATION_PATTERNS.BPI.some(p => lowerName.includes(p)) ||
      EXPIRING_CERTIFICATION_PATTERNS.NFPA.some(p => lowerName.includes(p))) {
    return 3;
  }
  
  // Most others - 2 years (NATE, MA licenses, CSL)
  return 2;
}

/**
 * Get the display status for a certification based on its expiration.
 * @param isLifetime - Whether the certification is lifetime
 * @param daysLeft - Days until expiration (ignored for lifetime certs)
 * @returns Status string for display
 */
export function getCertificationStatus(isLifetime: boolean, daysLeft: number): string {
  if (isLifetime) {
    return 'Lifetime';
  }
  
  if (daysLeft < 0) {
    return 'Expired';
  } else if (daysLeft <= 30) {
    return 'Expiring Soon';
  } else {
    return 'Active';
  }
}

/**
 * Get the status badge class for UI display.
 * @param isLifetime - Whether the certification is lifetime
 * @param daysLeft - Days until expiration (ignored for lifetime certs)
 * @returns CSS class name for status badge
 */
export function getStatusBadgeClass(isLifetime: boolean, daysLeft: number): string {
  if (isLifetime) {
    return 'status-lifetime'; // Blue/purple badge for lifetime
  }
  
  if (daysLeft < 0) {
    return 'status-crit'; // Red for expired
  } else if (daysLeft <= 30) {
    return 'status-warn'; // Yellow for expiring soon
  } else {
    return 'status-ok'; // Green for active
  }
}
