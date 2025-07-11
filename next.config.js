/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  // Required for serverless chromium support in Vercel
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
}

module.exports = nextConfig 