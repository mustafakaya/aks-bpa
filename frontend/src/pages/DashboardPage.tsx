import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Spinner } from '@fluentui/react-components'
import {
  Server24Regular,
  DocumentSearch24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Warning24Regular,
} from '@fluentui/react-icons'
import { listScans, getClustersSummary, getRecommendationStats } from '../services/api'
import ScoreDonut from '../components/ScoreDonut'
import PillarBars from '../components/PillarBars'
import StartScanDialog from '../components/StartScanDialog'

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: clusterSummary, isLoading: loadingClusters } = useQuery({
    queryKey: ['clustersSummary'],
    queryFn: getClustersSummary,
  })

  const { data: scans, isLoading: loadingScans } = useQuery({
    queryKey: ['scans'],
    queryFn: () => listScans(),
  })

  const { data: recommendationStats } = useQuery({
    queryKey: ['recommendationStats'],
    queryFn: getRecommendationStats,
  })

  const totalClusters = clusterSummary?.reduce((acc, sub) => acc + sub.cluster_count, 0) || 0
  const latestScan = scans?.[0]

  // Calculate aggregate stats from recent scans
  const aggregateStats = scans?.slice(0, 10).reduce(
    (acc, scan) => ({
      passed: acc.passed + scan.passed,
      failed: acc.failed + scan.failed,
      notValidated: acc.notValidated + scan.not_validated,
    }),
    { passed: 0, failed: 0, notValidated: 0 }
  ) || { passed: 0, failed: 0, notValidated: 0 }

  const overallScore = 
    aggregateStats.passed + aggregateStats.failed > 0
      ? Math.round((aggregateStats.passed / (aggregateStats.passed + aggregateStats.failed)) * 100)
      : 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Azure Kubernetes Service Best Practices Assessment
          </p>
        </div>
        <StartScanDialog onScanComplete={(scanId) => navigate(`/scans/${scanId}`)} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Server24Regular className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Clusters</p>
              <p className="text-2xl font-bold">
                {loadingClusters ? <Spinner size="tiny" /> : totalClusters}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DocumentSearch24Regular className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Scans</p>
              <p className="text-2xl font-bold">
                {loadingScans ? <Spinner size="tiny" /> : scans?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Checkmark24Regular className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Checks Passed</p>
              <p className="text-2xl font-bold text-green-600">{aggregateStats.passed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Dismiss24Regular className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Checks Failed</p>
              <p className="text-2xl font-bold text-red-600">{aggregateStats.failed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Overview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Overall Score</h2>
          {scans && scans.length > 0 ? (
            <ScoreDonut
              score={overallScore}
              passed={aggregateStats.passed}
              failed={aggregateStats.failed}
              notValidated={aggregateStats.notValidated}
              size="lg"
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No scans yet. Start a scan to see your score.</p>
              <StartScanDialog
                trigger={
                  <Button appearance="primary" className="mt-4">
                    Start Your First Scan
                  </Button>
                }
                onScanComplete={(scanId) => navigate(`/scans/${scanId}`)}
              />
            </div>
          )}
        </Card>

        {/* Recommendations Stats */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recommendations by Pillar</h2>
          {recommendationStats ? (
            <div className="space-y-4">
              {Object.entries(recommendationStats.by_pillar).map(([pillar, count]) => (
                <div key={pillar} className="flex justify-between items-center">
                  <span className="text-gray-700">{pillar}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Recommendations</span>
                  <span>{recommendationStats.total}</span>
                </div>
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </Card>

        {/* Recent Scans */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Scans</h2>
            <Button appearance="subtle" onClick={() => navigate('/scans')}>
              View All
            </Button>
          </div>
          {loadingScans ? (
            <Spinner />
          ) : scans && scans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3 font-medium">Cluster</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Passed</th>
                    <th className="pb-3 font-medium">Failed</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.slice(0, 5).map((scan) => (
                    <tr
                      key={scan.scan_id}
                      className="border-b cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/scans/${scan.scan_id}`)}
                    >
                      <td className="py-3 font-medium">{scan.cluster_name}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            scan.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : scan.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {scan.status}
                        </span>
                      </td>
                      <td className="py-3 text-green-600">✅ {scan.passed}</td>
                      <td className="py-3 text-red-600">❌ {scan.failed}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(scan.started_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No scans yet. Start a scan to assess your clusters.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
