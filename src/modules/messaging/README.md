# Módulo 35 — Mensajería (outbox, colas y notificación multicanal)

Publicación transaccional de eventos de dominio, relay y fan-out a suscriptores, colas de trabajo
con reintento y cola muerta, y notificación multicanal consciente del consentimiento con
conciliación de acuses del proveedor.

> **Este módulo es la pieza que desbloquea a los demás.** Los 17 módulos de la tanda A declaran sus
> eventos en el "Pendiente" de su README porque no había dónde publicarlos. `OutboxService` es esa
> API: ver *Cómo lo usa un módulo de negocio*, más abajo.

## Casos de uso cubiertos (13)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-35-01 | *(interno)* `OutboxService.publishDomainEvent()` | Publicar evento de dominio vía outbox |
| UC-35-02 | `POST /internal/outbox/relay/run` | Reclamar y publicar mensajes (relay) |
| UC-35-03 | `POST /internal/events/:domainEventId/dispatch` | Despachar a suscriptores |
| UC-35-04 | `POST /internal/event-deliveries/:id/ack` | Acuse de entrega del consumidor |
| UC-35-05 | `POST /queues/:code/jobs` | Encolar job con deduplicación |
| UC-35-06 | `POST /internal/queues/:code/claim` | Reclamar jobs (`SKIP LOCKED`) |
| UC-35-07 | `POST /internal/jobs/:id/complete` | Completar job y liberar lock |
| UC-35-08 | `POST /internal/jobs/:id/fail` | Reintento con backoff o cola muerta |
| UC-35-09 | `POST /queues/dead-letter/:deadLetterJobId/redrive` | Reencolar desde cola muerta |
| UC-35-10 | `POST /notifications/requests` | Solicitud consciente del consentimiento |
| UC-35-11 | `POST /internal/notifications/:requestId/deliver` | Entrega multicanal |
| UC-35-12 | `POST /webhooks/providers/:providerCode/receipts` | Conciliar acuse del proveedor |
| UC-35-13 | `POST /notifications/in-app/:id/read` | Marcar in-app como leída |

UC-35-01 **no tiene endpoint**: el caso de uso lo declara "(interno, misma tx del cambio de
negocio)". Exponerlo por HTTP rompería justo lo que lo hace útil — el evento tiene que confirmarse
dentro de la transacción de quien lo produce, no en una llamada aparte.

## Cómo lo usa un módulo de negocio

`MessagingModule` **exporta `OutboxService`**. `publishDomainEvent()` recibe el `EntityManager` de
quien tiene la transacción abierta y se enlista en ella:

```ts
// en el módulo de negocio
constructor(private readonly outbox: OutboxService) {}

return this.em.transactional(async (tx) => {
  const pedido = this.repo.crearPedido(tx, dto);

  await this.outbox.publishDomainEvent(tx, {
    eventType: 'OrderPlaced',
    aggregateType: 'orders',
    aggregateId: pedido.id,
    payloadJson: { total: dto.total },
  });

  return { id: pedido.id };
});
```

El cambio y el hecho que lo describe se confirman juntos, o no se confirma ninguno. Si el servicio
abriera su propia transacción, un fallo posterior dejaría publicado un evento sobre algo que nunca
ocurrió — que es exactamente el problema que el patrón outbox existe para evitar.

## Entidades

Escritas: `domain_events` (inmutable), `outbox_messages`, `event_deliveries`, `queued_jobs`,
`dead_letter_jobs` (append-only), `notification_requests`, `notification_deliveries`,
`delivery_receipts` (append-only), `in_app_notifications`.

Sólo leídas: `event_subscriptions`, `message_queues`, `message_channels`, `message_templates`,
`recipient_preferences`, `messaging_providers`, `provider_channel_configs`.

Del esquema pero fuera de los 13 casos de uso —son del adaptador de proveedores, que tiene sus
propios UC—: `adapter_event_mappings`, `adapter_inbound_events`, `adapter_tracking_capabilities`,
`delivery_tracking_events`, `delivery_status_transitions`, `delivery_reconciliation_runs`.

## Flujo general

```
transacción de negocio
  └─ publishDomainEvent(tx, ...) ──> domain_events + outbox_messages (pending)
                                     ambos COMMIT con el cambio de negocio

/internal/outbox/relay/run  [FOR UPDATE SKIP LOCKED]
  ├─ publica ─────────> outbox published
  └─ agotó intentos ──> outbox failed

/internal/events/:id/dispatch
  └─ por cada suscripción activa que casa con el filtro
       ├─ event_deliveries (dispatched)   [idempotente por suscripción]
       └─ si el modo es cola: queued_jobs (ready)

/internal/queues/:code/claim  [SKIP LOCKED + visibility timeout]
  └─ jobs running, reservados para el worker
       ├─ /complete ──> succeeded
       └─ /fail ──────> ready con backoff, o dead_letter_jobs al agotar
                           └─ /redrive ──> job nuevo (la evidencia se conserva)

/notifications/requests
  ├─ sin opt-in u horas de silencio ──> suppressed (se registra igual)
  ├─ misma debounce key viva ─────────> se devuelve la existente
  └─ resto ───────────────────────────> pending
       └─ /internal/notifications/:id/deliver ──> notification_deliveries + in-app si aplica
            └─ /webhooks/providers/:code/receipts ──> delivered | bounced
```

## Reglas de negocio

- **Nunca se llama a un sistema externo dentro de la transacción de negocio.** Es la razón de ser del
  módulo entero: se escribe el hecho, se confirma con el cambio, y entregarlo es problema de otro
  proceso y de otro momento.
