# Revisión del módulo `health_data` — ALOVIDA

## 1. Alcance, método y límites

- Fecha: 2026-10-05. Unidad: `src/modules/health_data` y sus repositorios de recursos, identidad, ingesta y liberación.
- Lectura: 55 archivos TypeScript no spec (9.842 líneas), 7 specs, 2 controladores, DTO, servicios y repositorios de UC-52-01 a UC-52-14.
- Evidencia dinámica: `corepack yarn test src/modules/health_data --runInBand --silent` → **7 suites y 98 tests pasan**. Los dobles no ejercen dos tenants, ownership de paciente, RLS ni almacenamiento.
- No cubierto: FHIR real, vault, file storage, jobs/outbox, PostgreSQL desplegado y consentimiento clínico completo.

## 2. Resumen ejecutivo

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | HD-01: `$everything` entrega historia longitudinal sin política de paciente/tenant aplicada al actor. |
| Alta | 2 | HD-02: ingesta permite mezclar tenant de conexión, lote y recurso; HD-03: de-identificación y exportación aceptan perfiles, corridas y paciente sin alcance. |
| Media | 1 | HD-04: colecciones de issues, findings y versiones fuente no tienen tope. |

## 3. Mapa de la unidad

| Superficie | Operaciones | Roles HTTP | Control de alcance observado |
|---|---|---|---|
| Ingesta/canónico | origen, lote, registro, proyección, relaciones y bindings | admin, worker, informático, steward | identifica recursos por UUID y DTO; no política común de tenant. |
| Identidad | candidatos MPI y línea de tiempo | steward, system | cluster y perfiles se consultan por ID. |
| Liberación | de-identificación, exportación, `$everything` | privacy officer, admin, interop consumer | actor se audita, pero no se usa para resolver paciente/custodio. |

## 4. Hallazgos confirmados

### HD-01 — Crítica — `$everything` no comprueba acceso del actor al paciente ni al custodio

