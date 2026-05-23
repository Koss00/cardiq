export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-white/5 rounded-md" />
        <div className="h-9 w-28 bg-white/5 rounded-md" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-52 bg-white/5 rounded-xl border border-white/[0.06]"
          />
        ))}
      </div>
    </div>
  );
}
