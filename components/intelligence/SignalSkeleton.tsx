export default function SignalSkeleton({ player }: { player: string }) {
  return (
    <div className="border border-[#1E2D45] rounded-md overflow-hidden bg-[#111D33]">
      {/* Header */}
      <div className="bg-[#0A1628]/60 px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-sm skeleton flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm mb-1.5 truncate">{player}</p>
            <div className="w-14 h-4 rounded-sm skeleton" />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="w-16 h-3 rounded-sm skeleton mb-2 ml-auto" />
          <div className="w-28 h-2 rounded-full skeleton" />
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-3 border-b border-[rgba(245,200,66,0.06)] bg-navy-900/40 space-y-2">
        <div className="w-full h-3.5 rounded-sm skeleton" />
        <div className="w-3/4 h-3.5 rounded-sm skeleton" />
      </div>

      {/* Three dimension panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[rgba(245,200,66,0.06)] bg-navy-900/20">
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-4 py-4 space-y-2">
            <div className="w-24 h-3 rounded-sm skeleton" />
            <div className="w-full h-2.5 rounded-sm skeleton" />
            <div className="w-5/6 h-2.5 rounded-sm skeleton" />
            <div className="w-4/6 h-2.5 rounded-sm skeleton" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[rgba(245,200,66,0.06)] bg-navy-950/40 flex items-center justify-between gap-4">
        <div className="w-28 h-3 rounded-sm skeleton" />
        <div className="w-36 h-3 rounded-sm skeleton" />
      </div>
    </div>
  );
}
