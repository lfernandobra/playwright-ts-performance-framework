# 🚀 Testes de Performance com Artillery, PostgreSQL Seeding & Análise com IA

Este documento consolida toda a arquitetura, arquivos criados, comandos de execução, estratégia de massa de dados, cenários de carga e pico (Spike Testing), análise de relatórios e pontos fortes desenvolvidos no módulo de testes de performance da API **ShortBeyond**.

---

## 📁 1. Estrutura de Arquivos do Módulo

```text
shortbeyond/
├── performance/
│   ├── README.md                # Documentação técnica consolidada do módulo
│   ├── data/
│   │   └── usuarios.csv         # Massa de testes com 2.000 usuários únicos gerada pelo script
│   ├── reports/
│   │   ├── cadastro.json        # Relatório JSON do teste de cadastro
│   │   ├── login.json           # Relatório JSON do teste de autenticação/login
│   │   └── spike.json           # Relatório JSON do teste de pico extremo (Spike Testing)
│   └── tests/
│       ├── health.yaml          # Teste de carga do endpoint de health check
│       ├── cadastro.yaml        # Teste de carga de cadastro (80% sucesso / 20% duplicado)
│       ├── pre-cadastro.yaml    # Script de pré-carga/seeding via API
│       ├── login.yaml           # Teste de carga de autenticação (70% sucesso / 30% 401)
│       └── spike.yaml           # Teste de pico com 5 fases (até 100 req/s e 4.000 VUs)
└── playwright/
    └── support/
        └── services/
            └── database.js      # Serviço transacional de banco (seed de 2.000 users, cleanup, ULID, Bcrypt)
```

---

## 🛠️ 2. Guia de Comandos e Execuções

### 2.1. Manipulação do Banco de Dados e Geração de Massa (`database.js`)

O serviço [`playwright/support/services/database.js`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/playwright/support/services/database.js) opera diretamente no PostgreSQL com controle transacional (`BEGIN` / `COMMIT` / `ROLLBACK`), gerando IDs no padrão ULID, hash Bcrypt (salt 10) otimizado e exportando a massa para CSV.

* **Limpar dados de teste (usuários e links):**
  ```bash
  node playwright/support/services/database.js cleanup
  ```

* **Inserir 2.000 usuários e gerar o arquivo CSV:**
  ```bash
  node playwright/support/services/database.js seed 2000
  ```

* **Executar o fluxo completo (limpeza prévia + inserção de 2.000 usuários + CSV):**
  ```bash
  node playwright/support/services/database.js
  ```

---

### 2.2. Execução dos Testes de Performance (Artillery)

#### 🟢 1. Health Check
Validação de disponibilidade e latência do endpoint `/health`:
```bash
npx artillery run performance/tests/health.yaml
```

#### 🟡 2. Cadastro de Usuários (com exportação JSON)
Validação de registros novos e tratamento de e-mails duplicados:
```bash
npx artillery run performance/tests/cadastro.yaml --output performance/reports/cadastro.json
```

#### 🔵 3. Autenticação / Login (com exportação JSON)
Simulação de tráfego de login (70% válidos / 30% senha incorreta) consumindo `usuarios.csv`:
```bash
npx artillery run performance/tests/login.yaml --output performance/reports/login.json
```

#### 🔴 4. Teste de Pico Extremo / Spike Test (com exportação JSON)
Simulação de 4.000 usuários virtuais e pico súbito de 100 req/s em 5 fases:
```bash
npx artillery run performance/tests/spike.yaml --output performance/reports/spike.json
```

---

### 2.3. Geração de Relatórios Visuais em HTML
Para transformar os dados brutos de métricas JSON em relatórios gráficos interativos:
```bash
# Relatório de Cadastro
npx artillery report performance/reports/cadastro.json

# Relatório de Login
npx artillery report performance/reports/login.json

# Relatório de Teste de Pico (Spike)
npx artillery report performance/reports/spike.json
```

---

## ⚙️ 3. Cenários e Scripts Desenvolvidos

### 3.1. Autenticação Realista (`login.yaml`)
* **Payload:** Consome [`performance/data/usuarios.csv`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/performance/data/usuarios.csv) com `skipHeader: true`.
* **Cenário 1 — Login com Sucesso (`weight: 70`):** Credenciais válidas, valida status `200`, propriedade `data.token` e mensagem de confirmação.
* **Cenário 2 — Senha Incorreta (`weight: 30`):** E-mail válido com senha incorreta, valida status `401` e mensagem `"Credenciais inválidas"`.
* **Carga:** 4 req/s durante 60s (240 requisições).