- **La clave de idempotencia corta el duplicado en el origen**, no en cada consumidor. Se deriva del
  contenido del evento si el llamante no la declara, así que dos publicaciones del mismo hecho
  producen la misma clave.
- **`SKIP LOCKED` en relay y en cola**: varios workers corren a la vez llevándose lotes distintos en
  lugar de esperarse. Es lo que hace que escalar sea añadir procesos.
- **`lock_expires_at` recupera el trabajo de un worker caído.** Y por eso mismo, **sólo cierra el job
  quien lo tiene reservado**: si el lock expiró y otro lo tomó, el primero llega tarde y no debe
  pisar trabajo ajeno.
- **Entrega al menos una vez**, en el outbox y en las colas. El handler tiene que ser idempotente por
  su clave: garantizar "exactamente una vez" exigiría una transacción distribuida con el destino,
  que es justo lo que este diseño evita.
- **El fan-out es idempotente por suscripción**: reintentar el despacho no crea una segunda entrega.
- **Agotar los intentos es terminal.** Sin estado terminal el relay reintentaría el mismo mensaje
  para siempre; en las colas, la evidencia va a cola muerta y ahí espera a que alguien arregle la
  causa.
- **La entrada de cola muerta no se borra al reencolar**: aquello falló, y sigue siendo cierto aunque
  el reintento ahora funcione.
- **Sin consentimiento u opt-in la notificación se registra como suprimida, no se omite.** Dejar de
  escribir la fila haría imposible demostrar después que se respetó la preferencia del destinatario.
- **La clave de rebote colapsa las repetidas conservando la que ya existe**, en lugar de crear una
  segunda.
- **Los acuses del proveedor son idempotentes por (entrega, tipo)**: los proveedores reentregan sus
  webhooks, y contar dos veces el mismo rebote falsearía la entregabilidad.
- **Sólo el rebote es terminal en la solicitud**: que la lean es información añadida, no un cambio en
  si llegó o no.
- **Marcar leído conserva la primera lectura**: cuándo se enteró el usuario es un dato, y repisarlo
  con cada apertura lo perdería.

## Vocabularios: qué se define aquí y qué no

Sólo los ciclos de vida que el caso de uso enumera: estado del outbox, de la entrega de eventos, del
job, de la solicitud, del intento de entrega, del acuse y de la bandeja in-app. Tipo de canal, tipo
de proveedor, categoría, idioma y moneda son catálogos abiertos y llegan como `*ConceptId`.

`OUTBOX_FAILED` es la única adición sobre lo enumerado: el caso de uso no la nombra, pero la columna
`max_attempts` existe y sin estado terminal el relay no pararía nunca. Está documentada como tal en
`concepts.ts`.

## Permisos

`MESSAGING_ADMIN` cubre el módulo. `SYSTEM` —los workers— opera el relay, el despacho, el reclamo de
jobs y la entrega de notificaciones. `USER` marca sus propias notificaciones como leídas.

`POST /webhooks/providers/:providerCode/receipts` es **la única ruta pública**: quien llama es un
proveedor externo sin sesión.

## Concurrencia

`FOR UPDATE SKIP LOCKED` en el reclamo del outbox y de la cola. `FOR UPDATE` sobre la entrega de
eventos al acusarla, sobre el job al cerrarlo o fallarlo, sobre la solicitud al entregarla y sobre la
entrega al conciliar su acuse. La reserva por worker (`locked_by` + `lock_expires_at`) es lo que
evita que dos workers cierren el mismo trabajo.

## Logs

`operation: 'messaging.<área>.<acción>'`. Nivel `warn` ante mensaje de outbox agotado, entrega de
evento fallida, cola destino inactiva, job en cola muerta, redrive manual, notificación suprimida,
intento de entrega fallido y rebote del proveedor. No se loguea el contenido de las notificaciones.

## Pruebas

`yarn test --testPathPatterns=modules/messaging` — 83 pruebas (70 de servicio + 13 de delegación de
los tres controladores).

## Pendiente

- **Bucle del worker**: los endpoints `/internal/*` son el contrato; el proceso que los llama en
  bucle (relay, workers de cola, worker de notificaciones) es despliegue, no API.
- **Llamada real al proveedor**: el worker la hace fuera de la transacción y aquí sólo se asienta el
  resultado. Elegir el proveedor por `rate_limit_per_min` y rotar a la siguiente configuración por
  prioridad vive en el worker.
- **Verificación de firma del webhook**: la ruta es pública y hoy sólo comprueba que el proveedor
  exista. El HMAC corresponde al conector de integraciones (módulo 12), que guarda el secreto.
- **Evaluación del consentimiento**: se guarda la referencia a la directiva (`consent_id`); evaluarla
  vive en `consent` y leerla desde aquí cruzaría la frontera del esquema. Las horas de silencio y el
  opt-in sí se evalúan, porque son tablas nuestras.
- **Idempotencia en Redis** (`redis_runtime.idempotency_entries`,
  `distributed_lock_entries`): aquí está resuelta en tabla —clave de idempotencia, clave de
  deduplicación, reserva por worker—; la capa en Redis llegará con el módulo 54.
- **Adaptador de proveedores**: `adapter_*`, `delivery_tracking_events` y
  `delivery_reconciliation_runs` tienen sus propios casos de uso, fuera de estos 13.
- **Proyecciones**: `read_models.event_log_v`, `event_delivery_v`, `job_status_v`,
  `notification_inbox_v`, `delivery_status_v` y las series de `time_series` las alimentará el propio
  outbox una vez haya consumidores registrados.
