/**
 * Server-side whitelists and validators for onboarding profile fields.
 * Used by /api/onboarding/profile to reject arbitrary client data.
 */

export const ALLOWED_TEAM_SIZES = new Set([
  'just_me',
  '2-5',
  '6-15',
  '16-30',
  '30+',
]);

export const ALLOWED_WORK_TYPES = new Set([
  'residential',
  'commercial',
  'industrial',
]);

export const ALLOWED_SERVICES = new Set([
  'refrigeration',
  'heating',
  'oil_burner',
  'sheet_metal',
  'gas_fitting',
  'refrigeration_large',
]);

export const ALLOWED_REQUIRED_CERTIFICATIONS = new Set([
  'epa_608',
  'epa_609',
  'ma_refrigeration',
  'ma_oil_burner',
  'ma_sheet_metal',
  'ma_gas_fitter',
  'osha_10',
  'osha_30',
  'first_aid_cpr',
  'nate',
  'bpi',
]);

const MAX_COMPANY_NAME = 500;
const MAX_CITY = 200;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function filterToWhitelist(arr: string[], allowed: Set<string>): string[] {
  return arr.filter((item) => allowed.has(item));
}

export interface Step1Payload {
  company_name?: string;
  city?: string;
  team_size?: string;
  work_types?: string[];
  services?: string[];
}

export interface Step2Payload {
  required_certifications?: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: Step1Payload | Step2Payload;
}

/**
 * Validate and normalize step 1 (company profile) payload.
 * Returns validated data with arrays filtered to whitelists, or error.
 */
export function validateStep1Payload(body: unknown): ValidationResult {
  if (body === null || typeof body !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }

  const raw = body as Record<string, unknown>;
  const company_name =
    typeof raw.company_name === 'string' ? raw.company_name.trim() : '';
  const city = typeof raw.city === 'string' ? raw.city.trim() : '';
  const team_size = typeof raw.team_size === 'string' ? raw.team_size : '';

  if (!company_name) {
    return { valid: false, error: 'Company name is required' };
  }
  if (company_name.length > MAX_COMPANY_NAME) {
    return { valid: false, error: `Company name must be ${MAX_COMPANY_NAME} characters or less` };
  }
  if (!city) {
    return { valid: false, error: 'City is required' };
  }
  if (city.length > MAX_CITY) {
    return { valid: false, error: `City must be ${MAX_CITY} characters or less` };
  }
  if (!team_size || !ALLOWED_TEAM_SIZES.has(team_size)) {
    return { valid: false, error: 'Invalid team size' };
  }

  const work_types = isStringArray(raw.work_types)
    ? filterToWhitelist(raw.work_types, ALLOWED_WORK_TYPES)
    : [];
  const services = isStringArray(raw.services)
    ? filterToWhitelist(raw.services, ALLOWED_SERVICES)
    : [];

  if (work_types.length === 0) {
    return { valid: false, error: 'At least one work type is required' };
  }
  if (services.length === 0) {
    return { valid: false, error: 'At least one service is required' };
  }

  return {
    valid: true,
    data: {
      company_name,
      city,
      team_size,
      work_types,
      services,
    },
  };
}

/**
 * Validate and normalize step 2 (required certifications) payload.
 * Returns validated data with array filtered to whitelist, or error.
 */
export function validateStep2Payload(body: unknown): ValidationResult {
  if (body === null || typeof body !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }

  const raw = body as Record<string, unknown>;
  const required_certifications = isStringArray(raw.required_certifications)
    ? filterToWhitelist(raw.required_certifications, ALLOWED_REQUIRED_CERTIFICATIONS)
    : [];

  return {
    valid: true,
    data: { required_certifications },
  };
}
