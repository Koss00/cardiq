export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-white/5 rounded-md" />
        <div className="h-9 w-36 bg-white/5 rounded-md" />
      </div>

      {/* Narrative panel skeleton */}
      <div className="h-44 bg-white/5 rounded-xl border border-white/[0.06]" />

      {/* Signal cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-white/5 rounded-xl border border-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
