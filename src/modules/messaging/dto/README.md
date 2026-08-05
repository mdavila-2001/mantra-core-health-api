# DTOs de mensajería

Contratos de entrada y salida. La validación vive en `class-validator`; la documentación, en
`@nestjs/swagger`.

## Convenciones

- Los identificadores de concepto viajan como UUID. Sólo tres vocabularios viajan como literal, y son
  los que el caso de uso enumera: `EventAckOutcome` (`HANDLED`/`FAILED`), `ReceiptType`
  (`DELIVERED`/`BOUNCED`/`READ`) y `DeliveryAttemptOutcome` (`SENT`/`FAILED`).
- Las fechas de entrada son ISO-8601; las de salida, `toISOString()`.
- El coste de envío es `numeric` y viaja como cadena.

## Por caso de uso

| UC | Entrada | Salida |
| --- | --- | --- |
| 01 | `PublishDomainEventInput` (interfaz del servicio, no DTO HTTP) | `PublishDomainEventResult` |
| 02 | `RunOutboxRelayDto` | `OutboxRelayResponseDto` (+ `RelayedMessageDto`) |
| 03 | `DispatchEventDto` | `DispatchEventResponseDto` (+ `DispatchedSubscriberDto`) |
| 04 | `AckEventDeliveryDto` | `EventDeliveryResponseDto` |
| 05 | `EnqueueJobDto` | `JobResponseDto` |
| 06 | `ClaimJobsDto` | `ClaimJobsResponseDto` (+ `ClaimedJobDto`) |
| 07 | `CompleteJobDto` | `JobResponseDto` |
| 08 | `FailJobDto` | `FailJobResponseDto` |
| 09 | `RedriveDeadLetterDto` | `RedriveResponseDto` |
| 10 | `CreateNotificationRequestDto` | `NotificationRequestResponseDto` |
| 11 | `DeliverNotificationDto` | `DeliverNotificationResponseDto` |
| 12 | `ProviderReceiptDto` | `ProviderReceiptResponseDto` |
| 13 | — (sin cuerpo) | `InAppReadResponseDto` |

## Decisiones que no son obvias

- **UC-35-01 no tiene DTO HTTP**: su contrato es `PublishDomainEventInput`, una interfaz TypeScript,
  porque se llama desde código dentro de una transacción abierta. Un DTO de request implicaría que
  se puede llamar por HTTP, y entonces el evento no se confirmaría con el cambio de negocio.
- **`RunOutboxRelayDto.workerId` y `ClaimJobsDto.workerId` son obligatorios**: sin saber quién
  reserva un lote no se puede comprobar después que lo cierra el mismo.
- **`CompleteJobDto` y `FailJobDto` también lo exigen**, y el servicio lo compara contra `locked_by`.
  Es lo que evita que un worker con el lock ya expirado pise el trabajo de quien lo tomó después.
- **`ClaimedJobDto.lockExpiresAt`** le dice al worker hasta cuándo es suyo: pasado ese punto, otro
  puede reclamarlo y él debe dejar de reportar sobre él.
- **`FailJobResponseDto` devuelve `availableAt` o `deadLetterJobId`, nunca los dos**: o vuelve a la
  cola con backoff, o agotó los intentos.
- **`NotificationRequestResponseDto` distingue `suppressed` de `debounced`**: la primera es una
  decisión de privacidad y la segunda una de volumen. Colapsarlas impediría auditar la primera.
- **`DeliverNotificationDto` lleva `subject` y `bodyText`** para el canal in-app: es el único que se
  entrega escribiendo en nuestra propia tabla en vez de saliendo a un proveedor.
- **`ProviderReceiptDto.rawPayloadJson`** guarda el webhook tal como llegó: cuando un proveedor
  cambia su formato sin avisar, es lo único que permite reconstruir qué mandó.
- **`InAppReadResponseDto.alreadyRead`** distingue la primera lectura de las siguientes sin cambiar
  `readAt`.

## Pruebas

Sin suite propia: los DTOs se validan por el `ValidationPipe` global y se ejercitan desde las
pruebas de servicio y de controlador.
