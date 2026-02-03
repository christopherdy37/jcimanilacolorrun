import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'JCI Manila Color Run | Color Run for Mental Health',
  description: 'Join us for the JCI Manila Color Run - A vibrant event supporting mental health awareness',
  keywords: 'color run, mental health, JCI Manila, fun run, charity run',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  )
}

