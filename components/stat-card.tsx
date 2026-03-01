import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'destructive'
}

export function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden",
      variant === 'primary' && "border-primary/20 bg-primary/5",
      variant === 'secondary' && "border-secondary/20 bg-secondary/5",
      variant === 'success' && "border-success/20 bg-success/5",
      variant === 'destructive' && "border-destructive/20 bg-destructive/5"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            variant === 'default' && "bg-muted",
            variant === 'primary' && "bg-primary/10",
            variant === 'secondary' && "bg-secondary/20",
            variant === 'success' && "bg-success/10",
            variant === 'destructive' && "bg-destructive/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              variant === 'default' && "text-muted-foreground",
              variant === 'primary' && "text-primary",
              variant === 'secondary' && "text-secondary-foreground",
              variant === 'success' && "text-success",
              variant === 'destructive' && "text-destructive"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
