# 🚀 Performance & Load Engineering with Artillery, PostgreSQL Seeding & Statistical Analysis

This document details the performance engineering architecture, test suites, database seeding strategies, high-concurrency spike scenarios, and statistical SLA benchmarking developed for the backend platform.

---

## 📁 1. Directory Structure

```text
.
├── performance/
│   ├── README.md                # Consolidated performance module documentation
│   ├── data/
│   │   └── usuarios.csv         # Dynamically seeded dataset (2,000 unique records)
│   ├── reports/
│   │   ├── register.json        # User registration load test report (JSON)
│   │   ├── login.json           # Authentication workload report (JSON)
│   │   └── spike.json           # Extreme traffic surge report (Spike Test)
│   └── tests/
│       ├── health.yaml          # Baseline latency test for /health endpoint
│       ├── register.yaml        # Registration load test (80% 201 / 20% 400 duplicate)
│       ├── pre-register.yaml    # Initial warm-up dataset creation via API
│       ├── login.yaml           # Authentication test (70% valid / 30% invalid credentials)
│       └── spike.yaml           # Multi-phase spike test (up to 100 req/s & 4,000 VUs)
└── playwright/
    └── support/
        └── services/
            └── database.js      # Transactional database controller (2k seed, cleanup, ULID, Bcrypt)
```

---

## 🛠️ 2. Execution Guide

### 2.1. Direct PostgreSQL Manipulation & Seeding (`database.js`)

The module [`playwright/support/services/database.js`](../playwright/support/services/database.js) communicates directly with PostgreSQL using transactional controls (`BEGIN` / `COMMIT` / `ROLLBACK`), ULID generation, and optimized bcrypt hashing:

* **Clean up test data:**
  ```bash
  node playwright/support/services/database.js cleanup
  ```

* **Seed 2,000 users and generate CSV dataset:**
  ```bash
  node playwright/support/services/database.js seed 2000
  ```

* **Execute full workflow (cleanup + seed 2,000 users + generate CSV):**
  ```bash
  node playwright/support/services/database.js
  ```

---

### 2.2. Executing Performance Tests (Artillery)

#### 🟢 1. Health Check
Baseline latency and availability check:
```bash
npx artillery run performance/tests/health.yaml
```

#### 🟡 2. User Registration (with JSON export)
Validates registration throughput and graceful handling of duplicate email submissions:
```bash
npx artillery run performance/tests/register.yaml --output performance/reports/register.json
```

#### 🔵 3. Authentication & Login (with JSON export)
Simulates realistic login traffic (70% valid / 30% invalid password) consuming `usuarios.csv`:
```bash
npx artillery run performance/tests/login.yaml --output performance/reports/login.json
```

#### 🔴 4. Traffic Surge Stress Test / Spike Test (with JSON export)
Simulates sudden traffic spikes of up to 100 req/s across 5 execution phases:
```bash
npx artillery run performance/tests/spike.yaml --output performance/reports/spike.json
```

---

### 2.3. Visual HTML Report Generation
Transform raw JSON metric outputs into interactive graphical dashboards:
```bash
# Registration report
npx artillery report performance/reports/register.json

# Authentication report
npx artillery report performance/reports/login.json

# Spike test report
npx artillery report performance/reports/spike.json
```

---

## ⚙️ 3. Scenario Architecture

### 3.1. Realistic Authentication (`login.yaml`)
* **Payload:** Consumes `performance/data/usuarios.csv` with `skipHeader: true`.
* **Scenario 1 — Valid Credentials (`weight: 70`):** Authenticates successfully, asserts status `200`, verifies `data.token` presence.
* **Scenario 2 — Invalid Password (`weight: 30`):** Valid email with incorrect password, asserts status `401` and error contract.
* **Workload:** 4 req/s sustained for 60 seconds (240 requests).

### 3.2. Multi-User Spike Test (`spike.yaml`)
* **Execution Phases:**
  1. `warmup` (30s @ 5 req/s) — Baseline system warm-up.
  2. `ramp-up` (20s @ 5 -> 20 req/s) — Progressive traffic escalation.
  3. `spike` (30s @ 100 req/s) — Extreme peak traffic surge.
  4. `drop` (10s @ 100 -> 10 req/s) — Rapid traffic de-escalation and queue draining.
  5. `recovery` (10s @ 5 req/s) — Observes post-spike recovery and SLA stabilization.
