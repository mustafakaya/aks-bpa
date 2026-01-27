"""
Azure client service for interacting with Azure APIs.
"""

import logging
from typing import Dict, List, Optional, Any
from azure.identity import DefaultAzureCredential, ClientSecretCredential, AzureCliCredential
from azure.core.exceptions import ClientAuthenticationError
from azure.mgmt.containerservice import ContainerServiceClient
from azure.mgmt.resourcegraph import ResourceGraphClient
from azure.mgmt.resourcegraph.models import QueryRequest
from azure.mgmt.subscription import SubscriptionClient
from azure.mgmt.resource import ResourceManagementClient

from app.core.config import settings

logger = logging.getLogger(__name__)


class AzureClientService:
    """Service for Azure API operations."""

    def __init__(self, credential=None):
        """Initialize the Azure client service."""
        self._credential = credential or self._get_credential()
        self._subscription_client = None
        self._resource_graph_client = None
        self._container_service_clients: Dict[str, ContainerServiceClient] = {}

    def _get_credential(self):
        """Get Azure credential based on configuration."""
        # If service principal credentials are provided, use them
        if settings.AZURE_CLIENT_ID and settings.AZURE_CLIENT_SECRET and settings.AZURE_TENANT_ID:
            logger.info("Using ClientSecretCredential (Service Principal)")
            return ClientSecretCredential(
                tenant_id=settings.AZURE_TENANT_ID,
                client_id=settings.AZURE_CLIENT_ID,
                client_secret=settings.AZURE_CLIENT_SECRET,
            )
        
        # Try Azure CLI credential first (most common for local dev)
        try:
            logger.info("Trying AzureCliCredential...")
            credential = AzureCliCredential()
            # Test the credential by getting a token
            credential.get_token("https://management.azure.com/.default")
            logger.info("AzureCliCredential is working")
            return credential
        except Exception as e:
            logger.warning(f"AzureCliCredential failed: {e}")
        
        # Fall back to DefaultAzureCredential which tries multiple methods
        logger.info("Using DefaultAzureCredential")
        return DefaultAzureCredential()

    @property
    def subscription_client(self) -> SubscriptionClient:
        """Get or create subscription client."""
        if self._subscription_client is None:
            self._subscription_client = SubscriptionClient(self._credential)
        return self._subscription_client

    @property
    def resource_graph_client(self) -> ResourceGraphClient:
        """Get or create resource graph client."""
        if self._resource_graph_client is None:
            self._resource_graph_client = ResourceGraphClient(self._credential)
        return self._resource_graph_client

    def get_container_service_client(self, subscription_id: str) -> ContainerServiceClient:
        """Get or create container service client for a subscription."""
        if subscription_id not in self._container_service_clients:
            self._container_service_clients[subscription_id] = ContainerServiceClient(
                self._credential, subscription_id
            )
        return self._container_service_clients[subscription_id]

    async def list_subscriptions(self) -> List[Dict[str, Any]]:
        """List all accessible Azure subscriptions."""
        subscriptions = []
        for sub in self.subscription_client.subscriptions.list():
            subscriptions.append({
                "id": sub.subscription_id,
                "name": sub.display_name,
                "state": str(sub.state) if sub.state else "Unknown",
                "tenant_id": getattr(sub, 'tenant_id', None),
            })
        return subscriptions

    async def list_clusters(self, subscription_id: str) -> List[Dict[str, Any]]:
        """List all AKS clusters in a subscription."""
        client = self.get_container_service_client(subscription_id)
        clusters = []
        for cluster in client.managed_clusters.list():
            clusters.append(self._cluster_to_dict(cluster))
        return clusters

    async def list_clusters_in_resource_group(
        self, subscription_id: str, resource_group: str
    ) -> List[Dict[str, Any]]:
        """List AKS clusters in a specific resource group."""
        client = self.get_container_service_client(subscription_id)
        clusters = []
        for cluster in client.managed_clusters.list_by_resource_group(resource_group):
            clusters.append(self._cluster_to_dict(cluster))
        return clusters

    async def get_cluster(
        self, subscription_id: str, resource_group: str, cluster_name: str
    ) -> Dict[str, Any]:
        """Get detailed information about a specific AKS cluster."""
        client = self.get_container_service_client(subscription_id)
        cluster = client.managed_clusters.get(resource_group, cluster_name)
        return self._cluster_to_dict(cluster, include_full_data=True)

    def _cluster_to_dict(self, cluster, include_full_data: bool = False) -> Dict[str, Any]:
        """Convert cluster object to dictionary."""
        result = {
            "id": cluster.id,
            "name": cluster.name,
            "location": cluster.location,
            "resource_group": self._extract_resource_group(cluster.id),
            "subscription_id": self._extract_subscription_id(cluster.id),
            "kubernetes_version": cluster.kubernetes_version,
            "provisioning_state": cluster.provisioning_state,
            "power_state": cluster.power_state.code if cluster.power_state else None,
            "sku": {
                "name": cluster.sku.name if cluster.sku else None,
                "tier": cluster.sku.tier if cluster.sku else None,
            },
            "node_resource_group": cluster.node_resource_group,
            "fqdn": cluster.fqdn,
            "private_fqdn": cluster.private_fqdn,
            "agent_pool_profiles": [
                {
                    "name": pool.name,
                    "count": pool.count,
                    "vm_size": pool.vm_size,
                    "os_type": pool.os_type,
                    "mode": pool.mode,
                    "availability_zones": pool.availability_zones,
                    "enable_auto_scaling": pool.enable_auto_scaling,
                    "min_count": pool.min_count,
                    "max_count": pool.max_count,
                    "os_disk_type": pool.os_disk_type,
                }
                for pool in (cluster.agent_pool_profiles or [])
            ],
        }

        if include_full_data:
            # Include full cluster data for assessment
            result["_raw"] = cluster.as_dict()

        return result

    def _extract_resource_group(self, resource_id: str) -> str:
        """Extract resource group from resource ID."""
        # Azure resource IDs can have different case for 'resourceGroups' or 'resourcegroups'
        parts = resource_id.split("/")
        for i, part in enumerate(parts):
            if part.lower() == "resourcegroups" and i + 1 < len(parts):
                return parts[i + 1]
        return ""

    def _extract_subscription_id(self, resource_id: str) -> str:
        """Extract subscription ID from resource ID."""
        parts = resource_id.split("/")
        for i, part in enumerate(parts):
            if part.lower() == "subscriptions" and i + 1 < len(parts):
                return parts[i + 1]
        return ""

    async def run_resource_graph_query(
        self, query: str, subscriptions: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Execute an Azure Resource Graph query."""
        if subscriptions is None:
            subs = await self.list_subscriptions()
            subscriptions = [s["id"] for s in subs]

        request = QueryRequest(
            query=query,
            subscriptions=subscriptions,
        )
        response = self.resource_graph_client.resources(request)
        return response.data if response.data else []


# Global instance
azure_client = AzureClientService()
