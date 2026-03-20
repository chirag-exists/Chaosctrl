# ⚡ Chaosctrl

A lightweight control room for [LitmusChaos](https://litmuschaos.io). Simplify CNCF-grade chaos engineering with a developer-first dashboard. Bridge the gap between "we have failover" and "we've tested failover."

![Chaosctrl Dashboard](docs/screenshot.png)

## Features

| Feature | Description |
|---|---|
| **One-Click Chaos Gallery** | Pre-defined experiment cards (Pod Delete, CPU Hog, Memory Hog, Network Chaos, Disk Fill, Node Drain, Container Kill, Pod Network Latency) ready to trigger instantly. |
| **Real-Time Status Monitor** | Live polling table showing workflow run phases, resiliency scores, and pass/fail counts — refreshed every 5 seconds. |
| **Safety Switch** | Big red abort button with two-step confirmation that immediately stops all active chaos experiments. |

## Architecture

```
┌─────────────────┐     REST/JSON      ┌──────────────────────┐     GraphQL     ┌────────────────┐
│  React Frontend │ ◄────────────────► │  Node.js/Express API │ ◄─────────────► │  LitmusChaos   │
│  (Tailwind CSS) │                    │  (chaosctrl-backend) │                 │  GraphQL API   │
└─────────────────┘                    └──────────────────────┘                 └────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- A running LitmusChaos instance with its GraphQL API accessible

### Local Development

```bash
# 1. Backend
cd backend
cp .env.example .env          # Fill in LITMUS_ENDPOINT, LITMUS_TOKEN, LITMUS_PROJECT_ID
npm install
npm run dev                    # Starts on http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local     # Set VITE_API_BASE=http://localhost:4000
npm install
npm run dev                    # Starts on http://localhost:5173
```

### Docker Compose

```bash
# Set your Litmus credentials
export LITMUS_ENDPOINT=http://your-litmus-host:9002/query
export LITMUS_TOKEN=your-bearer-token
export LITMUS_PROJECT_ID=your-project-id

docker-compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:4000
```

### Kubernetes

```bash
# 1. Edit k8s/deployment.yaml
#    - Set LITMUS_ENDPOINT in the ConfigMap
#    - Set LITMUS_TOKEN in the Secret
#    - Set LITMUS_PROJECT_ID in the ConfigMap
#    - Update the Ingress hostname

# 2. Apply
kubectl apply -f k8s/deployment.yaml

# 3. Check pods
kubectl get pods -n chaosctrl
```

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/experiments/templates` | Pre-defined experiment gallery |
| `GET` | `/api/experiments` | List all LitmusChaos workflows |
| `POST` | `/api/experiments/:id/run` | Trigger a specific workflow |
| `GET` | `/api/experiments/runs` | List all workflow runs |
| `GET` | `/api/experiments/runs/:runID` | Get a single workflow run |
| `POST` | `/api/experiments/abort` | 🛑 Abort all active runs (Safety Switch) |

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `LITMUS_ENDPOINT` | `http://litmus-server-service:9002/query` | LitmusChaos GraphQL endpoint |
| `LITMUS_TOKEN` | _(empty)_ | LitmusChaos Bearer token |
| `LITMUS_PROJECT_ID` | `default-project` | LitmusChaos project ID |
| `PORT` | `4000` | Backend port |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:4000` | Backend API URL |

## Project Structure

```
Chaosctrl/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry point
│   │   ├── routes/
│   │   │   └── experiments.js    # API routes
│   │   ├── litmus/
│   │   │   ├── client.js         # LitmusChaos GraphQL client
│   │   │   └── templates.js      # Pre-defined experiment metadata
│   │   └── __tests__/
│   │       └── api.test.js       # Jest tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Root component
│   │   ├── api.js                # API client
│   │   ├── hooks/
│   │   │   └── useWorkflowRuns.js # Polling hook
│   │   └── components/
│   │       ├── ChaosGallery.jsx  # One-Click Chaos Gallery
│   │       ├── StatusMonitor.jsx # Real-Time Status Monitor
│   │       └── SafetySwitch.jsx  # Safety Switch
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── k8s/
│   └── deployment.yaml           # Kubernetes manifests
├── docker-compose.yml
└── README.md
```

## Running Tests

```bash
cd backend
npm test
```
