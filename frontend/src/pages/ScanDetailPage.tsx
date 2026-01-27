import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Spinner, Tab, TabList } from '@fluentui/react-components'
import { ArrowLeft24Regular, Open24Regular } from '@fluentui/react-icons'
import { useState } from 'react'
import { getScan } from '../services/api'
import ScoreDonut from '../components/ScoreDonut'
import PillarBars from '../components/PillarBars'
import StatusBadge from '../components/StatusBadge'
import type { StatusType } from '../types'
import { PILLAR_COLORS } from '../types'

export default function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>()
  const navigate = useNavigate()
  const [selectedPillar, setSelectedPillar] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => getScan(scanId!),
    enabled: !!scanId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="large" />
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="p-8 text-center">
        <p>Scan not found</p>
        <Button appearance="primary" onClick={() => navigate('/scans')}>
          Back to Scans
        </Button>
      </div>
    )
  }

  const pillars = [
    'all',
    'Reliability',
    'Security',
    'Cost Optimization',
    'Operational Excellence',
    'Performance Efficiency',
  ]

  const statuses = ['all', 'Passed', 'Failed', 'CouldNotValidate']

  const filteredResults = scan.results.filter((result) => {
    const pillarMatch = selectedPillar === 'all' || result.category === selectedPillar
    const statusMatch = selectedStatus === 'all' || result.status === selectedStatus
    return pillarMatch && statusMatch
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/scans')}
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{scan.cluster_name}</h1>
          <p className="text-gray-500">
            {scan.resource_group} • Scanned on{' '}
            {new Date(scan.started_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Score Donut */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Overall Score</h2>
          {scan.summary && (
            <ScoreDonut
              score={scan.summary.overall_score}
              passed={scan.summary.passed}
              failed={scan.summary.failed}
              notValidated={scan.summary.not_validated}
            />
          )}
        </Card>

        {/* Pillar Breakdown */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Score by Pillar</h2>
          {scan.summary?.pillar_scores && (
            <PillarBars pillarScores={scan.summary.pillar_scores} />
          )}
        </Card>
      </div>

      {/* Results Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Assessment Results</h2>
          <div className="flex flex-wrap gap-4">
            {/* Pillar Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pillar</label>
              <TabList
                selectedValue={selectedPillar}
                onTabSelect={(_, data) => setSelectedPillar(data.value as string)}
                size="small"
              >
                {pillars.map((pillar) => (
                  <Tab key={pillar} value={pillar}>
                    {pillar === 'all' ? 'All' : pillar}
                  </Tab>
                ))}
              </TabList>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <TabList
                selectedValue={selectedStatus}
                onTabSelect={(_, data) => setSelectedStatus(data.value as string)}
                size="small"
              >
                {statuses.map((status) => (
                  <Tab key={status} value={status}>
                    {status === 'all'
                      ? 'All'
                      : status === 'CouldNotValidate'
                      ? 'N/A'
                      : status}
                  </Tab>
                ))}
              </TabList>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Pillar</th>
                <th className="px-6 py-4 font-medium">Recommendation</th>
                <th className="px-6 py-4 font-medium">Actual Value</th>
                <th className="px-6 py-4 font-medium">Expected Value</th>
                <th className="px-6 py-4 font-medium">Learn More</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result, index) => (
                <tr key={`${result.recommendation_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <StatusBadge status={result.status as StatusType} showLabel={false} />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${PILLAR_COLORS[result.category]}20`,
                        color: PILLAR_COLORS[result.category],
                      }}
                    >
                      {result.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{result.recommendation_name}</p>
                      {result.description && (
                        <p className="text-sm text-gray-500 mt-1">{result.description}</p>
                      )}
                      {result.remediation && result.status === 'Failed' && (
                        <p className="text-sm text-blue-600 mt-1">
                          💡 {result.remediation}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {result.actual_value || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {result.expected_value || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {result.learn_more_link && (
                      <a
                        href={result.learn_more_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Open24Regular className="w-4 h-4" />
                        Docs
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResults.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No results match the selected filters
          </div>
        )}
      </Card>
    </div>
  )
}
