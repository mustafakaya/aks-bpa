"""
Subscription management endpoints.
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


class Subscription(BaseModel):
    """Azure subscription model."""
    id: str
    name: str
    state: str
    tenant_id: Optional[str] = None


@router.get("/", response_model=List[Subscription])
async def list_subscriptions():
    """List all accessible Azure subscriptions."""
    from app.services.azure_client import AzureClientService
    
    try:
        client = AzureClientService()
        subscriptions = await client.list_subscriptions()
        
        return [
            Subscription(
                id=sub["id"],
                name=sub["name"],
                state=sub["state"],
                tenant_id=sub.get("tenant_id"),
            )
            for sub in subscriptions
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list subscriptions: {str(e)}",
        )


@router.get("/{subscription_id}")
async def get_subscription(subscription_id: str):
    """Get details of a specific subscription."""
    from app.services.azure_client import AzureClientService
    
    try:
        client = AzureClientService()
        subscriptions = await client.list_subscriptions()
        
        for sub in subscriptions:
            if sub["id"] == subscription_id:
                return Subscription(
                    id=sub["id"],
                    name=sub["name"],
                    state=sub["state"],
                    tenant_id=sub["tenant_id"],
                )
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription {subscription_id} not found",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription: {str(e)}",
        )
