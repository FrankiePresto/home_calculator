import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Home Purchase Analyzer | Should I Rent or Buy?',
  description: 'A comprehensive financial calculator to help first-time homebuyers compare the true costs of renting vs buying a home. Make informed decisions with detailed projections and insights.',
  keywords: ['rent vs buy', 'home purchase calculator', 'first time homebuyer', 'mortgage calculator', 'housing affordability'],
}

export const viewport: Viewport = {
  themeColor: '#d97706',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
