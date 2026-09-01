# 📚 Guia Definitivo: Automação de Testes de API, Banco de Dados e Performance com Playwright, Artillery e IA

Este guia é uma referência completa e definitiva sobre a arquitetura, padrões de projeto, automação de APIs, engenharia de performance, manipulação de banco de dados e análise inteligente desenvolvidas no projeto **ShortBeyond**.

---

## 📑 Índice
1. [Arquitetura Geral do Projeto](#-1-arquitetura-geral-do-projeto)
2. [Glossário Definitivo de Termos](#-2-glossário-definitivo-de-termos)
3. [Padrões de Projeto Aplicados](#-3-padrões-de-projeto-aplicados)
4. [Banco de Dados & Gestão de Massa de Testes](#-4-banco-de-dados--gestão-de-massa-de-testes)
5. [Automação de APIs com Playwright](#-5-automação-de-apis-com-playwright)
6. [Engenharia de Performance com Artillery](#-6-engenharia-de-performance-com-artillery)
7. [Análise de Métricas & Critérios de Aceitação com IA](#-7-análise-de-métricas--critérios-de-aceitação-com-ia)
8. [Cheat Sheet Definitivo de Comandos](#-8-cheat-sheet-definitivo-de-comandos)
9. [Dicas de Ouro & Armadilhas Comuns](#-9-dicas-de-ouro--armadilhas-comuns)

---

## 🏛️ 1. Arquitetura Geral do Projeto

A solução foi estruturada para unir testes funcionais de contrato/E2E em APIs com testes de carga e pico, integrando limpeza e geração de dados direto no PostgreSQL:

```text
shortbeyond/
├── docs/                        # Coleções OpenCollection da API e documentações
│   ├── auth/                    # Especificação dos endpoints de autenticação
│   ├── links/                   # Especificação dos endpoints de links
│   ├── health/                  # Especificação do endpoint de saúde
│   └── GUIA_DEFINITIVO.md       # Este guia definitivo
├── performance/                 # Módulo de Engenharia de Performance
│   ├── data/
│   │   └── usuarios.csv         # Massa de dados dinâmicos para testes de carga
│   ├── reports/
│   │   ├── cadastro.json        # Relatório JSON do teste de cadastro
│   │   ├── login.json           # Relatório JSON do teste de login
│   │   └── spike.json           # Relatório JSON do teste de pico
│   └── tests/
│       ├── health.yaml          # Teste de latência base do /health
│       ├── cadastro.yaml        # Teste de cadastro (80% sucesso / 20% duplicado)
│       ├── pre-cadastro.yaml    # Script de carga inicial via API
│       ├── login.yaml           # Teste de autenticação com validação JWT
│       └── spike.yaml           # Teste de pico em 5 fases (até 100 req/s e 4k VUs)
├── playwright/                  # Módulo de Testes Automatizados de API
│   ├── e2e/                     # Suítes de testes funcionais organizadas por domínio
│   │   ├── auth/
│   │   ├── health.spec.js
│   │   └── links/
│   └── support/                 # Infraestrutura de suporte e utilitários
│       ├── factories/           # Geração de dados de teste (Faker + ULID)
│       ├── fixtures/            # Injeção de dependências e custom fixtures
│       └── services/            # Camada de comunicação HTTP e PostgreSQL
├── global-setup.js              # Hook global de setup (limpeza do banco antes dos testes)
└── playwright.config.js         # Configurações do Playwright Test Runner
```

---

## 📖 2. Glossário Definitivo de Termos

### 🔹 Conceitos de APIs & Autenticação
* **Endpoint:** URL onde um serviço específico da API pode ser acessado (ex: `/api/auth/login`).
* **JWT (JSON Web Token):** Padrão aberto (RFC 7519) para autenticação stateless entre cliente e servidor em formato de token criptografado.
* **Payload:** O corpo de dados transmitido em uma requisição HTTP (`body`) ou resposta (`data`).
* **Idempotência:** Propriedade de uma operação de produzir o mesmo resultado independentemente de quantas vezes for executada (ex: `GET`, `PUT`, `DELETE`).

### 🔹 Identificadores & Criptografia
* **ULID (Universally Unique Lexicographically Sortable Identifier):** Identificador de 26 caracteres baseado em Base32 (alfabeto Crockford), ordenável por timestamp e com alta entropia para chaves primárias de alto desempenho.
* **Bcrypt:** Função de derivação de chave e algoritmo de hash unidirecional para senhas, que utiliza um fator de trabalho adaptativo (*salt rounds*, ex: 10) resistente a ataques de força bruta.
* **Salt:** Dado aleatório adicionado à senha antes do cálculo do hash para garantir que duas senhas idênticas resultem em hashes diferentes.

### 🔹 Testes de Performance & Carga
* **VU (Virtual User):** Usuário virtual simulado que executa um fluxo de requisições de forma concorrente.
* **Throughput (Vazão):** Quantidade de requisições processadas pela aplicação por unidade de tempo (ex: `req/s`).
* **Arrival Rate:** Taxa de novos usuários virtuais injetados no sistema por segundo.
* **Arrival Count:** Quantidade total fixa de usuários virtuais a serem distribuídos ao longo de uma fase.
* **Cold Start:** Lentidão na primeira execução de um serviço/endpoint devido à inicialização de recursos, alocação de memória ou pool de conexões.
* **Spike Testing (Teste de Pico):** Teste que submete o sistema a um aumento súbito e extremo de carga para avaliar a estabilidade, tolerância a falhas e tempo de recuperação.
* **Soak Testing (Teste de Resistência):** Teste de carga mantido por longos períodos para identificar vazamentos de memória (*memory leaks*) ou exaustão de conexões.

### 🔹 Métricas & Percentis de Latência
* **Média (Mean):** Soma dos tempos de resposta dividida pelo total de requisições. *Atenção:* Pode mascarar outliers críticos.
* **Mediana (p50):** Tempo exato em que 50% das requisições foram mais rápidas e 50% foram mais lentas.
* **p90 / p95 / p99:** Percentis que indicam que 90%, 95% ou 99% das requisições responderam em tempo menor ou igual àquele valor. São a métrica padrão da indústria para SLA/SLO de cauda longa.

### 🔹 Banco de Dados & SQL
* **CTE (Common Table Expression):** Bloco temporário e nomeado (`WITH ... AS`) que facilita consultas complexas, encadeando exclusões em cascata com integridade.
* **Bulk Insert (Inserção em Lote):** Técnica de inserção de múltiplos registros em um único comando SQL `INSERT INTO tabela VALUES (...), (...)`, reduzindo o overhead de rede com o banco de dados.

---

## 🎨 3. Padrões de Projeto Aplicados

### 1. Service Object Pattern (`playwright/support/services/`)
Isola todas as chamadas HTTP (rotas, payloads e headers) em módulos de serviço reutilizáveis:
```javascript
export const authService = (request) => ({
  login: async (user) => request.post('/api/auth/login', { data: user }),
  register: async (user) => request.post('/api/auth/register', { data: user })
});
```

### 2. Factory Pattern (`playwright/support/factories/`)
Encapsula a criação de objetos dinâmicos e massas de dados usando `@faker-js/faker`:
```javascript
export const getUser = () => ({
  name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  email: faker.internet.email({ provider: 'lfernandobra.dev' }).toLowerCase(),
  password: 'pwd123'
});
```

### 3. Custom Fixtures Pattern (`playwright/support/fixtures/`)
Injeta serviços e contexto automaticamente nos testes sem necessidade de instanciamento manual:
```javascript
const test = baseTest.extend({
  auth: async ({ request }, use) => {
    await use(authService(request));
  }
});
```

---

## 💾 4. Banco de Dados & Gestão de Massa de Testes

O serviço [`database.js`](file:///Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/playwright/support/services/database.js) opera diretamente no PostgreSQL com foco em alta performance e consistência:

### Inserção em Lote Otimizada (2.000 usuários em < 1s):
```javascript
// Otimização crucial: Calcula o hash Bcrypt 1 única vez para todos os registros
const passwordHash = await bcrypt.hash('pwd123', 10);

// Insere em lotes de 500 registros por query com ULIDs e e-mails únicos
for (let i = 0; i < totalUsers; i += batchSize) {
  const query = `
    INSERT INTO users (id, name, email, password)
    VALUES ${users.map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`).join(', ')}
  `;
  await client.query(query, values);
}
```

### Limpeza Robusta com CTE (Users + Links Órfãos):
```sql
WITH usuarios_para_deletar AS (
  SELECT id FROM users WHERE email LIKE '%@lfernandobra.dev' OR email LIKE '%@qa.dev.com'
),
delete_links AS (
  DELETE FROM links
  WHERE user_id IN (SELECT id FROM usuarios_para_deletar)
     OR user_id NOT IN (SELECT id FROM users)  -- Remove órfãos
     OR user_id IS NULL                       -- Remove anônimos
)
DELETE FROM users
WHERE id IN (SELECT id FROM usuarios_para_deletar);
```

---

## 🚀 5. Engenharia de Performance com Artillery

### Arquitetura de um Teste de Pico (Spike Test):
```yaml
config:
  target: "http://localhost:3333/api"
  payload:
    path: "../data/usuarios.csv"
    fields: ["name", "email", "password"]
    skipHeader: true
  phases:
    - name: "warmup"     # 1. Aquecimento base
      duration: 30
      arrivalRate: 5
    - name: "ramp-up"    # 2. Subida gradual
      duration: 20
      arrivalRate: 5
      rampTo: 20
    - name: "spike"      # 3. PICO EXTREMO
      duration: 30
      arrivalRate: 100
    - name: "drop"       # 4. Queda de carga
      duration: 10
      arrivalRate: 100
      rampTo: 10
    - name: "recovery"   # 5. Validação de recuperação
      duration: 10
      arrivalRate: 5

scenarios:
  - name: "Criar Link"
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
            original_url: "https://instagram.com/papitoqa"
            title: "Instagram do Papito"
          expect:
            - statusCode: 201
```

---

## 🤖 6. Análise de Métricas & Critérios de Aceitação com IA

A interpretação de relatórios de carga utiliza métricas estatísticas consolidadas para verificar conformidade com SLAs de negócio:

```text
[Relatório JSON do Artillery] ──► [Extração de Métricas] ──► [Validação vs Critérios de Aceitação]
                                  • Counters (2xx, 4xx, 5xx)   • Taxa de Sucesso (%)
                                  • Percentis (p50, p95, p99)  • Latência Máxima no p95
                                  • Timeouts & Erros de VU     • Tempo de Recuperação pós-pico
```

---

## 📋 7. Cheat Sheet Definitivo de Comandos

### 🗄️ Banco de Dados & Seeding
```bash
# Limpar dados de teste
node playwright/support/services/database.js cleanup

# Inserir 2.000 usuários no PostgreSQL e gerar usuarios.csv
node playwright/support/services/database.js seed 2000

# Executar fluxo completo (cleanup + seed 2000)
node playwright/support/services/database.js
```

### 🎭 Testes Funcionais de API (Playwright)
```bash
# Executar todos os testes de API
npx playwright test

# Executar testes em modo com interface gráfica (UI Mode)
npx playwright test --ui

# Executar suíte específica (ex: autenticação)
npx playwright test playwright/e2e/auth/

# Visualizar o relatório HTML de testes funcionais
npx playwright show-report
```

### ⚡ Testes de Performance (Artillery)
```bash
# 1. Health Check
npx artillery run performance/tests/health.yaml

# 2. Cadastro com exportação JSON
npx artillery run performance/tests/cadastro.yaml --output performance/reports/cadastro.json

# 3. Login com exportação JSON
npx artillery run performance/tests/login.yaml --output performance/reports/login.json

# 4. Spike Test com exportação JSON
npx artillery run performance/tests/spike.yaml --output performance/reports/spike.json

# 5. Gerar relatório visual em HTML do Artillery
npx artillery report performance/reports/spike.json
```

---

## 💡 8. Dicas de Ouro & Armadilhas Comuns

1. **Sempre use `skipHeader: true` em Payloads CSV:**
   * Sem essa flag, o Artillery enviará os nomes das colunas (`name,email,password`) na primeira requisição, gerando erros 400 inesperados na API.
2. **Cálculo de Bcrypt em Seeding de Massa:**
   * Nunca chame `bcrypt.hash` dentro de um loop de 2.000 iterações. Calcule o hash **uma única vez** antes do loop e reutilize o valor para todos os registros.
3. **Métricas Percentis > Médias:**
   * A média mascara picos de lentidão. Sempre baseie seus SLAs de performance no **p95** ou **p99**.
4. **Resiliência em Testes de Pico:**
   * Um teste de pico bem-sucedido não exige 100% de sucesso durante a sobrecarga máxima, mas sim:
     * Erros 5xx contidos (ex: ≤ 3%)
     * Ausência de crash do servidor
     * **Recuperação rápida** (retorno aos SLAs normais em ≤ 30s após a queda da carga).
5. **Limpeza Global Pré-Teste:**
   * Mantenha um hook em `globalSetup` do Playwright chamando o `cleanupTestData` para garantir que cada rodada de teste comece em um ambiente limpo e sem poluição de dados residuais.
