import { NavLink } from 'react-router-dom'
import { Bell, Search, Laptop, ShieldAlert, Bug, Settings, ShieldHalf } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/alerts', label: '알림', icon: Bell, ready: true },
  { to: '/investigate', label: '사고 조사', icon: Search, ready: true },
  { to: '/agents', label: 'Agent', icon: Laptop, ready: true },
  { to: '/rules', label: '탐지 룰', icon: ShieldAlert, ready: true },
  { to: '/threat-intel', label: 'Threat Intel', icon: Bug, ready: true },
  { to: '/settings', label: '설정', icon: Settings, ready: true },
]

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <ShieldHalf className="h-5 w-5 text-cyan-400" />
        <div>
          <div className="text-sm font-semibold text-slate-100">SOC Console</div>
          <div className="text-[11px] text-slate-500">EDR/NDR Dashboard</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, ready }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {!ready && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">준비중</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3 text-[11px] text-slate-600">v0.1.0</div>
    </aside>
  )
}
