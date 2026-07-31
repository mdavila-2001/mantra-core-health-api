# Glosario

> Términos usados de forma consistente en este portal y en el código. Fase 9.

| Término | Significado en este sistema |
|---|---|
| **PHI** | Protected Health Information — dato de salud identificable. El PDP clínico (`authz`) exige rol **y** alcance clínico vigente para acceder a PHI, no basta con el rol (ver [autorización](../api/authorization.md)). |
| **PDP** | Policy Decision Point — el punto que decide si una petición de acceso clínico se concede, implementado en `src/modules/authz/services/authz-pdp.service.ts`. |
| **RBAC** | Role-Based Access Control — autorización por rol global (`RolesGuard`, `@Roles(...)`), 120 roles distintos en uso (ver [actores y roles](actors-and-roles.md)). |
| **RLS** | Row-Level Security — aislamiento de filas por tenant a nivel de PostgreSQL, controlado por `RLS_ENFORCE` (ver `SEC-001` en la [matriz de trazabilidad](../governance/traceability-matrix.md)). |
| **Tenant** | Unidad de aislamiento multi-organización del sistema (una clínica, cadena o red de salud). |
| **Outbox** | Patrón de mensajería transaccional propio sobre PostgreSQL (`messaging.message_queues`); un cambio de dominio y su evento se escriben en la misma transacción, y `worker-messaging` los despacha después. |
| **`row_version`** | Columna de bloqueo optimista presente en el modelo de datos (`version: true` en MikroORM); dos escrituras concurrentes sobre la misma fila se detectan en vez de pisarse silenciosamente. |
| **Concepto / catálogo de terminología** | El modelo resuelve casi todos sus valores cerrados contra `terminology.catalog_concepts` (columnas `*_concept_id`) en vez de enums nativos — añadir un valor es un `INSERT`, no una migración. |
| **Worker** | Proceso Node independiente (17 en total) que ejecuta ticks periódicos de un dominio, llamando a la API por HTTP (`/internal/*`) — no accede a la base directamente. Ver [mapa de integraciones](../architecture/integration-map.md). |
| **DDD por schema** | Cada uno de los 57-60 módulos de negocio corresponde a un *schema* PostgreSQL propio del "modelo canónico SALUD" — el límite de módulo en código es también el límite de schema en base de datos. |
| **`@Public()`** | Decorador que exime un endpoint del guard JWT global — 9 endpoints en todo el sistema, lista verificada en [notas de generación de OpenAPI](../reports/openapi-generation-notes.md). |
| **Modelo canónico SALUD** | Nombre del modelo de datos versionado (`v4.0.x` según `src/modules/README.md`) del que derivan los 60 módulos y sus ~1184 entidades. |
| **Break-the-glass** | Mecanismo de acceso clínico de emergencia que otorga acceso excepcional a PHI fuera del flujo normal de autorización, auditado explícitamente (módulo `authz`). |
| **DomainException** | Jerarquía de excepciones propia (`ResourceNotFoundException`, `ConflictException`, `PreconditionFailedException`, ...) que homogeneiza el modelo de error entre los 60 módulos. Ver [modelo de error](../api/error-model.md). |
