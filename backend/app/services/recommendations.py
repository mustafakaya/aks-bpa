"""
Recommendation definitions and loader.
"""

import os
import json
from typing import List, Dict, Any, Optional
from pathlib import Path


def get_recommendations_path() -> Path:
    """Get the path to recommendations directory."""
    return Path(__file__).parent.parent / "checks" / "definitions"


def load_recommendations() -> List[Dict[str, Any]]:
    """Load all recommendation definitions."""
    recommendations = []
    recommendations_file = get_recommendations_path() / "recommendations.json"
    
    if recommendations_file.exists():
        with open(recommendations_file, "r", encoding="utf-8") as f:
            recommendations = json.load(f)
    
    return recommendations


def load_kql_query(query_file: str) -> Optional[str]:
    """Load a KQL query from file."""
    kql_path = get_recommendations_path() / "kql" / query_file
    
    if kql_path.exists():
        with open(kql_path, "r", encoding="utf-8") as f:
            return f.read()
    
    return None


def get_recommendations_by_category(category: str) -> List[Dict[str, Any]]:
    """Get recommendations filtered by category/pillar."""
    recommendations = load_recommendations()
    return [r for r in recommendations if r.get("category", "").lower() == category.lower()]


def get_recommendation_by_id(recommendation_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific recommendation by ID."""
    recommendations = load_recommendations()
    for rec in recommendations:
        if rec.get("id") == recommendation_id:
            return rec
    return None


# Pillar categories
PILLARS = [
    {
        "id": "reliability",
        "name": "Reliability",
        "icon": "✅",
        "description": "Ensure your clusters are resilient and highly available",
        "color": "#22c55e",
    },
    {
        "id": "security",
        "name": "Security",
        "icon": "🔐",
        "description": "Protect your workloads, data, and access",
        "color": "#ef4444",
    },
    {
        "id": "cost-optimization",
        "name": "Cost Optimization",
        "icon": "💰",
        "description": "Optimize resource usage and reduce costs",
        "color": "#f59e0b",
    },
    {
        "id": "operational-excellence",
        "name": "Operational Excellence",
        "icon": "⚙️",
        "description": "Streamline operations, monitoring, and DevOps practices",
        "color": "#3b82f6",
    },
    {
        "id": "performance-efficiency",
        "name": "Performance Efficiency",
        "icon": "🚀",
        "description": "Maximize performance and scalability",
        "color": "#8b5cf6",
    },
]
