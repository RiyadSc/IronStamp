import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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
  expiration_date: string;
  priority: string | null;
  notes: string | null;
}

// Safe HTML escaping for server-side
function safeEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function generateSimpleCompliancePDFHTML(companyName: string, stats: any, priorityActions: any[], employeeSummaries: any[]): string {
  const complianceRate = stats.activeCertifications > 0 
    ? Math.round((stats.activeCertifications / (stats.activeCertifications + stats.expiredCertifications)) * 100)
    : 0;

  const safeCompanyName = safeEscape(companyName);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compliance Summary Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
        }
        
        .section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .summary-box {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 25px;
        }
        
        .summary-text {
            font-size: 16px;
            line-height: 1.6;
        }
        
        .compliance-meter {
            background: #e5e7eb;
            border-radius: 10px;
            height: 30px;
            margin: 15px 0;
            position: relative;
            overflow: hidden;
        }
        
        .compliance-fill {
            background: linear-gradient(90deg, #dc2626, #f59e0b, #10b981);
            height: 100%;
            border-radius: 10px;
            width: ${complianceRate}%;
        }
        
        .compliance-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: bold;
            color: white;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
            display: block;
        }
        
        .stat-label {
            font-size: 14px;
            color: #64748b;
        }
        
        .priority-high {
            color: #dc2626;
            font-weight: bold;
        }
        
        .priority-medium {
            color: #f59e0b;
            font-weight: bold;
        }
        
        .priority-low {
            color: #059669;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
            font-size: 12px;
        }
        
        th {
            background: #f9fafb;
            font-weight: 600;
        }
        
        .recommendations {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin-top: 25px;
        }
        
        .recommendations h4 {
            margin-top: 0;
            color: #92400e;
        }
        
        .rec-list {
            list-style-type: none;
            padding: 0;
        }
        
        .rec-list li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .rec-list li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
        }
        
        @media print {
            .section {
                page-break-inside: avoid;
            }
            
            @page {
                margin: 2cm;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">Compliance Summary Report</div>
            <div class="subtitle">Company: ${safeCompanyName}</div>
            <div class="subtitle">Generated: ${currentDate}</div>
            <div class="subtitle">Reporting Period: Current Status</div>
        </div>
        
        <div class="section">
            <div class="summary-box">
                <div class="summary-text">
                    <strong>Executive Summary:</strong><br>
                    Your organization maintains ${stats.totalEmployees} active employees with ${stats.activeCertifications + stats.expiredCertifications} total certifications. 
                    Current compliance rate is <strong>${complianceRate}%</strong> with ${stats.expiredCertifications} expired certifications requiring immediate attention.
                </div>
            </div>
            
            <div class="compliance-meter">
                <div class="compliance-fill"></div>
                <div class="compliance-text">${complianceRate}% Compliance Rate</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Key Metrics</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${stats.totalEmployees}</span>
                    <div class="stat-label">Active Employees</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.activeCertifications + stats.expiredCertifications}</span>
                    <div class="stat-label">Total Certifications</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.activeCertifications}</span>
                    <div class="stat-label">Active Certifications</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.expiredCertifications}</span>
                    <div class="stat-label">Expired Certifications</div>
                </div>
            </div>
        </div>

        ${priorityActions.length > 0 ? `
            <div class="section">
                <div class="section-title">Priority Actions Required</div>
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Certification</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Action Required</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${priorityActions.slice(0, 15).map(action => `
                            <tr>
                                <td>${safeEscape(action.employee)}</td>
                                <td>${safeEscape(action.certification)}</td>
                                <td>${action.type === 'expired' ? 'EXPIRED' : `Expires in ${action.daysLeft} days`}</td>
                                <td class="priority-${action.priority}">${action.priority.toUpperCase()}</td>
                                <td>${action.type === 'expired' ? 'Immediate renewal required' : 'Schedule renewal'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${priorityActions.length > 15 ? `<p><em>Showing top 15 priority actions. Total: ${priorityActions.length}</em></p>` : ''}
            </div>
        ` : ''}

        <div class="section">
            <div class="section-title">Employee Breakdown</div>
            <table>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Total Certs</th>
                        <th>Active</th>
                        <th>Expiring Soon</th>
                        <th>Expired</th>
                        <th>Compliance Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${employeeSummaries.map(employee => {
                      const empCompliance = employee.totalCertifications > 0 
                        ? Math.round((employee.activeCertifications / employee.totalCertifications) * 100) 
                        : 0;
                      return `
                        <tr>
                            <td>${safeEscape(employee.employeeName)}</td>
                            <td>${employee.totalCertifications}</td>
                            <td>${employee.activeCertifications}</td>
                            <td>${employee.expiringSoonCertifications}</td>
                            <td>${employee.expiredCertifications}</td>
                            <td class="${empCompliance >= 80 ? 'priority-low' : empCompliance >= 60 ? 'priority-medium' : 'priority-high'}">${empCompliance}%</td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="recommendations">
            <h4>Recommended Actions</h4>
            <ul class="rec-list">
                ${stats.expiredCertifications > 0 ? `<li>Immediate attention required for ${stats.expiredCertifications} expired certifications</li>` : ''}
                ${stats.expiringSoon > 0 ? `<li>Schedule renewal for ${stats.expiringSoon} certifications expiring within 30 days</li>` : ''}
                ${complianceRate < 80 ? `<li>Implement proactive renewal tracking to improve compliance rate above 80%</li>` : ''}
                <li>Set up automated notifications for certifications expiring in 60, 30, and 7 days</li>
                <li>Review and update certification requirements for each role</li>
                <li>Consider bulk renewal for multiple employees with similar certification types</li>
            </ul>
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

    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    
    // Get user from access token
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

    // Gather all data needed for compliance summary
    const [employeesResult, certificationsResult] = await Promise.all([
      supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id),
      
      supabase
        .from('certifications')
        .select('id, employee_name, certification_name, issue_date, expiration_date, priority, notes')
        .eq('user_id', user.id)
    ]);

    if (employeesResult.error || certificationsResult.error) {
      console.error('Database error:', employeesResult.error || certificationsResult.error);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    const allCertifications = certificationsResult.data || [];
    const totalEmployees = employeesResult.count || 0;

    // Calculate statistics
    let activeCertifications = 0;
    let expiredCertifications = 0;
    let expiringSoon = 0;
    const priorityActions: any[] = [];
    const employeeMap = new Map();

    allCertifications.forEach((cert: CertificationRow) => {
      const daysLeft = calculateDaysBetween(cert.expiration_date);
      let status = 'Active';
      
      if (daysLeft < 0) {
        status = 'Expired';
        expiredCertifications++;
      } else if (daysLeft <= 30) {
        status = 'Expiring Soon';
        expiringSoon++;
        if (daysLeft <= 7) {
          activeCertifications++;
        }
      } else {
        activeCertifications++;
      }

      // Add to priority actions if needed
      if (daysLeft < 0 || daysLeft <= 30) {
        let priority: 'high' | 'medium' | 'low' = 'low';
        let type: 'expiring' | 'expired' = 'expiring';
        
        if (daysLeft < 0) {
          type = 'expired';
          priority = 'high';
        } else if (daysLeft <= 7) {
          type = 'expiring';
          priority = 'high';
        } else if (daysLeft <= 30) {
          type = 'expiring';
          priority = 'medium';
        }
        
        if (priority === 'high' || priority === 'medium') {
          priorityActions.push({
            id: cert.id,
            type,
            employee: cert.employee_name,
            certification: cert.certification_name,
            daysLeft: daysLeft >= 0 ? daysLeft : undefined,
            priority,
            expirationDate: cert.expiration_date
          });
        }
      }

      // Group by employee for employee breakdown
      const employeeKey = cert.employee_name || 'Unknown Employee';
      if (!employeeMap.has(employeeKey)) {
        employeeMap.set(employeeKey, {
          employeeName: cert.employee_name || 'Unknown Employee',
          totalCertifications: 0,
          activeCertifications: 0,
          expiringSoonCertifications: 0,
          expiredCertifications: 0
        });
      }

      const employee = employeeMap.get(employeeKey);
      employee.totalCertifications++;

      if (status === 'Active') {
        employee.activeCertifications++;
      } else if (status === 'Expiring Soon') {
        employee.expiringSoonCertifications++;
      } else if (status === 'Expired') {
        employee.expiredCertifications++;
      }
    });

    const stats = {
      totalEmployees,
      activeCertifications,
      expiredCertifications,
      expiringSoon
    };

    const employeeSummaries = Array.from(employeeMap.values());

    // Sort priority actions by priority and days left
    priorityActions.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      if (a.type === 'expired' && b.type !== 'expired') return -1;
      if (a.type !== 'expired' && b.type === 'expired') return 1;
      return (a.daysLeft || -999) - (b.daysLeft || -999);
    });

    // Generate HTML content
    const htmlContent = generateSimpleCompliancePDFHTML(companyName, stats, priorityActions, employeeSummaries);

    // Environment-specific Puppeteer configuration
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      platform: process.platform
    });

    if (process.env.NODE_ENV === 'development') {
      // Local development: use regular puppeteer
      console.log('📝 Using local puppeteer for development');
      const puppeteer = (await import('puppeteer')).default;
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      // Production: use serverless-optimized chromium
      console.log('🚀 Using serverless chromium for production');
      try {
        const puppeteerCore = (await import('puppeteer-core')).default;
        console.log('✅ Puppeteer-core imported successfully');
        
        const chromium = (await import('@sparticuz/chromium')).default;
        console.log('✅ Chromium imported successfully');
        
        const executablePath = await chromium.executablePath();
        console.log('📍 Chromium executable path:', executablePath);
        
        browser = await puppeteerCore.launch({
          args: [...chromium.args, '--disable-gpu', '--no-first-run', '--no-zygote', '--single-process'],
          executablePath,
          headless: true,
        });
        console.log('✅ Browser launched successfully');
      } catch (importError: any) {
        console.error('❌ Import or launch error:', importError);
        throw new Error(`Browser setup failed: ${importError?.message || 'Unknown error'}`);
      }
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
    res.setHeader('Content-Disposition', `attachment; filename="compliance-summary-${new Date().toISOString().split('T')[0]}.pdf"`);
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