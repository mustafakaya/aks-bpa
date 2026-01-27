"""
Scan and ScanResult models.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Scan(Base):
    """Represents a best practice assessment scan."""

    __tablename__ = "scans"

    id = Column(String, primary_key=True, index=True)
    subscription_id = Column(String, nullable=False, index=True)
    resource_group = Column(String, nullable=False)
    cluster_name = Column(String, nullable=False)
    cluster_id = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Summary statistics
    total_checks = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    not_validated = Column(Integer, default=0)
    
    # Score by pillar (stored as JSON)
    pillar_scores = Column(JSON, nullable=True)
    
    # Error message if scan failed
    error_message = Column(Text, nullable=True)
    
    # Relationship to results
    results = relationship("ScanResult", back_populates="scan", cascade="all, delete-orphan")


class ScanResult(Base):
    """Individual check result within a scan."""

    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    
    # Recommendation details
    recommendation_id = Column(String, nullable=False)
    recommendation_name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Pillar category
    
    # Result
    status = Column(String, nullable=False)  # Passed, Failed, CouldNotValidate
    
    # Additional context
    actual_value = Column(Text, nullable=True)
    expected_value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    learn_more_link = Column(String, nullable=True)
    
    # Relationship
    scan = relationship("Scan", back_populates="results")
