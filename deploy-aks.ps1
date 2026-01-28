# AKS BPA Deployment Script for Windows
# Usage: .\deploy-aks.ps1 [-Build] [-Registry <registry>] [-Namespace <namespace>] [-DryRun]

param(
    [switch]$Build,
    [string]$Registry = "ghcr.io/mustafakaya",
    [string]$Namespace = "aks-bpa",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 AKS BPA Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Registry: $Registry"
Write-Host "Namespace: $Namespace"
Write-Host ""

# Build and push images if requested
if ($Build) {
    Write-Host "📦 Building Docker images..." -ForegroundColor Yellow
    
    # Build backend
    Write-Host "Building backend image..."
    docker build -t "$Registry/aks-bpa-backend:latest" ./backend
    if ($LASTEXITCODE -ne 0) { throw "Failed to build backend image" }
    
    # Build frontend
    Write-Host "Building frontend image..."
    docker build -t "$Registry/aks-bpa-frontend:latest" ./frontend
    if ($LASTEXITCODE -ne 0) { throw "Failed to build frontend image" }
    
    Write-Host "📤 Pushing images to registry..." -ForegroundColor Yellow
    docker push "$Registry/aks-bpa-backend:latest"
    docker push "$Registry/aks-bpa-frontend:latest"
    
    Write-Host "✅ Images built and pushed successfully" -ForegroundColor Green
    Write-Host ""
}

# Check for secret
if (-not (Test-Path "k8s/secret.yaml")) {
    Write-Host "⚠️  Warning: k8s/secret.yaml not found!" -ForegroundColor Yellow
    Write-Host "   Please create it from k8s/secret.yaml.template with your Azure credentials"
    Write-Host ""
    Write-Host "   Copy-Item k8s/secret.yaml.template k8s/secret.yaml"
    Write-Host "   # Edit k8s/secret.yaml with your values"
    Write-Host ""
    
    if (-not $DryRun) {
        $response = Read-Host "Continue without secrets? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            exit 1
        }
    }
}

# Deploy using kubectl
if ($DryRun) {
    Write-Host "🔍 Dry run - showing what would be deployed..." -ForegroundColor Yellow
    kubectl apply -k k8s/ --dry-run=client
} else {
    Write-Host "🚀 Deploying to AKS..." -ForegroundColor Green
    
    # Apply namespace and configs first
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    
    # Apply secret if exists
    if (Test-Path "k8s/secret.yaml") {
        kubectl apply -f k8s/secret.yaml
    }
    
    # Apply deployments and services
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/frontend.yaml
    kubectl apply -f k8s/ingress.yaml
    
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Checking deployment status..." -ForegroundColor Cyan
    kubectl get pods -n $Namespace
    Write-Host ""
    kubectl get services -n $Namespace
    Write-Host ""
    kubectl get ingress -n $Namespace
    Write-Host ""
    Write-Host "🌐 Access the application via the Ingress IP/hostname above" -ForegroundColor Cyan
}
