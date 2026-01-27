// Type definitions for AKS BPA

export interface Subscription {
  id: string
  name: string
  state: string
  tenant_id: string
}

export interface AgentPoolProfile {
  name: string
  count: number
  vm_size: string
  os_type?: string
  mode?: string
  availability_zones?: string[]
  enable_auto_scaling?: boolean
  min_count?: number
  max_count?: number
  os_disk_type?: string
}

export interface ClusterSku {
  name?: string
  tier?: string
}

export interface Cluster {
  id: string
  name: string
  location: string
  resource_group: string
  subscription_id: string
  kubernetes_version: string
  provisioning_state: string
  power_state?: string
  sku: ClusterSku
  node_resource_group?: string
  fqdn?: string
  private_fqdn?: string
  agent_pool_profiles: AgentPoolProfile[]
}

export interface ClusterSummary {
  subscription_id: string
  subscription_name: string
  cluster_count: number
  clusters: Cluster[]
}

export interface Pillar {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

export interface Recommendation {
  id: string
  category: string
  recommendation_name: string
  description?: string
  remediation?: string
  learn_more_link?: string
  check_type: 'object_key' | 'kql_query'
}

export interface ScanResult {
  recommendation_id: string
  recommendation_name: string
  category: string
  status: 'Passed' | 'Failed' | 'CouldNotValidate'
  actual_value?: string
  expected_value?: string
  description?: string
  remediation?: string
  learn_more_link?: string
}

export interface PillarScore {
  score: number
  passed: number
  failed: number
  not_validated: number
  total: number
}

export interface ScanSummary {
  overall_score: number
  total_checks: number
  passed: number
  failed: number
  not_validated: number
  pillar_scores: Record<string, PillarScore>
}

export interface Scan {
  scan_id: string
  subscription_id: string
  resource_group: string
  cluster_name: string
  cluster_id?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  error_message?: string
  summary?: ScanSummary
  results: ScanResult[]
}

export interface ScanListItem {
  scan_id: string
  subscription_id: string
  resource_group: string
  cluster_name: string
  status: string
  started_at: string
  completed_at?: string
  total_checks: number
  passed: number
  failed: number
  not_validated: number
}

export interface AuthStatus {
  authenticated: boolean
  auth_type: string
  user_name?: string
  tenant_id?: string
}

export type StatusType = 'Passed' | 'Failed' | 'CouldNotValidate'

export const STATUS_COLORS: Record<StatusType, string> = {
  Passed: '#22c55e',
  Failed: '#ef4444',
  CouldNotValidate: '#f59e0b',
}

export const STATUS_ICONS: Record<StatusType, string> = {
  Passed: '✅',
  Failed: '❌',
  CouldNotValidate: '⚠️',
}

export const PILLAR_COLORS: Record<string, string> = {
  'Reliability': '#22c55e',
  'Security': '#ef4444',
  'Cost Optimization': '#f59e0b',
  'Operational Excellence': '#3b82f6',
  'Performance Efficiency': '#8b5cf6',
}
