import { useState } from 'react'

export function VendorChips({ vendors }: { vendors: string[] }) {
  const [expanded, setExpanded] = useState(false)

  if (vendors.length === 0) {
    return <p className="text-sm text-slate-500">탐지한 보안 엔진이 없습니다.</p>
  }

  const shown = expanded ? vendors : vendors.slice(0, 12)

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((v) => (
          <span key={v} className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
            {v}
          </span>
        ))}
      </div>
      {vendors.length > 12 && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-1.5 text-xs text-cyan-400 hover:underline">
          {expanded ? '접기' : `외 ${vendors.length - 12}개 더 보기`}
        </button>
      )}
    </div>
  )
}
