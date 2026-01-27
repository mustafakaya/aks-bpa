"""
Scan management endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.scan import Scan, ScanResult

router = APIRouter()


class ScanRequest(BaseModel):
    """Request to start a new scan."""
    subscription_id: str
    resource_group: str
    cluster_name: str


class ScanResultResponse(BaseModel):
    """Individual scan result."""
    recommendation_id: str
    recommendation_name: str
    category: str
    status: str
    actual_value: Optional[str] = None
    expected_value: Optional[str] = None
    description: Optional[str] = None
    remediation: Optional[str] = None
    learn_more_link: Optional[str] = None


class PillarScore(BaseModel):
    """Score for a single pillar."""
    score: int
    passed: int
    failed: int
    not_validated: int
    total: int


class ScanSummary(BaseModel):
    """Scan summary statistics."""
    overall_score: int
    total_checks: int
    passed: int
    failed: int
    not_validated: int
    pillar_scores: dict


class ScanResponse(BaseModel):
    """Full scan response."""
    scan_id: str
    subscription_id: str
    resource_group: str
    cluster_name: str
    cluster_id: Optional[str] = None
    status: str
    started_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    summary: Optional[ScanSummary] = None
    results: List[ScanResultResponse]


class ScanListItem(BaseModel):
    """Scan list item (without full results)."""
    scan_id: str
    subscription_id: str
    resource_group: str
    cluster_name: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_checks: int
    passed: int
    failed: int
    not_validated: int


@router.post("/", response_model=ScanResponse)
async def start_scan(request: ScanRequest, db: AsyncSession = Depends(get_db)):
    """
    Start a new best practice assessment scan on a cluster.
    
    This endpoint runs a comprehensive assessment against all configured
    best practice recommendations.
    """
    from app.services.azure_client import AzureClientService
    from app.services.assessment_engine import AssessmentEngine
    
    try:
        # Create assessment engine
        azure_client = AzureClientService()
        engine = AssessmentEngine(azure_client)
        
        # Run assessment
        result = await engine.run_assessment(
            subscription_id=request.subscription_id,
            resource_group=request.resource_group,
            cluster_name=request.cluster_name,
        )
        
        # Save scan to database
        scan = Scan(
            id=result["scan_id"],
            subscription_id=result["subscription_id"],
            resource_group=result["resource_group"],
            cluster_name=result["cluster_name"],
            cluster_id=result.get("cluster_id"),
            status=result["status"],
            started_at=datetime.fromisoformat(result["started_at"]),
            completed_at=datetime.fromisoformat(result["completed_at"]) if result.get("completed_at") else None,
            error_message=result.get("error_message"),
            total_checks=result.get("summary", {}).get("total_checks", 0),
            passed=result.get("summary", {}).get("passed", 0),
            failed=result.get("summary", {}).get("failed", 0),
            not_validated=result.get("summary", {}).get("not_validated", 0),
            pillar_scores=result.get("summary", {}).get("pillar_scores"),
        )
        db.add(scan)
        
        # Save scan results
        for r in result.get("results", []):
            scan_result = ScanResult(
                scan_id=result["scan_id"],
                recommendation_id=r["recommendation_id"],
                recommendation_name=r["recommendation_name"],
                category=r["category"],
                status=r["status"],
                actual_value=r.get("actual_value"),
                expected_value=r.get("expected_value"),
                description=r.get("description"),
                remediation=r.get("remediation"),
                learn_more_link=r.get("learn_more_link"),
            )
            db.add(scan_result)
        
        await db.commit()
        
        # Build response
        return ScanResponse(
            scan_id=result["scan_id"],
            subscription_id=result["subscription_id"],
            resource_group=result["resource_group"],
            cluster_name=result["cluster_name"],
            cluster_id=result.get("cluster_id"),
            status=result["status"],
            started_at=result["started_at"],
            completed_at=result.get("completed_at"),
            error_message=result.get("error_message"),
            summary=ScanSummary(**result["summary"]) if result.get("summary") else None,
            results=[ScanResultResponse(**r) for r in result.get("results", [])],
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scan failed: {str(e)}",
        )


@router.get("/", response_model=List[ScanListItem])
async def list_scans(
    cluster_name: Optional[str] = Query(None, description="Filter by cluster name"),
    subscription_id: Optional[str] = Query(None, description="Filter by subscription"),
    limit: int = Query(50, le=100, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db),
):
    """List all scans, optionally filtered by cluster or subscription."""
    query = select(Scan).order_by(Scan.started_at.desc()).limit(limit)
    
    if cluster_name:
        query = query.where(Scan.cluster_name == cluster_name)
    if subscription_id:
        query = query.where(Scan.subscription_id == subscription_id)
    
    result = await db.execute(query)
    scans = result.scalars().all()
    
    return [
        ScanListItem(
            scan_id=scan.id,
            subscription_id=scan.subscription_id,
            resource_group=scan.resource_group,
            cluster_name=scan.cluster_name,
            status=scan.status,
            started_at=scan.started_at,
            completed_at=scan.completed_at,
            total_checks=scan.total_checks,
            passed=scan.passed,
            failed=scan.failed,
            not_validated=scan.not_validated,
        )
        for scan in scans
    ]


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    """Get details of a specific scan including all results."""
    # Get scan
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalar_one_or_none()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan {scan_id} not found",
        )
    
    # Get results
    results_query = await db.execute(
        select(ScanResult).where(ScanResult.scan_id == scan_id)
    )
    results = results_query.scalars().all()
    
    return ScanResponse(
        scan_id=scan.id,
        subscription_id=scan.subscription_id,
        resource_group=scan.resource_group,
        cluster_name=scan.cluster_name,
        cluster_id=scan.cluster_id,
        status=scan.status,
        started_at=scan.started_at.isoformat(),
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        error_message=scan.error_message,
        summary=ScanSummary(
            overall_score=round((scan.passed / (scan.passed + scan.failed)) * 100) if (scan.passed + scan.failed) > 0 else 0,
            total_checks=scan.total_checks,
            passed=scan.passed,
            failed=scan.failed,
            not_validated=scan.not_validated,
            pillar_scores=scan.pillar_scores or {},
        ),
        results=[
            ScanResultResponse(
                recommendation_id=r.recommendation_id,
                recommendation_name=r.recommendation_name,
                category=r.category,
                status=r.status,
                actual_value=r.actual_value,
                expected_value=r.expected_value,
                description=r.description,
                remediation=r.remediation,
                learn_more_link=r.learn_more_link,
            )
            for r in results
        ],
    )


@router.delete("/{scan_id}")
async def delete_scan(scan_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a scan and its results."""
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalar_one_or_none()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan {scan_id} not found",
        )
    
    await db.delete(scan)
    await db.commit()
    
    return {"status": "deleted", "scan_id": scan_id}
