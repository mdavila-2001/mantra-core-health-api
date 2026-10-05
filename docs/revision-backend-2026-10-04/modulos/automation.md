# Revisión del módulo `automation` — ALOVIDA

## Alcance y evidencia

Se revisaron catálogo de agentes y herramientas, guardrails, workflows, triggers, runs, aprobaciones y escritura dinámica de registros. `corepack yarn test src/modules/automation --runInBand --silent` aprobó **6 suites y 133 pruebas**.

## Hallazgos confirmados

### AUTO-01 — Crítica — Roles de automatización pueden operar recursos de otro tenant por UUID

La identidad autenticada contiene `tenantIds` y `scopedRoles`, cuyo contrato limita los roles de negocio a su tenant ([`authenticated-user.interface.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/auth/authenticated-user.interface.ts#L18-L43)). Sin embargo, los servicios de automatización no comparan ese alcance: `defineWorkflow()` persiste `dto.tenantId` y enlaza agentes por `findAgentById(id)` sin tenant ([`automation-definition.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/services/automation-definition.service.ts#L62-L150)); `configureTrigger()` carga el workflow y crea el trigger sin comparar sus tenants ([`automation-definition.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/services/automation-definition.service.ts#L225-L306)); y el arranque de run acepta `dto.tenantId ?? workflow.tenantId` después de resolver sólo por UUID ([`automation-execution.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/services/automation-execution.service.ts#L140-L234)). Los repositorios confirman que esas búsquedas usan exclusivamente `{ id }` ([`automation-governance.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/repositories/automation-governance.repository.ts#L481-L500), [`automation-runs.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/repositories/automation-runs.repository.ts#L233-L255)).

La cadena sigue hasta la escritura: `executeRecordAutomation()` ignora el actor, carga tanto `agentRun` como `recordAutomation` por UUID y escribe el destino dinámico si coincide el agente ([`record-automation.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/services/record-automation.service.ts#L85-L181)). No comprueba que el run, el workflow, el agente, la automatización y el destino pertenezcan al mismo tenant. Un `AUTOMATION_ENGINEER`, `AGENT_RUNTIME` o aprobador con acceso a un UUID ajeno puede modificar definiciones, iniciar/reanudar ejecuciones o inducir una escritura atribuida a la identidad de servicio de otro tenant.

**Plan:** introducir una resolución única de alcance para toda la cadena `actor → tenant activo → workflow/run → agent/version → trigger/approval/record automation`. Derivar el tenant del contexto para actores humanos; permitir `SYSTEM` sólo con una identidad de worker explícita y tenant verificable. Agregar búsquedas por `(id, tenantId)` y relaciones cruzadas obligatorias antes de cada transición o write. Hacer que los recursos ajenos respondan de forma uniforme como ausentes y registrar la denegación sin payload.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Engineer con membresía del tenant A crea workflow, trigger y run A | `201`, mismos tenant en workflow/trigger/run y outbox A |
| Límite | Runtime de A usa record automation A vinculada al agente del run A | escritura permitida y traza atribuida a la identidad de servicio A |
| Error | Engineer de A publica agente, configura trigger o inicia run con UUID del tenant B | respuesta indistinguible de ausente; ninguna fila, transición ni evento B |
| Falla catalogada | Aprobador de A decide aprobación B | `404/RESOURCE_NOT_FOUND/AUTOMATION_RESOURCE_OUT_OF_SCOPE` sin alterar el run |

### AUTO-02 — Alta — Errores de configuración del escritor dinámico salen como 500 genérico sin `reason`

El escritor de destinos construye identificadores SQL desde configuración. Si el destino no tiene dos segmentos, una columna no cumple la lista blanca o el mapeo queda vacío, lanza `InternalServerErrorException` de Nest ([`target-record.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/repositories/target-record.repository.ts#L45-L68), [`target-record.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/automation/repositories/target-record.repository.ts#L93-L105)). El filtro global conserva el status genérico pero no puede ofrecer una razón de negocio estable para esa excepción. Esto deja al runtime distinguir errores leyendo texto libre y puede convertir una configuración corregible en un 500 opaco.

**Plan:** validar al crear/activar `record_automations` la lista permitida de destinos y columnas. Reemplazar las excepciones genéricas por una excepción de dominio `AUTOMATION_RECORD_TARGET_INVALID` o `AUTOMATION_RECORD_MAPPING_EMPTY`, con `400/VALIDATION_FAILED` para entrada/configuración inválida. Traducir los errores inesperados de la base sin exponer SQL ni identificadores.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Automatización activa con destino y mapeo permitidos | inserción parametrizada, traza y outbox |
| Límite | Dedupe sin columnas actualizables | `written: false` ante colisión, sin duplicar fila |
| Error | Destino configurado como `clinical` o columna fuera de lista permitida | configuración rechazada antes de ejecutar |
| Falla catalogada | Mapeo vacío o identificador inválido | `400/VALIDATION_FAILED/AUTOMATION_RECORD_TARGET_INVALID` sin SQL ni fila nueva |

## Controles verificados y cobertura pendiente

El módulo bloquea versiones no publicadas, impide runs de agentes pausados y usa locks para transiciones de approval. La lista blanca de identificadores y parámetros SQL evita interpolar valores en el `INSERT`; no sustituye la autorización por tenant. Las pruebas actuales usan repositorios mockeados y no ejercen actores de tenants distintos, UUID ajenos ni la superficie real de `record_automations` contra una base aislada.

Hay trabajo pendiente de integrar en `fa74b78c` para catálogo de reasons de `automation`; contrastar el segundo hallazgo cuando llegue a `dev`.
