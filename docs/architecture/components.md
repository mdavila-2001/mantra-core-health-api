# Componentes (C4 nivel 3) — dominios críticos

> Fase 10. C4 nivel 3 para los dos dominios de mayor centralidad arquitectónica
> ([graphify-audit.md](../reports/graphify-audit.md) §5, §9): `authz` (hub de autorización,
> presente en 71/97 pares de dependencia cruzada) y `messaging` (bus de eventos). El resto de los
> 60 módulos siguen el mismo patrón de capas (controller fino → service → repository) descrito en
> `docs/modules/*` — no se repite el diagrama para cada uno.

## `authz` — autorización

```mermaid
flowchart TB
  subgraph authz [Módulo authz]
    Ctrl["Controllers (7)<br/>políticas, roles, permisos, accesos clínicos"]
    PDP["AuthzPdpService<br/>evaluación de decisión"]
    Clinical["AuthzClinicalService<br/>relación asistencial, alcance"]
    Repos["Repositories (14)<br/>Roles, Permissions, ClinicalAccessGrants,<br/>CareRelationships, ResourceScopeGrants, ..."]
  end

  RolesGuard["RolesGuard<br/>(src/common/auth)"] -->|consulta rol| Ctrl
  OtherModules["Los otros 59 módulos"] -->|evalúa decisión clínica| PDP
  Ctrl --> PDP
  Ctrl --> Clinical
  PDP --> Repos
  Clinical --> Repos
  Repos --> PG[(PostgreSQL<br/>schema authz)]
```

Detalle funcional completo: [módulo `authz`](../modules/authz.md) ·
[autorización](../api/authorization.md).

## `messaging` — bus de eventos (outbox)

```mermaid
flowchart LR
  Producer["Cualquier módulo<br/>(automation, vector_rag, lakehouse,<br/>graph_intelligence, time_series, ...)"]
  Outbox["OutboxService<br/>.publishDomainEvent()"]
  Queue[("messaging.message_queues<br/>(PostgreSQL)")]
  WorkerM["worker-messaging<br/>(claim → dispatch → ack)"]
  Consumer["Suscriptor<br/>(webhook saliente, otro dominio)"]

  Producer -->|misma transacción| Outbox
  Outbox --> Queue
  WorkerM -->|POST /internal/queues/:code/claim| Queue
  WorkerM -->|POST /internal/events/:id/dispatch| Consumer
  Consumer -->|POST /internal/event-deliveries/:id/ack| WorkerM
```

Detalle funcional completo: [módulo `messaging`](../modules/messaging.md) · eventos (Fase 12).

## Patrón de capas común (los 58 módulos restantes)

```mermaid
flowchart LR
  HTTP[Cliente HTTP] --> Guard["JwtAuthGuard → RolesGuard<br/>(src/common/auth)"]
  Guard --> Interceptor["TenantContextInterceptor"]
  Interceptor --> Controller["Controller (fino)<br/>valida DTO, delega"]
  Controller --> Service["Service<br/>dueño de la transacción"]
  Service --> Repository["Repository (stateless)"]
  Repository --> DB[(PostgreSQL / Mongo / Redis / OpenSearch / MinIO)]
  Service -.->|excepción de dominio| Filter["AllExceptionsFilter"]
  Filter --> HTTP
```

Fuente del patrón: convención documentada en `src/modules/README.md` y verificada en el
[catálogo de módulos](../modules/index.md) (191 controllers, 252 services, 352 repositories sobre
60 módulos, con la misma forma en todos).
