<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `insurance-campaigns`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 16 (0 con decisiones propias, 16 sin ellas)
- Inventario de endpoints del módulo: [insurance-campaigns](../endpoints/insurance-campaigns.md)

## Proceso: insurance-campaigns

- **Código:** `insurance-campaigns` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 16
- **Actores:** Cualquier sesión válida
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** —

### Para qué sirve

_Sin fuente: ni el README del módulo ni el modelo lo describen._

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:sin controlador` | Operaciones de sin controlador que el README no asigna a un caso de uso | GET /insurance-campaigns | Cualquier sesión válida | BAJO | 0 |
|  |  | POST /insurance-campaigns | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance-campaigns/{id} | Cualquier sesión válida | BAJO | 0 |
|  |  | PATCH /insurance-campaigns/{id} | Cualquier sesión válida | BAJO | 0 |
|  |  | PATCH /insurance-campaigns/{id}/status | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance-campaigns/active | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance-campaigns/my-benefits | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance-campaigns/patient/{patientProfileId} | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance/campaigns | Cualquier sesión válida | BAJO | 0 |
|  |  | POST /insurance/campaigns | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance/campaigns/{id} | Cualquier sesión válida | BAJO | 0 |
|  |  | PATCH /insurance/campaigns/{id} | Cualquier sesión válida | BAJO | 0 |
|  |  | PATCH /insurance/campaigns/{id}/status | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance/campaigns/active | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance/campaigns/my-benefits | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /insurance/campaigns/patient/{patientProfileId} | Cualquier sesión válida | BAJO | 0 |

### Diagrama — etapas `ctrl:sin controlador`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  subgraph s0["ctrl:sin controlador · Operaciones de sin controlador que el README no asigna a…"]
    o1["GET /insurance-campaigns"]:::op
    o3["POST /insurance-campaigns"]:::op
    o4["GET /insurance-campaigns/{id}"]:::op
    o5["PATCH /insurance-campaigns/{id}"]:::op
    o6["PATCH /insurance-campaigns/{id}/status"]:::op
    o7["GET /insurance-campaigns/active"]:::op
    o8["GET /insurance-campaigns/my-benefits"]:::op
    o9["GET /insurance-campaigns/patient/{patientProfileId}"]:::op
    o10["GET /insurance/campaigns"]:::op
    o11["POST /insurance/campaigns"]:::op
    o12["GET /insurance/campaigns/{id}"]:::op
    o13["PATCH /insurance/campaigns/{id}"]:::op
    o14["PATCH /insurance/campaigns/{id}/status"]:::op
    o15["GET /insurance/campaigns/active"]:::op
    o16["GET /insurance/campaigns/my-benefits"]:::op
    o17["GET /insurance/campaigns/patient/{patientProfileId}"]:::op
  end
  a2 --> o1
  a2 --> o3
  a2 --> o4
  a2 --> o5
  a2 --> o6
  a2 --> o7
  a2 --> o8
  a2 --> o9
  a2 --> o10
  a2 --> o11
  a2 --> o12
  a2 --> o13
  a2 --> o14
  a2 --> o15
  a2 --> o16
  a2 --> o17
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| GET /insurance-campaigns | — | 0 |
| POST /insurance-campaigns | — | 0 |
| GET /insurance-campaigns/{id} | — | 0 |
| PATCH /insurance-campaigns/{id} | — | 0 |
| PATCH /insurance-campaigns/{id}/status | — | 0 |
| GET /insurance-campaigns/active | — | 0 |
| GET /insurance-campaigns/my-benefits | — | 0 |
| GET /insurance-campaigns/patient/{patientProfileId} | — | 0 |
| GET /insurance/campaigns | — | 0 |
| POST /insurance/campaigns | — | 0 |
| GET /insurance/campaigns/{id} | — | 0 |
| PATCH /insurance/campaigns/{id} | — | 0 |
| PATCH /insurance/campaigns/{id}/status | — | 0 |
| GET /insurance/campaigns/active | — | 0 |
| GET /insurance/campaigns/my-benefits | — | 0 |
| GET /insurance/campaigns/patient/{patientProfileId} | — | 0 |
