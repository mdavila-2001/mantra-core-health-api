# Revisión del módulo `read_models` — ALOVIDA

## Alcance y evidencia

Se revisaron los tres controladores, servicios, repositorios, entidades, DTOs y
sus seis specs. También se contrastó el contexto global de tenant: el
`TenantContextInterceptor` verifica los `tenantId` declarados antes de que se
ejecute este módulo, por lo que no se registró como hallazgo local que las
preferencias reciban ese campo en el DTO.

`corepack yarn test src/modules/read_models --runInBand --silent` aprobó **6
suites y 40 pruebas**. La cobertura es unitaria con repositorios y conexión SQL
simulados; no hay prueba HTTP que cubra permisos del contrato de vista ni una
materialized view real.

## Mapa verificado

| Ruta | Protección declarada | Comportamiento real relevante |
| --- | --- | --- |
| `POST /read-models/definitions`, versiones, refresh, backfill, invalidate, deprecate y retiro | `SECURITY_ADMIN` | Administra definición y corridas de materialización. |
| `GET /read-models/health`, `POST /read-models/:id/reconcile` | `SYSTEM`, `SECURITY_ADMIN` | Lee salud global y reconcilia una definición. |
| `POST /portals/:portalCode/routes/:routeCode/views` | `SECURITY_ADMIN` | Crea portal, ruta, vista e hijos. |
| `GET .../views/:viewCode/data`, `GET .../actions`, `PUT /views/:id/preferences` | autenticado | Resuelve contrato, pero no aplica los requisitos del portal/ruta/campo. |
| `GET /public/directory`, `GET /public/:slug` | `@Public()` | Lee una MV con columnas y límite constantes. |

Las tablas son `read_model_definitions`, dependencias y corridas; contratos de
portal/ruta/vista y sus hijos; y `user_view_preferences`. Las consultas SQL
dinámicas de refresh validan/citan el identificador y las consultas públicas
usan columnas constantes con parámetros para filtros, controles que se
conservarán.

## Hallazgos confirmados

### RM-01 — Alta — Cualquier usuario autenticado puede resolver contratos de rutas y vistas no autorizadas

