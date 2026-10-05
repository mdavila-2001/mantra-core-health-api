# Revisión del módulo `health_context` — ALOVIDA

## Alcance y evidencia

Se revisaron el controlador de las doce rutas, DTOs, los dos servicios, el
repositorio, las diez entidades, el job de tick y los DDL e índices de
`database/SQL/44_health_context`. El módulo modela contexto sanitario agregado
por país; no expone una ruta de paciente ni devuelve payloads crudos de
observaciones. Las rutas requieren JWT y roles explícitos; no se encontró una
ruta `@Public()` ni una lectura clínica de paciente.

`corepack yarn test src/modules/health_context --runInBand --silent` aprobó
**3 suites y 81 pruebas**. Son pruebas unitarias con repositorio simulado. No
ejercitan roles HTTP, restricciones de base de datos, dos solicitudes
concurrentes, procedencia país-fuente, nivel de confianza ni la identidad de un
agente revisor.

## Mapa verificado

| Superficie | Roles declarados | Regla implementada relevante |
| --- | --- | --- |
| `POST /agents`, `/sources` | `SOURCE_ADMIN`, `PLATFORM_ADMIN` | Alta global de agentes y fuentes por código único. |
| `POST /schedules`, `/contexts`, versiones, publicación y retiro | `CONTEXT_CURATOR`, `PLATFORM_ADMIN` (`SYSTEM` también en versionado) | Ciclo de vida y bloqueos de contexto/corrida. |
| `POST /collection-runs`, observaciones y cierre | `SYSTEM` con los roles adicionales indicados por la ruta | Corrida, deduplicación y conciliación de contadores. |
| `POST /versions/:id/quality-reviews` | `QUALITY_REVIEWER`, `SYSTEM`, `PLATFORM_ADMIN` | La revisión cambia borrador a aprobada o rechazada. |
| `GET /contexts/resolve` | `CONTEXT_CONSUMER`, curador, sistema o plataforma | Devuelve versión publicada, hechos y UUIDs de evidencia. |
| `HealthContextScheduleTickJob` | cliente interno de sistema | Cada 30 s llama a `internal/schedules/run-due`. |

Las tablas son `context_agents`, `health_context_sources`,
`country_context_schedules`, `context_collection_runs`, observaciones, contexto,
versiones, hechos, evidencia y revisiones. La clave única de corrida es global
por `idempotency_key`; la de versión es `(country_health_context_id,
version_number)`.

## Hallazgos confirmados

### HC-01 — Alta — Una fuente activa de otro país o de cualquier nivel de confianza puede producir evidencia aceptada

