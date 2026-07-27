# DTO de seguimiento

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`tracking.dto.ts`) porque los 11 casos de uso comparten vocabulario (sujeto, envío, hito, estado).

## Convenciones

- **Enums de dominio por código legible** (`SPECIMEN`, `IN_TRANSIT`, `CARRIER_WEBHOOK`, `TRANSFER`,
  `SIGNATURE`…); el servicio los traduce al `*_concept_id` del catálogo.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Coordenadas y distancias como cadena decimal** (`@IsNumberString`): el modelo usa `numeric`, y
  una latitud por `number` pierde precisión justo donde importa.
- **Colección anidada** (`milestones`) con `@ValidateNested({ each: true })`, `@Type` y
  `@ArrayMinSize(1)`: definir un catálogo vacío no define nada.
- **Rango acotado** en `confidencePct` (0–100) y en el tamaño del barrido (`@Max(1000)`).

## El número de seguimiento no se recibe

`OpenSubjectDto` no lo acepta: lo genera el servicio, aleatorio y opaco. Aceptarlo permitiría
elegir uno que revelara qué se transporta —o adivinar los de otros—.

`CarrierWebhookDto` sí lo recibe, porque ahí es la clave con la que el transportista identifica el
envío del que habla.

## Lo que no se acepta

- **Derivados**: `shipmentNumber`, `currentStatusConceptId`, `currentMilestoneId`,
  `priorityConceptId` y `estimatedArrivalAt` del envío se calculan y se devuelven; nunca se reciben.
- **El estado del envío directamente**: lo mueven actos concretos (despachar, entregar, marcar
  excepción, cancelar) o el mapeo del webhook.
- **La prioridad**: sube sola con la excepción y con el incumplimiento de SLA. No hay DTO que la fije.

## `externalEventId` es obligatorio en el webhook

Es lo que hace idempotente la ingesta. Sin él, cada reentrega del transportista añadiría una fila al
timeline, y los transportistas reentregan por diseño.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Sujeto | `OpenSubjectDto` | `SubjectResponseDto` |
| Hitos | `DefineMilestonesDto` (+ `MilestoneDefinitionDto`) | `MilestonesResponseDto` |
| Envío | `DispatchShipmentDto`, `RecordHandoffDto`, `RecomputeEtaDto`, `CancelShipmentDto` | `DispatchResponseDto`, `HandoffResponseDto`, `EtaResponseDto`, `CancelShipmentResponseDto` |
| Timeline | `RecordEventDto`, `CarrierWebhookDto` | `EventResponseDto`, `WebhookResponseDto` |
| Entrega | `RecordDeliveryProofDto`, `RecordExceptionDto` | `DeliveryProofResponseDto`, `ExceptionResponseDto` |
| SLA | `ScanSlaDto` | `ScanSlaResponseDto` |

## Respuestas que declaran el efecto

- `EventResponseDto.subjectClosed` — si el hito alcanzado cerró el seguimiento.
- `WebhookResponseDto.duplicate` — si el evento ya se había recibido.
- `EtaResponseDto.applied` — si la estimación pasó a ser la vigente del envío o quedó sólo en el
  histórico.

Los tres existen porque el llamador no puede deducirlos de lo que envió: dependen del estado que ya
había.

## Ejemplo de solicitud

```json
POST /tracking/webhooks/carriers/DHL
{
  "trackingNumber": "K7Q2M9XZ",
  "externalStatusCode": "OUT_FOR_DELIVERY",
  "externalEventId": "evt-88213-2026-09-01",
  "occurredAt": "2026-09-01T14:02:00Z",
  "locationText": "Centro de distribución La Paz"
}
```

## Ejemplo de respuesta

```json
{
  "eventId": "11111111-1111-1111-1111-111111111111",
  "trackableSubjectId": "22222222-2222-2222-2222-222222222222",
  "currentStatusConceptId": "…",
  "duplicate": false
}
```

`duplicate: true` con el mismo `eventId` de antes es la respuesta a una reentrega: el transportista
recibe 200 y deja de reintentar, sin que el timeline haya cambiado.
