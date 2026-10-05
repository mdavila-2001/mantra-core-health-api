# Revisión del módulo `system_context` — ALOVIDA

## Alcance y evidencia

Se revisaron los doce casos de uso de enumeraciones dinámicas y contextos versionados: controlador, DTOs, servicios, repositorio, entidades, DDL e índices de `45_system_context`, además del interceptor global de tenant para intentar refutar un posible cruce de tenant. `corepack yarn test src/modules/system_context --runInBand --silent` aprobó **3 suites y 99 pruebas**.

No se confirmó un IDOR de tenant: `TenantContextInterceptor` resuelve el tenant, rechaza un `tenantId` contradictorio y puede fijar RLS ([`tenant-context.interceptor.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/tenant/tenant-context.interceptor.ts#L22-L44), [`L115-L145`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/tenant/tenant-context.interceptor.ts#L115-L145)). Las pruebas dirigidas son unitarias con repositorios simulados: no ejercitan PostgreSQL, constraints, carreras ni el filtro HTTP completo.

## Hallazgos confirmados

### SYSCTX-01 — Alta — la idempotencia de refresco mezcla contextos distintos

El refresco busca primero una corrida sólo por `idempotencyKey` y devuelve su resultado sin comparar `systemContextId` ([`system-contexts.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/system-contexts.service.ts#L139-L153)); el repositorio conserva ese criterio ([`system-context.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/repositories/system-context.repository.ts#L974-L980)) y el DDL lo refuerza con una unicidad global ([`04_indexes.sql`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/45_system_context/04_indexes.sql#L29)).

Si dos contextos legítimos usan la misma clave, el segundo recibe el `runId`, hash y estado del primero y no se refresca. El test sólo cubre repetir la clave sobre el mismo contexto, por lo que no refuta la colisión entre agregados.

**Plan:** decidir y documentar el alcance de la clave. Para la semántica que expresa el servicio, cambiar repositorio e índice a `(system_context_id, idempotency_key)` y consultar ambos valores; persistir un hash del request si debe detectarse reutilización divergente dentro del mismo contexto. Migrar tras buscar colisiones existentes y traducir la carrera de unicidad a una respuesta idempotente o conflicto de dominio.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Refrescar C1 con clave `k` y repetir C1/`k` | misma corrida, `duplicate=true`; sin versión extra |
| Límite | Refrescar C1 y C2 con la misma `k` | dos corridas y versiones independientes |
| Error | Refrescar UUID de contexto inexistente | `404`, ninguna corrida creada |
| Falla catalogada | Reusar `k` en C1 con payload distinto, si se adopta hash de request | `409/CONFLICT/SYSTEM_CONTEXT_IDEMPOTENCY_PAYLOAD_MISMATCH` |

### SYSCTX-02 — Alta — los controles de unicidad y ventanas se rompen bajo concurrencia

`createBinding` de enum lee si existe un binding y luego inserta sin lock sobre una clave inexistente ([`dynamic-enums.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/dynamic-enums.service.ts#L501-L545)); `findEnumBindingByTarget` tampoco bloquea ([`system-context.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/repositories/system-context.repository.ts#L532-L545)) y el DDL no declara unicidad sobre `(target_schema_name, target_entity_name, target_field_name)` ([`04_indexes.sql`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/45_system_context/04_indexes.sql#L115-L127)). Dos transacciones pueden ver vacío y crear dos bindings activos; la resolución posterior usa `findOne`, por lo que el catálogo aplicado queda indeterminado.

El binding de contexto repite el patrón: carga el contexto sin `FOR UPDATE`, busca solapes y crea la fila ([`system-contexts.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/system-contexts.service.ts#L423-L470)); el repositorio no bloquea y el DDL no tiene exclusion constraint de rango ([`system-context.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/repositories/system-context.repository.ts#L1059-L1073), [`04_indexes.sql`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/45_system_context/04_indexes.sql#L61-L75)). El test cubre un solape secuencial, no dos inserciones en paralelo.

**Plan:** añadir invariantes en PostgreSQL antes de confiar en la lectura previa: unicidad para el objetivo de enum activo y una exclusion constraint por consumidor/ventana activa para contextos, o serializar ambos agregados con locks/advisory locks de clave estable. Mantener la comprobación previa para mensajes claros, capturar la violación de constraint como conflicto catalogado y añadir integración concurrente con dos conexiones.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Crear un binding de enum y uno de contexto no solapado | `201` para ambos; resolución determinista |
| Límite | Ventanas donde `validTo` de A coincide con `validFrom` de B | ambas aceptadas, sin solape temporal |
| Error | Crear binding para objetivo ya activo o rango que se solapa | sin segunda fila activa |
| Falla catalogada | Dos requests paralelos por el mismo objetivo/rango | una `201` y una `409/CONFLICT/SYSTEM_CONTEXT_BINDING_CONFLICT`, sin error de driver |

### SYSCTX-03 — Alta — el DTO permite procedencia incompleta y termina en violación de base

`ContextInputDto` hace opcionales `sourceSchemaName`, `sourceEntityName`, `sourceRecordId` y `sourceContentHash` ([`system-context.dto.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/dto/system-context.dto.ts#L744-L787)). El refresco los pasa tal cual al repositorio ([`system-contexts.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/system-contexts.service.ts#L250-L267)), mientras la tabla los declara `NOT NULL` ([`02_tables.sql`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/45_system_context/02_tables.sql#L60-L75)). Una entrada con sólo `sourceTypeConceptId` supera class-validator y acaba en un `not_null_violation` de PostgreSQL, sin respuesta de dominio estable.

**Plan:** hacer obligatorios esos cuatro campos cuando `missing` es falso; si se admite una fuente ausente, definir explícitamente un shape alternativo sin crear una fila incompleta. Añadir límites de cantidad/tamaño para `inputs` y JSON, validar la forma antes de abrir la corrida y mapear cualquier constraint residual a un error catalogado sin detalles del driver.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Refresco con procedencia completa y hash de fuente | `201`; versión y snapshot persistidos |
| Límite | Entrada marcada `missing=true` y `required=false` | corrida válida sin exponer datos inexistentes |
| Error | Entrada `required=true, missing=true` | corrida `failed`, sin versión nueva |
| Falla catalogada | Entrada no ausente sin `sourceRecordId`/hash | `400/VALIDATION_FAILED/SYSTEM_CONTEXT_INPUT_PROVENANCE_REQUIRED` |

### SYSCTX-04 — Media — errores de negocio siguen sin `reason` versionado

`readEnum` y el parser de `target` lanzan `BadRequestException` de Nest ([`dynamic-enums.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/dynamic-enums.service.ts#L84-L88), [`L221-L225`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/dynamic-enums.service.ts#L221-L225)); las transiciones restantes usan excepciones de dominio pero no suministran `details.reason`, por ejemplo definición retirada y versión no publicable ([`dynamic-enums.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/dynamic-enums.service.ts#L314-L323), [`L430-L443`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/system_context/services/dynamic-enums.service.ts#L430-L443)). El filtro global puede derivar `ErrorCode` desde el status, pero no inventa una razón estable. Las specs verifican clases/efectos, no `status + code + reason` HTTP.

**Plan:** crear `system-context.error-reasons.ts`, reemplazar excepciones genéricas y adjuntar `details.reason` a cada transición visible. Comenzar por `ENUM_SELECTOR_REQUIRED`, `ENUM_TARGET_INVALID`, `ENUM_DEFINITION_RETIRED`, `ENUM_VERSION_DRAFT_REQUIRED`, `SYSTEM_CONTEXT_INACTIVE` y `SYSTEM_CONTEXT_VERSION_HASH_MISMATCH`; cubrir el filtro HTTP y no revelar UUID ni contenido en rechazos fuera de alcance.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Leer enum publicado con `code` válido | `200` y opciones habilitadas |
| Límite | Selector `target` con tres segmentos válidos | resolución del binding esperado |
| Error | Publicar versión sin opciones habilitadas | estado y publicación sin cambios |
| Falla catalogada | GET sin `target` ni `code` | `400/VALIDATION_FAILED/ENUM_SELECTOR_REQUIRED` |

## Matriz y olas

| Superficie | Correcto / límite | Error / falla catalogada |
| --- | --- | --- |
| Definición, versión, publicación y retiro de enum | transición válida, versión consecutiva, opción por defecto | definición retirada, versión no draft, reasons de enum |
| Bindings y resolución de enum | binding único, valor habilitado, fallback LENIENT | objetivo duplicado concurrente, target inválido, respuesta de rechazo estable |
| Contexto, refresh, activación y rollback | hash canónico, reintento propio, activación/rollback serializados | clave cruzada, contexto inactivo, hash distinto, reason estable |
| Procedencia y bindings de contexto | snapshot completo, ventana contigua | procedencia incompleta, ventana concurrentemente solapada |

1. **Ola 1 (M):** SYSCTX-01 y SYSCTX-02, con migraciones de índices/constraints y pruebas de integración concurrente.
2. **Ola 2 (S):** SYSCTX-03, endurecer DTO y traducir cualquier constraint residual.
3. **Ola 3 (M):** SYSCTX-04, catálogo de reasons y e2e a través del filtro global.

No se modificaron fuentes, SQL ni datos. Los 99 tests verdes prueban reglas aisladas, pero no las carreras, constraints ni respuestas HTTP descritas.
