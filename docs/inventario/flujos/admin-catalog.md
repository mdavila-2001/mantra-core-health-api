<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `admin-catalog`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 15 (0 con decisiones propias, 15 sin ellas)
- Inventario de endpoints del módulo: [admin-catalog](../endpoints/admin-catalog.md)

## Proceso: admin-catalog

- **Código:** `admin-catalog` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 15
- **Actores:** Cualquier sesión válida
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** —

### Para qué sirve

_Sin fuente: ni el README del módulo ni el modelo lo describen._

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:sin controlador` | Operaciones de sin controlador que el README no asigna a un caso de uso | POST /admin/catalog/annotations/{id}/review | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/coverage | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/objects | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/objects/{id} | Cualquier sesión válida | BAJO | 0 |
|  |  | PUT /admin/catalog/objects/{id}/annotation | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/objects/{id}/changes | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/objects/{id}/columns | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/objects/{id}/evidence | Cualquier sesión válida | BAJO | 0 |
|  |  | POST /admin/catalog/objects/{id}/evidence | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/objects/{id}/history | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/objects/{id}/impact | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/scans | Cualquier sesión válida | BAJO | 0 |
|  |  | POST /admin/catalog/scans | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/scans/{id} | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /admin/catalog/schemas | Cualquier sesión válida | BAJO | 0 |

### Diagrama — etapas `ctrl:sin controlador`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  subgraph s0["ctrl:sin controlador · Operaciones de sin controlador que el README no asigna a…"]
    o1["POST /admin/catalog/annotations/{id}/review"]:::op
    o3["GET /admin/catalog/coverage"]:::op
    o4["GET /admin/catalog/objects"]:::op
    o5["GET /admin/catalog/objects/{id}"]:::op
    o6["PUT /admin/catalog/objects/{id}/annotation"]:::op
    o7["GET /admin/catalog/objects/{id}/changes"]:::op
    o8["GET /admin/catalog/objects/{id}/columns"]:::op
    o9["GET /admin/catalog/objects/{id}/evidence"]:::op
    o10["POST /admin/catalog/objects/{id}/evidence"]:::op
    o11["GET /admin/catalog/objects/{id}/history"]:::op
    o12["GET /admin/catalog/objects/{id}/impact"]:::op
    o13["GET /admin/catalog/scans"]:::op
    o14["POST /admin/catalog/scans"]:::op
    o15["GET /admin/catalog/scans/{id}"]:::op
    o16["GET /admin/catalog/schemas"]:::op
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
| POST /admin/catalog/annotations/{id}/review | — | 0 |
| GET /admin/catalog/coverage | — | 0 |
| GET /admin/catalog/objects | — | 0 |
| GET /admin/catalog/objects/{id} | — | 0 |
| PUT /admin/catalog/objects/{id}/annotation | — | 0 |
| GET /admin/catalog/objects/{id}/changes | — | 0 |
| GET /admin/catalog/objects/{id}/columns | — | 0 |
| GET /admin/catalog/objects/{id}/evidence | — | 0 |
| POST /admin/catalog/objects/{id}/evidence | — | 0 |
| GET /admin/catalog/objects/{id}/history | — | 0 |
| GET /admin/catalog/objects/{id}/impact | — | 0 |
| GET /admin/catalog/scans | — | 0 |
| POST /admin/catalog/scans | — | 0 |
| GET /admin/catalog/scans/{id} | — | 0 |
| GET /admin/catalog/schemas | — | 0 |
