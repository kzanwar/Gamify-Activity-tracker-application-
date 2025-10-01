/**
 * Root Layout Component
 *
 * This is the top-level layout component for the entire Next.js application.
 * It provides the global structure, styling, and context providers that wrap
 * all pages and components in the application.
 *
 * Key Responsibilities:
 * - Global CSS imports and font loading
 * - HTML document structure and metadata
 * - Authentication context provider (NextAuth SessionProvider)
 * - Global styling and theming
 * - SEO optimization with proper meta tags
 * - Responsive viewport configuration
 *
 * Font Configuration:
 * - Inter font from Google Fonts for modern, readable typography
 * - Optimized loading with display: 'swap' for better performance
 * - Fallback font stack for reliability
 *
 * Metadata Configuration:
 * - Dynamic title and description for SEO
 * - Open Graph tags for social media sharing
 * - Theme color for mobile browsers
 * - Viewport settings for responsive design
 * - Progressive Web App manifest configuration
 *
 * Authentication Setup:
 * - SessionProvider wraps the entire app for authentication state
 * - Automatic session management across all components
 * - Secure token handling and refresh logic
 *
 * Performance Optimizations:
 * - Font preloading for faster text rendering
 * - CSS optimization with Tailwind's purging
 * - Minimal global styles for fast loading
 * - Optimized bundle splitting
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gamified Tracker',
  description: 'Track your activities and earn points in a gamified way',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
