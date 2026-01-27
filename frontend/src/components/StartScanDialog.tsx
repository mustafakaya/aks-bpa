import { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Dropdown,
  Option,
  Spinner,
} from '@fluentui/react-components'
import { Play24Regular } from '@fluentui/react-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSubscriptions, listClusters, startScan } from '../services/api'
import type { Cluster } from '../types'

interface StartScanDialogProps {
  trigger?: React.ReactNode
  onScanComplete?: (scanId: string) => void
}

export default function StartScanDialog({ trigger, onScanComplete }: StartScanDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<string>('')
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null)
  const queryClient = useQueryClient()

  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: listSubscriptions,
    enabled: open,
  })

  const { data: clusters, isLoading: loadingClusters } = useQuery({
    queryKey: ['clusters', selectedSubscription],
    queryFn: () => listClusters(selectedSubscription),
    enabled: !!selectedSubscription,
  })

  const scanMutation = useMutation({
    mutationFn: () => {
      if (!selectedCluster) throw new Error('No cluster selected')
      return startScan(
        selectedCluster.subscription_id,
        selectedCluster.resource_group,
        selectedCluster.name
      )
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
      setOpen(false)
      setSelectedSubscription('')
      setSelectedCluster(null)
      onScanComplete?.(data.scan_id)
    },
  })

  const handleSubscriptionChange = (_: unknown, data: { optionValue?: string }) => {
    setSelectedSubscription(data.optionValue || '')
    setSelectedCluster(null)
  }

  const handleClusterChange = (_: unknown, data: { optionValue?: string }) => {
    const cluster = clusters?.find((c) => c.id === data.optionValue)
    setSelectedCluster(cluster || null)
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {trigger || (
          <Button appearance="primary" icon={<Play24Regular />}>
            Start Scan
          </Button>
        )}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Start New Scan</DialogTitle>
          <DialogContent>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription
                </label>
                {loadingSubscriptions ? (
                  <Spinner size="tiny" />
                ) : (
                  <Dropdown
                    placeholder="Select a subscription"
                    value={
                      subscriptions?.find((s) => s.id === selectedSubscription)?.name || ''
                    }
                    onOptionSelect={handleSubscriptionChange}
                    style={{ width: '100%' }}
                  >
                    {subscriptions?.map((sub) => (
                      <Option key={sub.id} value={sub.id}>
                        {sub.name}
                      </Option>
                    ))}
                  </Dropdown>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AKS Cluster
                </label>
                {loadingClusters ? (
                  <Spinner size="tiny" />
                ) : (
                  <Dropdown
                    placeholder="Select a cluster"
                    disabled={!selectedSubscription}
                    value={selectedCluster?.name || ''}
                    onOptionSelect={handleClusterChange}
                    style={{ width: '100%' }}
                  >
                    {clusters?.map((cluster) => (
                      <Option key={cluster.id} value={cluster.id}>
                        {cluster.name} ({cluster.resource_group})
                      </Option>
                    ))}
                  </Dropdown>
                )}
              </div>

              {selectedCluster && (
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p><strong>Location:</strong> {selectedCluster.location}</p>
                  <p><strong>K8s Version:</strong> {selectedCluster.kubernetes_version}</p>
                  <p><strong>Node Pools:</strong> {selectedCluster.agent_pool_profiles.length}</p>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={() => scanMutation.mutate()}
              disabled={!selectedCluster || scanMutation.isPending}
            >
              {scanMutation.isPending ? <Spinner size="tiny" /> : 'Start Scan'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
