import { Badge } from '../common/Badge'
import { SEVERITY_COLOR, SEVERITY_LABEL } from '../../lib/labels'
import type { Severity } from '../../types/alert'

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge className={SEVERITY_COLOR[severity]}>{SEVERITY_LABEL[severity]}</Badge>
}
