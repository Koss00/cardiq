export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-white/5 rounded-md" />
        <div className="h-9 w-32 bg-white/5 rounded-md" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/5 rounded-xl border border-white/[0.06]" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="h-12 border-b border-white/[0.06] bg-white/[0.03]" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-white/[0.04] last:border-0" />
        ))}
      </div>
    </div>
  );
}
