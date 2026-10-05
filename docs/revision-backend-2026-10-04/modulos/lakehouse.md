# Revisión backend — lakehouse

Fecha: 2026-10-05. Alcance: `src/modules/lakehouse`, sus contratos, repositorios, controladores, entidades y el DDL de `database/SQL/63_lakehouse`. No se modificó código.

## Resumen ejecutivo

| Severidad | Hallazgos |
| --- | ---: |
| Crítica | 1 |
| Alta | 1 |
| Media | 1 |
| Baja | 0 |

La capa de catálogo, transformación e investigación tiene transacciones y bloqueos para varios flujos, pero no propaga el tenant resuelto a sus búsquedas por UUID. Por tanto, una identidad con el rol adecuado en su tenant puede relacionar o modificar recursos de otro tenant. Además, varios DTO permiten omitir columnas que el DDL declara `NOT NULL`, de modo que la primera persistencia termina en un error de ORM sin contrato de negocio.

## Cobertura real

Se leyeron ambos controladores, los tres servicios, los tres repositorios, DTO, entidades, constantes, specs y el DDL del módulo. También se contrastó el interceptor global de tenant: compara los campos de entrada llamados `tenantId`, pero no convierte las búsquedas de recursos por UUID en búsquedas acotadas por tenant.

Se ejecutó:

```bash
corepack yarn test src/modules/lakehouse --runInBand --silent
```

Resultado: **4 suites, 73 pruebas aprobadas**. Las pruebas cubren reglas de estado e idempotencia, pero sus mocks no incluyen tenant de recurso ni casos de UUID perteneciente a otro tenant.

## Mapa de la unidad

| Área | Rutas / métodos públicos | Roles declarados |
| --- | --- | --- |
| Catálogo | `POST /lakehouse/zones`, `/catalogs`, `/data-products/:id/versions`, `/datasets` | `DATA_PLATFORM_ENGINEER` o `DATA_PRODUCT_OWNER`; `PLATFORM_ADMIN` cubre ambos |
| Ejecución | `POST /lakehouse/transformations/:defId/runs`, `/ingestion/curated-runs`, `/datasets/:id/quality-runs` | workers de transformación/deidentificación, `DATA_STEWARD`, `SYSTEM`, o administrador |
| Investigación | `POST /research/deidentification-profiles`, `/projects/:id/cohorts`, `/dataset-releases`, `/:id/approve`, `/:id/revoke`; `GET /dataset-releases/expired` | investigador, gobernanza/DPO, `SYSTEM` o administrador según ruta |

Entidades: zonas, catálogos, productos y versiones, datasets y esquemas, definiciones/corridas/particiones/archivos/linaje, reglas/corridas/incidencias de calidad, proyectos/cohortes/solicitudes/manifiestos de investigación. Publica eventos outbox para altas, ejecución, calidad y ciclo de release.

## Hallazgos

### LAKE-01 — Crítica — búsquedas por UUID sin tenant permiten cruzar recursos y releases entre tenants

**Evidencia.** El interceptor global rechaza solamente un `tenantId` de entrada distinto al tenant resuelto ([`tenant-context.interceptor.ts:124-126`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/tenant/tenant-context.interceptor.ts)); no agrega filtros a los repositorios. Estos buscan exclusivamente por UUID:

- [`lakehouse-catalog.repository.ts:292-297`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts) y [`475-497`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts) cargan versión de producto y dataset con `{ id }`.
- [`lakehouse-runtime.repository.ts:33-38`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts) hace lo mismo para la definición de transformación.
- [`research.repository.ts:26-48`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/repositories/research.repository.ts) y [`267-283`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/repositories/research.repository.ts) hacen lo mismo para proyecto y solicitud de release, incluso en operaciones con bloqueo.

Los servicios reciben `actor` pero no obtienen el tenant contextual ni comprueban la pertenencia antes de utilizar esos recursos: [`lakehouse-catalog.service.ts:303-395`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/lakehouse-catalog.service.ts), [`transformation.service.ts:93-176`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/transformation.service.ts) y [`research-release.service.ts:267-354`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/research-release.service.ts). La aprobación/revocación toma un `:id` y altera la solicitud devuelta sin comprobar su tenant ([`research-release.service.ts:397-500`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/research-release.service.ts), [`549-610`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/research-release.service.ts)). El listado de vencidos tampoco filtra tenant ([`research.repository.ts:311-320`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/repositories/research.repository.ts)).

