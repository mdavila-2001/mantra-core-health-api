# Semántica de entrega

> Fase 12. Derivado de `src/modules/messaging/README.md` y las entidades reales del módulo.

## Garantía: al menos una vez, no exactamente una vez

No hay evidencia en el código de deduplicación end-to-end garantizada en el consumidor final. La
correctitud ante entregas duplicadas depende de que el **consumidor sea idempotente**, no de que
el sistema de mensajería garantice entrega única — patrón estándar y honesto para un sistema
outbox + polling, no una limitación oculta.

## Orden

Sin garantía de orden total entre eventos de distintos agregados. Dentro de un mismo
`aggregateId`, el orden de publicación sigue el orden de commit de las transacciones que los
originan (no hay partición/particionamiento por clave que reordene). No se verificó en esta fase
si algún consumidor depende de orden estricto — riesgo a evaluar por consumidor.

## Idempotencia en la entrega

`event_deliveries` es explícitamente **idempotente por suscripción** (`src/modules/messaging/README.md`):
una misma combinación evento+suscripción no genera dos entregas duplicadas, aunque `dispatch` se
llame más de una vez sobre el mismo evento.

## Deduplicación de jobs en cola

`POST /queues/:code/jobs` (UC-35-05) encola **con deduplicación** — el mecanismo exacto (llave de
deduplicación, ventana temporal) vive en `queued_jobs`, no detallado más allá de lo confirmado en
el README del módulo en esta fase.

## Notificaciones — debounce y consentimiento

`notification_requests` (UC-35-10) tiene tres desenlaces posibles al crearse:

| Caso | Resultado |
|---|---|
| Sin opt-in del destinatario u horas de silencio activas | `suppressed` — **se registra igual**, no se descarta silenciosamente |
| Misma `debounce key` ya viva | Se devuelve la solicitud existente, no se crea una nueva |
| Resto | `pending`, sigue el flujo normal de entrega |

Este es el único punto del sistema donde el consentimiento del destinatario (no del paciente sobre
sus datos — del destinatario sobre recibir comunicaciones) bloquea una operación antes de llegar a
intentar la entrega.

## Reconciliación de acuses del proveedor

`POST /webhooks/providers/:code/receipts` (UC-35-12) — el proveedor externo de un canal
(SMS/email/push) confirma `delivered`/`bounced` de forma asíncrona, desacoplado del `deliver`
inicial. Endpoint público (`@Public()`, ver [autenticación](../api/authentication.md)),
autenticado por firma del proveedor, no por JWT.

## Ver también

- [Visión general](overview.md), [Reintentos y cola muerta](retries-and-dlq.md).
