# Chaosctrl — User Manual

> **Chaosctrl** is a lightweight control room for [LitmusChaos](https://litmuschaos.io).  
> It abstracts complex YAML configurations into a clean, developer-friendly dashboard so you can trigger, monitor, and stop chaos experiments in seconds — not hours.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
   - 3.1 [Local Development](#31-local-development)
   - 3.2 [Docker Compose](#32-docker-compose)
   - 3.3 [Kubernetes](#33-kubernetes)
4. [Configuration Reference](#4-configuration-reference)
5. [Using the Dashboard](#5-using-the-dashboard)
   - 5.1 [Safety Switch](#51-safety-switch)
   - 5.2 [One-Click Chaos Gallery](#52-one-click-chaos-gallery)
   - 5.3 [Real-Time Status Monitor](#53-real-time-status-monitor)
6. [Experiment Catalog](#6-experiment-catalog)
7. [API Reference](#7-api-reference)
8. [Project Structure](#8-project-structure)
9. [Troubleshooting](#9-troubleshooting)
10. [FAQ](#10-faq)

---

## 1. Overview

Chaosctrl sits between your engineers and LitmusChaos. Instead of writing and applying Argo workflow YAML files, engineers open the dashboard and click a button.

```
┌─────────────────┐     REST/JSON      ┌──────────────────────┐     GraphQL     ┌────────────────┐
│  React Frontend │ ◄────────────────► │  Node.js/Express API │ ◄─────────────► │  LitmusChaos   │
│  (Tailwind CSS) │                    │  (chaosctrl-backend) │                 │  GraphQL API   │
└─────────────────┘                    └──────────────────────┘                 └────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS | Developer UI |
| **Backend** | Node.js 20, Express 4 | LitmusChaos API proxy |
| **Protocol** | LitmusChaos GraphQL API | Workflow management |
| **Packaging** | Docker, Kubernetes | Deployment |

---

## 2. Prerequisites

### Required

| Requirement | Minimum Version | Notes |
|---|---|---|
| **Node.js** | 20 LTS | For local development |
| **npm** | 9+ | Bundled with Node 20 |
| **LitmusChaos** | 2.x | Running and accessible |
| **LitmusChaos GraphQL API** | — | Endpoint + project ID + bearer token |

### Optional (for Docker/Kubernetes deployments)

| Tool | Purpose |
|---|---|
| Docker 24+ | Build and run containers |
| Docker Compose v2 | Local multi-container stack |
| kubectl | Kubernetes deployments |
| A Kubernetes cluster | Production deployment |

### Getting your LitmusChaos credentials

You need three values from your LitmusChaos instance before starting:

1. **`LITMUS_ENDPOINT`** — The GraphQL API URL of your LitmusChaos server.  
   Default when installed via Helm: `http://litmus-server-service.litmus.svc.cluster.local:9002/query`

2. **`LITMUS_PROJECT_ID`** — Found in the LitmusChaos portal under **Settings → My Account → Project ID**, or from the URL when inside a project.

3. **`LITMUS_TOKEN`** — A bearer token from the Litmus portal:  
   **Settings → User Management → (your user) → Copy token**

---

## 3. Installation

### 3.1 Local Development

Use this for local testing or development without Docker.

**Step 1 — Clone the repository**

```bash
git clone https://github.com/chirag-exists/Chaosctrl.git
cd Chaosctrl
```

**Step 2 — Start the backend**

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your LitmusChaos details:

```dotenv
LITMUS_ENDPOINT=http://your-litmus-host:9002/query
LITMUS_PROJECT_ID=your-project-id
LITMUS_TOKEN=your-bearer-token
PORT=4000
```

Then install dependencies and start:

```bash
npm install
npm run dev        # Hot-reloading dev server on http://localhost:4000
# or
npm start          # Production mode
```

Verify the backend is running:

```bash
curl http://localhost:4000/api/health
# Expected: {"status":"ok","service":"chaosctrl-backend"}
```

**Step 3 — Start the frontend** (new terminal)

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
VITE_API_BASE=http://localhost:4000
```

Then install and start:

```bash
npm install
npm run dev        # Dev server on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

### 3.2 Docker Compose

The fastest way to run the full stack locally.

**Step 1 — Set environment variables**

```bash
export LITMUS_ENDPOINT=http://your-litmus-host:9002/query
export LITMUS_TOKEN=your-bearer-token
export LITMUS_PROJECT_ID=your-project-id
```

**Step 2 — Build and start**

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

**Step 3 — Stop**

```bash
docker-compose down
```

> **Note:** The `VITE_API_BASE` build argument in `docker-compose.yml` defaults to `http://localhost:4000`. If you change the backend port, update both `docker-compose.yml` and rebuild the frontend image.

---

### 3.3 Kubernetes

Deploy Chaosctrl directly into the cluster where LitmusChaos is running.

**Step 1 — Edit `k8s/deployment.yaml`**

Open `k8s/deployment.yaml` and update:

```yaml
# ConfigMap — set your LitmusChaos endpoint and project ID
data:
  LITMUS_ENDPOINT: "http://litmus-server-service.litmus.svc.cluster.local:9002/query"
  LITMUS_PROJECT_ID: "your-actual-project-id"
```

```yaml
# Secret — paste your LitmusChaos bearer token
stringData:
  LITMUS_TOKEN: "your-actual-token"
```

```yaml
# Ingress — set your actual hostname
- host: chaosctrl.your-domain.com
```

**Step 2 — Build and push your Docker images**

```bash
# Replace with your registry/image names
docker build -t your-registry/chaosctrl-backend:latest ./backend
docker build -t your-registry/chaosctrl-frontend:latest ./frontend
docker push your-registry/chaosctrl-backend:latest
docker push your-registry/chaosctrl-frontend:latest
```

Then update the `image:` fields in `k8s/deployment.yaml` to match.

**Step 3 — Apply the manifests**

```bash
kubectl apply -f k8s/deployment.yaml
```

**Step 4 — Verify**

```bash
kubectl get all -n chaosctrl
# Expected: pods, services, deployments all Running/Available

kubectl get pods -n chaosctrl
# chaosctrl-backend-xxx    1/1  Running
# chaosctrl-frontend-xxx   1/1  Running
```

**Step 5 — Access the dashboard**

If you configured the Ingress: open `https://chaosctrl.your-domain.com` in your browser.

If you're testing without Ingress, use port-forwarding:

```bash
kubectl port-forward svc/chaosctrl-frontend 3000:80 -n chaosctrl
# Then open http://localhost:3000
```

---

## 4. Configuration Reference

### Backend environment variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `LITMUS_ENDPOINT` | `http://litmus-server-service:9002/query` | ✅ Yes | Full URL of the LitmusChaos GraphQL API |
| `LITMUS_TOKEN` | _(empty)_ | ⚠️ Depends | Bearer token for LitmusChaos authentication. Required if your Litmus instance has auth enabled. |
| `LITMUS_PROJECT_ID` | `default-project` | ✅ Yes | The LitmusChaos project to operate on |
| `PORT` | `4000` | No | Port the backend listens on |
| `NODE_ENV` | `development` | No | Set to `production` when deploying |

### Frontend environment variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `VITE_API_BASE` | `http://localhost:4000` | ✅ Yes | Full URL of the Chaosctrl backend as seen from the browser |

> **Important:** `VITE_API_BASE` is baked into the frontend bundle at build time (Vite inlines `import.meta.env.*`). If you change the backend URL after building, you must rebuild the frontend.

---

## 5. Using the Dashboard

The dashboard has three panels, displayed from top to bottom:

```
┌────────────────────────────────────────┐
│  ⚡ Chaosctrl    LitmusChaos Control Room  │  ← Header
├────────────────────────────────────────┤
│  🛑  Safety Switch                      │  ← Panel 1 (always visible)
├────────────────────────────────────────┤
│  ⚡  One-Click Chaos Gallery            │  ← Panel 2
├────────────────────────────────────────┤
│  📡  Real-Time Status Monitor          │  ← Panel 3
└────────────────────────────────────────┘
```

---

### 5.1 Safety Switch

**Location:** Top of the page, always visible.

**Purpose:** Immediately stop every active chaos experiment with one confirmed click. Use this if something unexpected happens during a test and you need to kill all experiments immediately.

**How to use:**

1. Click the red **🛑 Abort All** button.
2. The panel turns orange and asks: *"Abort all running experiments?"*
3. Click **⚠️ Confirm Abort** to proceed, or **Cancel** to go back.
4. A spinner appears while the abort is in progress.
5. When complete, the panel turns green and shows how many runs were stopped (e.g. *"✅ Aborted 3 runs"*).
6. After 6 seconds the panel resets to its default red state.

**What it aborts:** Any workflow run in `Running` or `Awaited` phase at the time of the click. Already-completed runs (`Succeeded`, `Failed`, `Stopped`) are unaffected.

> **Safety design:** Two clicks are always required. The first click is the intent, the second is the confirmation. This prevents accidental aborts.

---

### 5.2 One-Click Chaos Gallery

**Location:** Middle section of the dashboard.

**Purpose:** Browse and immediately trigger pre-defined chaos experiments without writing any YAML.

**How to use:**

1. Each card represents one type of chaos experiment.  
   - The **icon** and **name** identify the experiment type.
   - The **description** explains what the experiment does.
   - The **severity badge** (bottom-left of each card) indicates potential impact:
     - 🟢 `low` — minimal risk, safe for most environments
     - 🟡 `medium` — moderate impact, test in staging first
     - 🟠 `high` — significant resource impact, use with care
     - 🔴 `critical` — can cause workload loss, only in controlled environments
2. If a matching workflow exists in your LitmusChaos project, the button shows **▶ Run**.  
   Click it to immediately trigger the experiment.
3. If no matching workflow exists, the button shows **⚙ Setup** (greyed out). You must first import the corresponding experiment workflow into LitmusChaos.
4. After clicking **▶ Run**, a toast notification appears at the top of the gallery:
   - ✅ Green: experiment was triggered, shows the new Run ID.
   - ❌ Red: trigger failed, shows the error reason.

**Matching logic:** The gallery card is linked to a LitmusChaos workflow by name. Chaosctrl looks for a workflow whose name contains the experiment `id` (e.g. `pod-delete`). Name your workflows in LitmusChaos so they include the experiment type in their name (e.g. `"my-app-pod-delete"` will match the **Pod Delete** card).

---

### 5.3 Real-Time Status Monitor

**Location:** Bottom section of the dashboard.

**Purpose:** Live view of all workflow run statuses — automatically refreshes every 5 seconds.

**Reading the table:**

| Column | Description |
|---|---|
| **Workflow** | The workflow name (top) and the unique run ID (below, monospace font) |
| **Phase** | Current execution status with an animated indicator dot |
| **Resiliency** | Score as a colour-coded progress bar (green ≥80%, yellow ≥50%, red <50%) |
| **Experiments** | `passed / total` count. Red `(N fail)` suffix if any experiments failed |
| **Started** | Timestamp when the run began |

**Phase values and what they mean:**

| Phase | Colour | Meaning |
|---|---|---|
| `Running` | 🔵 Blue (pulsing) | Experiment is actively executing |
| `Awaited` | 🟡 Yellow (pulsing) | Queued or waiting for a step to complete |
| `Succeeded` | 🟢 Green | All experiments passed |
| `Failed` | 🔴 Red | One or more experiments failed |
| `Stopped` | ⚫ Grey | Run was manually aborted |
| `Unknown` | ⚫ Grey | Status not yet available |

**Active badge:** When one or more runs are in `Running` or `Awaited` phase, a pulsing blue **N ACTIVE** badge appears next to the section heading.

**Manual refresh:** Click the **🔄 Refresh** button (top-right of the panel) to fetch the latest status immediately, without waiting for the 5-second interval.

**Error state:** If the backend is unreachable, a warning banner appears:  
*"⚠️ [error message] — retrying automatically every 5s"*  
The table will resume updating once the connection is restored.

---

## 6. Experiment Catalog

These are the eight pre-defined experiments available in the gallery. Each must have a matching workflow imported into LitmusChaos (with the experiment ID in the workflow name) before it can be triggered.

| Icon | Name | ID | Category | Severity | What it tests |
|---|---|---|---|---|---|
| 💥 | Pod Delete | `pod-delete` | pod | medium | Auto-healing, pod restart policies, high availability |
| 🔥 | CPU Hog | `cpu-hog` | stress | high | CPU throttling, HPA behaviour, resource starvation |
| 🧠 | Memory Hog | `memory-hog` | stress | high | OOM handling, memory limits, eviction policies |
| 🌐 | Network Chaos | `network-chaos` | network | medium | Retry logic, timeouts, circuit breakers |
| 💾 | Disk Fill | `disk-fill` | io | high | Disk-space monitoring, application graceful degradation |
| 🖥️ | Node Drain | `node-drain` | node | critical | Workload rescheduling, PodDisruptionBudgets |
| 🪓 | Container Kill | `container-kill` | pod | medium | Container restart policies, init containers |
| ⏱️ | Pod Network Latency | `pod-network-latency` | network | low | Timeout handling, SLA compliance under latency |

### Importing an experiment workflow into LitmusChaos

1. Open the LitmusChaos portal.
2. Go to **Chaos Workflows → Schedule a workflow**.
3. Choose a pre-defined hub experiment matching the type (e.g. *pod-delete*).
4. **Name the workflow so it contains the Chaosctrl experiment ID** (e.g. `staging-pod-delete`).
5. Configure target namespace, labels, and duration as appropriate.
6. Save and activate the workflow.
7. Reload the Chaosctrl gallery — the card button will now show **▶ Run**.

---

## 7. API Reference

The backend exposes a REST JSON API at `http://<backend-host>:4000`. All responses are JSON.

### Health

#### `GET /api/health`

Returns the backend health status.

**Response 200:**
```json
{
  "status": "ok",
  "service": "chaosctrl-backend"
}
```

---

### Experiment Templates

#### `GET /api/experiments/templates`

Returns the static gallery of pre-defined experiment cards. Does **not** call LitmusChaos.

**Response 200:**
```json
{
  "templates": [
    {
      "id": "pod-delete",
      "name": "Pod Delete",
      "description": "Randomly deletes pods to test auto-healing and high availability.",
      "icon": "💥",
      "category": "pod",
      "severity": "medium",
      "defaultNamespace": "default"
    }
  ]
}
```

---

### Workflows

#### `GET /api/experiments`

Lists all chaos workflows in the configured LitmusChaos project.

**Response 200:**
```json
{
  "workflows": [
    {
      "workflowID": "abc-123",
      "workflowName": "my-app-pod-delete",
      "workflowDescription": "",
      "cronSyntax": "",
      "workflowType": "workflow",
      "isCustomWorkflow": false,
      "tags": [],
      "createdAt": "1700000000",
      "updatedAt": "1700000000"
    }
  ]
}
```

**Response 502:** LitmusChaos is unreachable or returned an error.

---

#### `POST /api/experiments/:workflowID/run`

Triggers a workflow run by its LitmusChaos workflow ID.

**URL params:**
- `:workflowID` — the `workflowID` from `GET /api/experiments`

**Response 200:**
```json
{
  "workflowRunID": "run-xyz-456",
  "message": "Workflow run request received"
}
```

**Response 502:** Trigger failed (workflow not found, Litmus unreachable, etc.)

---

### Workflow Runs

#### `GET /api/experiments/runs`

Lists all workflow run records (up to what LitmusChaos returns, most recent first).

**Response 200:**
```json
{
  "totalNoOfWorkflowRuns": 5,
  "workflowRuns": [
    {
      "workflowRunID": "run-xyz-456",
      "workflowID": "abc-123",
      "workflowName": "my-app-pod-delete",
      "phase": "Succeeded",
      "resiliencyScore": 100,
      "totalExperiments": 1,
      "experimentsPassed": 1,
      "experimentsFailed": 0,
      "executionData": "...",
      "createdAt": "1700000100",
      "updatedAt": "1700000200"
    }
  ]
}
```

---

#### `GET /api/experiments/runs/:runID`

Gets a single workflow run by its run ID.

**URL params:**
- `:runID` — the `workflowRunID`

**Response 200:** Single run object (same shape as an item from the list above).

**Response 502:** Run not found or Litmus unreachable.

---

### Safety Switch

#### `POST /api/experiments/abort`

Aborts all active workflow runs. This is the API backing the Safety Switch button.

**Request body** (optional):
```json
{
  "runIDs": ["run-xyz-456", "run-abc-789"]
}
```

- If `runIDs` is provided, only those specific runs are stopped.
- If `runIDs` is omitted, the backend automatically fetches all runs, filters to `Running` and `Awaited` phases, and stops them all.

**Response 200 — some runs aborted:**
```json
{
  "message": "Abort signal sent",
  "aborted": 2,
  "result": true
}
```

**Response 200 — nothing to abort:**
```json
{
  "message": "No active workflow runs to abort",
  "aborted": 0
}
```

**Response 502:** Litmus unreachable or abort failed.

---

## 8. Project Structure

```
Chaosctrl/
│
├── backend/                        # Node.js/Express API
│   ├── src/
│   │   ├── index.js                # App entry point, Express setup, health route
│   │   ├── routes/
│   │   │   └── experiments.js      # All /api/experiments/* route handlers
│   │   ├── litmus/
│   │   │   ├── client.js           # LitmusChaos GraphQL client (5 operations)
│   │   │   └── templates.js        # Static experiment metadata list
│   │   └── __tests__/
│   │       └── api.test.js         # Jest integration tests (11 tests)
│   ├── .env.example                # Environment variable template
│   ├── Dockerfile                  # Node 20 Alpine image
│   └── package.json
│
├── frontend/                       # React + Tailwind CSS SPA
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Root layout component
│   │   ├── App.css                 # (empty — all styling via Tailwind)
│   │   ├── index.css               # Tailwind base/components/utilities
│   │   ├── api.js                  # fetch() wrapper for all backend calls
│   │   ├── hooks/
│   │   │   └── useWorkflowRuns.js  # Polling hook (5s interval, auto-cleanup)
│   │   └── components/
│   │       ├── ChaosGallery.jsx    # One-Click Chaos Gallery panel
│   │       ├── StatusMonitor.jsx   # Real-Time Status Monitor panel
│   │       └── SafetySwitch.jsx    # Safety Switch panel
│   ├── .env.example                # VITE_API_BASE template
│   ├── nginx.conf                  # SPA routing + gzip for production image
│   ├── Dockerfile                  # Multi-stage: Vite build → nginx serve
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── k8s/
│   └── deployment.yaml             # Namespace, Deployments, Services, Ingress,
│                                   # ConfigMap, Secret — all in one file
│
├── docs/
│   └── USER_MANUAL.md              # This file
│
├── docker-compose.yml              # Full local stack (backend + frontend)
├── .gitignore
└── README.md                       # Quick-start overview
```

---

## 9. Troubleshooting

### Gallery cards all show "⚙ Setup" (greyed out)

**Cause:** No workflows were found in LitmusChaos, or the workflow names don't contain the experiment ID.

**Fix:**
1. Check the backend can reach LitmusChaos:
   ```bash
   curl http://localhost:4000/api/experiments
   ```
   If it returns `{"workflows":[]}`, Litmus has no workflows in the project.
2. Verify the `LITMUS_PROJECT_ID` matches your project exactly (case-sensitive).
3. Ensure your workflow names include the experiment ID.  
   Example: a workflow named `"chaos-pod-delete-v1"` will match the **Pod Delete** card.

---

### "Failed to fetch workflows" error in the gallery

**Cause:** The backend cannot reach the LitmusChaos GraphQL endpoint.

**Fix:**
1. Verify `LITMUS_ENDPOINT` is correct:
   ```bash
   curl http://localhost:4000/api/health   # Backend is up?
   curl http://your-litmus-host:9002/query  # Litmus endpoint reachable?
   ```
2. If running in Kubernetes, confirm the service name and namespace:
   ```bash
   kubectl get svc -n litmus | grep server
   ```
3. Check that `LITMUS_TOKEN` is set if your Litmus instance has authentication enabled.

---

### Status Monitor shows "⚠️ [error] — retrying automatically every 5s"

**Cause:** The browser can't reach the Chaosctrl backend.

**Fix:**
1. Make sure the backend is running (`curl http://localhost:4000/api/health`).
2. Check that `VITE_API_BASE` was set correctly when the frontend was built.
3. Check for CORS issues in the browser's developer console (Network tab).

---

### Safety Switch shows "❌ [error message]"

**Cause:** The abort call to LitmusChaos failed.

**Fix:**
1. Check `LITMUS_TOKEN` is valid and not expired.
2. Verify the backend can reach LitmusChaos:  
   `curl http://localhost:4000/api/experiments/runs`
3. Check the backend logs for the specific error:  
   `docker-compose logs backend`  
   or  
   `kubectl logs -n chaosctrl deployment/chaosctrl-backend`

---

### Backend tests fail

```bash
cd backend
npm test
```

If tests fail after pulling new code, try:

```bash
npm ci          # Clean install from lockfile
npm test
```

---

### Frontend build fails

```bash
cd frontend
npm run build
```

Common causes:
- `node_modules` is outdated: run `npm ci` first.
- The `VITE_API_BASE` env variable contains a trailing slash — remove it.

---

## 10. FAQ

**Q: Do I need to create the workflows in LitmusChaos before using Chaosctrl?**  
A: Yes. Chaosctrl triggers existing workflows — it does not create them. Import each experiment workflow into LitmusChaos first, then Chaosctrl can trigger it with one click.

---

**Q: The gallery shows "▶ Run" but nothing seems to happen in my application. Why?**  
A: The workflow was triggered successfully in LitmusChaos, but the experiment may be targeting a different namespace or pod selector than your application. Check the experiment configuration in the LitmusChaos portal and confirm the target app labels match.

---

**Q: Can I add custom experiments to the gallery?**  
A: Yes. Edit `backend/src/litmus/templates.js` and add a new entry to the `EXPERIMENT_TEMPLATES` array. The `id` must match a substring of the corresponding LitmusChaos workflow name.

---

**Q: How do I get a LitmusChaos bearer token?**  
A:  
1. Log in to the LitmusChaos portal (default: `http://<litmus-host>:9091`).
2. Go to **Settings → User Management**.
3. Click on your username → **Copy API token**.

---

**Q: Is the Safety Switch instant?**  
A: It sends a stop signal to LitmusChaos immediately. LitmusChaos then terminates the running experiments at the workflow level. Individual containers/pods that the experiment already launched may take a few seconds to be cleaned up by Kubernetes.

---

**Q: What is the "Resiliency Score"?**  
A: A percentage score calculated by LitmusChaos based on how many experiments in the workflow passed vs. failed. 100% means every experiment ran and the system behaved as expected. 0% means every experiment detected a failure.

---

**Q: Can Chaosctrl run on a cluster without internet access?**  
A: Yes. Build the Docker images locally and push them to your private registry. Update the `image:` fields in `k8s/deployment.yaml` accordingly. Chaosctrl itself has no external runtime dependencies — it only talks to your LitmusChaos instance on the cluster.

---

**Q: What happens if I run the Safety Switch with no active experiments?**  
A: The Safety Switch reports *"No active workflow runs to abort"* with `aborted: 0`. No error is thrown — it is safe to click even when nothing is running.

---

*For bugs and feature requests, open an issue at [github.com/chirag-exists/Chaosctrl](https://github.com/chirag-exists/Chaosctrl).*
