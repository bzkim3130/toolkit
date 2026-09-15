import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAgents } from '../api/agents'
import { AgentFilterBar } from '../components/agents/AgentFilterBar'
import { AgentTable } from '../components/agents/AgentTable'
import { AgentDetailDrawer } from '../components/agents/AgentDetailDrawer'
import { Pagination } from '../components/common/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { AgentStatus } from '../types/agent'

const PAGE_SIZE = 20

export function AgentsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<AgentStatus | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const debouncedQ = useDebouncedValue(q, 300)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['agents', { q: debouncedQ, status, page }],
    queryFn: () => listAgents({ q: debouncedQ || undefined, status, page, page_size: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-100">Agent</h1>
          <p className="text-sm text-slate-500">EDR 에이전트가 설치된 엔드포인트 목록을 조회합니다.</p>
        </div>

        <AgentFilterBar
          q={q}
          onQChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          status={status}
          onStatusChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
        />

        <div className={`min-h-0 flex-1 overflow-y-auto ${isPlaceholderData ? 'opacity-60' : ''}`}>
          <AgentTable
            agents={data?.items ?? []}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      </div>

      {selectedId && <AgentDetailDrawer agentId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
