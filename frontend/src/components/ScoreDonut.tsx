import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ScoreDonutProps {
  score: number
  passed: number
  failed: number
  notValidated: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreDonut({
  score,
  passed,
  failed,
  notValidated,
  size = 'md',
}: ScoreDonutProps) {
  const data = [
    { name: 'Passed', value: passed, color: '#22c55e' },
    { name: 'Failed', value: failed, color: '#ef4444' },
    { name: 'Could Not Validate', value: notValidated, color: '#f59e0b' },
  ].filter((d) => d.value > 0)

  const dimensions = {
    sm: { width: 150, height: 150, inner: 30, outer: 50 },
    md: { width: 200, height: 200, inner: 40, outer: 70 },
    lg: { width: 300, height: 300, inner: 60, outer: 100 },
  }

  const dim = dimensions[size]

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim.width, height: dim.height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={dim.inner}
              outerRadius={dim.outer}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl font-bold text-gray-800">{score}%</span>
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span>{passed} Passed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span>{failed} Failed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>{notValidated} N/A</span>
        </div>
      </div>
    </div>
  )
}