* **Chained JWT Scenarios:**
  * `Create Link` (50%): Login -> Capture JWT -> `POST /links`
  * `List Links` (30%): Login -> Capture JWT -> `GET /links`
  * `Complete Workflow` (20%): Login -> Capture JWT -> `POST /links` -> `GET /links`

---

## 📊 4. SLA & Acceptance Criteria Benchmarks

### 4.1. Health Check & Registration
* ✅ **Health Check:** 100% success rate, p95 latency of **13.9 ms** (Target: < 50ms), 0% error rate.
* ✅ **User Registration:** 78.52% HTTP 201 (Target: ~80%), 21.48% HTTP 400 (Target: ~20%), p95 latency of **100.5 ms** (Target: < 500ms).

### 4.2. Authentication Workload (`login.yaml`)
| Acceptance Criteria | Target SLA | Measured Benchmark | Status |
| :--- | :---: | :---: | :---: |
| **Successful Logins (HTTP 200)** | ~70% | **71.67%** (172 requests) | ✅ **Passed** |
| **Authentication Failures (HTTP 401)** | ~30% | **28.33%** (68 requests) | ✅ **Passed** |
| **p95 Latency Threshold** | < 400 ms | **94.6 ms** | ✅ **Passed** |
| **Valid JWT Token Issuance** | `data.token` verified | **100%** (172/172) | ✅ **Passed** |

### 4.3. High-Concurrency Spike Test (`spike.yaml`)
| Acceptance Criteria | Target SLA | Measured Benchmark | Status |
| :--- | :---: | :---: | :---: |
| **Steady-State Success Rate** | $\ge 95\%$ across baseline | **100%** during warm-up and recovery | ✅ **Passed** |
| **Peak Throughput Success** | $\ge 90\%$ at 100 req/s | **63.32%** (2,282 / 3,604 responses) | ⚠️ **Degraded Under Peak** |
| **Non-Peak p95 Latency** | $\le 300\text{ ms}$ | **83.9 ms to 92.8 ms** | ✅ **Passed** |
| **Peak p95 Latency** | $\le 2,000\text{ ms}$ | **5,487 ms to 6,312 ms** | ⚠️ **Queue Saturation** |
| **Post-Peak Recovery Time** | $\le 30\text{ s}$ | **~20s to 30s** (100% success, p95 = 89ms) | ✅ **Passed** |
| **5xx Errors Under Peak** | $\le 3.0\%$ | **3.69%** (133 errors out of 3,604 responses) | ⚠️ **Borderline** |
| **Server Crash Resilience** | Zero crashes | **0 crashes**, 6,702 total requests handled | ✅ **Passed** |

---

## 🌟 5. Engineering Highlights & Best Practices

1. **Transactional Bulk Seeding:**
   * Seeds 2,000 users in 500-record batches (`Bulk Insert`). By computing the Bcrypt hash **once** upfront, execution time dropped from several minutes to under **1 second**.
   * Employs **ULID** (26 characters) and dynamic email generation via `@faker-js/faker` to guarantee collision-free uniqueness in PostgreSQL.
2. **Deterministic Data-Driven Pipeline:**
   * Automatically exports `usuarios.csv` with plaintext credentials while the database securely holds the hashed records, achieving 100% payload compatibility with Artillery.
3. **Resilient SQL CTE Teardown:**
   * Utilizes SQL Common Table Expressions (CTEs) to surgically remove test records, associated links, and orphaned foreign keys without database lock contention.
4. **Dynamic JWT Token Chaining:**
   * Leverages Artillery's `capture` engine to dynamically extract `Bearer {{ authToken }}` tokens from login responses and inject them into subsequent authorized API calls.
5. **Accurate Bottleneck Diagnosis via Percentiles:**
   * Pinpointed CPU saturation on the Bcrypt cryptographic layer under 100 req/s peak surges, while proving nominal latency remains < 95ms under normal operation with immediate self-healing after traffic drops.
