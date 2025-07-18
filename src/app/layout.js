"use client"
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import image from '../../public/clock.png'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
