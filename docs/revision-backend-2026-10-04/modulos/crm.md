# Revisión del módulo `crm` — ALOVIDA

## Alcance y evidencia

Se revisaron cuentas, contactos, equipos, leads, oportunidades, actividades, alianzas, casos y consentimiento de canales. `corepack yarn test src/modules/crm --runInBand --silent` aprobó **3 suites y 46 pruebas**.

## Hallazgos confirmados

### CRM-01 — Crítica — Operaciones CRM no derivan ni verifican el tenant del actor

Las rutas sólo exigen `CRM_ADMIN` o `CRM_AGENT` ([`crm.controller.ts`](../../../src/modules/crm/controllers/crm.controller.ts#L42-L232)). Los altas persisten `dto.tenantId` directamente: cuentas y leads en [`crm-sales.service.ts`](../../../src/modules/crm/services/crm-sales.service.ts#L77-L129), [`…185-L215`](../../../src/modules/crm/services/crm-sales.service.ts#L185-L215); actividades y casos en [`crm-service.service.ts`](../../../src/modules/crm/services/crm-service.service.ts#L103-L167), [`…212-L280`](../../../src/modules/crm/services/crm-service.service.ts#L212-L280). Las mutaciones por UUID cargan filas sin tenant, como cuenta, lead, oportunidad, contacto, canal y caso ([`crm-sales.repository.ts`](../../../src/modules/crm/repositories/crm-sales.repository.ts#L221-L223), [`…384-L385`](../../../src/modules/crm/repositories/crm-sales.repository.ts#L377-L385), [`…425-L445`](../../../src/modules/crm/repositories/crm-sales.repository.ts#L425-L445), [`crm-service.repository.ts`](../../../src/modules/crm/repositories/crm-service.repository.ts#L429-L447)).

Un agente CRM de A puede crear registros con `tenantId` B si el gateway no los reescribe, y con UUID conocidos puede calificar/convertir leads, asignar equipos, comentar/cerrar casos, cambiar consentimiento o consultar la vista 360 de B. El rol global no demuestra pertenencia al recurso.

**Plan:** resolver tenant activo en el servicio y rechazar que cualquier `dto.tenantId` difiera. Sustituir repositorios de mutación por búsquedas `(id, tenantId)` y exigir que todos los recursos relacionados hereden ese tenant. Usar respuesta uniforme de recurso inexistente fuera de alcance; añadir pruebas de dos tenants para cada cadena de UUID.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | CRM agent miembro de A crea y muta lead/caso/cuenta de A | éxito y filas con tenant A |
| Límite | CRM admin de A incorpora miembro a cuenta A | `201` con relación cuenta–miembro A |
| Error | Agent A califica lead o cambia caso/canal de B por UUID | `404` uniforme, sin transición ni comentario |
| Falla catalogada | `tenantId` del cuerpo no coincide con el tenant resuelto | `403/FORBIDDEN/CRM_TENANT_SCOPE_REQUIRED` sin persistir fila |

### CRM-02 — Alta — El pipeline, la etapa y las referencias comerciales pueden combinarse entre tenants

Al convertir un lead, el servicio crea la oportunidad con `pipelineId`, `stageId` y cuenta suministrados sin resolver ninguno de ellos ([`crm-sales.service.ts`](../../../src/modules/crm/services/crm-sales.service.ts#L259-L315)). Al avanzar etapa sólo verifica que la etapa exista, sin comparar `stage.pipelineId`, tenant o pipeline de la oportunidad ([`crm-sales.service.ts`](../../../src/modules/crm/services/crm-sales.service.ts#L326-L386)); el repositorio confirma que `findStageById` consulta únicamente `{ id }` ([`crm-sales.repository.ts`](../../../src/modules/crm/repositories/crm-sales.repository.ts#L436-L445)). El mismo patrón afecta actividades/casos que aceptan account, contact o subject ref sin validar la cadena.

Esto permite corromper el embudo y sus históricos, asociar información de un contacto/cuenta ajeno y calcular probabilidad desde una etapa de otro pipeline.

**Plan:** antes de crear o mover, resolver pipeline, stage, account, contact y sujeto dentro del tenant; exigir `stage.pipelineId === opportunity.pipelineId`; proteger estas relaciones con FK/constraint compuesta si el DDL lo permite. Validar la transición permitida además de la mera existencia de una etapa.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Lead A se convierte con pipeline y etapa A vinculados | oportunidad e histórico coherentes |
| Límite | Mover a etapa siguiente del mismo pipeline | probabilidad e histórico actualizados una vez |
| Error | Mover oportunidad A a etapa de pipeline B o usar cuenta B | sin cambio de etapa ni fila histórica |
| Falla catalogada | Etapa no pertenece al pipeline de la oportunidad | `422/PRECONDITION_FAILED/CRM_STAGE_PIPELINE_MISMATCH` |

## Cobertura pendiente

Las suites son unitarias y mockean repositorios. Faltan integración con dos tenants, cadenas account/contact/case, transición de pipeline y aserciones HTTP de `status`, `code` y `reason`.
