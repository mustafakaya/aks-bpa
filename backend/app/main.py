"""
AKS Best Practices Assessment - Main Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api import clusters, scans, recommendations, subscriptions, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="AKS Best Practices Assessment",
    description="""
    🚀 **AKS BPA** - Azure Kubernetes Service Best Practices Assessment Tool
    
    This tool evaluates your AKS clusters against a set of recommendations based on the 
    **Azure Well-Architected Framework** across five key pillars:
    
    - ✅ **Reliability** - Ensure your clusters are resilient and available
    - 🔐 **Security** - Protect your workloads and data
    - 💰 **Cost Optimization** - Optimize resource usage and costs
    - ⚙️ **Operational Excellence** - Streamline operations and monitoring
    - 🚀 **Performance Efficiency** - Maximize performance and scalability
    
    ## Features
    
    - 🔍 JSON-driven recommendation engine
    - 📊 Azure Resource Graph (ARG) support for advanced queries
    - 💡 Support for deep cluster attribute checks
    - 🟢 ✅ Passed / ❌ Failed / ⚠️ CouldNotValidate status mapping
    - 📈 Historical scan tracking and comparison
    """,
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(clusters.router, prefix="/api/clusters", tags=["Clusters"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - Health check."""
    return {
        "name": "AKS Best Practices Assessment",
        "version": "2.0.0",
        "status": "healthy",
        "description": "Evaluate AKS clusters against Azure Well-Architected Framework",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
    }
