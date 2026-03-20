# Chaosctrl ⚡

A lightweight control room for [LitmusChaos](https://litmuschaos.io).  
Simplify CNCF-grade chaos engineering with a developer-first dashboard.  
Bridge the gap between *"we have failover"* and *"we've tested failover."*

---

## Features

| Feature | Description |
|---------|-------------|
| **One-Click Chaos Gallery** | 8 pre-defined experiments (Pod Delete, CPU Hog, Memory Hog, Container Kill, Network Latency, Network Loss, Disk Fill, Node CPU Hog) — launch any with one click |
| **Real-time Status Monitor** | Live progress bars for every running experiment, polling every 3 s |
| **Safety Switch** | Big red button — immediately aborts every active experiment run |
| **Mock Mode** | Works out-of-the-box without a real LitmusChaos cluster (great for local dev) |
| **Live Mode** | Point at a real LitmusChaos portal via environment variables and get full GraphQL integration |

---

## Architecture

```
chaosctrl/
├── backend/          # Node.js / Express REST API
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/   # experiments, runs, abort
│   │   ├── services/ # litmus.js – GraphQL client + mock simulation
│   │   └── data/     # pre-defined experiment templates + YAML generator
│   └── Dockerfile
├── frontend/         # React + Vite + Tailwind CSS dashboard
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/      # fetch wrapper
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── ExperimentGallery.jsx
│   │       ├── ExperimentCard.jsx
│   │       ├── StatusMonitor.jsx
│   │       └── SafetySwitch.jsx
│   └── Dockerfile
├── k8s/
│   └── deployment.yaml   # Namespace, Deployments, Services, Ingress
└── docker-compose.yml    # Local dev / quick start
```

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Start the backend (mock mode – no LitmusChaos needed)
cd ../backend && npm start

# 3. Start the frontend dev server (in a second terminal)
cd ../frontend && npm run dev
```

Open **http://localhost:3000** – the dashboard is live.

### Using Docker Compose

```bash
docker-compose up --build
```

Frontend: http://localhost:3000  
Backend API: http://localhost:3001

---

## Connecting to a Real LitmusChaos Cluster

Copy `backend/.env.example` to `backend/.env` and fill in your cluster details:

```env
LITMUS_ENDPOINT=http://litmusportal-server-service.litmus:9091
LITMUS_USERNAME=admin
LITMUS_PASSWORD=litmus
LITMUS_PROJECT_ID=<your-project-id>
LITMUS_CLUSTER_ID=<your-cluster-id>
```

When `LITMUS_ENDPOINT` is set the backend authenticates against the LitmusChaos  
GraphQL API, creates Argo Workflow manifests for each experiment, and tracks real  
workflow run status. When unset, a built-in simulator runs instead.

---

## Kubernetes Deployment

```bash
# Create the namespace + deploy everything
kubectl apply -f k8s/deployment.yaml

# Create the connection secret (fill in your real values)
kubectl create secret generic chaosctrl-litmus-secret \
  --namespace chaosctrl \
  --from-literal=endpoint=http://litmusportal-server-service.litmus:9091 \
  --from-literal=username=admin \
  --from-literal=password=litmus \
  --from-literal=project_id=<project-id> \
  --from-literal=cluster_id=<cluster-id>
```

Edit `k8s/deployment.yaml` to update the Ingress hostname and image references  
for your own registry.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + current mode |
| `GET` | `/api/experiments` | List all pre-defined experiments |
| `POST` | `/api/experiments/:id/run` | Trigger an experiment (body: `{ namespace, appLabel, duration }`) |
| `GET` | `/api/runs` | List all experiment runs (newest first) |
| `GET` | `/api/runs/:runId` | Get a single run's status |
| `POST` | `/api/abort` | **Safety Switch** – abort all active runs |

---

## Pre-defined Experiments

| ID | Name | Category | Risk |
|----|------|----------|------|
| `pod-delete` | Pod Delete | pod | Medium |
| `pod-cpu-hog` | CPU Hog | pod | High |
| `pod-memory-hog` | Memory Hog | pod | High |
| `container-kill` | Container Kill | pod | Medium |
| `pod-network-latency` | Network Latency | network | Low |
| `pod-network-loss` | Network Loss | network | Medium |
| `disk-fill` | Disk Fill | storage | High |
| `node-cpu-hog` | Node CPU Hog | node | High |