`createSource` persiste `countryConceptId` y `trustTierConceptId`
([`context-collection.service.ts:143-154`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L143-L154)). Al recibir una observación, el servicio sólo comprueba que la
fuente exista y esté activa ([`context-collection.service.ts:477-487`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L477-L487)); después etiqueta la observación con el país de la corrida, sin comparar el país de
la fuente ([`context-collection.service.ts:502-516`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L502-L516)). Tampoco hay una decisión sobre `trustTierConceptId` fuera del alta. Al redactar,
una observación sólo necesita estar marcada `ACCEPTED` para convertirse en
evidencia ([`country-context.service.ts:164-210`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/country-context.service.ts#L164-L210)).

Un recolector con rol `SYSTEM`, erróneo o comprometido, puede declarar aceptada
una fuente nacional de otro país o una fuente de confianza insuficiente. La
versión resultante conserva enlaces de evidencia formalmente válidos, pero con
procedencia incorrecta; la regla documentada de que la confianza gobierna la
aceptación no se ejecuta. La spec sólo cubre fuente activa/inactiva, no país ni
confianza ([`context-collection.service.spec.ts:428-515`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.spec.ts#L428-L515)).

**Plan de corrección.** Definir en el modelo de fuente si `countryConceptId`
ausente significa global y cuál es el conjunto de `trustTier` apto para una
observación aceptada. Antes de insertar, exigir que una fuente localizada tenga
el mismo país de la corrida y que una aceptación cumpla la política de
confianza; una fuente global debe ser una elección explícita. Guardar el motivo
de rechazo en una observación rechazada, sin alterar el histórico. Crear una
razón de negocio estable y no revelar el país o la fuente fuera de alcance.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | Fuente global o del país de la corrida y tier permitido | `201`; observación aceptada con país de la corrida. |
| Límite | Fuente global con país ausente | `201` sólo si la política global está declarada. |
| Error | Fuente activa cuyo país difiere del de la corrida | No se inserta observación ni cambian contadores. |
| Falla catalogada | Fuente localizada ajena o tier no admisible para `ACCEPTED` | `422/PRECONDITION_FAILED/HEALTH_CONTEXT_SOURCE_NOT_ELIGIBLE`. |

### HC-02 — Alta — Una corrida asociada a una programación puede usar agente y país enviados por el cliente

Cuando llega `scheduleId`, `startCollectionRun` carga y bloquea la
programación, pero usa `agentId ??= schedule.agentId` y `countryConceptId ??=
schedule.countryConceptId` ([`context-collection.service.ts:377-405`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L377-L405)). Por tanto, valores presentes en el DTO ganan a los
de la programación. La corrida se persiste con esos valores
([`context-collection.service.ts:416-436`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L416-L436)) y puede además avanzar `next_run_at` de la programación original. El DTO presenta ambos campos como valores “por defecto” de la programación
([`health-context.dto.ts:524-544`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/dto/health-context.dto.ts#L524-L544)), pero no impone igualdad.

Un curador puede iniciar una corrida que parece pertenecer a la programación A,
pero la atribuye al agente o país B. Esto rompe la cadena programación → corrida
→ evidencia y puede dejar sin ejecutar la marca legítima de A. La prueba sólo
cubre la omisión de ambos campos y no su contradicción
([`context-collection.service.spec.ts:306-340`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.spec.ts#L306-L340)).

**Plan de corrección.** Para una corrida con `scheduleId`, derivar siempre
agente y país del registro bloqueado y rechazar `agentId`/`countryConceptId`
si están presentes y difieren; restringir ese modo al trigger programado si ése
es el contrato. Mantener los valores explícitos sólo para corridas manuales sin
programación. Probar además que el rechazo no cambia `next_run_at`.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | `scheduleId` sin agente ni país | `201`; la corrida copia ambos valores de la programación. |
| Límite | `scheduleId` con los mismos UUIDs | `201`; se conserva la misma atribución. |
| Error | `scheduleId` con país o agente distinto | No hay corrida ni avance de `next_run_at`. |
| Falla catalogada | Contradicción entre programación y DTO | `422/PRECONDITION_FAILED/HEALTH_CONTEXT_SCHEDULE_BINDING_MISMATCH`. |

### HC-03 — Alta — La idempotencia de una corrida no resuelve la carrera entre dos peticiones simultáneas

El servicio primero busca por clave y, si no encuentra una fila, crea la
corrida ([`context-collection.service.ts:361-371`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L361-L371), [`…:428-443`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L428-L443)). El DDL impone el único
`uq_context_collection_runs_idempotency_key`
([`04_indexes.sql:45`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/database/SQL/44_health_context/04_indexes.sql#L45)). Dos transacciones que lean antes de que cualquiera haga flush llegan ambas al
insert; una pierde por unicidad. El filtro global la convierte en `409/CONFLICT`
([`all-exceptions.filter.ts:294-300`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/filters/all-exceptions.filter.ts#L294-L300)), pero el método no captura esa condición ni recupera la corrida
ganadora, por lo que incumple la respuesta documentada de repetición
`duplicate: true`.

Un reintento de red o dos réplicas puede recibir un conflicto en lugar de la
misma corrida, y el cliente puede crear otra clave o dar por fallido un trabajo
que sí empezó. La prueba de idempotencia preconfigura una lectura ya existente;
no sincroniza dos transacciones ni verifica la restricción real
([`context-collection.service.spec.ts:342-357`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.spec.ts#L342-L357)).

**Plan de corrección.** Conservar el índice único como árbitro y, ante
`UniqueConstraintViolationException` de esa restricción, volver a leer por la
clave dentro de una transacción nueva y devolver la corrida ganadora con
`duplicate: true`. Si no se puede releer o la restricción no corresponde a esa
clave, propagar una falla catalogada distinta. Aplicar la misma semántica al
alta de agentes, fuentes y contextos que hoy hacen check-then-insert.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | Primera petición con una clave nueva | `201`, `duplicate: false`. |
| Límite | Repetición después de confirmar la primera | `201`, mismo `id`, `duplicate: true`. |
| Error | Dos transacciones coordinadas con la misma clave | Ambas respuestas señalan el mismo `id`; sólo hay una fila. |
| Falla catalogada | Único ajeno o fila ganadora no recuperable | `409/CONFLICT/HEALTH_CONTEXT_IDEMPOTENCY_RESOLUTION_FAILED`. |

### HC-04 — Media — La ruta de revisión permite que un revisor humano suplante la firma de un agente automático

El endpoint de revisión admite a `QUALITY_REVIEWER` además de `SYSTEM`
([`health-context.controller.ts:185-199`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/controllers/health-context.controller.ts#L185-L199)). El DTO acepta un `reviewerAgentId` controlado por el cliente
([`health-context.dto.ts:958-1002`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/dto/health-context.dto.ts#L958-L1002)) y el servicio lo persiste directamente; si está presente,
elimina la firma del actor humano ([`country-context.service.ts:290-299`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/country-context.service.ts#L290-L299)). No carga ni verifica el agente, su estado, ni que la llamada sea del
sistema. El FK puede impedir un UUID inexistente, pero no que una persona
atribuya su aprobación a un agente real.

Una persona con permiso de calidad puede aprobar contenido y dejar el ledger
como si hubiera sido decidido por un agente automático. La aprobación ya es una
decisión sensible y la atribución falsa impide auditoría y revocación fiables.

**Plan de corrección.** Separar la revisión humana de la automática, o resolver
el agente desde una identidad de workload autenticada. Para un actor humano,
ignorar/rechazar `reviewerAgentId` y guardar siempre `actor.id`; para sistema,
cargar un agente activo autorizado para revisar. Mantener una razón de error
estable para agente inexistente, inactivo o incompatible.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | Worker autenticado revisa con agente activo autorizado | `201`; queda `reviewerAgentId`, sin firma humana. |
| Límite | Revisor humano sin agente | `201`; queda `reviewedByUserId` del actor. |
| Error | Revisor humano envía UUID de agente real | No cambia estado ni se inserta revisión. |
| Falla catalogada | Agente inexistente, inactivo o actor no `SYSTEM` | `422/PRECONDITION_FAILED/HEALTH_CONTEXT_REVIEWER_AGENT_INVALID`. |

### HC-05 — Media — Las fallas del módulo no tienen reasons estables por caso de negocio

No existe un archivo `health_context.error-reasons.ts`. Los servicios lanzan
`ResourceNotFoundException`, `ConflictException` y
`PreconditionFailedException` con textos y detalles variables, por ejemplo al
cerrar una corrida ([`context-collection.service.ts:554-571`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/context-collection.service.ts#L554-L571)) o publicar una versión
([`country-context.service.ts:340-359`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/health_context/services/country-context.service.ts#L340-L359)). `DomainException` sólo serializa `code`, `message` y
`details` ([`domain.exception.ts:13-29`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/errors/domain.exception.ts#L13-L29)); el filtro no agrega un reason de módulo
([`all-exceptions.filter.ts:161-170`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/filters/all-exceptions.filter.ts#L161-L170)).

Clientes y jobs distinguen estados como “corrida cerrada”, “fuente inactiva” o
“versión no aprobada” parseando español o eligiendo un tratamiento genérico de
`422`. No pueden decidir de forma estable si deben reintentar, corregir la
entrada o mostrar una acción concreta.

**Plan de corrección.** Crear el catálogo local de reasons y hacer que cada
rama de negocio lo incluya en `details.reason`; documentar `status`,
`ErrorCode` y los campos seguros de detalle. Cubrir HTTP, no sólo instancia de
excepción, y no incluir payload, URLs de fuentes ni datos de evidencia en la
respuesta.

| Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- |
| Correcto | Publicación de versión aprobada | `200`; sin cuerpo de error. |
| Límite | Repetición de una corrida ya cerrada | Respuesta estable sin reabrir ni alterar contadores. |
| Error | Versión en borrador intenta publicar | No cambia contexto ni versión. |
| Falla catalogada | Estado inválido, recurso ausente o fuente inactiva | `404|409|422` con `NOT_FOUND|CONFLICT|PRECONDITION_FAILED` y reason `HEALTH_CONTEXT_*` exacto. |

## Matriz mínima de regresión

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Agentes y fuentes | alta única | fuente global | código duplicado | conflicto con reason de código duplicado |
| Programaciones y tick | cron válido y agente activo | lote de 100 / `SKIP LOCKED` | cron inválido o agente inactivo | reason de programación inválida |
| Corridas | nueva y repetida secuencial | concurrencia misma clave | binding de programación contradictorio | HC-02 y HC-03 |
| Observaciones | fuente apta del país | hash repetido | fuente revocada, país/tier incompatible | HC-01 |
| Versionado | hechos con evidencia del run | versión caducada se marca stale | evidencia ajena o repetida | reason de evidencia inválida |
| Revisión/publicación/retiro | aprobación y publicación | reemplazo aprobado del mismo contexto | revisor falso o versión fuera de estado | HC-04 y HC-05 |
| Resolución | contexto publicado | payload vencido `stale: true` | sin versión vigente | reason de contexto no resoluble |

## Catálogo, olas y controles preservados

Crear los reasons `HEALTH_CONTEXT_SOURCE_NOT_ELIGIBLE`,
`HEALTH_CONTEXT_SCHEDULE_BINDING_MISMATCH`,
`HEALTH_CONTEXT_IDEMPOTENCY_RESOLUTION_FAILED` y
`HEALTH_CONTEXT_REVIEWER_AGENT_INVALID`, además de reasons específicos para
los estados ya existentes. Todos deben conservar los `ErrorCode` del contrato y
los status propuestos en las tablas.

1. **Ola 0 (M):** HC-01 y HC-02 antes de seguir publicando contexto recolectado.
2. **Ola 1 (M):** HC-03 con integración PostgreSQL y carga concurrente.
3. **Ola 1 (S):** HC-04, con identidad de workload o rutas separadas.
4. **Ola 2 (M):** HC-05 y aserciones HTTP de `reason` en cada rama.

Se verificaron como controles presentes: `ParseUUIDPipe`, `ValidationPipe`
global con whitelist, límite HTTP de 1 MB, transacciones, bloqueos pesimistas
para las transiciones y FKs/índices de la cadena de evidencia. No sustituyen las
validaciones de procedencia, vínculo de programación ni firma descritas arriba.
