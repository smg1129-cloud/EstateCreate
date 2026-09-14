import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'EstateCreate — Automated Florida Estate Planning',
  description:
    'Answer a guided questionnaire and receive attorney-reviewed Florida estate planning documents — wills, trusts, powers of attorney, and health care directives.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
