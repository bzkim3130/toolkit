import { Badge } from '../common/Badge'
import { ALERT_STATUS_COLOR, ALERT_STATUS_LABEL } from '../../lib/labels'
import type { AlertStatus } from '../../types/alert'

export function StatusPill({ status }: { status: AlertStatus }) {
  return <Badge className={ALERT_STATUS_COLOR[status]}>{ALERT_STATUS_LABEL[status]}</Badge>
}
