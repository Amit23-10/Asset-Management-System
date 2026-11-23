import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from '@/components/auth/session-provider'
import { getServerAuthSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Meal Management',
    template: '%s · Meal Management',
  },
  description: 'Continental Works meal operations workspace.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession()

  return (
    <html lang="en" className={cn('font-sans', jakarta.variable)}>
      <body>
        <TooltipProvider>
          <SessionProvider user={session.user}>{children}</SessionProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
