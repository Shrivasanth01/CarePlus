# CarePlus | Service Health Monitoring Dashboard
### Real-Time Uptime, Incident Tracking & System Observability

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB.svg?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Theme-Green_&_White-16A34A.svg)](https://tailwindcss.com)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_%2F_SQLite-336791.svg?logo=postgresql)](https://www.postgresql.org)
[![WebSocket](https://img.shields.io/badge/Streaming-WebSocket_Live_Feed-166534.svg)](#real-time-websocket-engine)
[![Tests](https://img.shields.io/badge/Tests-13_Passed-success.svg)](#testing)

---

## 1. Project Overview

**CarePlus Service Health Monitoring Dashboard** is a full-stack, enterprise-grade system observability platform engineered for site reliability engineers (SREs), system operators, developers, and IT administrators.

The system continuously monitors mission-critical microservices, APIs, and background workers through real HTTP/HTTPS probes and advanced simulation engines. It computes SLA availability, measures P95/P99 latency envelopes, automates outage detection and recovery, tracks incident response lifecycles, and broadcasts real-time telemetry over WebSockets to a green & white user interface.

---

## 2. Design System: Green & White Enterprise Theme

The application strictly implements the clean enterprise green and white aesthetic:

- **Primary Green (`#16A34A`)**: Used for primary action buttons, active navigation indicators, and healthy health badges.
- **Dark Green (`#166534`)**: High-contrast text, active container highlights, and brand typography.
- **Light Green (`#DCFCE7`)**: Soft pill backgrounds, healthy status chip backgrounds, and positive cards.
- **Pale Green (`#F0FDF4`)**: Calm, clean app-wide canvas background.
- **White (`#FFFFFF`)**: Crisp, elevated card surfaces with subtle border lines (`#E5E7EB`).
- **Status Indicators**:
  - `Operational`: Emerald Green (`#16A34A`) with live pulsing beacon
  - `Degraded`: Amber / Warning (`#F59E0B`)
  - `Down`: Crimson Red (`#DC2626`) with outage pulse
  - `Maintenance`: Indigo (`#6366F1`)
  - `Unknown`: Slate (`#64748B`)

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (custom Green & White theme tokens)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Latency AreaCharts, Uptime BarCharts, Timeline breakdown)
- **Routing**: React Router v7
- **Real-Time**: Native WebSocket client (`/ws/monitoring`) with heartbeat ping-pong, auto-reconnect, and polling fallback

### Backend
- **Framework**: Python 3.11+ / 3.13 + FastAPI + Uvicorn
- **ORM & DB**: SQLAlchemy 2.0 (PostgreSQL primary with SQLite out-of-the-box local fallback)
- **Validation**: Pydantic v2 + Pydantic Settings
- **Security & SSRF**: Direct bcrypt password hashing, JWT bearer tokens, SSRF validator (blocking localhost, private IP subnets, AWS/GCP cloud metadata)
- **HTTP Engine**: Async `httpx.AsyncClient` with connection pooling, configurable timeouts, and response timing
- **Background Scheduler**: Async background loop monitoring services at individual intervals
- **Simulation Engine**: Realistic simulation scenarios (Normal, Slow Response, High Latency Spike, Complete Outage, Intermittent Failure, Swift Recovery)

---

## 4. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   React 19 Frontend                         │
│  [Sidebar]  [Top Header]  [Demo Toolbar]  [10 Tab Pages]   │
└──────────────┬──────────────────────────────▲───────────────┘
               │ HTTP REST API                │ WebSocket Push
               │ (port 8001 / proxy)          │ (/ws/monitoring)
┌──────────────▼──────────────────────────────┴───────────────┐
│                   FastAPI Backend                           │
│  ├── /api/dashboard      ├── /api/services                  │
│  ├── /api/incidents      ├── /api/uptime                    │
│  ├── /api/analytics      ├── /api/monitoring               │
│  ├── /api/maintenance    ├── /api/demo                      │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
┌──────────────▼──────────────────────────────┴───────────────┐
│               Monitoring & Observability Core               │
│  ├── Background Scheduler (Async interval loop)             │
│  ├── HTTP / HTTPS Prober (httpx async + SSRF filter)       │
│  ├── Simulation Engine (7 Scenarios)                        │
│  ├── Incident Detector (Consecutive failure/recovery logic) │
│  └── Uptime Calculator (Interval & Check based, Maint exc.) │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│           Relational Database (PostgreSQL / SQLite)         │
│  11 Tables: users, services, service_groups, health_checks, │
│  incidents, incident_events, maintenance_windows,           │
│  notifications, monitoring_settings, audit_logs, events     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema (11 Tables)

1. **`users`**: id, name, email, password_hash, role (`Admin`, `Operator`, `Viewer`), is_active, created_at, updated_at
2. **`services`**: id, name, description, url, category, environment, monitoring_type, status, monitoring_enabled, monitoring_interval, timeout_seconds, expected_status_code, warning_threshold_ms, critical_threshold_ms, failure_threshold, recovery_threshold, owner_id, group_id, created_at, updated_at
3. **`service_groups`**: id, name, description, created_at, updated_at
4. **`health_checks`**: id, service_id, check_type, status, response_time_ms, http_status_code, error_message, checked_at (indexed)
5. **`incidents`**: id, incident_number, service_id, title, description, severity, status, detected_at, acknowledged_at, recovery_started_at, resolved_at, duration_seconds, resolution_notes, assigned_user_id, created_at, updated_at
6. **`incident_events`**: id, incident_id, event_type, message, user_id, created_at
7. **`maintenance_windows`**: id, service_id, title, description, start_time, end_time, status, created_by, created_at
8. **`notifications`**: id, user_id, service_id, incident_id, notification_type, title, message, is_read, created_at
9. **`monitoring_settings`**: id, service_id, monitoring_interval, timeout_seconds, retry_count, failure_threshold, recovery_threshold, warning_threshold_ms, critical_threshold_ms, updated_at
10. **`audit_logs`**: id, user_id, action, entity_type, entity_id, details, created_at
11. **`service_status_events`**: id, service_id, previous_status, new_status, reason, created_at

---

## 6. Seeded Services & Users

### Pre-Seeded Accounts
| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@careplus.com` | `admin123` | Full access: Add/Edit/Delete services, thresholds, maintenance, audit logs |
| **Operator** | `operator@careplus.com` | `operator123` | Acknowledge/Resolve incidents, manual checks, toggle maintenance |
| **Viewer** | `viewer@careplus.com` | `viewer123` | Read-only dashboard, charts, uptime reports |

*Tip: You can switch active roles instantaneously with the **A / O / V** buttons in the bottom sidebar or top user menu.*

### 10 Pre-Seeded Sample Services
1. **Main Website** (Website, Production, 15s interval)
2. **Authentication API** (Authentication Service, Production, 15s interval)
3. **Payment API** (Payment Service, Production, 10s interval)
4. **User Management API** (REST API, Production, 15s interval)
5. **Notification Service** (Internal Service, Production, 20s interval)
6. **Database Service** (Database Service, Production, 10s interval)
7. **File Storage Service** (Backend Service, Production, 30s interval)
8. **Analytics Service** (Custom Service, Staging, 15s interval)
9. **Admin API** (REST API, Production, Under Maintenance)
10. **Background Worker** (Backend Service, Development, 15s interval)

---

## 7. Local Setup Instructions (Windows / Linux / macOS)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### A. Backend Setup
1. Open PowerShell or Terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate      # Windows
   # source venv/bin/activate    # Linux / macOS
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8001
   ```
   *The database is automatically created and seeded on initial boot!*
   - API Docs: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
   - API Health: [http://127.0.0.1:8001/health](http://127.0.0.1:8001/health)

### B. Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
4. Open your browser at:
   ```
   http://127.0.0.1:5173/
   ```

---

## 8. Docker & Docker Compose Setup

Run the entire stack with PostgreSQL, FastAPI backend, and Nginx frontend in one command:

```bash
docker-compose up --build
```

- Web Application: `http://localhost:3000` (or `http://localhost`)
- Backend API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## 9. Interactive Demo Mode

The dashboard features an **Interactive Demo Toolbar** at the very top:
- **Simulate Outage**: Injects connection refusal / 503 errors on the target service. Consecutive failures breach the failure threshold, automatically triggering an incident and broadcasting real-time alerts.
- **Spike Latency (1400ms)**: Spikes response times above the critical threshold, demonstrating degraded performance tracking.
- **Degrade Warning (550ms)**: Elevates latency into the warning threshold band.
- **Trigger Swift Recovery**: Restores pristine 25ms responses. When consecutive healthy checks satisfy the recovery threshold, open incidents automatically resolve with root-cause duration logs.
- **Reset Demo State**: One-click cleanup returning all services to healthy baselines.

---

## 10. Automated Testing

Run the comprehensive pytest suite verifying health checking, SSRF protection, latency percentiles, uptime calculations, and API endpoints:

```bash
cd backend
.\venv\Scripts\pytest
```

Output:
```text
tests\test_api.py .........                                    [ 69%]
tests\test_monitoring.py ....                                  [100%]
======================= 13 passed in 2.12s =======================
```

---

## 11. Security & SSRF Protection

To prevent Server-Side Request Forgery (SSRF) when probing external targets:
- Probing protocols are restricted to `http://` and `https://`.
- DNS resolution checks verify destination IPs before requests are dispatched.
- Loopback addresses (`127.0.0.1`, `localhost`, `::1`), private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata (`169.254.169.254`) are blocked by default.
- Private network probing can only be permitted via explicit administrator configuration (`ALLOW_PRIVATE_NETWORKS=True`).

---

## 12. Application Pages & Capabilities

1. **Dashboard (`/`)**: 8 KPI cards, latency AreaChart, availability BarChart, active incidents, and live WebSocket telemetry stream.
2. **Services (`/services`)**: Filterable, sortable data table, manual probe triggers, maintenance toggles, service creation modal.
3. **Service Details (`/services/:id`)**: Deep-dive with 1h/6h/24h/7d/30d time filters, P95/P99 latency envelopes, check logs.
4. **Service Groups (`/service-groups`)**: Group-level health aggregation across infrastructure, billing, and identity domains.
5. **Incidents (`/incidents`)**: Outage lifecycle (Detected -> Investigating -> Identified -> Monitoring Recovery -> Resolved).
6. **Uptime Reports (`/uptime`)**: 1h, 24h, 7d, 30d, 90d SLA tracking, visual 24-block timeline bars, CSV export.
7. **Response Time Analytics (`/response-time`)**: P95/P99 percentiles across services and slowest endpoint leaderboard.
8. **Maintenance Windows (`/maintenance`)**: Schedule downtime with automated alert suppression and SLA downtime protection.
9. **Monitoring Configuration (`/monitoring-config`)**: Configure probe intervals, timeouts, failure thresholds, and scheduler controls.
10. **Notification History (`/notifications`)**: In-app alert trail with mark-as-read and unread count badges.
11. **Audit Logs (`/audit-logs`)**: Immutable event logging of administrative actions with CSV compliance export.

---

## 13. License
CarePlus is distributed under the MIT License. Enterprise-grade and production-ready.
