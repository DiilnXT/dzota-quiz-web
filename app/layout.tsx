import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

import { ThemeProvider } from './ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hệ Thống Thi Trắc Nghiệm',
  description: 'Hệ thống thi trắc nghiệm và quản lý ngân hàng môn học',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('dzota_theme');
                if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} transition-colors duration-200`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  )
}
