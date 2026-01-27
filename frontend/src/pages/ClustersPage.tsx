import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Spinner } from '@fluentui/react-components'
import { Play24Regular, ArrowSync24Regular } from '@fluentui/react-icons'
import { getClustersSummary, startScan } from '../services/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function ClustersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: summaries, isLoading, refetch } = useQuery({
    queryKey: ['clustersSummary'],
    queryFn: getClustersSummary,
  })

  const scanMutation = useMutation({
    mutationFn: ({ subscriptionId, resourceGroup, clusterName }: {
      subscriptionId: string
      resourceGroup: string
      clusterName: string
    }) => startScan(subscriptionId, resourceGroup, clusterName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
      navigate(`/scans/${data.scan_id}`)
    },
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clusters</h1>
          <p className="text-gray-500 mt-1">
            View and scan your AKS clusters across all subscriptions
          </p>
        </div>
        <Button
          appearance="subtle"
          icon={<ArrowSync24Regular />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      ) : summaries && summaries.length > 0 ? (
        <div className="space-y-8">
          {summaries.map((sub) => (
            <Card key={sub.subscription_id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{sub.subscription_name}</h2>
                  <p className="text-sm text-gray-500">{sub.subscription_id}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {sub.cluster_count} cluster{sub.cluster_count !== 1 ? 's' : ''}
                </span>
              </div>

              {sub.clusters.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-500 text-sm border-b">
                        <th className="pb-3 font-medium">Cluster Name</th>
                        <th className="pb-3 font-medium">Resource Group</th>
                        <th className="pb-3 font-medium">Location</th>
                        <th className="pb-3 font-medium">K8s Version</th>
                        <th className="pb-3 font-medium">SKU Tier</th>
                        <th className="pb-3 font-medium">Node Pools</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sub.clusters.map((cluster) => (
                        <tr key={cluster.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 font-medium text-blue-600">{cluster.name}</td>
                          <td className="py-4 text-gray-600">{cluster.resource_group}</td>
                          <td className="py-4 text-gray-600">{cluster.location}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                              {cluster.kubernetes_version}
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                cluster.sku.tier === 'Premium'
                                  ? 'bg-purple-100 text-purple-700'
                                  : cluster.sku.tier === 'Standard'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {cluster.sku.tier || 'Free'}
                            </span>
                          </td>
                          <td className="py-4 text-gray-600">
                            {cluster.agent_pool_profiles.length}
                          </td>
                          <td className="py-4">
                            <Button
                              appearance="primary"
                              size="small"
                              icon={<Play24Regular />}
                              onClick={() =>
                                scanMutation.mutate({
                                  subscriptionId: cluster.subscription_id,
                                  resourceGroup: cluster.resource_group,
                                  clusterName: cluster.name,
                                })
                              }
                              disabled={scanMutation.isPending}
                            >
                              Scan
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No clusters found in this subscription
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">No clusters found</p>
            <p className="text-sm">
              Make sure you have the correct Azure credentials configured and have access to AKS
              clusters.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
