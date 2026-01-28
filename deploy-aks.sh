#!/bin/bash
# AKS Deployment Script for AKS BPA
# Usage: ./deploy-aks.sh [options]
#
# Options:
#   --build           Build and push Docker images before deploying
#   --registry        Container registry (default: ghcr.io/mustafakaya)
#   --namespace       Kubernetes namespace (default: aks-bpa)
#   --dry-run         Show what would be deployed without applying

set -e

# Default values
REGISTRY="${REGISTRY:-ghcr.io/mustafakaya}"
NAMESPACE="${NAMESPACE:-aks-bpa}"
BUILD_IMAGES=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_IMAGES=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🚀 AKS BPA Deployment Script"
echo "=============================="
echo "Registry: $REGISTRY"
echo "Namespace: $NAMESPACE"
echo ""

# Build and push images if requested
if [ "$BUILD_IMAGES" = true ]; then
    echo "📦 Building Docker images..."
    
    # Build backend
    echo "Building backend image..."
    docker build -t "$REGISTRY/aks-bpa-backend:latest" ./backend
    
    # Build frontend
    echo "Building frontend image..."
    docker build -t "$REGISTRY/aks-bpa-frontend:latest" ./frontend
    
    echo "📤 Pushing images to registry..."
    docker push "$REGISTRY/aks-bpa-backend:latest"
    docker push "$REGISTRY/aks-bpa-frontend:latest"
    
    echo "✅ Images built and pushed successfully"
    echo ""
fi

# Check for secret
if [ ! -f "k8s/secret.yaml" ]; then
    echo "⚠️  Warning: k8s/secret.yaml not found!"
    echo "   Please create it from k8s/secret.yaml.template with your Azure credentials"
    echo ""
    echo "   cp k8s/secret.yaml.template k8s/secret.yaml"
    echo "   # Edit k8s/secret.yaml with your values"
    echo ""
    
    if [ "$DRY_RUN" = false ]; then
        read -p "Continue without secrets? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Deploy using kubectl
if [ "$DRY_RUN" = true ]; then
    echo "🔍 Dry run - showing what would be deployed..."
    kubectl apply -k k8s/ --dry-run=client
else
    echo "🚀 Deploying to AKS..."
    
    # Apply namespace and configs first
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    
    # Apply secret if exists
    if [ -f "k8s/secret.yaml" ]; then
        kubectl apply -f k8s/secret.yaml
    fi
    
    # Apply deployments and services
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/frontend.yaml
    kubectl apply -f k8s/ingress.yaml
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📊 Checking deployment status..."
    kubectl get pods -n $NAMESPACE
    echo ""
    kubectl get services -n $NAMESPACE
    echo ""
    kubectl get ingress -n $NAMESPACE
    echo ""
    echo "🌐 Access the application via the Ingress IP/hostname above"
fi
