import { Inter, Space_Grotesk } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/hooks/useToast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'arquivos do templo - Seu Leitor Digital Premium',
  description: 'Leitor de EPUB e PDF com interface moderna e minimalista.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-blue-500/30 selection:text-blue-200" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
