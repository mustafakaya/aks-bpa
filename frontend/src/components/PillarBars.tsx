import { PILLAR_COLORS } from '../types'

interface PillarScore {
  score: number
  passed: number
  failed: number
  not_validated: number
  total: number
}

interface PillarBarsProps {
  pillarScores: Record<string, PillarScore>
}

export default function PillarBars({ pillarScores }: PillarBarsProps) {
  const pillars = [
    { name: 'Reliability', icon: '✅' },
    { name: 'Security', icon: '🔐' },
    { name: 'Cost Optimization', icon: '💰' },
    { name: 'Operational Excellence', icon: '⚙️' },
    { name: 'Performance Efficiency', icon: '🚀' },
  ]

  return (
    <div className="space-y-4">
      {pillars.map((pillar) => {
        const score = pillarScores[pillar.name]
        if (!score) return null

        const percentage = score.score

        return (
          <div key={pillar.name} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{pillar.icon}</span>
                <span className="text-sm font-medium text-gray-700">{pillar.name}</span>
              </div>
              <div className="text-sm text-gray-600">
                {score.passed}/{score.total} ({percentage}%)
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: PILLAR_COLORS[pillar.name] || '#6b7280',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
