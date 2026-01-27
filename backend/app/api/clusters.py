"""
Cluster management endpoints.
"""

from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


class AgentPoolProfile(BaseModel):
    """Node pool profile."""
    name: str
    count: int
    vm_size: str
    os_type: Optional[str] = None
    mode: Optional[str] = None
    availability_zones: Optional[List[str]] = None
    enable_auto_scaling: Optional[bool] = None
    min_count: Optional[int] = None
    max_count: Optional[int] = None
    os_disk_type: Optional[str] = None


class ClusterSku(BaseModel):
    """Cluster SKU information."""
    name: Optional[str] = None
    tier: Optional[str] = None


class Cluster(BaseModel):
    """AKS cluster model."""
    id: str
    name: str
    location: str
    resource_group: str
    subscription_id: str
    kubernetes_version: str
    provisioning_state: str
    power_state: Optional[str] = None
    sku: ClusterSku
    node_resource_group: Optional[str] = None
    fqdn: Optional[str] = None
    private_fqdn: Optional[str] = None
    agent_pool_profiles: List[AgentPoolProfile]


class ClusterSummary(BaseModel):
    """Summary of clusters in a subscription."""
    subscription_id: str
    subscription_name: str
    cluster_count: int
    clusters: List[Cluster]


@router.get("/", response_model=List[Cluster])
async def list_clusters(
    subscription_id: Optional[str] = Query(None, description="Filter by subscription ID"),
    resource_group: Optional[str] = Query(None, description="Filter by resource group"),
):
    """List all AKS clusters across subscriptions or in a specific subscription/resource group."""
    from app.services.azure_client import AzureClientService
    
    try:
        client = AzureClientService()
        all_clusters = []
        
        if subscription_id:
            if resource_group:
                clusters = await client.list_clusters_in_resource_group(
                    subscription_id, resource_group
                )
            else:
                clusters = await client.list_clusters(subscription_id)
            all_clusters.extend(clusters)
        else:
            # List clusters from all subscriptions
            subscriptions = await client.list_subscriptions()
            for sub in subscriptions:
                try:
                    clusters = await client.list_clusters(sub["id"])
                    all_clusters.extend(clusters)
                except Exception:
                    # Skip subscriptions where we can't list clusters
                    continue
        
        return [_cluster_to_model(c) for c in all_clusters]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list clusters: {str(e)}",
        )


@router.get("/summary", response_model=List[ClusterSummary])
async def get_clusters_summary():
    """Get a summary of clusters across all subscriptions."""
    from app.services.azure_client import AzureClientService
    
    try:
        client = AzureClientService()
        subscriptions = await client.list_subscriptions()
        summaries = []
        
        for sub in subscriptions:
            try:
                clusters = await client.list_clusters(sub["id"])
                summaries.append(
                    ClusterSummary(
                        subscription_id=sub["id"],
                        subscription_name=sub["name"],
                        cluster_count=len(clusters),
                        clusters=[_cluster_to_model(c) for c in clusters],
                    )
                )
            except Exception:
                # Include subscription with 0 clusters if we can't access it
                summaries.append(
                    ClusterSummary(
                        subscription_id=sub["id"],
                        subscription_name=sub["name"],
                        cluster_count=0,
                        clusters=[],
                    )
                )
        
        return summaries
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cluster summary: {str(e)}",
        )


@router.get("/{subscription_id}/{resource_group}/{cluster_name}", response_model=Cluster)
async def get_cluster(subscription_id: str, resource_group: str, cluster_name: str):
    """Get detailed information about a specific cluster."""
    from app.services.azure_client import AzureClientService
    
    try:
        client = AzureClientService()
        cluster = await client.get_cluster(subscription_id, resource_group, cluster_name)
        return _cluster_to_model(cluster)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster not found: {str(e)}",
        )


def _cluster_to_model(cluster: dict) -> Cluster:
    """Convert cluster dict to Cluster model."""
    return Cluster(
        id=cluster["id"],
        name=cluster["name"],
        location=cluster["location"],
        resource_group=cluster["resource_group"],
        subscription_id=cluster["subscription_id"],
        kubernetes_version=cluster["kubernetes_version"],
        provisioning_state=cluster["provisioning_state"],
        power_state=cluster.get("power_state"),
        sku=ClusterSku(
            name=cluster.get("sku", {}).get("name"),
            tier=cluster.get("sku", {}).get("tier"),
        ),
        node_resource_group=cluster.get("node_resource_group"),
        fqdn=cluster.get("fqdn"),
        private_fqdn=cluster.get("private_fqdn"),
        agent_pool_profiles=[
            AgentPoolProfile(
                name=pool["name"],
                count=pool["count"],
                vm_size=pool["vm_size"],
                os_type=pool.get("os_type"),
                mode=pool.get("mode"),
                availability_zones=pool.get("availability_zones"),
                enable_auto_scaling=pool.get("enable_auto_scaling"),
                min_count=pool.get("min_count"),
                max_count=pool.get("max_count"),
                os_disk_type=pool.get("os_disk_type"),
            )
            for pool in cluster.get("agent_pool_profiles", [])
        ],
    )