**Impacto y escenario.** Un investigador del tenant A envía su `tenantId` válido junto con UUID de proyecto, cohorte y versión de producto del tenant B; la solicitud queda creada como A pero referencia datos de B. Un DPO de A puede además aprobar o revocar por UUID un release de B. Esto rompe la frontera de investigación y puede materializar/conceder acceso temporal a datos que pertenecen a otra organización.

**Veredicto adversarial.** Confirmado. El interceptor mitiga la falsificación literal de `dto.tenantId`, pero los UUID de proyecto, release, dataset, versión, definición y perfil no contienen el tenant en el nombre ni son validados por dicho interceptor. Los roles sólo autorizan el tipo de operación; no aplican un predicado de pertenencia a la consulta.

**Plan de corrección.**

1. Obtener `requireCurrentTenantId()` en cada operación tenantizada y no aceptar el tenant del DTO como autoridad.
2. Añadir variantes de repositorio `find…InTenant` que unan a `data_products`, `lakehouse_datasets` o `research_projects` y apliquen `tenantId` en la consulta y en las filas bloqueadas.
3. Validar que versión, dataset, definición, perfil, cohorte, proyecto y solicitud pertenezcan al mismo tenant antes de crear relaciones o mutar estado; responder con `404` para recurso fuera de alcance.
4. Limitar `findExpiredManifests` al tenant del worker o ejecutar el barrido exclusivamente como `SYSTEM` con una ruta interna separada.
5. Añadir integración con dos tenants y RLS/consulta real, para no ocultar el defecto con mocks.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | Integración; recurso y actor de A | Aprobar release de A | `201`, manifiesto y outbox de A |
| Límite | Integración; `SYSTEM` con alcance explícito de A | UUID de A y TTL al borde de ética | `201`, expiración recortada a la fecha ética |
| Error | Integración; actor de A y UUID de proyecto/release de B | Solicitud, aprobación o revocación cruzada | `404`, sin fila, manifiesto ni evento nuevo |
| Falla catalogada | E2E de cada ruta afectada | UUID existente de B con actor A | `404 NOT_FOUND`, `ErrorCode.NOT_FOUND`, `reason: LAKEHOUSE_RESOURCE_OUTSIDE_TENANT` |

### LAKE-02 — Alta — contratos opcionales contra columnas `NOT NULL` producen errores de ORM

**Evidencia.** El DTO permite omitir valores que el servicio propaga sin default y el DDL exige:

- `DefineZoneDto` hace opcionales `namespaceId`, `encryptionProfileCode` y `retentionPolicyCode` ([`lakehouse.dto.ts:60-87`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/dto/lakehouse.dto.ts)); `defineZone` los pasa directamente ([`lakehouse-catalog.service.ts:60-68`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/lakehouse-catalog.service.ts)); el DDL los declara `NOT NULL` ([`02_tables.sql:10-12`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/63_lakehouse/02_tables.sql)).
- `RegisterCatalogDto` permite omitir formato y compresión ([`lakehouse.dto.ts:152-168`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/dto/lakehouse.dto.ts)), mientras el DDL los exige ([`02_tables.sql:22-23`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/63_lakehouse/02_tables.sql)).
- `RegisterDatasetDto` permite omitir `partitionSpecJson` y `sourceDatasetCode` ([`lakehouse.dto.ts:459-474`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/dto/lakehouse.dto.ts)); `createDataset` acepta ambos opcionales ([`lakehouse-catalog.repository.ts:420-465`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts)); la tabla no ([`02_tables.sql:62-63`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/63_lakehouse/02_tables.sql)).
- Las particiones y archivos admiten campos opcionales que sus tablas exigen, por ejemplo valores/fechas de partición y manifiesto/estadísticas del archivo ([`lakehouse.dto.ts:548-673`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/dto/lakehouse.dto.ts), [`02_tables.sql:83-100`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/63_lakehouse/02_tables.sql)). La propia spec de transformación construye esas entradas sin los campos requeridos por DDL ([`transformation.service.spec.ts:29-43`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/transformation.service.spec.ts)).

