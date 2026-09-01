## Health

Esse é o meu teste de carga com o Artillery abaixo:

config:
target: "http://localhost:3333"
phases: - name: "health-check"
duration: 30
arrivalRate: 5

scenarios:

- name: "Health Check"
  flow:
  - get:
    url: "/health"
    expect: - statusCode: 200 - equals: ["shortbeyond-api", "{{ service }}"] - equals: ["healthy", "{{ status }}"]

Segue o resultado:

All VUs finished. Total time: 30 seconds

---

## Summary report @ 10:33:47(+0200)

http.codes.200: ................................................................ 150
http.downloaded_bytes: ......................................................... 7200
http.request_rate: ............................................................. 5/sec
http.requests: ................................................................. 150
http.response_time:
  min: ......................................................................... 0
  max: ......................................................................... 123
  mean: ........................................................................ 6.5
  median: ...................................................................... 5
  p95: ......................................................................... 13.9
  p99: ......................................................................... 19.9
http.response_time.2xx:
  min: ......................................................................... 0
  max: ......................................................................... 123
  mean: ........................................................................ 6.5
  median: ...................................................................... 5
  p95: ......................................................................... 13.9
  p99: ......................................................................... 19.9
http.responses: ................................................................ 150
vusers.completed: .............................................................. 150
vusers.created: ................................................................ 150
vusers.created_by_name.Health Check: ........................................... 150
vusers.failed: ................................................................. 0
vusers.session_length:
  min: ......................................................................... 2.8
  max: ......................................................................... 165.9
  mean: ........................................................................ 11.5
  median: ...................................................................... 8.4
  p95: ......................................................................... 21.5
  p99: ......................................................................... 28.5

Faça uma analise de acordo com os critérios de aceite:

### Critérios de Aceitação:                                                                                          

                                                                                                                       
  [✓] 100% de sucessos (status 200)                                                                                    
  [✓] Tempo de resposta p95 < 50ms                                                                                     
  [✓] 0% de erros 

Resultado do Gemini:

```python
total_requests = 150
status_200 = 150
failed_users = 0
p95 = 13.9

success_rate = (status_200 / total_requests) * 100
error_rate = (failed_users / total_requests) * 100
p95_pass = p95 < 50

print(f"Success Rate: {success_rate}%")
print(f"Error Rate: {error_rate}%")
print(f"P95: {p95}ms (Passed < 50ms: {p95_pass})")


```

```text
Success Rate: 100.0%
Error Rate: 0.0%
P95: 13.9ms (Passed < 50ms: True)


```

# Relatório de Análise do Teste de Carga — Artillery

## 1. Visão Geral da Execução

- **Alvo:** `http://localhost:3333`
- **Cenário:** Health Check (`/health`)
- **Duração do Teste:** 30 segundos
- **Taxa de Chegada (_Arrival Rate_):** 5 req/s
- **Total de Requisições:** 150

---

## 2. Validação dos Critérios de Aceitação

| Critério de Aceitação          | Meta / Limite |  Resultado Obtido   |    Status    |
| :----------------------------- | :-----------: | :-----------------: | :----------: |
| **Taxa de Sucesso (HTTP 200)** |     100%      | **100%** (150/150)  | **APROVADO** |
| **Tempo de Resposta (p95)**    |    < 50 ms    |     **13.9 ms**     | **APROVADO** |
| **Taxa de Erros**              |      0%       | **0.0%** (0 falhas) | **APROVADO** |

---

## 3. Métricas Detalhadas de Desempenho

### 3.1. Tempo de Resposta da API (`http.response_time`)

- **Mínimo:** `0 ms`
- **Média (_Mean_):** `6.5 ms`
- **Mediana (_p50_):** `5.0 ms`
- **Percentil 95 (_p95_):** `13.9 ms` _(limite do critério: < 50ms)_
- **Percentil 99 (_p99_):** `19.9 ms`
- **Máximo:** `123.0 ms`

### 3.2. Taxa de Transferência e VUs

- **VUs Criados / Completados:** 150 / 150
- **VUs com Falha:** 0
- **Taxa Real de Requisições:** 5.0 req/s
- **Dados Baixados:** 7.200 bytes (~7.03 KB)

---

## 4. Parecer Técnico e Conclusão

- **Estabilidade e Conformidade:** Todos os critérios de aceitação foram cumpridos integralmente. A rota `/health` respondeu de forma consistente e muito abaixo do limite de latência tolerado (o p95 foi ~72% mais rápido que o teto de 50ms).
- **Observação de Pico (_Outlier_):** O valor máximo registrado de **123ms** ocorreu pontualmente (possível _cold start_, handshake inicial ou alocação de recursos da primeira conexão), mas não afetou a distribuição global dos percentis (`p99 = 19.9ms`).
- **Veredito:** **Aprovado para a carga avaliada.**

## Cadastro

/Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/performance/reports/cadastro.json
/Users/lfernandobra/Documents/GitHub/udemy-playwright-api/shortbeyond/performance/tests/cadastro.yaml Faça uma analise
no meu teste de performance com base no seguinte critério de aceitação: ### Critérios de Aceitação:

    [✓] 80% cadastros com sucesso (status 201)
    [✓] 20% erros de email duplicado (status 400)
    [✓] Tempo de resposta p95 < 500ms
    [✓] User retornado com sucesso no JSON

- Retorno analise gemini IA

# 📈 Relatório de Teste de Performance — Cadastro de Usuários

    ## 📋 Critérios de Aceitação

    | Critério | Meta Esperada | Resultado Obtido | Status |
    | :--- | :---: | :---: | :---: |
    | **Cadastros com sucesso (status 201)** | ~80% | **78.52%** (106 reqs) | [✓] Aprovado |
    | **Erros de e-mail duplicado (status 400)** | ~20% | **21.48%** (29 reqs) | [✓] Aprovado |
    | **Tempo de resposta (p95)** | < 500ms | **100.5 ms** | [✓] Aprovado |
    | **User retornado no JSON** | Objeto presente | **100% de asserções válidas** | [✓] Aprovado |

    ---

    ## 📊 Métricas Consolidadas da Execução

    ### 1. Volume de Requisições
    - **Total de Requisições:** 135
    - **Taxa de Chegada (Arrival Rate):** 3 req/s
    - **Duração do Teste:** 45 segundos
    - **Usuários Virtuais Concluídos:** 135 (100%)
    - **Falhas de Execução (`vusers.failed`):** 0 (0%)

    ---

    ### 2. Distribuição por Código de Status
    - **Status 201 (Created):** 106 requisições (**78.52%**)
    - **Status 400 (Bad Request):** 29 requisições (**21.48%**)
    - **Outros Códigos (5xx / 4xx inesperados):** 0 (0%)

    ---

    ### 3. Tempos de Resposta (Latência)

    | Percentil / Métrica | Tempo Geral | Status 201 (Sucesso) | Status 400 (Duplicado) |
    | :--- | :---: | :---: | :---: |
    | **Mínimo** | 1.0 ms | 69.0 ms | 1.0 ms |
    | **Médio (Mean)** | 66.2 ms | 83.1 ms | 4.3 ms |
    | **Mediana (p50)** | 74.4 ms | 76.0 ms | 2.0 ms |
    | **p75** | 90.9 ms | 94.6 ms | 5.0 ms |
    | **p90** | 98.5 ms | 98.5 ms | 10.1 ms |
    | **p95 (Meta < 500ms)** | **100.5 ms** | **100.5 ms** | **12.1 ms** |
    | **p99** | 108.9 ms | 108.9 ms | 13.1 ms |
    | **Máximo** | 117.0 ms | 117.0 ms | 21.0 ms |

    ---

    ## 🔎 Validação de Asserções e Integridade do Payload
    - **Cenário "Cadastro com Sucesso":**
      - Asserção `hasProperty: "user"`: **106/106 aprovadas**
      - Asserção `$.message == "Usuário cadastrado com sucesso!"`: **106/106 aprovadas**
    - **Cenário "Email Duplicado":**
      - Asserção `hasProperty: "message"`: **29/29 aprovadas**
      - Asserção `$.message == "Este e-mail já está em uso. Por favor, tente outro."`: **29/29 aprovadas**

    ---

    ## 🏁 Conclusão
    O teste atendeu a **100% dos critérios de aceitação**. A API demonstrou alta estabilidade e tempo de resposta p95

(~100.5ms) quase 5 vezes inferior ao limite tolerado (500ms).

prompt aula 26 para criação de usuarios
"Crie uma massa de testes com 100 usuários com os campos 'name', 'email', 'password', no formato CSV"
"Ajuste esse script para fazer a carga de usuários no meu ambiente de testes:
config:
target: "http://localhost:3333/api"
phases: - name: "cadastros"
duration: 45
arrivalRate: 3
defaults:
headers:
Content-Type: "application/json"

scenarios:

- name: "Cadastro com Sucesso"
  weight: 80
  flow:
  - post:
    url: "/auth/register"
    json:
    name: "Usuario {{ $uuid }}"
    email: "usuario-{{ $uuid }}@lfernandobra.dev"
    password: "senha123"
    expect: - statusCode: 201 - hasProperty: "user" - match:
    json: "$.message"
    value: "Usuário cadastrado com sucesso!"

- name: "Email Duplicado"
  weight: 20
  flow: - post:
  url: "/auth/register"
  json:
  name: "Usuario Duplicado"
  email: "duplicado@lfernandobra.dev"
  password: "senha123"
  expect: - statusCode: 400 - hasProperty: "message" - match:
  json: "$.message"
  value: "Este e-mail já está em uso. Por favor, tente outro."
  "

Topico 26

faça para mim uma função que insere 2 mil usuarios na tabela users.

Os ids são do tipo ULID e a senha deve ser sempre "pwd123" criptografada com bcrypt salt 10, use faker para gerar dados dinamicos. E todos os emails devem ter o
dominio lfernandobra.dev
