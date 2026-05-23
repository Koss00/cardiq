export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-8 w-32 bg-white/5 rounded-md" />

      {/* Search / filter bar */}
      <div className="flex gap-3">
        <div className="flex-1 h-11 bg-white/5 rounded-md border border-white/[0.06]" />
        <div className="h-11 w-28 bg-white/5 rounded-md border border-white/[0.06]" />
      </div>

      {/* Result rows */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-white/[0.04] last:border-0 bg-white/[0.02]" />
        ))}
      </div>
    </div>
  );
}
