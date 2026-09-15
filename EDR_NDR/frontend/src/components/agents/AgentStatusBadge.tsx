import { Badge } from '../common/Badge'
import { AGENT_STATUS_COLOR, AGENT_STATUS_LABEL } from '../../lib/labels'
import type { AgentStatus } from '../../types/agent'

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return <Badge className={AGENT_STATUS_COLOR[status]}>{AGENT_STATUS_LABEL[status]}</Badge>
}
