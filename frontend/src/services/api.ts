import axios from 'axios'
import type {
  Subscription,
  Cluster,
  ClusterSummary,
  Scan,
  ScanListItem,
  Pillar,
  Recommendation,
  AuthStatus,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth
export const getAuthStatus = async (): Promise<AuthStatus> => {
  const response = await api.get('/auth/status')
  return response.data
}

export const validateCredentials = async (): Promise<{ valid: boolean; message: string }> => {
  const response = await api.get('/auth/validate')
  return response.data
}

// Subscriptions
export const listSubscriptions = async (): Promise<Subscription[]> => {
  const response = await api.get('/subscriptions/')
  return response.data
}

// Clusters
export const listClusters = async (subscriptionId?: string): Promise<Cluster[]> => {
  const params = subscriptionId ? { subscription_id: subscriptionId } : {}
  const response = await api.get('/clusters/', { params })
  return response.data
}

export const getClustersSummary = async (): Promise<ClusterSummary[]> => {
  const response = await api.get('/clusters/summary')
  return response.data
}

export const getCluster = async (
  subscriptionId: string,
  resourceGroup: string,
  clusterName: string
): Promise<Cluster> => {
  const response = await api.get(`/clusters/${subscriptionId}/${resourceGroup}/${clusterName}`)
  return response.data
}

// Scans
export const startScan = async (
  subscriptionId: string,
  resourceGroup: string,
  clusterName: string
): Promise<Scan> => {
  const response = await api.post('/scans/', {
    subscription_id: subscriptionId,
    resource_group: resourceGroup,
    cluster_name: clusterName,
  })
  return response.data
}

export const listScans = async (clusterName?: string): Promise<ScanListItem[]> => {
  const params = clusterName ? { cluster_name: clusterName } : {}
  const response = await api.get('/scans/', { params })
  return response.data
}

export const getScan = async (scanId: string): Promise<Scan> => {
  const response = await api.get(`/scans/${scanId}`)
  return response.data
}

export const deleteScan = async (scanId: string): Promise<void> => {
  await api.delete(`/scans/${scanId}`)
}

// Recommendations
export const listPillars = async (): Promise<Pillar[]> => {
  const response = await api.get('/recommendations/pillars')
  return response.data
}

export const listRecommendations = async (category?: string): Promise<Recommendation[]> => {
  const params = category ? { category } : {}
  const response = await api.get('/recommendations/', { params })
  return response.data
}

export const getRecommendationStats = async (): Promise<{
  total: number
  by_pillar: Record<string, number>
  by_check_type: Record<string, number>
}> => {
  const response = await api.get('/recommendations/stats')
  return response.data
}

export default api