**Impacto y escenario.** Un `POST /lakehouse/zones` válido para class-validator, sin política de retención, crea una entidad parcial y falla al `flush` contra PostgreSQL. El filtro global lo traduce como un 500 de infraestructura, sin un código ni un motivo útil. Lo mismo afecta el registro de datasets y la ejecución normal de transformaciones.

**Plan de corrección.** Elegir una semántica por campo y hacerla consistente: exigirlo en DTO con `@IsDefined` y documentación, o asignar un default de negocio antes de crear la entidad; después alinear la nulabilidad de entidad, repositorio y DDL. Convertir cualquier conflicto residual de persistencia en una excepción de dominio catalogada. Añadir pruebas con EntityManager/PostgreSQL real para cada payload mínimo.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | Integración con DDL real | Zona/dataset/partición con todos sus campos requeridos | `201`, filas persistidas |
| Límite | Unit + integración | Payload mínimo documentado, usando defaults explícitos | `201`, defaults verificables |
| Error | E2E | Omitir `retentionPolicyCode`, `partitionSpecJson` o `objectManifestId` si son obligatorios | `400`, sin intentar `flush` |
| Falla catalogada | E2E | Valor sin default de negocio | `400 VALIDATION_ERROR`, `ErrorCode.VALIDATION_ERROR`, `reason: LAKEHOUSE_REQUIRED_FIELD_MISSING` |

### LAKE-03 — Media — el módulo no expone reasons estables por fallo de negocio

**Evidencia.** Todos los rechazos de negocio usan las excepciones genéricas `ConflictException`, `ResourceNotFoundException` y `PreconditionFailedException` con texto libre, por ejemplo [`lakehouse-catalog.service.ts:53-57`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/lakehouse-catalog.service.ts), [`transformation.service.ts:103-115`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/transformation.service.ts) y [`research-release.service.ts:277-298`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/lakehouse/services/research-release.service.ts). `DomainException` sólo serializa `{ code, message, details }` ([`domain.exception.ts:22-29`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/errors/domain.exception.ts)); no hay catálogo `lakehouse.error-reasons.ts` ni campo `reason` en este módulo. Así, el cliente debe interpretar el texto para distinguir versión superseded, dataset cuarentenado, ética expirada o cohorte ajena.

**Plan de corrección.** Crear `lakehouse.error-reasons.ts`, extender la excepción/filtro con `reason` estable y sustituir los mensajes semánticos por reasons enumerados, conservando un mensaje humano. Priorizar las rutas de fronteras de tenant, ética, cuarentena y DDL. Aserir los tres elementos del contrato en las specs.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | Unit | Publicar versión activa | Respuesta exitosa sin error |
| Límite | Unit | Regla blocking sin umbral con una incidencia | Dataset en cuarentena y evento consistente |
| Error | E2E | Dataset en cuarentena para una transformación | `422` de dominio |
| Falla catalogada | E2E | Dataset en cuarentena | `422 PRECONDITION_FAILED`, `ErrorCode.PRECONDITION_FAILED`, `reason: LAKEHOUSE_DATASET_NOT_WRITABLE` |

## Matriz de pruebas de unidad

| Superficie | Correcto | Límite | Error | Falla catalogada pendiente |
| --- | --- | --- | --- | --- |
| Catálogo (`zones`, `catalogs`, `products`, `datasets`) | alta con datos completos | defaults documentados | duplicado/versión superseded | campos obligatorios y recurso ajeno |
| Transformación e ingesta | materializa una partición | reintento con hash existente | dataset cuarentenado/zona no curated | UUID de definición/dataset ajeno |
| Calidad | regla warning | blocking en umbral | regla inexistente | dataset ajeno y reason de regla inválida |
| Investigación | release propio con ética vigente | TTL recortado | ética vencida | proyecto, release o listado de otro tenant |

## Olas y esfuerzo

1. **Ola 0 (L):** LAKE-01, scope tenant en repositorios y rutas de investigación; requiere pruebas de integración multitenant.
2. **Ola 1 (M):** LAKE-02, alinear DTO, defaults, entidades y DDL antes de seguir exponiendo los endpoints.
3. **Ola 2 (M):** LAKE-03, catálogo de reasons y aserciones de contrato.

## Trabajo pendiente de integrar

No aparece `lakehouse` entre los módulos señalados por el plan con un commit pendiente específico. Los cambios transversales al contrato de errores deben contrastarse al integrar `fa74b78c`.
