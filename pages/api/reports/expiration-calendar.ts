import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Environment validation
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
}

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

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

// Input validation
function validateAuthHeader(authHeader: string | undefined): string | null {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.slice(7);
  
  if (!/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
    return null;
  }
  
  return token;
}

const calculateDaysBetween = (date1: string, date2?: string): number => {
  const targetDate = new Date(date1);
  const compareDate = date2 ? new Date(date2) : new Date();
  const timeDiff = targetDate.getTime() - compareDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

// Safe HTML escaping
function safeEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

interface ExpiringCertification {
  id: string;
  employee_name: string;
  certification_name: string;
  expiration_date: string;
  priority: string | null;
}

// Calendar generation functions
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function generateCalendarMonth(year: number, month: number, certificationsByDate: Map<string, any[]>): string {
  const monthName = getMonthName(month);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let calendarHTML = `
    <div class="calendar-month">
      <div class="month-header">
        <h2>${monthName} ${year}</h2>
      </div>
      <div class="calendar-grid">
        <div class="day-headers">
          ${dayNames.map(day => `<div class="day-header">${day}</div>`).join('')}
        </div>
        <div class="calendar-days">
  `;
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += '<div class="calendar-day empty"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const expirations = certificationsByDate.get(dateKey) || [];
    
    let dayClass = 'calendar-day';
    if (expirations.length > 0) {
      const hasExpired = expirations.some(cert => calculateDaysBetween(cert.expiration_date) < 0);
      const hasExpiringSoon = expirations.some(cert => {
        const daysLeft = calculateDaysBetween(cert.expiration_date);
        return daysLeft >= 0 && daysLeft <= 30;
      });
      
      if (hasExpired) {
        dayClass += ' has-expired';
      } else if (hasExpiringSoon) {
        dayClass += ' has-expiring';
      }
    }
    
    calendarHTML += `
      <div class="${dayClass}">
        <div class="day-number">${day}</div>
        <div class="day-content">
          ${expirations.map(cert => {
            const daysLeft = calculateDaysBetween(cert.expiration_date);
            const isExpired = daysLeft < 0;
            const priority = cert.priority || 'medium';
            
            return `
              <div class="expiration-item priority-${priority} ${isExpired ? 'expired' : ''}">
                <div class="cert-name">${safeEscape(cert.certification_name)}</div>
                <div class="employee-name">${safeEscape(cert.employee_name)}</div>
                ${isExpired ? 
                  `<div class="status expired">EXPIRED</div>` : 
                  `<div class="status expiring">${daysLeft === 0 ? 'Today' : `${daysLeft}d left`}</div>`
                }
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  calendarHTML += `
        </div>
      </div>
    </div>
  `;
  
  return calendarHTML;
}

function generateCalendarPDFHTML(companyName: string, certifications: ExpiringCertification[]): string {
  const safeCompanyName = safeEscape(companyName);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Group certifications by date
  const certificationsByDate = new Map<string, ExpiringCertification[]>();
  
  certifications.forEach(cert => {
    const date = cert.expiration_date;
    if (!certificationsByDate.has(date)) {
      certificationsByDate.set(date, []);
    }
    certificationsByDate.get(date)!.push(cert);
  });
  
  // Generate calendar for current month and next 11 months (12 total)
  const calendarMonths = [];
  for (let i = 0; i < 6; i++) { // Reduced from 12 to 6 months to manage file size
    const monthDate = new Date(currentYear, currentMonth + i, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    calendarMonths.push(generateCalendarMonth(year, month, certificationsByDate));
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certification Expiration Calendar</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px; /* Reduced from 12px */
            line-height: 1.1; /* Reduced from 1.2 */
            color: #333;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px; /* Reduced from 20px */
            padding: 10px; /* Reduced from 15px */
            border-bottom: 2px solid #2563eb;
        }
        
        .title {
            font-size: 20px; /* Reduced from 24px */
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
        }
        
        .subtitle {
            font-size: 12px; /* Reduced from 14px */
            color: #64748b;
        }
        
        .calendar-month {
            page-break-before: always;
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .calendar-month:first-child {
            page-break-before: avoid;
        }
        
        .month-header {
            text-align: center;
            padding: 15px 0; /* Reduced from 20px */
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            margin-bottom: 8px; /* Reduced from 10px */
        }
        
        .month-header h2 {
            font-size: 24px; /* Reduced from 28px */
            font-weight: bold;
        }
        
        .calendar-grid {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .day-headers {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px; /* Reduced from 2px */
            margin-bottom: 1px; /* Reduced from 2px */
        }
        
        .day-header {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 6px 3px; /* Reduced from 8px 4px */
            text-align: center;
            font-weight: bold;
            font-size: 12px; /* Reduced from 14px */
            color: #475569;
        }
        
        .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(6, 1fr);
            gap: 1px; /* Reduced from 2px */
            flex: 1;
        }
        
        .calendar-day {
            border: 1px solid #e2e8f0;
            background: white;
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 100px; /* Reduced from 120px */
        }
        
        .calendar-day.empty {
            background: #f9fafb;
            border-color: #f1f5f9;
        }
        
        .calendar-day.has-expiring {
            background: #fef3c7;
            border-color: #f59e0b;
        }
        
        .calendar-day.has-expired {
            background: #fecaca;
            border-color: #dc2626;
        }
        
        .day-number {
            position: absolute;
            top: 3px; /* Reduced from 4px */
            left: 5px; /* Reduced from 6px */
            font-weight: bold;
            font-size: 14px; /* Reduced from 16px */
            color: #374151;
            z-index: 1;
        }
        
        .has-expiring .day-number {
            color: #92400e;
        }
        
        .has-expired .day-number {
            color: #991b1b;
        }
        
        .day-content {
            padding: 18px 3px 3px 3px; /* Reduced padding */
            overflow: hidden;
            flex: 1;
        }
        
        .expiration-item {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 3px; /* Reduced from 4px */
            padding: 2px; /* Reduced from 3px */
            margin-bottom: 1px; /* Reduced from 2px */
            font-size: 8px; /* Reduced from 9px */
            line-height: 1.0; /* Reduced from 1.1 */
        }
        
        .expiration-item.priority-high {
            border-color: #dc2626;
            background: #fef2f2;
        }
        
        .expiration-item.priority-medium {
            border-color: #f59e0b;
            background: #fffbeb;
        }
        
        .expiration-item.priority-low {
            border-color: #059669;
            background: #f0fdf4;
        }
        
        .expiration-item.expired {
            border-color: #991b1b;
            background: #fecaca;
        }
        
        .cert-name {
            font-weight: bold;
            color: #374151;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%; /* Limit text width */
        }
        
        .employee-name {
            color: #6b7280;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%; /* Limit text width */
        }
        
        .status {
            font-size: 7px; /* Reduced from 8px */
            font-weight: bold;
            text-align: center;
            padding: 1px;
            border-radius: 2px;
            margin-top: 1px;
        }
        
        .status.expired {
            background: #dc2626;
            color: white;
        }
        
        .status.expiring {
            background: #f59e0b;
            color: white;
        }
        
        .legend {
            position: fixed;
            bottom: 8px; /* Reduced from 10px */
            right: 8px; /* Reduced from 10px */
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 5px; /* Reduced from 6px */
            padding: 6px; /* Reduced from 8px */
            font-size: 9px; /* Reduced from 10px */
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 1px; /* Reduced from 2px */
        }
        
        .legend-color {
            width: 10px; /* Reduced from 12px */
            height: 10px; /* Reduced from 12px */
            border-radius: 2px;
            margin-right: 3px; /* Reduced from 4px */
            border: 1px solid #d1d5db;
        }
        
        .legend-expired { background: #fecaca; }
        .legend-expiring { background: #fef3c7; }
        .legend-normal { background: white; }
        
        @page {
            size: A4 landscape;
            margin: 0.8cm; /* Reduced from 1cm */
        }
        
        @media print {
            .calendar-month {
                page-break-before: always;
                height: 100vh;
            }
            
            .calendar-month:first-child {
                page-break-before: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Certification Expiration Calendar</div>
        <div class="subtitle">Company: ${safeCompanyName}</div>
        <div class="subtitle">Generated: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
        <div class="subtitle">Showing Next 6 Months</div>
    </div>
    
    ${calendarMonths.join('')}
    
    <div class="legend">
        <div class="legend-item">
            <div class="legend-color legend-expired"></div>
            <span>Expired</span>
        </div>
        <div class="legend-item">
            <div class="legend-color legend-expiring"></div>
            <span>Expiring Soon</span>
        </div>
        <div class="legend-item">
            <div class="legend-color legend-normal"></div>
            <span>Normal</span>
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

    // Get expiring certifications (next 12 months and recently expired)
    const twelveMonthsFromNow = new Date();
    twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);
    
    const { data: certifications, error: certsError } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, expiration_date, priority')
      .eq('user_id', user.id)
      .lte('expiration_date', twelveMonthsFromNow.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true }) as { data: ExpiringCertification[] | null, error: any };

    if (certsError) {
      console.error('Database error:', certsError.message);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    if (!certifications || certifications.length === 0) {
      return res.status(404).json({ error: 'No expiring certifications found' });
    }

    // Filter relevant certifications (next 12 months and last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const relevantCertifications = certifications.filter((cert) => {
      const expirationDate = new Date(cert.expiration_date);
      return expirationDate >= thirtyDaysAgo;
    });

    if (relevantCertifications.length === 0) {
      return res.status(404).json({ error: 'No relevant certifications found in the date range' });
    }

    // Generate HTML content
    const htmlContent = generateCalendarPDFHTML(companyName, relevantCertifications);

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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 1500ms
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true, // Horizontal orientation
      printBackground: true,
      margin: {
        top: '0.8cm',
        right: '0.8cm',
        bottom: '0.8cm',
        left: '0.8cm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      scale: 0.8 // Reduce scale to make content smaller
    });
    
    await browser.close();
    browser = null;

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    console.log('Generated Calendar PDF size:', pdfBuffer.length, 'bytes');
    
    // Check if PDF exceeds Next.js 4MB limit (use 3.5MB as safety margin)
    const maxSize = 3.5 * 1024 * 1024; // 3.5MB in bytes
    if (pdfBuffer.length > maxSize) {
      console.error('PDF size exceeds limit:', pdfBuffer.length, 'bytes (max:', maxSize, 'bytes)');
      return res.status(413).json({ 
        error: 'Calendar is too large to generate. Please contact support for a custom report.',
        size: pdfBuffer.length,
        maxSize 
      });
    }

    // Set security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certification-expiration-calendar-${new Date().toISOString().split('T')[0]}.pdf"`);
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
    console.error('Calendar generation error:', error);
    
    // Ensure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return res.status(500).json({ error: 'Calendar generation failed' });
  }
} 