**Evidencia.** La ruta sólo exige uno de tres roles y recibe el paciente y `custodian` desde URL/query ([fhir-r5.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/controllers/fhir-r5.controller.ts#L61-L81)). `serveEverything` usa el actor sólo para log, busca membresía MPI por `patientProfileId`, expande el clúster y consulta recursos con el `custodianTenantId` recibido ([data-release.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/services/data-release.service.ts#L294-L380)). El repositorio filtra por ese valor sin contrastarlo con actor o tenant resuelto ([canonical-resources.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/repositories/canonical-resources.repository.ts#L179-L190)); la membresía MPI tampoco lleva un filtro de tenant en la consulta ([patient-identity.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/repositories/patient-identity.repository.ts#L294-L320)).

**Impacto y plan.** Un `INTEROP_CONSUMER` con UUID de paciente y custodio de otra organización puede obtener el payload FHIR y los perfiles enlazados del clúster. Resolver primero una política clínica de lectura para paciente y custodio a partir de la sesión, no de query; validar que el clúster no cruce custodios sin autorización explícita y registrar acceso con decisión/propósito.

### HD-02 — Alta — la cadena de ingesta acepta tenants incompatibles

**Evidencia.** Crear conexión usa `dto.tenantId` directamente ([health-ingestion.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/services/health-ingestion.service.ts#L73-L117)); abrir lote bloquea conexión por ID pero persiste otro `dto.tenantId` sin compararlo con el sistema/conexión ([#L124-L197](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/services/health-ingestion.service.ts#L124-L197)). Proyectar un record busca el registro por ID y crea/busca el recurso bajo el `dto.custodianTenantId`, también sin enlazarlo al lote/conexión ([#L314-L405](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/services/health-ingestion.service.ts#L314-L405)).

**Refutación intentada.** Hay roles distintos, locks, idempotencia y FK de entidades. Ninguno comprueba igualdad de tenant entre actor, conexión, lote, record y recurso; las FK demuestran existencia, no propiedad. **Sostenido.**

**Plan.** Resolver tenant del actor/worker y derivar todos los tenants de la conexión; prohibir los campos de tenant redundantes en comandos externos o compararlos estrictamente. Consultar lote/record con joins o filtros compuestos, y cubrir T1/T2 antes de crear cualquier versión o procedencia.

### HD-03 — Alta — liberación y exportación no atan perfil, corrida ni paciente al actor

**Evidencia.** `recordDeidRun` busca el perfil por sólo ID y usa su tenant para crear la corrida/provenance ([data-release.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/services/data-release.service.ts#L67-L176); [data-release.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/repositories/data-release.repository.ts#L27-L32)). `exportBundle` acepta `patientProfileId` o cohorte y busca una corrida por sólo ID; comprueba estado, pero no tenant, paciente, consentimiento ni actor antes de crear job/manifiesto ([data-release.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/services/data-release.service.ts#L185-L283)).

**Plan.** Aplicar alcance de privacy officer por tenant, ownership/consentimiento del paciente o cohorte y compatibilidad de corrida/perfil/manifiesto antes de exportar. El identificador ajeno debe responder igual que inexistente y no crear registro de salida.

### HD-04 — Media — arrays operativos sin máximo

**Evidencia.** Issues de validación, findings de calidad y `sourceVersionIds` son arrays anidados sin `@ArrayMaxSize` ([health-data.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/dto/health-data.dto.ts#L877-L887), [#L1037-L1045](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/dto/health-data.dto.ts#L1037-L1045), [#L1404-L1415](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/dto/health-data.dto.ts#L1404-L1415)). Los servicios iteran los IDs para crear linaje ([data-release.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/health_data/services/data-release.service.ts#L149-L162)).

**Plan.** Fijar límites distintos por diagnóstico, calidad y linaje, deduplicar IDs y mover liberaciones voluminosas a job paginado.

## 5. Pruebas de cuatro puntos

| ID | Correcto | Límite | Error | Falla catalogada propuesta |
|---|---|---|---|---|
| HD-01 | Consumidor autorizado T1 obtiene paciente T1. | clúster legítimo T1. | T1 pide paciente/custodio T2; no payload ni IDs. | `404/RESOURCE_NOT_FOUND/HEALTH_DATA_PATIENT_NOT_AVAILABLE`. |
| HD-02 | conexión, lote y recurso T1. | reintento del mismo record. | mezclar connection T1 con tenant/custodio T2. | `403/FORBIDDEN/HEALTH_DATA_TENANT_SCOPE_DENIED`. |
| HD-03 | privacy officer exporta paciente/corrida T1 aprobados. | salida de-identificada válida. | perfil, corrida o paciente T2/consentimiento inválido. | `404/RESOURCE_NOT_FOUND/HEALTH_DATA_RELEASE_NOT_AVAILABLE`. |
| HD-04 | array al máximo permitido. | duplicados se rechazan. | máximo+1 sin iniciar writes. | `400/VALIDATION_FAILED/HEALTH_DATA_BATCH_TOO_LARGE`. |

## 6. Matriz y catálogo propuesto

| Reason | Estado/código | Uso |
|---|---|---|
| `HEALTH_DATA_PATIENT_NOT_AVAILABLE` | `404 / RESOURCE_NOT_FOUND` | Paciente/custodio/clúster fuera de la política de lectura. |
| `HEALTH_DATA_TENANT_SCOPE_DENIED` | `403 / FORBIDDEN` | Conexión, lote, record o recurso no pertenece al tenant del actor. |
| `HEALTH_DATA_RELEASE_NOT_AVAILABLE` | `404 / RESOURCE_NOT_FOUND` | Perfil, corrida, manifiesto o sujeto de exportación ajeno. |
| `HEALTH_DATA_BATCH_TOO_LARGE` | `400 / VALIDATION_FAILED` | Colección sobre el máximo del contrato. |

## 7. Olas de corrección

| Ola | Hallazgos | Esfuerzo | Dependencia/riesgo |
|---|---|---|---|
| 0 | HD-01, HD-02, HD-03 | L | Política clínica/tenant común, consentimiento y tests PostgreSQL de dos tenants. |
| 2 | HD-04 | M | Definir máximos y job paginado para liberaciones grandes. |

## 8. Cierre

Los 98 tests verdes prueban reglas locales y no refutan el cruce de tenant/paciente. No se editaron fuentes, SQL ni datos.
