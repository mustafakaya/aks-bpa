import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Spinner } from '@fluentui/react-components'
import { ArrowSync24Regular, Delete24Regular } from '@fluentui/react-icons'
import { listScans, deleteScan } from '../services/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import StartScanDialog from '../components/StartScanDialog'

export default function ScansPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: scans, isLoading, refetch } = useQuery({
    queryKey: ['scans'],
    queryFn: () => listScans(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })

  const handleDelete = (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this scan?')) {
      deleteMutation.mutate(scanId)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Scans</h1>
          <p className="text-gray-500 mt-1">View all best practice assessment scan results</p>
        </div>
        <div className="flex gap-3">
          <Button
            appearance="subtle"
            icon={<ArrowSync24Regular />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <StartScanDialog onScanComplete={(scanId) => navigate(`/scans/${scanId}`)} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      ) : scans && scans.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Cluster</th>
                  <th className="px-6 py-4 font-medium">Resource Group</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Passed</th>
                  <th className="px-6 py-4 font-medium">Failed</th>
                  <th className="px-6 py-4 font-medium">N/A</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.map((scan) => {
                  const score =
                    scan.passed + scan.failed > 0
                      ? Math.round((scan.passed / (scan.passed + scan.failed)) * 100)
                      : 0

                  return (
                    <tr
                      key={scan.scan_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/scans/${scan.scan_id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-blue-600">{scan.cluster_name}</td>
                      <td className="px-6 py-4 text-gray-600">{scan.resource_group}</td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-green-600 font-medium">✅ {scan.passed}</td>
                      <td className="px-6 py-4 text-red-600 font-medium">❌ {scan.failed}</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">
                        ⚠️ {scan.not_validated}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{score}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(scan.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          appearance="subtle"
                          icon={<Delete24Regular />}
                          onClick={(e) => handleDelete(e, scan.scan_id)}
                          disabled={deleteMutation.isPending}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">No scans yet</p>
            <p className="text-sm mb-6">Start a scan to assess your AKS clusters</p>
            <StartScanDialog onScanComplete={(scanId) => navigate(`/scans/${scanId}`)} />
          </div>
        </Card>
      )}
    </div>
  )
}
