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
