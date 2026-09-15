import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'
import { testConnection } from '../../api/settings'
import type { ConnectionTarget } from '../../types/settings'

export function TestConnectionButton({ target }: { target: ConnectionTarget }) {
  const mutation = useMutation({ mutationFn: () => testConnection(target) })

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-900 disabled:opacity-50"
      >
        {mutation.isPending ? '확인 중...' : '연결 테스트'}
      </button>
      {mutation.data && (
        <span className={`flex items-center gap-1 text-xs ${mutation.data.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {mutation.data.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {mutation.data.message}
        </span>
      )}
    </div>
  )
}
