import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

import { ThemeProvider } from './ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dzota - Hệ Thống Thi Trắc Nghiệm',
  description: 'Hệ thống thi trắc nghiệm và quản lý ngân hàng môn học Dzota',
  icons: {
    icon: '/logo-dzota.png',
    shortcut: '/logo-dzota.png',
    apple: '/logo-dzota.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Dzota - Thư Viện Đề Thi & Trắc Nghiệm',
    description: 'Hệ thống thi trắc nghiệm trực quan, hiện đại Dzota. Bấm để bắt đầu làm bài.',
    url: 'https://dzota.edu.vn',
    siteName: 'Dzota Quiz',
    images: [
      {
        url: 'https://i.ibb.co/YBCrhtwk/logo-dzota.png',
        width: 1200,
        height: 630,
        alt: 'Dzota Logo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dzota - Hệ Thống Thi Trắc Nghiệm',
    description: 'Hệ thống thi trắc nghiệm trực quan, hiện đại Dzota',
    images: ['https://i.ibb.co/YBCrhtwk/logo-dzota.png'],
  },
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
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
