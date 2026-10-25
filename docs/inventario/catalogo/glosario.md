<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Glosario

14 términos de los glosarios de la API y del frontend, con su fuente. Un término que figura en los dos se muestra dos veces: no se unifican definiciones. Los enlaces relativos de las definiciones se quitaron (apuntaban a otro árbol de documentos); queda su texto.

| Término | Definición | Tablas relacionadas | Fuente |
|---|---|---|---|
| PHI | Protected Health Information — dato de salud identificable. El PDP clínico (`authz`) exige rol **y** alcance clínico vigente para acceder a PHI, no basta con el rol (ver autorización). | — | `mantra-core-health-api:docs/business/glossary.md:7` |
| PDP | Policy Decision Point — el punto que decide si una petición de acceso clínico se concede, implementado en `src/modules/authz/services/authz-pdp.service.ts`. | — | `mantra-core-health-api:docs/business/glossary.md:8` |
| RBAC | Role-Based Access Control — autorización por rol global (`RolesGuard`, `@Roles(...)`), 120 roles distintos en uso (ver actores y roles). | — | `mantra-core-health-api:docs/business/glossary.md:9` |
| RLS | Row-Level Security — aislamiento de filas por tenant a nivel de PostgreSQL, controlado por `RLS_ENFORCE` (ver aislamiento por tenant). | — | `mantra-core-health-api:docs/business/glossary.md:10` |
| Tenant | Unidad de aislamiento multi-organización del sistema (una clínica, cadena o red de salud). | — | `mantra-core-health-api:docs/business/glossary.md:11` |
| Outbox | Patrón de mensajería transaccional propio sobre PostgreSQL (`messaging.message_queues`); un cambio de dominio y su evento se escriben en la misma transacción, y `worker-messaging` los despacha después. | — | `mantra-core-health-api:docs/business/glossary.md:12` |
| row_version | Columna de bloqueo optimista presente en el modelo de datos (`version: true` en MikroORM); dos escrituras concurrentes sobre la misma fila se detectan en vez de pisarse silenciosamente. | — | `mantra-core-health-api:docs/business/glossary.md:13` |
| Concepto / catálogo de terminología | El modelo resuelve casi todos sus valores cerrados contra `terminology.catalog_concepts` (columnas `*_concept_id`) en vez de enums nativos — añadir un valor es un `INSERT`, no una migración. | — | `mantra-core-health-api:docs/business/glossary.md:14` |
| Worker | Proceso Node independiente (17 en total) que ejecuta ticks periódicos de un dominio, llamando a la API por HTTP (`/internal/*`) — no accede a la base directamente. Ver mapa de integraciones. | — | `mantra-core-health-api:docs/business/glossary.md:15` |
| DDD por schema | Cada uno de los 57-60 módulos de negocio corresponde a un *schema* PostgreSQL propio del "modelo canónico SALUD" — el límite de módulo en código es también el límite de schema en base de datos. | — | `mantra-core-health-api:docs/business/glossary.md:16` |
| @Public() | Decorador que exime un endpoint del guard JWT global — 9 endpoints en todo el sistema, lista verificada en notas de generación de OpenAPI. | — | `mantra-core-health-api:docs/business/glossary.md:17` |
| Modelo canónico SALUD | Nombre del modelo de datos versionado (**v4.0.10**, declarado en `Mantra Core Health Context/model-manifest.yaml` — la fuente que leen los generadores) del que derivan los 60 módulos y sus 1 186 entidades. | — | `mantra-core-health-api:docs/business/glossary.md:18` |
| Break-the-glass | Mecanismo de acceso clínico de emergencia que otorga acceso excepcional a PHI fuera del flujo normal de autorización, auditado explícitamente (módulo `authz`). | — | `mantra-core-health-api:docs/business/glossary.md:19` |
| DomainException | Jerarquía de excepciones propia (`ResourceNotFoundException`, `ConflictException`, `PreconditionFailedException`, ...) que homogeneiza el modelo de error entre los 60 módulos. Ver modelo de error. | — | `mantra-core-health-api:docs/business/glossary.md:20` |

