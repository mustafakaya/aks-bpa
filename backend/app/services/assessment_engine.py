"""
Assessment engine for evaluating AKS clusters against recommendations.
"""

import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

from app.services.azure_client import AzureClientService
from app.services.recommendations import load_recommendations, load_kql_query, PILLARS


class AssessmentEngine:
    """Engine for running best practice assessments."""

    def __init__(self, azure_client: AzureClientService):
        """Initialize the assessment engine."""
        self.azure_client = azure_client

    async def run_assessment(
        self,
        subscription_id: str,
        resource_group: str,
        cluster_name: str,
    ) -> Dict[str, Any]:
        """
        Run a complete best practice assessment on a cluster.
        
        Returns:
            Dictionary containing scan results and summary
        """
        scan_id = str(uuid.uuid4())
        started_at = datetime.utcnow()

        try:
            # Get cluster information
            cluster_info = await self.azure_client.get_cluster(
                subscription_id, resource_group, cluster_name
            )
            cluster_data = cluster_info.get("_raw", {})

            # Load recommendations
            recommendations = load_recommendations()

            # Run all checks
            results = []
            seen = set()

            for rec in recommendations:
                rec_name = rec.get("recommendation_name")
                if rec_name in seen:
                    continue
                seen.add(rec_name)

                result = await self._evaluate_recommendation(
                    rec, cluster_data, cluster_info, subscription_id
                )
                results.append(result)

            # Calculate summary
            summary = self._calculate_summary(results)

            return {
                "scan_id": scan_id,
                "subscription_id": subscription_id,
                "resource_group": resource_group,
                "cluster_name": cluster_name,
                "cluster_id": cluster_info.get("id"),
                "status": "completed",
                "started_at": started_at.isoformat(),
                "completed_at": datetime.utcnow().isoformat(),
                "summary": summary,
                "results": results,
            }

        except Exception as e:
            return {
                "scan_id": scan_id,
                "subscription_id": subscription_id,
                "resource_group": resource_group,
                "cluster_name": cluster_name,
                "cluster_id": None,
                "status": "failed",
                "started_at": started_at.isoformat(),
                "completed_at": datetime.utcnow().isoformat(),
                "error_message": str(e),
                "summary": None,
                "results": [],
            }

    async def _evaluate_recommendation(
        self,
        recommendation: Dict[str, Any],
        cluster_data: Dict[str, Any],
        cluster_info: Dict[str, Any],
        subscription_id: str,
    ) -> Dict[str, Any]:
        """Evaluate a single recommendation against the cluster."""
        rec_id = recommendation.get("id", recommendation.get("recommendation_name", "unknown"))
        rec_name = recommendation.get("recommendation_name", "Unknown")
        category = recommendation.get("category", "Unknown")
        
        status = "CouldNotValidate"
        actual_value = None
        expected_value = recommendation.get("object.value")

        try:
            # Check if this uses a KQL query
            if "query_file" in recommendation:
                status = await self._evaluate_kql_query(
                    recommendation, cluster_info, subscription_id
                )
            elif "object_key" in recommendation:
                status, actual_value = self._evaluate_object_key(
                    recommendation, cluster_data
                )
        except Exception as e:
            status = "CouldNotValidate"
            actual_value = f"Error: {str(e)}"

        return {
            "recommendation_id": rec_id,
            "recommendation_name": rec_name,
            "category": category,
            "status": status,
            "actual_value": str(actual_value) if actual_value is not None else None,
            "expected_value": str(expected_value) if expected_value else None,
            "description": recommendation.get("description"),
            "remediation": recommendation.get("remediation"),
            "learn_more_link": recommendation.get("learn_more_link"),
        }

    async def _evaluate_kql_query(
        self,
        recommendation: Dict[str, Any],
        cluster_info: Dict[str, Any],
        subscription_id: str,
    ) -> str:
        """Evaluate a recommendation using a KQL query."""
        query_file = recommendation.get("query_file")
        query = load_kql_query(query_file)
        
        if not query:
            return "CouldNotValidate"

        try:
            results = await self.azure_client.run_resource_graph_query(
                query, [subscription_id]
            )

            # Filter results to this cluster
            filtered = [
                item for item in results
                if item.get("name") == cluster_info.get("name")
            ]

            # If the query finds matching resources, it means the check failed
            # (the query is designed to find non-compliant resources)
            return "Failed" if len(filtered) > 0 else "Passed"

        except Exception:
            return "CouldNotValidate"

    def _evaluate_object_key(
        self, recommendation: Dict[str, Any], cluster_data: Dict[str, Any]
    ) -> tuple:
        """Evaluate a recommendation by checking an object key path."""
        object_key = recommendation.get("object_key")
        expected_value = recommendation.get("object.value")

        if not object_key or object_key == "CouldNotValidated":
            return "CouldNotValidate", None

        # Navigate to the value using dot notation
        keys = object_key.replace("[", ".[").split(".")
        value = cluster_data

        try:
            for key in keys:
                if not key:
                    continue
                if isinstance(value, dict):
                    value = value.get(key, {})
                elif isinstance(value, list) and key.startswith("[") and key.endswith("]"):
                    idx = int(key[1:-1])
                    value = value[idx] if idx < len(value) else {}
                else:
                    value = getattr(value, key, {})

            # Check against expected value
            if isinstance(expected_value, str) and "|" in expected_value:
                allowed_values = [v.strip().lower() for v in expected_value.split("|")]
                passed = str(value).lower() in allowed_values
            elif isinstance(expected_value, list):
                passed = all(item in value for item in expected_value)
            else:
                passed = str(value).lower() == str(expected_value).lower()

            return ("Passed" if passed else "Failed"), value

        except Exception:
            return "CouldNotValidate", None

    def _calculate_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate summary statistics from results."""
        total = len(results)
        passed = sum(1 for r in results if r["status"] == "Passed")
        failed = sum(1 for r in results if r["status"] == "Failed")
        not_validated = sum(1 for r in results if r["status"] == "CouldNotValidate")

        # Calculate scores by pillar
        pillar_scores = {}
        for pillar in PILLARS:
            pillar_name = pillar["name"]
            pillar_results = [r for r in results if r["category"] == pillar_name]
            pillar_total = len(pillar_results)
            pillar_passed = sum(1 for r in pillar_results if r["status"] == "Passed")
            
            if pillar_total > 0:
                score = round((pillar_passed / pillar_total) * 100)
            else:
                score = 0

            pillar_scores[pillar_name] = {
                "score": score,
                "passed": pillar_passed,
                "failed": sum(1 for r in pillar_results if r["status"] == "Failed"),
                "not_validated": sum(1 for r in pillar_results if r["status"] == "CouldNotValidate"),
                "total": pillar_total,
            }

        # Overall score
        validated_total = passed + failed
        overall_score = round((passed / validated_total) * 100) if validated_total > 0 else 0

        return {
            "overall_score": overall_score,
            "total_checks": total,
            "passed": passed,
            "failed": failed,
            "not_validated": not_validated,
            "pillar_scores": pillar_scores,
        }
