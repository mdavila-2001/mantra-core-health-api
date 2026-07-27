# Repositorios de mensajería

Acceso a datos de `messaging.*`. Sin lógica de negocio: sólo lecturas, escrituras y el modo de
bloqueo que cada operación necesita.

## Reparto

| Repositorio | Tablas |
| --- | --- |
| `OutboxRepository` | `domain_events`, `outbox_messages`, `event_subscriptions`, `event_deliveries` |
| `QueuesRepository` | `message_queues`, `queued_jobs`, `dead_letter_jobs` |
| `NotificationsRepository` | canales, plantillas, preferencias, solicitudes, configuraciones de proveedor, entregas, acuses, bandeja in-app |

## Lecturas con bloqueo

| Método | Modo | Por qué |
| --- | --- | --- |
| `claimPendingOutbox` | `FOR UPDATE SKIP LOCKED` | Varios relays se llevan lotes distintos en lugar de esperarse |
| `claimReadyJobs` | `FOR UPDATE SKIP LOCKED` | Reparte la carga entre workers de cola |
| `findEventDeliveryForUpdate` | `FOR UPDATE` | El acuse cambia el estado de la entrega |
| `findJobForUpdate` | `FOR UPDATE` | Cerrar o fallar el job |
| `findRequestForUpdate` | `FOR UPDATE` | Entregar y conciliar mueven el estado de la solicitud |
| `findDeliveryByProviderRefForUpdate` | `FOR UPDATE` | El acuse del proveedor la actualiza |
| `findInAppForUpdate` | `FOR UPDATE` | Marcar leída |

`SKIP LOCKED` es la diferencia entre poder escalar añadiendo procesos y tener workers haciendo cola
detrás del mismo lote.

## Consultas que llevan semántica

- **`findOutboxByIdempotencyKey`** — es la que impide publicar dos veces el mismo hecho.
- **`findJobByDedupeKey`** — colapsa los encolados repetidos del productor; también la usa el
  despacho para no encolar dos veces el par (evento, suscripción), y el redrive para no reencolar
  dos veces la misma entrada de cola muerta.
- **`findEventDelivery(evento, suscripción)`** — hace idempotente el fan-out.
- **`claimReadyJobs`** ordena por `priority ASC, available_at ASC`: la prioridad es parte del
  contrato de la cola, no un detalle de presentación.
- **`findChannelConfigs`** ordena por `priority ASC`: la primera es la que se usa y las siguientes
  son el plan B.
- **`findLiveRequestByDebounceKey`** filtra por los estados en que la solicitud sigue viva: una ya
  fallada no debe frenar la siguiente.
- **`findDeliveryByAttempt`** y **`findReceipt`** son las dos idempotencias del camino de
  notificación: el reintento del worker y la reentrega del webhook.

## Inmutables

`createDomainEvent`, `createDeadLetterJob` y `createReceipt` sólo insertan. El evento es lo que pasó,
la entrada de cola muerta es la evidencia de que algo falló y el acuse es lo que dijo el proveedor:
los tres dejarían de servir para lo que existen si se pudieran reescribir.

## Auditoría

`createdBy(actorUserId)` en las tablas que tienen columnas de auditoría —solicitudes, entregas,
bandeja in-app—. El resto lleva sus propias marcas (`recorded_at`, `created_at`).

## Pruebas

Los repositorios no tienen suite propia; se ejercitan como dobles desde los tres servicios.
