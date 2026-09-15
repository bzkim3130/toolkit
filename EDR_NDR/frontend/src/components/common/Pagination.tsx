interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
      <span>
        총 {total.toLocaleString()}건 중 {from.toLocaleString()}-{to.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-slate-700 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          이전
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          className="rounded-md border border-slate-700 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          다음
        </button>
      </div>
    </div>
  )
}
