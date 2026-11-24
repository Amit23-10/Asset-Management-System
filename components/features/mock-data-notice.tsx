import { MOCK_DATA_MESSAGE } from '@/lib/mock-data'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

/**
 * Displayed whenever sample data replaces an unavailable ERP response.
 */
export function MockDataNotice({ className }: { className?: string }) {
  return (
    <Alert className={cn('border-amber-200 bg-amber-50 text-amber-900', className)}>
      <AlertDescription className="text-amber-900">{MOCK_DATA_MESSAGE}</AlertDescription>
    </Alert>
  )
}
