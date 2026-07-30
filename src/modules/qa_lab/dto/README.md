# DTO de laboratorio de pruebas

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`qa-lab.dto.ts`) porque los 12 casos de uso comparten vocabulario (suite, caso, corrida, defecto).

## Convenciones

- **Enums de dominio por código legible** (`STAGING`, `JSON_PATH`, `EQUALS`, `CI_PUSH`, `JUNIT`,
  `CRITICAL`…); el servicio los traduce al `*_concept_id` del catálogo.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Colecciones anidadas** (`assertions`) con `@ValidateNested({ each: true })`, `@Type` y
  `@ArrayMinSize(1)`: un caso sin aserciones no comprueba nada, así que no es un caso.
- **Rangos acotados**: `expectedHttpStatus` y `httpStatus` entre 100 y 599.
- **Cuerpos como JSON de dominio** (`requestBodyJson`, `responseBodyJson`, `setupJson`,
  `configJson`) con `@IsObject()`: su forma la fija el sistema bajo prueba, no esta capa.

## Los cuerpos entran en claro y pueden guardarse enmascarados

`ExecuteCaseDto` recibe petición y respuesta tal como ocurrieron —el runner no puede enmascarar
antes, porque el hash debe calcularse sobre el original—. Es el servicio quien decide, según
`isProductionSafe` del entorno, si los persiste en claro o sustituidos. La respuesta lo declara con
`masked`, para que quien envía sepa qué quedó guardado.

## Lo que no se acepta

- **Derivados**: `runNumber`, `defectNumber`, `occurrencesCount`, `totalPassed` / `totalFailed` /
  `totalSkipped`, `version` de la suite, `ordinal` del caso y cualquier hash se calculan y se
  devuelven; nunca se reciben.
- **El estado del caso ejecutado**: lo fija la evaluación. `ExecuteCaseDto` sólo trae evidencia.
- **La firma del fallo al evaluar**: la produce `evaluateResult` y se recibe después en
  `RegisterDefectDto`, que es el punto donde el llamador ya la conoce.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Entornos | `CreateEnvironmentDto` | `EnvironmentResponseDto` |
| Casos | `CreateTestCaseDto` (+ `TestAssertionDto`), `PublishSuiteDto` | `TestCaseResponseDto`, `PublishSuiteResponseDto` |
| Corridas | `CreateRunDto`, `ExecuteCaseDto` | `RunResponseDto`, `ExecuteCaseResponseDto`, `EvaluateResultResponseDto`, `FinalizeRunResponseDto` |
| Evidencia | `AttachArtifactDto`, `LinkReleaseDto` | `ArtifactResponseDto`, `LinkReleaseResponseDto` |
| Defectos | `RegisterDefectDto`, `TriageDefectDto` | `DefectResponseDto`, `TriageDefectResponseDto` |
| Programación | `CreateTestScheduleDto` | `TestScheduleResponseDto` |

## Respuestas con hash

`ExecuteCaseResponseDto.responseBodyHash` y `LinkReleaseResponseDto.evidenceHash` devuelven el sello
de lo guardado. Es lo que permite a un tercero —CI, auditoría— comprobar más tarde que la evidencia
no cambió, sin tener que leerla entera.

## `DefectResponseDto.deduplicated`

Distingue "se abrió un defecto" de "el mismo fallo se vio otra vez". Sin ese dato, un pipeline que
registra defectos automáticamente no sabría si acaba de encontrar algo nuevo.

## Ejemplo de solicitud

```json
POST /qa/runs/{runId}/cases/{caseId}/execute
{
  "targetUrl": "https://staging.salud.example/scheduling/bookings",
  "requestBodyJson": { "slotId": "…", "patientId": "…" },
  "responseBodyJson": { "id": "…", "status": "booked" },
  "httpStatus": 201,
  "latencyMs": 87
}
```

## Ejemplo de respuesta

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "requestPayloadId": "22222222-2222-2222-2222-222222222222",
  "responsePayloadId": "33333333-3333-3333-3333-333333333333",
  "responseBodyHash": "9b74c9…",
  "masked": true
}
```

`masked: true` avisa de que el entorno no era seguro: lo guardado conserva las claves del cuerpo,
no los valores. El hash sigue siendo el del cuerpo original.
