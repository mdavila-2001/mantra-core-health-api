# Revisión del módulo `qa_execution` — ALOVIDA

## Alcance y resultado

Se revisaron controladores, planificación, aprobación, cliente HTTP protegido,
DTO, entidades y pruebas del ejecutor de QA. No se confirmó un hallazgo en el
alcance: es una superficie operativa global, no un recurso de práctica o paciente,
y las acciones peligrosas tienen barreras separadas de configuración, planificación
y ejecución.

| Barrera | Evidencia |
| --- | --- |
| Configurar destinos | Sólo `QA_ADMIN` o `SECURITY_ADMIN` puede cambiar un destino ([qa-execution.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/qa_execution/controllers/qa-execution.controller.ts#L67-L79)); producción no admite mutaciones ([qa-execution.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/qa_execution/services/qa-execution.service.ts#L130-L191)). |
| Evitar SSRF | El destino se limita a esquema, host, puerto y prefijos aprobados; el cliente clasifica DNS y no sigue redirecciones ([target-guard.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/qa_execution/domain/target-guard.ts#L39-L113)). |
| Segregación | El solicitante no puede aprobar su propio hash y la aprobación se bloquea con el plan desactualizado ([qa-execution.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/qa_execution/services/qa-execution.service.ts#L411-L477)). |
| Ejecución | `run-next` exige identidad `SYSTEM`; el plan persiste límites y evidencia antes de ejecutar ([qa-execution.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/qa_execution/controllers/qa-execution.controller.ts#L160-L171)). |
| Lecturas | Listados con límite máximo de 100 y eventos del detalle con límite de 1.000 ([qa-execution.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/qa_execution/services/qa-execution.service.ts#L509-L582)). |

## Pruebas ejecutadas

```text
corepack yarn test src/modules/qa_execution --runInBand --silent
3 suites, 58 pruebas aprobadas
```

Las pruebas incluidas cubren URL fuera de allowlist, red privada, redirección,
timeout, respuesta sobredimensionada, hash/autoaprobación y controladores. Falta
ejecutar en CI la integración declarada para un destino real aislado; no se
ejecutó desde esta auditoría porque requiere infraestructura de QA.

## Matriz de regresión que se conserva

| Área | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Destino | Host/prefijo aprobado | máximos de requests, tiempo y puertos | URL con usuario, host o puerto ajeno | `422/UNPROCESSABLE_ENTITY/QA_TARGET_NOT_ALLOWED` |
| Plan | Suite activa para un entorno activo | límites solicitados se recortan al máximo | suite/entorno inactivo o sin target | `422/UNPROCESSABLE_ENTITY/QA_PLAN_NOT_EXECUTABLE` |
| Aprobación | Segundo actor aprueba hash vigente | expiración de aprobación | solicitante intenta autoaprobar | `403/FORBIDDEN/SELF_APPROVAL` |
| Runner | identidad `SYSTEM` ejecuta un plan en cola | cancelación entre casos | DNS, timeout o redirección | Estado `INFRA_ERROR` y código de guardia/transportes saneado |

## Riesgo residual

Los destinos y sus referencias de secretos son datos operativos; la vista nunca
devuelve el valor del secreto, pero su acceso debe mantenerse restringido a los
roles de lectura QA ya definidos. Todo endpoint adicional debe reutilizar
`GuardedHttpClient`, nunca crear un cliente HTTP directo.