La ruta de datos y la de acciones sólo requieren autenticación en el
controlador ([`frontend-views.controller.ts:55-89`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/controllers/frontend-views.controller.ts#L55-L89)). Al resolver la vista, el servicio consulta portal, ruta y vista por código, pero no evalúa
`portal.audienceRoleValueSetId`, `portal.tenantScoped`,
`portal.patientScoped`, `route.requiredPermissionId`,
`route.purposeOfUseConceptId`, `route.featureFlagCode`,
`route.requiresPatientContext` ni `route.requiresTenantContext`
([`frontend-views.service.ts:259-319`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/services/frontend-views.service.ts#L259-L319),
[`frontend-views.service.ts:425-459`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/services/frontend-views.service.ts#L425-L459)). Esos requisitos existen en las entidades
([`portal_surfaces.entity.ts:34-53`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/entities/portal_surfaces.entity.ts#L34-L53),
[`frontend_routes.entity.ts:70-128`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/entities/frontend_routes.entity.ts#L70-L128)) y quedan sin efecto.

Un usuario autenticado que conozca los códigos de una ruta administrativa o
clínica puede obtener sus campos, acciones y estado de frescura. Hoy `data` es
vacío, pero el mismo punto de autorización será el que proteja las filas cuando
se implemente la proyección de RM-02.

**Plan de corrección.** Crear un autorizador de contrato de vista que reciba el
actor y el contexto de tenant/paciente ya resuelto; hacerlo llamar desde
`serveData` y `deriveAvailableActions` antes de listar hijos. Debe comprobar
audiencia, permiso individual, propósito, feature flag y contextos exigidos.
Aplicar también `FrontendViewFields.permissionId` al decidir qué campos
servir; `SECURITY_ADMIN`/`SUPERADMIN` sólo puede ser bypass explícito y
documentado. Usar un `DomainException` uniforme, sin confirmar la existencia
del contrato fuera de alcance.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | Usuario con audiencia, permiso y contextos consulta la vista | `200` con contrato permitido. |
| Límite | Ruta sin requisito de permiso ni contexto | `200` para usuario autenticado del tenant resuelto. |
| Error | Usuario del mismo tenant sin `requiredPermissionId` pide `/data` y `/actions` | Denegación sin campos, acciones ni IDs de vista. |
| Falla catalogada | Falta audiencia, permiso o contexto paciente exigido | `404/RESOURCE_NOT_FOUND/READ_MODEL_VIEW_OUT_OF_SCOPE`. |

### RM-02 — Alta — El endpoint que promete servir el read model nunca consulta ni devuelve la proyección

`serveData` resuelve el contrato y calcula metadatos, pero devuelve de forma
incondicional `data: []` y `nextCursor: null`; el comentario confirma que la
MV no se consulta ([`frontend-views.service.ts:259-305`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/services/frontend-views.service.ts#L259-L305)). Ignora además
`defaultPageSize`, `maximumPageSize`, `stableCursorColumnsJson`, filtros y
orden declarados en la definición/contrato. La prueba actual sólo verifica
masking y staleness de metadatos, y por ello no puede detectar la respuesta
vacía ([`frontend-views.service.spec.ts:195-248`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/services/frontend-views.service.spec.ts#L195-L248)).

Toda vista autenticada devuelve éxito sin registros aun cuando la MV tenga
datos. Esto deja la funcionalidad central del módulo sin implementar y oculta
una indisponibilidad funcional al frontend.

**Plan de corrección.** Tras RM-01, añadir un ejecutor de proyección que obtenga
la definición activa, construya `SELECT` sólo con las columnas permitidas y
citadas, aplique el filtro/orden allow-listed y use cursor firmado/estable. El
límite efectivo debe ser `min(requested, maximumPageSize)` y la respuesta debe
incluir sólo campos autorizados y `nextCursor` cuando corresponda. Rechazar
una definición no materializada, inválida o sin política de aislamiento en vez
de responder una lista vacía.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | MV con dos filas y contrato permitido | `200`, dos filas proyectadas y sólo columnas allow-listed. |
| Límite | Solicitud de tamaño superior al máximo y cursor al final | Límite aplicado, cursor estable y página final vacía legítima. |
| Error | Filtro, orden o columna fuera de allow-list | Sin SQL ejecutado contra el valor no permitido. |
| Falla catalogada | MV ausente, definición no materializable o cursor inválido | `422/PRECONDITION_FAILED/READ_MODEL_PROJECTION_UNAVAILABLE` o `READ_MODEL_CURSOR_INVALID`. |

### RM-03 — Alta — La caída de la materialized view pública se transforma en un `200` vacío

Las dos lecturas públicas capturan cualquier excepción de base, registran sólo
un warning y retornan `records: []` ([`public-projections.service.ts:52-79`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/services/public-projections.service.ts#L52-L79),
[`public-projections.service.ts:118-141`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/services/public-projections.service.ts#L118-L141)). No distinguen la ausencia esperable de
la MV de conexión caída, permisos revocados, timeout, corruptela u otro error
del driver. La spec establece explícitamente este `200` vacío ante
`relation does not exist` ([`public-projections.service.spec.ts:45-54`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/read_models/services/public-projections.service.spec.ts#L45-L54)).

El directorio público comunica “sin resultados” durante una caída real y evita
que clientes, métricas y alertas detecten el incidente. No hay contrato de
`ErrorCode` ni `reason` estable para esta ruta.

**Plan de corrección.** Clasificar la excepción de PostgreSQL por código: la
ausencia de MV durante el bootstrap puede responder `503` temporal con un
reason explícito; conexión, timeout y permisos deben propagarse como
`DomainException` de servicio no disponible, sin exponer SQL. Devolver vacío
sólo cuando el `SELECT` exitoso no tenga filas. Añadir métrica/alerta de la
proyección indisponible y conservar el log saneado.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | MV disponible sin coincidencias | `200` y `records: []`. |
| Límite | Directorio sin filtros | A lo sumo 50 filas, ordenado por `display_name`. |
| Error | Filtro city/especialidad con caracteres especiales | Parámetros SQL ligados, sin interpolación. |
| Falla catalogada | `42P01`, timeout o conexión rechazada de la MV | `503/SERVICE_UNAVAILABLE/READ_MODEL_PUBLIC_PROJECTION_UNAVAILABLE`. |

## Matriz mínima de regresión

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Definiciones/versiones | nueva versión única | N+1 tras ACTIVE | duplicado | `409` con reason de conflicto existente |
| Refresh/backfill/invalidate/reconcile | MV válida y corrida auditada | refresh concurrente | objeto no MV | `422` con reason de precondición |
| Publicación de contrato | admin publica hijos | ruta/portal existente | vista duplicada | `409` catalogado |
| Datos/acciones | autorización RM-01 | cursor/tamaño RM-02 | allow-list inválida | reasons RM-01/RM-02 |
| Preferencias | propio usuario y campos permitidos | actualización concurrente | campo ajeno | `422` catalogado |
| Proyección pública | fila aprobada | máximo 50 | filtro parametrizado | reason RM-03 |

## Catálogo y olas

Crear los reasons `READ_MODEL_VIEW_OUT_OF_SCOPE`,
`READ_MODEL_PROJECTION_UNAVAILABLE`, `READ_MODEL_CURSOR_INVALID` y
`READ_MODEL_PUBLIC_PROJECTION_UNAVAILABLE`, con los status y `ErrorCode` de
las tablas anteriores. No se halló archivo local `read_models.error-reasons.ts`.

1. **Ola 0 (M):** RM-01, antes de exponer filas reales.
2. **Ola 1 (L):** RM-02, con integración PostgreSQL y pruebas de paginación.
3. **Ola 1 (S):** RM-03 y alerta de disponibilidad de la MV pública.
