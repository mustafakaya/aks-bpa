"""
Cluster cache model for storing cluster information.
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON

from app.core.database import Base


class ClusterCache(Base):
    """Cache for cluster information to reduce API calls."""

    __tablename__ = "cluster_cache"

    id = Column(String, primary_key=True)  # Cluster resource ID
    subscription_id = Column(String, nullable=False, index=True)
    resource_group = Column(String, nullable=False)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    kubernetes_version = Column(String, nullable=True)
    sku_tier = Column(String, nullable=True)
    
    # Full cluster data as JSON
    cluster_data = Column(JSON, nullable=True)
    
    # Cache metadata
    cached_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
