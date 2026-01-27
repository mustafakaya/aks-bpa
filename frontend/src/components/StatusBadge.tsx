import { StatusType, STATUS_ICONS, STATUS_COLORS } from '../types'

interface StatusBadgeProps {
  status: StatusType
  showLabel?: boolean
}

export default function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const labels: Record<StatusType, string> = {
    Passed: 'Passed',
    Failed: 'Failed',
    CouldNotValidate: 'Could Not Validate',
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: `${STATUS_COLORS[status]}20`,
        color: STATUS_COLORS[status],
      }}
    >
      <span>{STATUS_ICONS[status]}</span>
      {showLabel && <span>{labels[status]}</span>}
    </span>
  )
}