### 3.2. Teste de Pico Multiusuário (`spike.yaml`)
* **Fases:**
  1. `warmup` (30s @ 5 req/s) — Aquecimento base.
  2. `ramp-up` (20s @ 5 -> 20 req/s) — Elevação gradual.
  3. `spike` (30s @ 100 req/s) — Carga extrema súbita.
  4. `drop` (10s @ 100 -> 10 req/s) — Queda de carga e drenagem de fila.
  5. `recovery` (10s @ 5 req/s) — Observação da recuperação e SLA pós-pico.
* **Cenários Executados com JWT Dinâmico:**
  * `Criar Link` (50%): Login -> Captura Token -> `POST /links`
  * `Listar Links` (30%): Login -> Captura Token -> `GET /links`
  * `Fluxo Completo` (20%): Login -> Captura Token -> `POST /links` -> `GET /links`

---

## 📊 4. Validação dos Critérios de Aceitação

### 4.1. Testes de Health Check & Cadastro
* ✅ **Health Check:** 100% sucesso, p95 de **13.9 ms** (< 50ms), 0% erros.
* ✅ **Cadastro de Usuários:** 78.52% HTTP 201 (meta ~80%), 21.48% HTTP 400 (meta ~20%), p95 de **100.5 ms** (< 500ms).

### 4.2. Teste de Login (`login.yaml`)
| Critério de Aceitação | Meta | Resultado Obtido | Status |
| :--- | :---: | :---: | :---: |
| **Logins com sucesso (status 200)** | ~70% | **71,67%** (172 reqs) | ✅ **Aprovado** |
| **Erros de autenticação (status 401)** | ~30% | **28,33%** (68 reqs) | ✅ **Aprovado** |
| **Tempo de resposta p95** | < 400 ms | **94,6 ms** | ✅ **Aprovado** |
| **Tokens JWT válidos retornados** | `data.token` presente | **100%** (172/172) | ✅ **Aprovado** |

### 4.3. Teste de Pico (`spike.yaml`)
| Critério de Aceitação | Meta | Resultado Obtido | Status |
| :--- | :---: | :---: | :---: |
| **Taxa de sucesso geral** | ≥ 95% em todas as fases | **100%** fora do pico / **~63%** no pico | ❌ **Reprovado** |
| **Taxa de sucesso durante o pico** | ≥ 90% (a 100 req/s) | **63,32%** (2.282 / 3.604 respostas) | ❌ **Reprovado** |
| **Latência p95 fora do pico** | ≤ 300 ms | **83,9 ms a 92,8 ms** | ✅ **Aprovado** |
| **Latência p95 durante o pico** | ≤ 2.000 ms | **5.487 ms a 6.312 ms** | ❌ **Reprovado** |
| **Recuperação pós-pico** | ≤ 30 s | **~20s a 30s** (100% sucesso, p95 = 89ms) | ✅ **Aprovado** |
| **Erros 5xx durante o pico** | ≤ 3,0% | **3,69%** (133 erros em 3.604 respostas) | ⚠️ **Margem estreita** |
| **Sem crashes ou indisponibilidade** | Sem crash | **0 crashes**, 6.702 respostas processadas | ✅ **Aprovado** |

---

## 🌟 5. Pontos Fortes e Melhores Práticas Aplicadas

1. **Seeding de Dados Transacional e Otimizado:**
   * Geração de 2.000 usuários em lotes de 500 registros (`Bulk Insert`), calculando o hash Bcrypt uma única vez para reduzir o tempo de execução de minutos para menos de **1 segundo**.
   * Uso do formato **ULID** (26 caracteres) e e-mails dinâmicos com `@faker-js/faker` (`fakerPT_BR`) respeitando a restrição de unicidade do banco.
2. **Consistência entre Banco e Testes (CSV Data-Driven):**
   * O script de banco gera automaticamente o arquivo `usuarios.csv` com as senhas em texto puro (`pwd123`), enquanto o banco armazena o hash criptografado, garantindo 100% de compatibilidade com os payloads do Artillery.
3. **Limpeza Robusta de Dados de Teste:**
   * Query CTE capaz de remover tanto usuários de teste quanto links vinculados, links anônimos (`user_id IS NULL`) e links órfãos residuais.
4. **Fluxos Complexos com Captura de JWT:**
   * Utilização do recurso `capture` do Artillery para autenticar e encadear o token `Bearer {{ authToken }}` em requisições subsequentes de criação e listagem de links.
5. **Diagnóstico Preciso de Gargalos com Métricas Percentis:**
   * Identificação de gargalo de CPU no algoritmo Bcrypt sob carga de 100 req/s (causando elevação de latência no pico), mantendo tempo de resposta < 95ms em operação normal e recuperação rápida pós-estresse.
