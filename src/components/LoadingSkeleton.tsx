'use client'

export function TabSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted/60 rounded" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted/40 rounded-xl border border-border/30" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-40 bg-muted/30 rounded-xl border border-border/30" />
        <div className="h-32 bg-muted/30 rounded-xl border border-border/30" />
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/30 bg-muted/20 p-4 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-32 bg-muted/60 rounded mb-2" />
      <div className="h-3 w-48 bg-muted/40 rounded" />
    </div>
  )
}
