# 🚀 ShortBeyond — Automação de Testes de API, Banco de Dados & Engenharia de Performance

[![Playwright](https://img.shields.io/badge/Playwright-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Artillery](https://img.shields.io/badge/Artillery-111111?style=for-the-badge&logo=artillery&logoColor=white)](https://www.artillery.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Faker.js](https://img.shields.io/badge/Faker.js-00D8FF?style=for-the-badge&logo=javascript&logoColor=black)](https://fakerjs.dev/)

Este repositório contém a **suíte completa de engenharia de qualidade (QA)** para a API do encurtador de URLs **ShortBeyond**. O projeto reúne testes funcionais de contrato e ponta a ponta (E2E) com **Playwright**, testes de carga e pico (Spike Testing) com **Artillery**, manipulação direta e idempotente de dados com **PostgreSQL**, e análise estatística de relatórios assistida por **Inteligência Artificial**.

---

## 📑 Índice
1. [Visão Geral e Arquitetura](#-1-visão-geral-e-arquitetura)
2. [Módulo 1: Setup do Ambiente e Fundamentos de API (`section-1`)](#-2-módulo-1-setup-do-ambiente-e-fundamentos-de-api-section-1)
3. [Módulo 2: Automação Funcional com Playwright (`section-2`)](#-3-módulo-2-automação-funcional-com-playwright-section-2)
4. [Módulo 3: Engenharia de Performance, Carga, Spike & IA (`section-3`)](#-4-módulo-3-engenharia-de-performance-carga-spike--ia-section-3)
5. [Guia de Instalação e Execução](#-5-guia-de-instalação-e-execução)
6. [Tabela Consolidada de Comandos](#-6-tabela-consolidada-de-comandos)
7. [Documentações Complementares](#-7-documentações-complementares)

---

## 🏛️ 1. Visão Geral e Arquitetura

O projeto adota uma arquitetura modular orientada a padrões de projeto consagrados (Service Objects, Factories, Fixtures e Data-Driven Testing):

```text
shortbeyond/
├── docs/                        # Documentações da API (OpenCollection) e Guias
│   ├── auth/                    # Especificação técnica das rotas de autenticação
│   ├── links/                   # Especificação técnica das rotas de encurtador de links
│   ├── health/                  # Especificação do endpoint de health check
│   └── GUIA_DEFINITIVO.md       # Guia definitivo com glossário e referências
├── performance/                 # Módulo de Engenharia de Performance
│   ├── data/
│   │   └── usuarios.csv         # Massa dinâmica gerada para os testes de carga
│   ├── reports/                 # Métricas brutas exportadas em formato JSON
│   │   ├── cadastro.json
│   │   ├── login.json
│   │   └── spike.json
│   ├── tests/                   # Cenários de carga e pico em YAML (Artillery)
│   │   ├── health.yaml
│   │   ├── cadastro.yaml
│   │   ├── pre-cadastro.yaml
│   │   ├── login.yaml
│   │   └── spike.yaml
│   └── README.md                # Documentação técnica detalhada de performance
├── playwright/                  # Módulo de Testes Funcionais de API
│   ├── e2e/                     # Suítes de testes E2E divididas por domínio
│   │   ├── auth/                # Testes de registro e login
│   │   ├── health.spec.js       # Teste de contrato do health check
│   │   └── links/               # Testes de CRUD completo de links encurtados
│   └── support/                 # Infraestrutura de suporte e utilitários
│       ├── factories/           # Geração de dados de teste (Faker + ULID)
│       │   ├── user.js
│       │   └── utils.js
│       ├── fixtures/            # Injeção de dependências e custom fixtures
│       │   └── index.js
│       └── services/            # Serviços de integração HTTP e PostgreSQL
│           ├── auth.js
│           ├── links.js
│           └── database.js
├── global-setup.js              # Hook global de setup (limpeza do banco antes dos testes)
├── playwright.config.js         # Configurações do Playwright Test Runner
└── package.json                 # Dependências e scripts do projeto
```

---

## 📦 2. Módulo 1: Setup do Ambiente e Fundamentos de API (`section-1`)

Foco no provisionamento da infraestrutura local, documentação viva dos contratos da API e validação inicial de rotas.

### 🎯 Entregas e Realizações:
* **Ambiente de Testes Contêinerizado:** Configuração e inicialização da API ShortBeyond e do banco PostgreSQL via contêineres (**Podman / Docker**).
* **Documentação Viva e Testes Exploratórios:** Mapeamento de todos os endpoints REST via **Swagger**, **Bruno** e coleções em **OpenCollection** (`docs/opencollection.yml`).
* **Estrutura Base do Playwright:** Configuração inicial do `playwright.config.js` para testes de API via `request` context, definindo baseURL e reporters.
* **Testes de Contrato Iniciais:** Criação dos primeiros testes automatizados validando o endpoint de integridade `/health` e `/auth/register`.

---

## 🎭 3. Módulo 2: Automação Funcional com Playwright (`section-2`)

Foco na construção de um framework robusto, sustentável e escalável para testes funcionais de API.

### 🎯 Entregas e Realizações:
* **Padrão Factory (`playwright/support/factories/`):**
  * Geração dinâmica de usuários e URLs via `@faker-js/faker`.
  * Criação de gerador de **ULID** (26 caracteres, padrão Crockford Base32) para IDs únicos e ordenáveis lexicograficamente.
* **Padrão Service Object (`playwright/support/services/`):**
  * Camadas de abstração `authService` e `linksService` isolando chamadas HTTP, payloads e headers.
* **Padrão Custom Fixtures (`playwright/support/fixtures/`):**
  * Extensão do `test` do Playwright para injeção automática dos serviços (`auth`, `links`), eliminando repetição de código.
* **Suítes de Testes Ponta a Ponta (E2E):**
  * **Autenticação:** Validação de cadastro com sucesso, campos obrigatórios, regras de duplicidade e extração/validação de tokens JWT.
  * **Encurtador de Links:** CRUD completo (`POST /links`, `GET /links`, `DELETE /links/:id`), validação de regex dos short codes (`^[a-zA-Z0-9_-]{5}$`) e persistência.
* **Integração com PostgreSQL & Global Setup:**
  * Criação do serviço [`database.js`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/playwright/support/services/database.js) utilizando o driver `pg`.
  * Implementação de query **CTE (Common Table Expression)** para exclusão atômica e em cascata de links e usuários de teste.
  * Configuração do [`global-setup.js`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/global-setup.js) para garantir banco de dados limpo antes de cada execução de testes.
* **Configurações Avançadas de Testes:**
  * Uso de `dotenv` para controle dinâmico de variáveis de ambiente.
  * Configuração de múltiplos reporters (`html`, `dot`, `list`) com desativação automática de abertura do browser em ambientes de CI/headless.

---

## ⚡ 4. Módulo 3: Engenharia de Performance, Carga, Spike & IA (`section-3`)

Foco em testes de estresse, capacidade, volumetria de dados, testes de pico extremo com Artillery e análise assistida por Inteligência Artificial.

### 🎯 Entregas e Realizações:
* **Seeding de Dados de Alta Performance no PostgreSQL:**
  * Função transacional `seedUsers` / `insertTestUsers` capaz de inserir **2.000 usuários em lotes de 500 registros em menos de 1 segundo**.
  * Otimização de cálculo único de hash **Bcrypt (salt 10)** para evitar saturação de CPU durante a carga.
  * Geração automática do arquivo [`usuarios.csv`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/performance/data/usuarios.csv) com as senhas em texto puro (`pwd123`), mantendo integridade com o banco.
* **Cenários de Teste de Carga com Artillery:**
  * `health.yaml`: Linha de base de latência do serviço.
  * `cadastro.yaml`: Proporção de 80% registros bem-sucedidos (201) e 20% e-mails duplicados (400).
  * `pre-cadastro.yaml`: Carga sequencial de 100% da massa de testes via API com `order: sequence` e `skipHeader: true`.
  * `login.yaml`: Proporção realista de 70% logins válidos (200 OK + `data.token`) e 30% credenciais inválidas (401).
* **Teste de Pico Extremo (Spike Testing — `spike.yaml`):**
  * Simulação de **4.000 Usuários Virtuais** e pico súbito de **100 req/s** dividido em 5 fases:
    1. `warmup` (5 req/s) ──► 2. `ramp-up` (5 -> 20 req/s) ──► 3. `spike` (100 req/s) ──► 4. `drop` (100 -> 10 req/s) ──► 5. `recovery` (5 req/s)
  * Encadeamento dinâmico de tokens JWT com `capture: $.data.token as authToken` e envio em `Authorization: Bearer {{ authToken }}`.
* **Interpretação e Diagnóstico de Resultados com IA:**
  * Validação estatística de relatórios JSON (`performance/reports/*.json`) contra critérios de aceitação e SLAs de negócio.
  * Diagnóstico de gargalo de CPU no cálculo de Bcrypt durante concorrência de 100 req/s contínuos.
  * Redução de timeouts de socket de 605 para apenas 3 conexões e validação de tempo de recuperação da API em **< 30s** pós-pico com 0 crashes.

---

## 🛠️ 5. Guia de Instalação e Execução

### 5.1. Pré-requisitos
* **Node.js:** Versão 18+ (recomendado Node 20+)
* **PostgreSQL:** Instância ativa na porta `5432` (via Docker/Podman ou local)
* **API ShortBeyond:** Rodando em `http://localhost:3333`

### 5.2. Configuração do `.env`
Crie um arquivo `.env` na pasta `shortbeyond/` com as seguintes variáveis:
```env
BASE_API=http://localhost:3333
DB_HOST=localhost
DB_PORT=5432
DB_USER=dba
DB_PASS=dba
DB_NAME=ShortDB
```

### 5.3. Instalação de Dependências
```bash
npm install
```

---

## 📋 6. Tabela Consolidada de Comandos

| Categoria | Objetivo | Comando |
| :--- | :--- | :--- |
| **Banco de Dados** | Limpar dados de teste (users + links) | `node playwright/support/services/database.js cleanup` |
| **Banco de Dados** | Inserir 2.000 usuários e gerar CSV | `node playwright/support/services/database.js seed 2000` |
| **Banco de Dados** | Fluxo completo (cleanup + seed 2.000) | `node playwright/support/services/database.js` |
| **Playwright (API)** | Executar todos os testes funcionais | `npx playwright test` |
| **Playwright (API)** | Executar testes em modo interativo (UI) | `npx playwright test --ui` |
| **Playwright (API)** | Abrir relatório HTML do Playwright | `npx playwright show-report` |
| **Artillery (Carga)** | Executar teste de Health Check | `npx artillery run performance/tests/health.yaml` |
| **Artillery (Carga)** | Executar teste de Cadastro com JSON | `npx artillery run performance/tests/cadastro.yaml --output performance/reports/cadastro.json` |
| **Artillery (Carga)** | Executar teste de Login com JSON | `npx artillery run performance/tests/login.yaml --output performance/reports/login.json` |
| **Artillery (Pico)** | Executar Spike Test (4k VUs) com JSON | `npx artillery run performance/tests/spike.yaml --output performance/reports/spike.json` |
| **Relatórios** | Gerar relatório visual HTML do Spike Test | `npx artillery report performance/reports/spike.json` |

---

## 📚 7. Documentações Complementares

Para aprofundamento técnico, consulte os documentos dedicados:
* 📖 [`docs/GUIA_DEFINITIVO.md`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/docs/GUIA_DEFINITIVO.md): Glossário completo de QA, padrões de projeto, métricas de latência e dicas de ouro.
* ⚡ [`performance/README.md`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/performance/README.md): Documentação aprofundada dos cenários de teste de carga, análise de percentis e arquitetura do Artillery.
