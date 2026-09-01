# 🚀 Resumo do Módulo: Testes de Performance com Artillery & Análise com IA

Este documento consolida todas as atividades, arquivos, comandos, arquitetura dos testes de carga, pontos fortes e lições aprendidas desenvolvidas durante o módulo de testes de performance da API **ShortBeyond**.

---

## 📁 1. Estrutura de Arquivos do Módulo

```text
performance/
├── data/
│   └── usuarios.csv             # Massa de testes com 100 usuários únicos
├── reports/
│   ├── cadastro.json            # Relatório JSON do teste de cadastro
│   └── login.json               # Relatório JSON do teste de login
└── tests/
    ├── health.yaml              # Teste de carga do endpoint /health
    ├── cadastro.yaml            # Teste de performance de cadastro (80% sucesso / 20% duplicado)
    ├── pre-cadastro.yaml        # Script de carga inicial/seeding (100 cadastros a partir do CSV)
    └── login.yaml               # Teste de performance de login (70% sucesso / 30% erro 401)
```

---

## 🛠️ 2. Comandos Executados

### 2.1. Geração de Massa de Dados (CSV)
Geração de 100 usuários com nomes, e-mails únicos com domínio `@lfernandobra.dev` e senhas padrão via Node.js:
```bash
node -e '
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");

const dataDir = path.join("performance", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const users = [["name", "email", "password"]];
for (let i = 0; i < 100; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  users.push([
    `${firstName} ${lastName}`,
    faker.internet.email({ firstName, lastName, provider: "lfernandobra.dev" }).toLowerCase(),
    "pwd123"
  ]);
}

const csv = users.map(r => r.map(v => `"${v.replace(/"/g, "\"\"")}"`).join(",")).join("\n");
fs.writeFileSync(path.join(dataDir, "usuarios.csv"), csv);
'
```

---

### 2.2. Execução dos Testes de Carga (Artillery)

#### Health Check
```bash
npx artillery run performance/tests/health.yaml
```

#### Carga Inicial de Usuários (Seeding a partir do CSV)
```bash
npx artillery run performance/tests/pre-cadastro.yaml
```

#### Teste de Carga de Cadastro de Usuários (com geração de relatório JSON)
```bash
npx artillery run performance/tests/cadastro.yaml --output performance/reports/cadastro.json
```

#### Teste de Carga de Autenticação / Login (com geração de relatório JSON)
```bash
npx artillery run performance/tests/login.yaml --output performance/reports/login.json
```

---

### 2.3. Geração de Relatórios Visuais em HTML
Para converter os arquivos JSON de métricas em relatórios interativos com gráficos:
```bash
# Relatório de Cadastro
npx artillery report performance/reports/cadastro.json

# Relatório de Login
npx artillery report performance/reports/login.json
```

---

## ⚙️ 3. Cenários e Scripts Desenvolvidos

### 3.1. Seeding de Usuários (`pre-cadastro.yaml`)
* **Objetivo:** Cadastrar 100% dos usuários contidos no CSV antes do teste de login.
* **Configurações-chave:**
  * `payload`: Aponta para `../data/usuarios.csv` com `order: sequence` e `skipHeader: true`.
  * `phases`: `duration: 20`, `arrivalCount: 100` (exatamente 100 requisições distribuídas em 20s).

### 3.2. Teste de Carga de Login (`login.yaml`)
* **Objetivo:** Simular uso realista de autenticação.
* **Configurações-chave:**
  * **Cenário 1 — Login com Sucesso (`weight: 70`):** Envia credenciais corretas do CSV. Valida status `200`, existência do `data.token` e mensagem `"Login realizado com sucesso"`.
  * **Cenário 2 — Senha Incorreta (`weight: 30`):** Envia e-mail válido com senha incorreta (`senha-incorreta`). Valida status `401` e mensagem `"Credenciais inválidas"`.
  * **Fase:** 4 req/s durante 60 segundos (total de 240 requisições).

---

## 📊 4. Validação dos Critérios de Aceitação

### Cenário 1: Health Check (`/health`)
* ✅ **100% de sucesso (HTTP 200)** (150/150 reqs)
* ✅ **Tempo de resposta p95 < 50ms:** Atingido **13.9 ms**
* ✅ **0% de falhas/erros**

### Cenário 2: Cadastro de Usuários (`/auth/register`)
* ✅ **80% cadastros com sucesso (HTTP 201):** Atingido **78.52%** (106 reqs)
* ✅ **20% erros de e-mail duplicado (HTTP 400):** Atingido **21.48%** (29 reqs)
* ✅ **Tempo de resposta p95 < 500ms:** Atingido **100.5 ms** (quase 5x mais rápido)
* ✅ **Objeto `user` retornado no JSON com sucesso**

### Cenário 3: Autenticação / Login (`/auth/login`)
* ✅ **70% logins com sucesso (HTTP 200):** Atingido **71.67%** (172 reqs)
* ✅ **30% erros de autenticação (HTTP 401):** Atingido **28.33%** (68 reqs)
* ✅ **Tempo de resposta p95 < 400ms:** Atingido **94.6 ms** (mais de 4x mais rápido)
* ✅ **Tokens JWT válidos retornados:** 100% dos logins de sucesso retornaram `data.token`

---

## 🌟 5. Pontos Fortes e Boas Práticas Identificadas

1. **Separação de Responsabilidades e Modularidade:**
   - Divisão clara de pastas (`data/`, `reports/`, `tests/`) mantendo o projeto limpo, escalável e de fácil manutenção.
2. **Carga Realista com Dados Dinâmicos (CSV Data-Driven):**
   - Substituição de strings hardcoded ou excesso de mocks aleatórios por datasets controlados (`usuarios.csv`), permitindo validar tanto o fluxo de registro quanto o de login com integridade referencial.
3. **Estratégia de Pré-Carga (Data Seeding):**
   - Execução prévia de carga sequencial (`pre-cadastro.yaml` com `arrivalCount: 100` e `order: sequence`) para garantir base populada antes dos testes de leitura/login.
4. **Resolução Rápida de Diagnóstico (`skipHeader: true`):**
   - Identificação de respostas 400 inesperadas por causa da leitura da linha de cabeçalho do CSV, rapidamente corrigida adicionando `skipHeader: true` na configuração do payload do Artillery.
5. **Assertividade de SLAs com Percentis:**
   - Uso de métricas percentis (`p90`, `p95`, `p99`) em vez de apenas médias aritméticas, garantindo avaliação precisa da experiência do usuário e identificação de eventuais picos de latência.
6. **Interpretação de Relatórios com IA:**
   - Extração e validação automática de relatórios JSON cruzados com regras de negócio e critérios de aceitação.
