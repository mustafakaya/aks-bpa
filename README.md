# AKS Best Practices Assessment (aks-bpa) v2.0

🚀 **AKS BPA** is a standalone web application for evaluating Azure Kubernetes Service (AKS) clusters against the **Azure Well-Architected Framework** best practices.

![AKS BPA Dashboard](docs/images/dashboard-preview.png)

## 🎯 Overview

This tool helps platform engineers, DevOps teams, and SREs validate their AKS clusters against real-world best practices across five key pillars:

| Pillar | Description |
|--------|-------------|
| ✅ **Reliability** | Ensure clusters are resilient and highly available |
| 🔐 **Security** | Protect workloads, data, and access |
| 💰 **Cost Optimization** | Optimize resource usage and reduce costs |
| ⚙️ **Operational Excellence** | Streamline operations and monitoring |
| 🚀 **Performance Efficiency** | Maximize performance and scalability |

## ✨ Features

- 🔍 **JSON-driven recommendation engine** - Easily extensible checks
- 📊 **Azure Resource Graph (ARG) support** - Advanced cross-resource queries
- 💡 **Deep property checks** - Validate nested cluster configurations
- 🟢 **Clear status mapping** - ✅ Passed / ❌ Failed / ⚠️ Could Not Validate
- 📈 **Historical tracking** - Compare scans over time
- 🎨 **Modern React UI** - Beautiful dashboard with Fluent UI
- 🐳 **Docker ready** - Easy deployment with docker-compose
- 🔌 **REST API** - Integrate with your existing tooling

## 📦 Architecture

```
aks-bpa/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # REST API endpoints
│   │   ├── checks/         # Recommendation definitions
│   │   │   └── definitions/
│   │   │       ├── recommendations.json
│   │   │       └── kql/    # KQL query files
│   │   ├── core/           # Configuration & database
│   │   ├── models/         # SQLAlchemy models
│   │   └── services/       # Business logic
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript definitions
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** (for backend)
- **Node.js 18+** (for frontend)
- **Azure CLI** or Azure credentials configured
- **Docker** (optional, for containerized deployment)

### Option 1: Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/aks-bpa.git
cd aks-bpa

# Start the application
docker-compose up -d

# Open in browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option 2: Run Locally

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open your browser to `http://localhost:3000`

## 🔐 Azure Authentication

AKS BPA uses Azure credentials to access your AKS clusters. You have several options:

### Option 1: Azure CLI (Development)

```bash
# Login with Azure CLI
az login
```

The application will automatically use your CLI credentials.

### Option 2: Environment Variables (Production)

Create a `.env` file in the `backend` directory:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Option 3: Managed Identity (Azure Deployment)

When deployed to Azure (Container Apps, App Service, etc.), the application can use managed identity.

### Required Permissions

The service principal or identity needs:

- **Reader** role on subscriptions containing AKS clusters
- **Azure Kubernetes Service Cluster User Role** for cluster access
- **Reader** on Resource Graph for ARG queries

## 📋 Best Practice Checks

The tool includes **30+ recommendations** across all five pillars:

### Reliability
- Update AKS tier to Standard or Premium
- Deploy across availability zones
- Enable cluster auto-scaler
- Configure Azure CNI networking
- Back up Azure Kubernetes Service
- Use ephemeral OS disks
- And more...

### Security
- Use managed identities
- Enable Microsoft Entra Workload ID
- Use private AKS cluster
- Enable Microsoft Defender
- Disable local accounts
- Use Azure RBAC for Kubernetes
- Enable network policies
- And more...

### Cost Optimization
- Use cost analysis add-on
- Consider ARM64-based VMs
- Use Spot VMs for non-production
- Choose right VM instance types

### Operational Excellence
- Enable Azure Monitor
- Use Azure Policy for AKS
- Enable KEDA
- Configure GitOps with Flux

### Performance Efficiency
- Use latest Kubernetes version
- Enable Vertical Pod Autoscaler
- Enable node auto-provisioning (Karpenter)

## 🔧 API Reference

The backend exposes a REST API. View interactive documentation at `/docs` when running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/` | List Azure subscriptions |
| GET | `/api/clusters/` | List AKS clusters |
| POST | `/api/scans/` | Start a new scan |
| GET | `/api/scans/{id}` | Get scan results |
| GET | `/api/recommendations/` | List all recommendations |
| GET | `/api/recommendations/pillars` | List WAF pillars |

### Example: Start a Scan

```bash
curl -X POST http://localhost:8000/api/scans/ \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": "your-subscription-id",
    "resource_group": "your-rg",
    "cluster_name": "your-cluster"
  }'
```

## 🎨 Extending Recommendations

Add new checks by editing `backend/app/checks/definitions/recommendations.json`:

```json
{
  "id": "custom-001",
  "category": "Security",
  "recommendation_name": "Enable my custom check",
  "description": "Description of why this matters",
  "object_key": "properties.someProperty.enabled",
  "object.value": "true",
  "remediation": "How to fix this issue",
  "learn_more_link": "https://docs.microsoft.com/..."
}
```

For complex checks, use KQL queries:

```json
{
  "id": "custom-002",
  "category": "Reliability",
  "recommendation_name": "Check using ARG query",
  "query_file": "my_custom_check.kql"
}
```

## 📚 References

This tool is built with guidance from:

- [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)
- [Azure Proactive Resiliency Library (APRL)](https://azure.github.io/Azure-Proactive-Resiliency-Library-v2/welcome/)
- [AKS Best Practices](https://learn.microsoft.com/en-us/azure/aks/best-practices)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Microsoft Azure for the amazing AKS platform
- The Azure Well-Architected Framework team
- All contributors to this project

---

**Let's build better clusters! 🚀**
