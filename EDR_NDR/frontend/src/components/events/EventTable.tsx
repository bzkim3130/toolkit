import { EVENT_TYPE_LABEL } from '../../lib/labels'
import { formatDateTime } from '../../lib/format'
import type { EventOut } from '../../types/event'

interface Props {
  events: EventOut[]
  isLoading: boolean
  onSelect: (event: EventOut) => void
}

export function EventTable({ events, isLoading, onSelect }: Props) {
  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">불러오는 중...</div>
  }

  if (events.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500">조건에 맞는 이벤트가 없습니다.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">시각</th>
            <th className="px-4 py-2 font-medium">유형</th>
            <th className="px-4 py-2 font-medium">에이전트</th>
            <th className="px-4 py-2 font-medium">내용</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              onClick={() => onSelect(event)}
              className="cursor-pointer border-b border-slate-900 hover:bg-slate-900/60"
            >
              <td className="px-4 py-2.5 whitespace-nowrap text-slate-400">{formatDateTime(event.timestamp)}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-slate-400">{EVENT_TYPE_LABEL[event.event_type]}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-slate-400">{event.agent?.hostname ?? '—'}</td>
              <td className="max-w-xl truncate px-4 py-2.5 font-mono text-xs text-slate-300">{event.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
