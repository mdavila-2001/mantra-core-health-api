# Revisión del módulo `audit` — ALOVIDA

## Alcance y evidencia

Se revisaron el registro WORM, la cadena hash por tenant, historial versionado, exportación de evidencia, DSAR, retención, anomalías y accesos de terceros. `corepack yarn test src/modules/audit --runInBand --silent` aprobó **8 suites y 38 pruebas**.

## Hallazgo confirmado

### AUD-01 — Alta — La atestación de integridad puede declarar válida una cadena parcialmente revisada

`POST /audit/integrity/verify` acepta un límite que por omisión es `1000` y usa ese resultado como si fuera toda la partición ([`audit-events.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/audit/services/audit-events.service.ts#L181-L237)). `findChain()` ordena ascendentemente y aplica ese `limit` sin cursor, conteo total ni indicador de truncamiento ([`audit-log.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/audit/repositories/audit-log.repository.ts#L198-L207)). Al terminar el prefijo, el servicio devuelve `verified: true` y agrega una atestación WORM aun cuando no examinó los eslabones posteriores.

Con más de 1.000 eventos de un tenant, una alteración a partir del evento 1.001 queda fuera de la recomputación predeterminada y la API emite una atestación positiva. La cadena y el cerrojo de append son correctos para las filas que sí se leen; el problema es que el contrato no distingue verificación completa de parcial.

**Plan:** hacer que la verificación completa recorra todas las páginas de una partición en una misma definición de rango, o devolver `complete: false`, `checkedCount`, cursor/rango y no emitir atestación de integridad cuando se alcanzó un tope. Preservar un modo acotado sólo como diagnóstico y llamarlo explícitamente parcial. Agregar una prueba de una cadena de más de 1.000 filas con alteración posterior al corte.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Cadena completa íntegra de más de 1.000 filas | `verified: true`, `complete: true` y conteo total real |
| Límite | Diagnóstico pedido con límite menor al total | resultado marcado parcial, sin atestación positiva global |
| Error | Alterar el eslabón 1.001 de una cadena de 1.001 | `verified: false`, `brokenAt` real y atestación de falla |
| Falla catalogada | Límite/cursor inválido o rango inconsistente | `400/VALIDATION_FAILED/AUDIT_INTEGRITY_RANGE_INVALID` sin crear fila WORM |

## Controles verificados

El endpoint de historial valida la entidad contra un registro cerrado antes de consultar, y registra la propia lectura dentro de una transacción ([`audit-history.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/audit/services/audit-history.service.ts#L45-L87), [`history.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/audit/repositories/history.repository.ts#L91-L129)). Las rutas HTTP de auditoría, cumplimiento y privacidad requieren `SECURITY_ADMIN`; DSAR conserva transición terminal y control optimista de fila. Estos controles no corrigen la afirmación positiva sobre una verificación incompleta.

## Cobertura pendiente

Las pruebas presentes cubren la recomputación de una lista mockeada, pero no una cadena mayor que el límite, paginación ni la semántica de la atestación parcial. Incorporar esa matriz junto con dos tenants y una partición global.
