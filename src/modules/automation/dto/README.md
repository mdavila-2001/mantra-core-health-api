# DTOs — automation

Un solo archivo, `automation.dto.ts`: una clase de entrada y una de respuesta por caso de uso, más
los anidados (`ToolBindingDto`, `WorkflowStepDto`).

## Lo que el cliente no puede decidir

- **Los estados.** `AUTO_AGENT_DRAFT`, `AUTO_VERSION_PUBLISHED`, `AUTO_RUN_RUNNING`,
  `AUTO_APPROVAL_PENDING`… los pone el servicio desde `CONCEPTS`. Ningún DTO de entrada los acepta.
- **`currentVersion` y el número de versión.** Derivados: el primero de la última publicada, el
  segundo del máximo emitido.
- **`runNumber`.** Se compone del código del workflow y de cuántos runs lleva.
- **`sequenceNo` del paso.** Deriva del último paso del run; si lo eligiera el llamante, dos pasos
  podrían compartir número y la traza dejaría de tener orden.
- **`scheduleSourceConceptId`.** Sale de si viene `campaignScheduleId`, no de la petición.
- **`decidedByUserId`.** Es el actor autenticado; que lo pusiera el cuerpo vaciaría de sentido la
  aprobación.

## Dinero como cadena

`maxCostAmount`, `accruedCostAmount` e `importance` corresponden a columnas `numeric` y se validan con
`@IsNumberString()`, no con `@IsNumber()`. Un importe que pasa por coma flotante se compara mal
exactamente donde importa: en el umbral de un guardrail de coste.

## Anidados

`BindToolsDto.bindings` y `DefineWorkflowDto.steps` llevan `@ArrayMinSize(1)`: una llamada que no
enlaza nada, o un workflow sin pasos, no son una declaración sino ruido. Los dos con
`@ValidateNested({ each: true })` + `@Type(() => …)`, porque sin `@Type` `class-transformer` deja
objetos planos y la validación anidada no corre.

`WorkflowStepDto` referencia los saltos por **código de paso**, no por id: los ids no existen hasta
que se insertan.

## Los `*Json`

`ruleJson`, `configJson`, `conditionJson`, `definitionJson`, `inputSchemaJson`, `outputSchemaJson`,
`modelParamsJson`, `scopeJson`, `toolInputJson`, `toolOutputJson`, `requestedActionJson` y
`payloadJson` se validan sólo con `@IsObject()`. Son `jsonb` sin forma declarada en el modelo;
imponer aquí una estructura sería inventar el contrato.

Las dos gramáticas que el módulo **sí** interpreta —el mapeo de campos y las guardas de
`validation_json`— viven en `record_automations`, que se configura fuera de estos DTOs, y se aplican
en el servicio, donde pueden fallar cerrado con el error correcto. Están documentadas en el README
del módulo.

## `decision`

`DecideApprovalDto.decision` es `@IsIn(['approved', 'rejected'])` y no un concepto: es la única
entrada del módulo que expresa una elección binaria del usuario, y pedirle el UUID del concepto para
decir "sí" o "no" añadiría un lookup sin ganar nada. El servicio lo traduce a
`AUTO_APPROVAL_APPROVED` / `AUTO_APPROVAL_REJECTED`.

## Respuestas

`WorkflowRunResponseDto.duplicate`, `AgentMemoryResponseDto.updated`,
`ExecuteRecordAutomationResponseDto.written` / `.draft` y
`FinalizeWorkflowRunResponseDto.alreadyFinalized` existen porque en todos esos casos la operación
puede haber hecho dos cosas distintas y devolver `200` sin decir cuál dejaría al llamante
adivinando.

`AgentStepResponseDto.paused` + `.approvalId` son lo que el runtime del agente necesita para saber
que **no** debe ejecutar la herramienta y que hay una aprobación esperando.

No se exponen `promptTemplate` ni `contentText` de la memoria en las respuestas.
