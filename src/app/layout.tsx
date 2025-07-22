import { Navbar } from '@/components/Navbar'
import { Providers } from '@/components/providers'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'therajai - Mental Health Platform for Thailand',
  description: 'Connect with licensed therapists in Thailand. Professional mental health support in Thai language.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}