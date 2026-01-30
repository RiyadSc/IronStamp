import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { isLifetimeCertification } from '@/lib/certification-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Rate limiting - simple in-memory store
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return true;
  }
  
  clientData.count++;
  return false;
}

// Helper function to calculate days between dates
const calculateDaysBetween = (date1: string, date2?: string): number => {
  const targetDate = new Date(date1);
  const compareDate = date2 ? new Date(date2) : new Date();
  const timeDiff = targetDate.getTime() - compareDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

// Input validation
function validateAuthHeader(authHeader: string | undefined): string | null {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer '
  
  // Basic token format validation (JWT-like)
  if (!/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
    return null;
  }
  
  return token;
}

interface CertificationRow {
  id: string;
  employee_name: string;
  certification_name: string;
  issue_date: string | null;
  expiration_date: string | null;
  priority: string | null;
  notes: string | null;
  is_lifetime?: boolean | null;
}

// Escape HTML to prevent issues
function _escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Safe HTML escaping for server-side
function safeEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function generateSimplePDFHTML(
  companyName: string,
  employeeSummaries: any[],
  stats: any,
  logoUrl?: string
): string {
  const safeCompanyName = safeEscape(companyName);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const safeLogoUrl = logoUrl ? safeEscape(logoUrl) : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Certification Report</title>
    <style>
        :root {
            --blueprint-blue: #0038FF;
            --blueprint-dark: #001F8C;
            --paper-white: #F0F4F8;
            --ink-black: #050505;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 13px;
            line-height: 1.5;
            color: var(--ink-black);
            background: #FFFFFF;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px 28px 32px 28px;
            background: var(--paper-white);
            border-radius: 12px;
            border: 1px solid rgba(15, 23, 42, 0.08);
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--blueprint-blue);
        }
        
        .brand {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .brand-mark {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            background: #050505;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(148, 163, 184, 0.6);
        }

        .brand-mark img {
            width: 26px;
            height: auto;
            display: block;
        }

        .brand-text {
            font-family: "Oswald", system-ui, sans-serif;
            letter-spacing: 0.16em;
            font-size: 11px;
            font-weight: 700;
        }

        .brand-text span {
            display: block;
        }

        .brand-text span:first-child {
            font-size: 9px;
            color: rgba(148, 163, 184, 0.9);
        }

        .brand-text span:last-child {
            font-size: 16px;
            color: var(--ink-black);
        }

        .report-meta {
            text-align: right;
            font-size: 11px;
            color: #6B7280;
        }

        .report-title {
            font-family: "Oswald", system-ui, sans-serif;
            font-size: 20px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--ink-black);
            margin-bottom: 4px;
        }

        .report-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid rgba(148, 163, 184, 0.8);
            font-size: 9px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            margin-top: 4px;
        }
        
        .summary {
            background: #FFFFFF;
            border-radius: 10px;
            padding: 16px 18px;
            margin-bottom: 20px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }
        
        .summary h3 {
            font-family: "Oswald", system-ui, sans-serif;
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            margin-bottom: 8px;
            color: var(--blueprint-dark);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 8px;
        }
        
        .stat-item {
            text-align: left;
            padding: 10px 12px;
            background: #F9FAFB;
            border-radius: 8px;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: var(--blueprint-blue);
            display: block;
        }
        
        .stat-label {
            font-size: 12px;
            color: #6B7280;
            margin-top: 5px;
        }
        
        .employee-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .employee-header {
            background: linear-gradient(120deg, #0038FF, #001F8C);
            color: #FFFFFF;
            padding: 10px 14px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 10px 10px 0 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .employee-stats {
            background-color: #E5E7EB;
            padding: 8px 14px;
            font-size: 12px;
            border-radius: 0 0 10px 10px;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 18px;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
        }
        
        th {
            background-color: #F3F4F6;
            font-weight: 600;
            font-size: 12px;
        }
        
        .status-active {
            color: #059669;
            font-weight: 600;
        }
        
        .status-expiring-soon {
            color: #d97706;
            font-weight: 600;
        }
        
        .status-expired {
            color: #dc2626;
            font-weight: 600;
        }

        .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed rgba(148, 163, 184, 0.8);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #6B7280;
        }

        .footer-left {
            text-transform: uppercase;
            letter-spacing: 0.16em;
        }

        .footer-right {
            font-family: "Oswald", system-ui, sans-serif;
            font-size: 11px;
        }
        
        @media print {
            .employee-section {
                page-break-inside: avoid;
            }
            
            @page {
                margin: 1cm;
                size: A4;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">
                <div class="brand-mark">
                    ${safeLogoUrl
                      ? `<img src="${safeLogoUrl}" alt="IronStamp logo" />`
                      : `<span style="font-size: 16px; font-weight: 700; color: #F9FAFB;">IS</span>`}
                </div>
                <div class="brand-text">
                    <span>COMPLIANCE SYSTEM</span>
                    <span>IRONSTAMP</span>
                </div>
            </div>
            <div class="report-meta">
                <div class="report-title">Team Certification Report</div>
                <div>Company: <strong>${safeCompanyName}</strong></div>
                <div>Generated: ${currentDate}</div>
                <div class="report-tag">INSPECTION READY</div>
            </div>
        </div>
        
        <div class="summary">
            <h3>Summary</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${stats.totalEmployees}</span>
                    <div class="stat-label">Total Employees</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.totalCertifications}</span>
                    <div class="stat-label">Total Certifications</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.activeCertifications}</span>
                    <div class="stat-label">Active Certifications</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.expiredCertifications}</span>
                    <div class="stat-label">Expired Certifications</div>
                </div>
            </div>
        </div>
        
        ${employeeSummaries.map(employee => `
            <div class="employee-section">
                <div class="employee-header">
                    <span>${safeEscape(employee.employeeName)}</span>
                    <span style="font-size: 11px; opacity: 0.9;">Total Certs: ${employee.totalCertifications}</span>
                </div>
                <div class="employee-stats">
                    Total: ${employee.totalCertifications} | 
                    Active: ${employee.activeCertifications} | 
                    Expiring Soon: ${employee.expiringSoonCertifications} | 
                    Expired: ${employee.expiredCertifications}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Certification</th>
                            <th>Issue Date</th>
                            <th>Expiration Date</th>
                            <th>Status</th>
                            <th>Days Left</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employee.certifications.map((cert: any) => `
                            <tr>
                                <td>${safeEscape(cert.type)}</td>
                                <td>${cert.issueDate || 'N/A'}</td>
                                <td>${cert.expirationDate}</td>
                                <td class="status-${cert.status.toLowerCase().replace(' ', '-')}">${cert.status}</td>
                                <td>${
                                  cert.isLifetime
                                    ? 'Lifetime'
                                    : cert.daysLeft >= 0
                                      ? `${cert.daysLeft} days`
                                      : `Expired ${Math.abs(cert.daysLeft)} days ago`
                                }</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('')}

        <div class="footer">
            <div class="footer-left">Generated by IronStamp</div>
            <div class="footer-right">www.ironstamp.app</div>
        </div>
    </div>
</body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown';
  if (isRateLimited(clientIP)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;
  try {
    // Validate authorization header
    const accessToken = validateAuthHeader(req.headers.authorization);
    if (!accessToken) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // Create authenticated Supabase client with timeout
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    
    // Get user from access token with timeout
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Get company name
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('id', user.id)
      .single();

    const companyName = profile?.company_name || 'Your Company';

    // Get all certifications for the user
    const { data: certifications, error: certsError } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, issue_date, expiration_date, priority, notes')
      .eq('user_id', user.id)
      .order('employee_name', { ascending: true }) as { data: CertificationRow[] | null, error: any };

    if (certsError) {
      console.error('Database error:', certsError.message);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    if (!certifications || certifications.length === 0) {
      return res.status(404).json({ error: 'No certification data found' });
    }

    // Process certifications and group by employee
    const employeeMap = new Map();

    certifications.forEach((cert) => {
      // Determine if this is a lifetime certification (never expires)
      const isLifetime =
        cert.is_lifetime === true ||
        cert.expiration_date === null ||
        isLifetimeCertification(cert.certification_name);

      const daysLeft = !isLifetime && cert.expiration_date
        ? calculateDaysBetween(cert.expiration_date)
        : Infinity;

      let status = 'Active';
      if (isLifetime) {
        status = 'Lifetime';
      } else if (daysLeft < 0) {
        status = 'Expired';
      } else if (daysLeft <= 30) {
        status = 'Expiring Soon';
      }
      
      const certDetail = {
        id: cert.id,
        employee: cert.employee_name,
        type: cert.certification_name,
        issueDate: cert.issue_date || '',
        expirationDate: cert.expiration_date,
        status,
        daysLeft,
        priority: cert.priority || 'medium',
        notes: cert.notes || undefined,
        isLifetime
      };

      const employeeKey = cert.employee_name || 'Unknown Employee';
      
      if (!employeeMap.has(employeeKey)) {
        employeeMap.set(employeeKey, {
          employeeName: cert.employee_name || 'Unknown Employee',
          totalCertifications: 0,
          activeCertifications: 0,
          expiringSoonCertifications: 0,
          expiredCertifications: 0,
          certifications: []
        });
      }

      const employee = employeeMap.get(employeeKey);
      employee.certifications.push(certDetail);
      employee.totalCertifications++;

      if (certDetail.status === 'Active' || certDetail.status === 'Lifetime') {
        employee.activeCertifications++;
      } else if (certDetail.status === 'Expiring Soon') {
        employee.expiringSoonCertifications++;
      } else if (certDetail.status === 'Expired') {
        employee.expiredCertifications++;
      }
    });

    const employeeSummaries = Array.from(employeeMap.values());

    // Calculate summary stats
    const stats = {
      totalEmployees: employeeSummaries.length,
      totalCertifications: employeeSummaries.reduce((sum: number, emp: any) => sum + emp.totalCertifications, 0),
      activeCertifications: employeeSummaries.reduce((sum: number, emp: any) => sum + emp.activeCertifications, 0),
      expiredCertifications: employeeSummaries.reduce((sum: number, emp: any) => sum + emp.expiredCertifications, 0)
    };

    // Derive logo URL so Puppeteer can load it while rendering static HTML
    const originHeader = (req.headers['x-forwarded-host'] || req.headers.host) as string | undefined;
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (originHeader ? `${req.headers['x-forwarded-proto'] || 'https'}://${originHeader}` : '');
    const logoUrl = origin ? `${origin}/IronStampLogov3.png` : undefined;

    // Generate HTML content
    const htmlContent = generateSimplePDFHTML(companyName, employeeSummaries, stats, logoUrl);

    // Environment-specific Puppeteer configuration
    if (process.env.NODE_ENV === 'development') {
      // Local development: use regular puppeteer
      const puppeteer = (await import('puppeteer')).default;
    browser = await puppeteer.launch({
      headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      // Production: use serverless-optimized chromium with remote executable
      const puppeteerCore = (await import('puppeteer-core')).default;
      const chromium = (await import('@sparticuz/chromium')).default;
      
      // Use remote chromium executable for Vercel serverless
      const remoteChromiumUrl = 'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';
      const executablePath = await chromium.executablePath(remoteChromiumUrl);
      
      browser = await puppeteerCore.launch({
      args: [
          ...chromium.args,
          '--disable-gpu',
          '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
          '--no-sandbox',
        '--no-zygote',
          '--single-process',
          '--disable-extensions'
        ],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
      });
    }
    
    const page = await browser.newPage();
    
    // Set a longer timeout and better page configuration
    await page.setDefaultTimeout(30000);
    await page.setContent(htmlContent, {
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 30000
    });
    
    // Wait a bit more to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.8cm',
        right: '0.8cm',
        bottom: '0.8cm',
        left: '0.8cm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: false,
      scale: 0.8
    });
    
    await browser.close();
    browser = null;

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    console.log('Generated PDF size:', pdfBuffer.length, 'bytes');
    
    // Check if PDF exceeds Next.js 4MB limit (use 3.5MB as safety margin)
    const maxSize = 3.5 * 1024 * 1024; // 3.5MB in bytes
    if (pdfBuffer.length > maxSize) {
      console.error('PDF size exceeds limit:', pdfBuffer.length, 'bytes (max:', maxSize, 'bytes)');
      return res.status(413).json({ 
        error: 'Report is too large to generate. Try filtering your data or contact support for a custom report.',
        size: pdfBuffer.length,
        maxSize 
      });
    }

    // Set security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="team-certification-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    // Ensure we have a proper Buffer and write binary data correctly
    const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    res.status(200);
    res.write(buffer);
    res.end();
    return;

  } catch (error) {
    console.error('Report generation error:', error);
    
    // Ensure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return res.status(500).json({ error: 'Report generation failed' });
  }
} 