"""
Authentication endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class AuthStatus(BaseModel):
    """Authentication status response."""
    authenticated: bool
    auth_type: str  # "azure" or "local"
    user_name: Optional[str] = None
    tenant_id: Optional[str] = None


class AzureAuthConfig(BaseModel):
    """Azure authentication configuration."""
    tenant_id: str
    client_id: str
    client_secret: Optional[str] = None


@router.get("/status", response_model=AuthStatus)
async def get_auth_status():
    """Get current authentication status."""
    from app.core.config import settings
    
    if settings.AZURE_TENANT_ID and settings.AZURE_CLIENT_ID:
        return AuthStatus(
            authenticated=True,
            auth_type="azure",
            tenant_id=settings.AZURE_TENANT_ID,
        )
    
    return AuthStatus(
        authenticated=False,
        auth_type="none",
    )


@router.post("/configure")
async def configure_auth(config: AzureAuthConfig):
    """
    Configure Azure authentication.
    
    Note: This updates the runtime configuration only.
    For persistent configuration, update environment variables or .env file.
    """
    from app.core.config import settings
    
    # Update settings (runtime only)
    settings.AZURE_TENANT_ID = config.tenant_id
    settings.AZURE_CLIENT_ID = config.client_id
    if config.client_secret:
        settings.AZURE_CLIENT_SECRET = config.client_secret
    
    return {"status": "configured", "message": "Azure authentication configured"}


@router.get("/validate")
async def validate_credentials():
    """Validate current Azure credentials by attempting to list subscriptions."""
    from app.services.azure_client import AzureClientService
    
    try:
        client = AzureClientService()
        subscriptions = await client.list_subscriptions()
        
        return {
            "valid": True,
            "subscription_count": len(subscriptions),
            "message": f"Successfully authenticated. Found {len(subscriptions)} subscription(s).",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
