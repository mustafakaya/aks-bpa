"""
Recommendation endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


class Pillar(BaseModel):
    """Well-Architected Framework pillar."""
    id: str
    name: str
    icon: str
    description: str
    color: str


class Recommendation(BaseModel):
    """Best practice recommendation."""
    id: str
    category: str
    recommendation_name: str
    description: Optional[str] = None
    remediation: Optional[str] = None
    learn_more_link: Optional[str] = None
    check_type: str  # "object_key" or "kql_query"


@router.get("/pillars", response_model=List[Pillar])
async def list_pillars():
    """List all Well-Architected Framework pillars."""
    from app.services.recommendations import PILLARS
    
    return [Pillar(**pillar) for pillar in PILLARS]


@router.get("/", response_model=List[Recommendation])
async def list_recommendations(
    category: Optional[str] = Query(None, description="Filter by pillar category"),
):
    """List all best practice recommendations."""
    from app.services.recommendations import load_recommendations, get_recommendations_by_category
    
    if category:
        recommendations = get_recommendations_by_category(category)
    else:
        recommendations = load_recommendations()
    
    return [
        Recommendation(
            id=rec.get("id", rec.get("recommendation_name", "unknown")),
            category=rec.get("category", "Unknown"),
            recommendation_name=rec.get("recommendation_name", "Unknown"),
            description=rec.get("description"),
            remediation=rec.get("remediation"),
            learn_more_link=rec.get("learn_more_link"),
            check_type="kql_query" if "query_file" in rec else "object_key",
        )
        for rec in recommendations
    ]


@router.get("/stats")
async def get_recommendation_stats():
    """Get statistics about recommendations by pillar."""
    from app.services.recommendations import load_recommendations, PILLARS
    
    recommendations = load_recommendations()
    
    stats = {
        "total": len(recommendations),
        "by_pillar": {},
        "by_check_type": {
            "object_key": 0,
            "kql_query": 0,
        },
    }
    
    # Count by pillar
    for pillar in PILLARS:
        count = sum(
            1 for rec in recommendations
            if rec.get("category", "").lower() == pillar["name"].lower()
        )
        stats["by_pillar"][pillar["name"]] = count
    
    # Count by check type
    for rec in recommendations:
        if "query_file" in rec:
            stats["by_check_type"]["kql_query"] += 1
        else:
            stats["by_check_type"]["object_key"] += 1
    
    return stats


@router.get("/{recommendation_id}", response_model=Recommendation)
async def get_recommendation(recommendation_id: str):
    """Get details of a specific recommendation."""
    from app.services.recommendations import load_recommendations
    
    recommendations = load_recommendations()
    
    for rec in recommendations:
        rec_id = rec.get("id", rec.get("recommendation_name", "unknown"))
        if rec_id == recommendation_id:
            return Recommendation(
                id=rec_id,
                category=rec.get("category", "Unknown"),
                recommendation_name=rec.get("recommendation_name", "Unknown"),
                description=rec.get("description"),
                remediation=rec.get("remediation"),
                learn_more_link=rec.get("learn_more_link"),
                check_type="kql_query" if "query_file" in rec else "object_key",
            )
    
    raise HTTPException(
        status_code=404,
        detail=f"Recommendation {recommendation_id} not found",
    )
