# 📚 Architecture Guide: API Test Automation, Database Seeding & Performance Engineering

This guide is an end-to-end technical reference detailing the software architecture, design patterns, API test automation, performance engineering, database manipulation, and automated metric analysis implemented in this framework.

---

## 📑 Table of Contents
1. [General System Architecture](#-1-general-system-architecture)
2. [Engineering Glossary & Terminology](#-2-engineering-glossary--terminology)
3. [Design Patterns Applied](#-3-design-patterns-applied)
4. [Database Layer & Test Data Management (PostgreSQL & CTEs)](#-4-database-layer--test-data-management-postgresql--ctes)
5. [API Automation with Playwright](#-5-api-automation-with-playwright)
6. [Performance Engineering with Artillery](#-6-performance-engineering-with-artillery)
7. [Automated Metric Analysis & SLA Validation](#-7-automated-metric-analysis--sla-validation)
8. [CLI Commands Quick Reference](#-8-cli-commands-quick-reference)
9. [Engineering Best Practices & Common Pitfalls](#-9-engineering-best-practices--common-pitfalls)

---

## 🏛️ 1. General System Architecture

The framework bridges automated functional contract/E2E API testing with high-concurrency stress testing, integrated with transactional data seeding and sanitation directly in PostgreSQL:

```text
.
├── docs/                        # API specifications and technical documentation
│   ├── auth/                    # Authentication endpoint specifications
│   ├── links/                   # URL shortener service route specs
│   ├── health/                  # Health check route specs
│   └── ARCHITECTURE_GUIDE.md    # This technical architecture guide
├── performance/                 # Performance Engineering Module (Artillery)
│   ├── data/
│   │   └── usuarios.csv         # Dynamically seeded dataset for load tests
│   ├── reports/                 # Raw JSON performance execution reports
│   │   ├── register.json        # Registration load test metrics
│   │   ├── login.json           # Authentication workload metrics
│   │   └── spike.json           # High-concurrency traffic surge metrics
│   └── tests/                   # Workload definitions in YAML
│       ├── health.yaml          # Baseline latency test for /health
│       ├── register.yaml        # Registration load test (80% success / 20% duplicate)
│       ├── pre-register.yaml    # Initial warm-up data loading script
│       ├── login.yaml           # Authentication test with JWT token capture
│       └── spike.yaml           # 5-phase spike test (up to 100 req/s & 4k VUs)
├── playwright/                  # Functional & E2E API Automation (Playwright)
│   ├── e2e/                     # Domain-partitioned test suites
│   │   ├── auth/                # Registration and login test suites
│   │   ├── health.spec.js       # Health check contract tests
│   │   └── links/               # Shortened link lifecycle CRUD tests
│   └── support/                 # Support infrastructure and utilities
│       ├── factories/           # Data generation utilities (Faker + ULID)
│       ├── fixtures/            # Dependency injection & custom fixtures
│       └── services/            # HTTP service clients & PostgreSQL controllers
├── global-setup.js              # Global bootstrap hook (database reset before tests)
├── playwright.config.js         # Playwright runner configuration
└── package.json                 # Project dependencies and script definitions
```

---

## 📖 2. Engineering Glossary & Terminology

### 🔹 API Architecture & Authentication
* **Endpoint:** Specific URL location exposing an API service capability (e.g., `/api/auth/login`).
* **JWT (JSON Web Token):** RFC 7519 open standard for stateless client-server authentication transmitting signed cryptographic claims.
* **Payload:** The core data body transmitted within an HTTP request (`body`) or response (`data`).
* **Idempotency:** Property of an operation where multiple identical requests produce the exact same outcome as a single request (e.g., `GET`, `PUT`, `DELETE`).

### 🔹 Identifiers & Cryptography
* **ULID (Universally Unique Lexicographically Sortable Identifier):** 26-character Base32 identifier (Crockford alphabet) providing millisecond timestamp sorting and 80-bit entropy for high-performance primary keys.
* **Bcrypt:** Adaptive key-derivation and one-way password hashing algorithm utilizing configurable work factors (*salt rounds*, e.g., 10) to thwart brute-force attacks.
* **Salt:** Cryptographic random data appended to passwords prior to hashing, ensuring identical passwords produce completely distinct hashes.

### 🔹 Performance & Load Engineering
* **VU (Virtual User):** Simulated client execution thread executing an end-to-end request scenario.
* **Arrival Rate:** Number of new virtual users initiated per second (`arrivalRate: 10`).
* **Ramp-Up:** Controlled progressive elevation of concurrent virtual users to observe latency curves under scaling load.
* **Spike Testing:** Sudden high-amplitude request surges designed to evaluate system limits, queue saturation, and recovery times.
* **Percentiles (p50, p95, p99):** Latency distribution thresholds indicating that $N\%$ of requests finished faster than the stated response time. Essential for tracking SLA compliance.

---

## 🧩 3. Design Patterns Applied

### 3.1. Service Object Pattern
All HTTP interactions are encapsulated in dedicated domain clients:
```javascript
export const authService = (request) => ({
  createUser: (user) => request.post("/api/auth/register", { data: user }),
  login: (user) => request.post("/api/auth/login", { data: user }),
  getToken: async (user) => (await (await request.post("/api/auth/login", { data: user })).json()).data.token
});
```

### 3.2. Custom Fixtures & Dependency Injection
Extends Playwright's native `test` context to provide pre-configured services and authenticated state without repetitive setup code:
```javascript
import { test as base } from "@playwright/test";
import { authService } from "../services/auth";

export const test = base.extend({
  auth: async ({ request }, use) => {
    await use(authService(request));
  }
});
```

---

## 🗄️ 4. Database Layer & Test Data Management (PostgreSQL & CTEs)

The service [`playwright/support/services/database.js`](../playwright/support/services/database.js) communicates directly with PostgreSQL with transactional controls (`BEGIN` / `COMMIT` / `ROLLBACK`):

```sql
WITH users_to_delete AS (
  SELECT id FROM users WHERE email LIKE $1 OR email LIKE '%@qa.dev.com'
),
delete_links AS (
  DELETE FROM links
  WHERE user_id IN (SELECT id FROM users_to_delete)
     OR user_id NOT IN (SELECT id FROM users)  -- Remove orphaned records
     OR user_id IS NULL                       -- Remove anonymous records
)
DELETE FROM users
WHERE id IN (SELECT id FROM users_to_delete);
```

---

## 🚀 5. Performance Engineering with Artillery

### Spike Test Architecture (`spike.yaml`):
```yaml
config:
  target: "http://localhost:3333/api"
  payload:
    path: "../data/usuarios.csv"
    fields: ["name", "email", "password"]
    skipHeader: true
  phases:
    - name: "warmup"     # 1. Baseline warm-up
      duration: 30
      arrivalRate: 5
    - name: "ramp-up"    # 2. Gradual load ramp
      duration: 20
      arrivalRate: 5
      rampTo: 20
    - name: "spike"      # 3. Sudden traffic surge
      duration: 30
      arrivalRate: 100
    - name: "drop"       # 4. Traffic drain
      duration: 10
      arrivalRate: 100
      rampTo: 10
    - name: "recovery"   # 5. Recovery validation
      duration: 10
      arrivalRate: 5

scenarios:
  - name: "Create Shortened Link"
    weight: 50
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            json: "$.data.token"
            as: "authToken"
          expect:
            - statusCode: 200
      - post:
          url: "/links"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            original_url: "https://github.com/lfernandobra/playwright-ts-performance-framework"
            title: "Enterprise Platform"
          expect:
            - statusCode: 201
```

---

## 📋 6. CLI Commands Quick Reference

### 🗄️ Database & Seeding
```bash
# Clean up test records
node playwright/support/services/database.js cleanup

# Seed 2,000 users directly into PostgreSQL and export CSV
node playwright/support/services/database.js seed 2000

# Full workflow: cleanup + seed 2,000 users
node playwright/support/services/database.js
```

### 🎭 Functional API Automation (Playwright)
```bash
# Execute all API tests
npm test

# Run tests in interactive UI Mode
npm run test:ui

# View HTML execution report
npm run test:report
```

### ⚡ Performance Testing (Artillery)
```bash
# Run baseline health check test
npx artillery run performance/tests/health.yaml

# Run registration workload with JSON metrics export
npx artillery run performance/tests/register.yaml --output performance/reports/register.json

# Run authentication workload with JSON metrics export
npx artillery run performance/tests/login.yaml --output performance/reports/login.json

# Run high-concurrency spike test with JSON metrics export
npx artillery run performance/tests/spike.yaml --output performance/reports/spike.json

# Generate interactive HTML visual report
npx artillery report performance/reports/spike.json
```

---

## 💡 7. Engineering Best Practices & Common Pitfalls

1. **Always set `skipHeader: true` on CSV Payloads:**
   * Omitting this flag causes Artillery to send column names (`name,email,password`) on the first request, triggering avoidable 400 Bad Request responses.
2. **Batch Bcrypt Operations during Massive Seeding:**
   * Avoid invoking `bcrypt.hash` inside large iteration loops. Calculate the hash **once** upfront and reuse the cryptographic string across batch insertions.
3. **Prioritize Percentiles over Averages:**
   * Arithmetic means smooth out severe tail spikes. Standardize your latency SLAs on **p95** or **p99**.
4. **Resilience During Spike Bursts:**
   * A successful spike test does not demand 100% success during peak saturation, but rather:
     * Contained 5xx error percentages (e.g., $\le 3\%$)
     * Zero system crashes
     * **Fast recovery** (latency and throughput returning to SLA baseline within $\le 30\text{s}$ post-burst).
5. **Deterministic Pre-Test Sanitation:**
   * Ensure `globalSetup` invokes `cleanupTestData` to verify that every test cycle starts in a pristine, uncontaminated database environment.
