# 🚀 Playwright E2E API & Artillery Performance Engineering Framework

[![Playwright](https://img.shields.io/badge/Playwright-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Artillery](https://img.shields.io/badge/Artillery-111111?style=for-the-badge&logo=artillery&logoColor=white)](https://www.artillery.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> **Enterprise-grade QA Automation Architecture** implementing contract & functional E2E testing with **Playwright**, deterministic data seeding via **PostgreSQL CTEs**, and high-concurrency load/spike engineering with **Artillery**.

---

## 📑 Table of Contents
1. [Overview & Architecture](#-1-overview--architecture)
2. [Design Patterns & Engineering Highlights](#-2-design-patterns--engineering-highlights)
3. [Layer 1: Infrastructure & Database Layer (PostgreSQL & CTEs)](#-3-layer-1-infrastructure--database-layer-postgresql--ctes)
4. [Layer 2: Functional E2E & Contract Testing (Playwright)](#-4-layer-2-functional-e2e--contract-testing-playwright)
5. [Layer 3: Performance & Load Engineering (Artillery)](#-5-layer-3-performance--load-engineering-artillery)
6. [Repository Structure](#-6-repository-structure)
7. [Installation & Getting Started](#-7-installation--getting-started)
8. [Technical Documentation](#-8-technical-documentation)
9. [Author](#-9-author)

---

## 🏛️ 1. Overview & Architecture

This repository delivers an end-to-end quality engineering framework for scalable backend platforms. It decouples test orchestration, network protocols, and data infrastructure by following proven software engineering principles (**Service Objects**, **Custom Fixtures**, **Factories**, and **Data-Driven Testing**).

```text
.
├── docs/                        # Technical specifications and architectural guides
│   ├── auth/                    # Auth endpoint specifications (OpenCollection)
│   ├── links/                   # URL shortener service route specs
│   ├── health/                  # Health check specifications
│   └── ARCHITECTURE_GUIDE.md       # Comprehensive architecture glossary & QA standards
├── performance/                 # Performance Engineering Module (Artillery)
│   ├── data/
│   │   └── usuarios.csv         # Dynamically seeded dataset for load tests
│   ├── reports/                 # Raw metric output reports (JSON)
│   │   ├── register.json
│   │   ├── login.json
│   │   └── spike.json
│   ├── tests/                   # Workload and spike test definitions in YAML
│   │   ├── health.yaml
│   │   ├── register.yaml
│   │   ├── pre-register.yaml
│   │   ├── login.yaml
│   │   └── spike.yaml
│   └── README.md                # In-depth performance & latency analysis docs
├── playwright/                  # Functional & E2E Testing Module (Playwright)
│   ├── e2e/                     # E2E test suites partitioned by business domain
│   │   ├── auth/                # User registration & authentication suites
│   │   ├── health.spec.js       # Health check contract tests
│   │   └── links/               # Shortened link lifecycle & CRUD validation
│   └── support/                 # Support infrastructure and utilities
│       ├── factories/           # Data generation utilities (Faker + ULID)
│       │   ├── user.js
│       │   └── utils.js
│       ├── fixtures/            # Dependency injection & custom fixtures
│       │   └── index.js
│       └── services/            # HTTP service clients & PostgreSQL controllers
├── global-setup.js              # Global bootstrap, health checks & state sanitization
├── playwright.config.js         # Playwright runner configuration (workers, reporters)
├── package.json                 # Project dependencies and script definitions
└── README.md                    # Main architecture documentation
```

---

## 🧩 2. Design Patterns & Engineering Highlights

* **Service Object Pattern:** Dedicated API domain clients (`auth.js`, `links.js`) centralize payload contracts, HTTP headers, and error assertions.
* **Custom Fixtures & Dependency Injection:** Eliminates repetitive boilerplate by extending Playwright's `test` context, automatically provisioning authenticated sessions and clean test states on demand.
* **Idempotency & Zero Flakiness:** Tests create isolated transient state or leverage deterministic tear-down routines, preventing test cascading failures.
* **Collision-Free Data Generation:** Combines Universally Unique Lexicographically Sortable Identifiers (**ULID**) with **Faker.js** for high-cardinality, realistic test datasets.

---

## 🗄️ 3. Layer 1: Infrastructure & Database Layer (PostgreSQL & CTEs)

Data operations interface directly with **PostgreSQL** via transactional database clients (`pg`), bypassing slower UI or multi-tier API setup steps:

* **Deterministic Fast Seeding:** Pre-populates database records with bcrypt-hashed credentials (salt rounds: 10) directly into tables, saving critical execution time before large-scale load tests.
* **Common Table Expressions (CTEs):** Complex relational setups and teardowns utilize SQL CTEs to guarantee atomic data insertion and surgical isolation without table-locking overhead.
* **Environment Sanitization (`global-setup.js`):** Verifies service health checks and ensures clean state across database tables prior to test execution.

---

## 🎭 4. Layer 2: Functional E2E & Contract Testing (Playwright)

Comprehensive E2E test coverage across positive, negative, and edge-case payload scenarios:

```bash
# Run the complete E2E test suite (headless)
npm test

# Run tests in interactive UI Mode
npm run test:ui

# Generate and view HTML test execution reports
npm run test:report
```

* **Strict Contract Validation:** Validates status codes, content-type headers, and JSON schema output formats.
* **Atomic State Chaining:** User creation → Authentication → JWT Token acquisition → Resource Creation/Deletion executed in clean atomic transactions.

---

## ⚡ 5. Layer 3: Performance & Load Engineering (Artillery)

Evaluates system resilience, saturation thresholds, and response degradation curves:

* **Warm-up & Steady Workloads:** Progressive ramping phase followed by sustained throughput to measure latency under continuous load.
* **Spike Testing:** Sudden request bursts to assess connection pool recovery, garbage collection impacts, and rate-limiting limits.
* **Tail Latency SLA Monitoring:** Statistical analysis tracking **p90**, **p95**, and **p99** latency percentiles against enterprise SLAs.

```bash
# Execute authentication workload test
npm run test:perf

# Execute traffic surge stress test (Spike Testing)
npm run test:spike
```

---

## 🛠️ 6. Installation & Getting Started

### Prerequisites
* Node.js `>= 18.x`
* Docker & Docker Compose (for PostgreSQL and backend service containerization)

```bash
# 1. Clone the repository
git clone https://github.com/lfernandobra/playwright-ts-performance-framework.git
cd playwright-ts-performance-framework

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run the automated E2E test suite
npm test
```

---

## 📚 7. Technical Documentation

For technical deep-dives into test strategies and metric analyses:
* 📖 [`docs/ARCHITECTURE_GUIDE.md`](docs/ARCHITECTURE_GUIDE.md): Architectural standards glossary, latency benchmarks, and design reference.
* ⚡ [`performance/README.md`](performance/README.md): Detailed percentile breakdown, workload definitions, and stress test reports.

---

## 👤 8. Author

**Luis Fernando Brandão**  
*Senior QA Automation Engineer*  
* 💼 [LinkedIn](https://linkedin.com/in/lfernandobra)  
* 🐙 [GitHub](https://github.com/lfernandobra)  
* ✉️ lfernandobra@gmail.com
