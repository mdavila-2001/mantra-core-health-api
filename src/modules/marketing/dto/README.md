# DTO de marketing

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`marketing.dto.ts`) porque los 12 casos de uso comparten vocabulario (miembro polimórfico, canal,
plantilla).

## Convenciones

- **Enums de dominio por código legible** (`DYNAMIC`, `EMAIL`, `SEND`, `LAST_TOUCH`…); el servicio
  los traduce al `*_concept_id` del catálogo. Nunca se acepta un concept id de estado del cliente.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Importes y puntuaciones como cadena decimal** (`@IsNumberString`): el modelo usa `numeric`, y
  pasarlos por `number` introduciría error de coma flotante.
- **Colecciones anidadas** (`members`, `steps`, `cohort`) con `@ValidateNested({ each: true })` y
  `@Type`. Sólo `steps` lleva `@ArrayMinSize(1)`: añadir cero pasos no tiene sentido, pero un
  refresco que deja el segmento vacío o una activación sin cohorte sí lo tienen.
- **JSON de dominio** (`definitionJson`, `conditionJson`, `variablesJson`, `metadataJson`) como
  `@IsObject()`: su forma la fija cada motor, no esta capa.

## Miembro polimórfico

`memberType` + `memberRefId` aparecen en segmento, cohorte, touchpoint y atribución. Es la
referencia polimórfica que el modelo valida contra `vs_marketing_member`; aquí se acota a los tipos
que el catálogo declara (`CONTACT`, `PATIENT`).

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Segmentos | `CreateSegmentDto`, `RefreshSegmentDto` (+ `SegmentMemberInputDto`) | `SegmentResponseDto`, `RefreshSegmentResponseDto` |
| Campañas | `CreateCampaignDto`, `MaterializeMembersDto` | `CampaignResponseDto`, `MaterializeMembersResponseDto` |
| Contenido | `PublishTemplateVersionDto` | `TemplateVersionResponseDto` |
| Journeys | `CreateJourneyDto`, `AddJourneyStepsDto` (+ `JourneyStepDto`), `ActivateJourneyDto` (+ `CohortMemberDto`) | `JourneyResponseDto`, `JourneyStepsResponseDto`, `ActivateJourneyResponseDto` |
| Inscripciones | `AdvanceEnrollmentDto`, `ExitEnrollmentDto` | `AdvanceEnrollmentResponseDto`, `ExitEnrollmentResponseDto` |
| Tracking | `CreateTrackedLinkDto`, `RecordTouchpointDto` | `TrackedLinkResponseDto`, `TrackedLinkClickResponseDto`, `TouchpointResponseDto` |
| Atribución | `ComputeAttributionDto` | `ComputeAttributionResponseDto` (+ `AttributionTouchDto`) |

## Campos que no se aceptan

`estimatedSize` y `clickCount` son derivados: el cliente no los envía, sólo los recibe. Lo mismo con
`version` en la plantilla, que sale de la versión anterior.

## Respuestas con conteos

`RefreshSegmentResponseDto`, `MaterializeMembersResponseDto` y `ActivateJourneyResponseDto`
devuelven `added`/`removed`, `materialized`/`skipped` y `enrolled`/`skipped`. Los conteos existen
porque estas operaciones son idempotentes: sin ellos, quien llama no distinguiría un lote que no
hizo nada de uno que sí.

## Ejemplo de solicitud

```json
POST /marketing/attribution/compute
{
  "conversionRefType": "order",
  "conversionRefId": "33333333-3333-3333-3333-333333333333",
  "memberType": "CONTACT",
  "memberRefId": "44444444-4444-4444-4444-444444444444",
  "model": "LINEAR",
  "windowFrom": "2026-06-01T00:00:00Z",
  "windowTo": "2026-07-01T00:00:00Z",
  "conversionValue": "300.00"
}
```

## Ejemplo de respuesta

```json
{
  "conversionRefType": "order",
  "conversionRefId": "33333333-3333-3333-3333-333333333333",
  "attributionModelConceptId": "…",
  "replaced": 0,
  "touches": [
    { "touchpointId": "…", "weight": "0.333333", "attributedValue": "100.00", "positionConceptId": "…" },
    { "touchpointId": "…", "weight": "0.333333", "attributedValue": "100.00", "positionConceptId": "…" },
    { "touchpointId": "…", "weight": "0.333334", "attributedValue": "100.00", "positionConceptId": "…" }
  ]
}
```

El tercer peso lleva el resto de la división para que la suma dé exactamente 1.
