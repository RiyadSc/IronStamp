# IronStamp - HVAC Certification Management Platform

[![IronStamp](https://img.shields.io/badge/IronStamp-HVAC%20Compliance-blue?style=for-the-badge&logo=shield)](https://ironstamp.app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat&logo=supabase)](https://supabase.com/)

> **Stop losing money to expired HVAC licenses in Massachusetts.** Track EPA 608, OSHA 10/30, and Massachusetts state license expirations for every tech on your team. We send reminders, store files, and keep you compliant.

## 🏗️ Project Overview

IronStamp is a comprehensive SaaS platform designed specifically for HVAC companies to manage technician certifications and maintain regulatory compliance. Built for Massachusetts HVAC teams, it automates the tracking of EPA 608, OSHA 10/30, and state licensing requirements.

### 🎯 Key Features

- **📅 Automated Renewal Reminders** - Get notified 90, 60, 30, and 7 days before any license expires
- **🔒 Secure Document Storage** - Bank-level encryption for all certification files
- **👥 Team Management** - Role-based access for managers and technicians
- **📧 Smart Notifications** - Email and SMS alerts for critical renewals
- **📊 Compliance Reports** - Generate audit-ready reports instantly
- **📱 Mobile-Ready** - Works perfectly on all devices
- **🔄 Data Export** - Export all data in multiple formats (PDF, CSV, ZIP)

## 🚀 Live Demo

**Production Site:** [https://ironstamp.app](https://ironstamp.app)

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Radix UI** - Accessible UI primitives
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Infrastructure
- **Supabase** - Database, authentication, and real-time features
- **Resend** - Email delivery service
- **Vercel** - Hosting and deployment
- **Puppeteer** - PDF generation for reports
- **@sparticuz/chromium** - Serverless PDF rendering

### Authentication & Security
- **Supabase Auth** - OAuth (Google), email/password, magic links
- **Row Level Security (RLS)** - Data isolation per user
- **PKCE Flow** - Secure authentication
- **Session Management** - Persistent user sessions

## 📁 Project Structure

```
cert-keeper-landing-page/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── onboarding/      # Onboarding flow components
│   └── blocks/          # Reusable UI blocks
├── pages/               # Next.js pages
│   ├── api/             # API routes
│   ├── auth/            # Authentication pages
│   └── onboarding/      # Onboarding flow
├── lib/                 # Utility libraries
│   ├── supabase.ts      # Supabase client
│   ├── data-service.ts  # Data access layer
│   ├── notification-service.ts  # Email notifications
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
├── public/              # Static assets
└── styles.css           # Global styles
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **npm** or **yarn** or **bun**
- **Supabase** account
- **Resend** account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cert-keeper-landing-page
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Email Service (Resend)
   RESEND_API_KEY=your_resend_api_key

   # File Upload Limits
   NEXT_PUBLIC_MAX_FILE_SIZE=20971520

   # Optional: OpenAI for AI features
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see Database Setup below)
   - Configure authentication providers (Google OAuth)
   - Set up Row Level Security policies

5. **Start the development server**
   ```bash
npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Required Tables

The application requires the following Supabase tables:

- `profiles` - User profile information
- `certifications` - Certification records
- `employees` - Team member information
- `notification_logs` - Email notification history
- `scheduled_notifications` - Future notification scheduling
- `activity_logs` - User activity tracking

### Row Level Security (RLS)

All tables implement RLS policies to ensure users can only access their own data:

```sql
-- Example RLS policy for certifications table
CREATE POLICY "Users can only access their own certifications"
ON certifications FOR ALL
USING (user_id = auth.uid());
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Structure

- **Components**: Reusable UI components in `components/`
- **Pages**: Next.js pages in `pages/`
- **API Routes**: Serverless functions in `pages/api/`
- **Hooks**: Custom React hooks in `hooks/`
- **Services**: Business logic in `lib/`

### Authentication Flow

1. **Sign Up**: Users can sign up with email/password or Google OAuth
2. **Onboarding**: Multi-step onboarding process for company setup
3. **Dashboard**: Main application with certification management
4. **Session Management**: Automatic session refresh and recovery

## 📧 Email Notifications

IronStamp uses Resend for email delivery with the following templates:

- **60-day reminders** - Early warning notifications
- **30-day reminders** - Important renewal notices
- **14-day reminders** - Urgent renewal alerts
- **7-day reminders** - Critical expiration warnings
- **Expired notices** - Immediate action required

### Email Configuration

```typescript
// lib/notification-service.ts
const resend = new Resend(process.env.RESEND_API_KEY);

// Send email notification
const response = await resend.emails.send({
  from: 'notifications@ironstamp.app',
  to: employeeEmail,
  subject: template.subject,
  html: template.html,
});
```

## 📊 Reporting & Analytics

### Available Reports

- **Compliance Summary** - Overall team compliance status
- **Expiration Calendar** - Visual calendar of upcoming expirations
- **Team Certification Report** - Detailed certification breakdown
- **Individual Employee Reports** - Per-employee certification status

### PDF Generation

Reports are generated using Puppeteer with serverless-optimized Chromium:

```typescript
// Environment-specific configuration
if (process.env.NODE_ENV === 'development') {
  // Local development: use regular puppeteer
  browser = await puppeteer.launch({ headless: true });
} else {
  // Production: use serverless-optimized chromium
  const executablePath = await chromium.executablePath(remoteChromiumUrl);
  browser = await puppeteerCore.launch({ executablePath, headless: true });
}
```

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level data isolation
- **OAuth 2.0 with PKCE** - Secure authentication flow
- **Session Management** - Automatic token refresh
- **File Upload Validation** - Secure file handling
- **Rate Limiting** - API request throttling
- **Input Validation** - Zod schema validation

## 🚀 Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel automatically builds and deploys

### Environment Variables for Production

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Email
RESEND_API_KEY=your_production_resend_key

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=20971520

# Custom Domain (if using)
NEXT_PUBLIC_SITE_URL=https://ironstamp.app
```

## 📱 Mobile Support

IronStamp is fully responsive and works on:
- **Desktop browsers** (Chrome, Firefox, Safari, Edge)
- **Mobile browsers** (iOS Safari, Chrome Mobile)
- **Tablet devices** (iPad, Android tablets)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://ironstamp.app/docs](https://ironstamp.app/docs)
- **Email Support**: support@ironstamp.app
- **Live Chat**: Available on the website
- **GitHub Issues**: For bug reports and feature requests

## 🏢 About IronStamp

IronStamp is built specifically for HVAC companies in Massachusetts to manage technician certifications and maintain regulatory compliance. Our mission is to prevent work stoppages due to expired licenses and ensure teams stay compliant with state and federal regulations.

**Built with ❤️ for HVAC professionals**

---

*IronStamp - The smart way to track HVAC technician licenses and certifications. Never miss a deadline again.*
