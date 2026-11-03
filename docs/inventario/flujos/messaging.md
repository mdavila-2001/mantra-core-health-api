<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `messaging`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 21 (18 con decisiones propias, 3 sin ellas)
- Inventario de endpoints del módulo: [messaging](../endpoints/messaging.md)

## Proceso: Módulo 35 — Mensajería (outbox, colas y notificación multicanal)

- **Código:** `messaging` · **Agrupación:** MIXTO · **Operaciones:** 21
- **Actores:** Cualquier sesión válida · MESSAGING_ADMIN · Público (sin sesión) · SYSTEM · USER
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/messaging/README.md`

### Para qué sirve

Publicación transaccional de eventos de dominio, relay y fan-out a suscriptores, colas de trabajo con reintento y cola muerta, y notificación multicanal consciente del consentimiento con conciliación de acuses del proveedor.

_Fuente: `src/modules/messaging/README.md:3`_

### Flujo general declarado en el README

```text
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

_Fuente: `src/modules/messaging/README.md:109`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-35-02` | Reclamar y publicar mensajes (relay) | POST /internal/outbox/relay/run | SYSTEM · MESSAGING_ADMIN | MEDIO | 2 |
| `UC-35-03` | Despachar a suscriptores | POST /internal/events/{domainEventId}/dispatch | SYSTEM · MESSAGING_ADMIN | MEDIO | 8 |
| `UC-35-04` | Acuse de entrega del consumidor | POST /internal/event-deliveries/{id}/ack | SYSTEM · MESSAGING_ADMIN | MEDIO | 2 |
| `UC-35-05` | Encolar job con deduplicación | POST /queues/{code}/jobs | SYSTEM · MESSAGING_ADMIN | MEDIO | 3 |
| `UC-35-06` | Reclamar jobs (SKIP LOCKED) | POST /internal/queues/{code}/claim | SYSTEM · MESSAGING_ADMIN | BAJO | 2 |
| `UC-35-07` | Completar job y liberar lock | POST /internal/jobs/{id}/complete | SYSTEM · MESSAGING_ADMIN | MEDIO | 2 |
| `UC-35-08` | Reintento con backoff o cola muerta | POST /internal/jobs/{id}/fail | SYSTEM · MESSAGING_ADMIN | MEDIO | 4 |
| `UC-35-09` | Reencolar desde cola muerta | POST /queues/dead-letter/{deadLetterJobId}/redrive | MESSAGING_ADMIN | MEDIO | 4 |
| `UC-35-10` | Solicitud consciente del consentimiento | POST /notifications/requests | SYSTEM · MESSAGING_ADMIN | MEDIO | 5 |
| `UC-35-11` | Entrega multicanal | POST /internal/notifications/{requestId}/deliver | SYSTEM · MESSAGING_ADMIN | MEDIO | 10 |
| `UC-35-12` | Conciliar acuse del proveedor | POST /webhooks/providers/{providerCode}/receipts | Público (sin sesión) | ALTO | 7 |
| `UC-35-13` | Marcar in-app como leída | POST /notifications/in-app/{id}/read | USER · MESSAGING_ADMIN | MEDIO | 2 |
| `ctrl:MessagingController` | Operaciones de MessagingController que el README no asigna a un caso de uso | POST /notifications/in-app/read-all | USER · MESSAGING_ADMIN | MEDIO | 2 |
|  |  | GET /notifications/me | USER · MESSAGING_ADMIN | BAJO | 1 |
|  |  | GET /notifications/preferences/me | USER · MESSAGING_ADMIN | BAJO | 2 |
|  |  | PUT /notifications/preferences/me | USER · MESSAGING_ADMIN | MEDIO | 3 |
| `ctrl:MessagingInternalController` | Operaciones de MessagingInternalController que el README no asigna a un caso de uso | GET /internal/notifications/pending | SYSTEM · MESSAGING_ADMIN | MEDIO | 3 |
| `ctrl:WebPushController` | Operaciones de WebPushController que el README no asigna a un caso de uso | DESCONOCIDO /notifications/web-push | Cualquier sesión válida | BAJO | 0 |
|  |  | GET /notifications/web-push/config | USER · MESSAGING_ADMIN | BAJO | 0 |
|  |  | DELETE /notifications/web-push/subscription | USER · MESSAGING_ADMIN | MEDIO | 2 |
|  |  | PUT /notifications/web-push/subscription | USER · MESSAGING_ADMIN | MEDIO | 3 |

### Diagrama 1 de 2 — etapas `UC-35-02`, `UC-35-03`, `UC-35-04`…

```mermaid
flowchart LR
  a2(["SYSTEM · MESSAGING_ADMIN"]):::actor
  a18(["MESSAGING_ADMIN"]):::actor
  a31(["Público (sin sesión)"]):::actor
  a35(["USER · MESSAGING_ADMIN"]):::actor
  t3[("messaging.outbox_messages")]:::tabla
  t5[("messaging.domain_events")]:::tabla
  t6[("messaging.event_deliveries")]:::tabla
  t7[("messaging.event_subscriptions")]:::tabla
  t8[("messaging.message_queues")]:::tabla
  t12[("messaging.queued_jobs")]:::tabla
  t16[("messaging.dead_letter_jobs")]:::tabla
  t20[("messaging.message_channels")]:::tabla
  t21[("messaging.message_templates")]:::tabla
  t22[("messaging.notification_requests")]:::tabla
  t23[("messaging.recipient_preferences")]:::tabla
  t25[("iam.devices")]:::tabla
  t26[("messaging.in_app_notifications")]:::tabla
  t27[("messaging.messaging_providers")]:::tabla
  t28[("messaging.notification_deliveries")]:::tabla
  t32[("messaging.delivery_receipts")]:::tabla
  subgraph s0["UC-35-02 · Reclamar y publicar mensajes (relay)"]
    o1["POST /internal/outbox/relay/run"]:::op
  end
  t9[("+2 tablas más")]
  subgraph s1["UC-35-03 · Despachar a suscriptores"]
    o4["POST /internal/events/{domainEventId}/dispatch"]:::op
  end
  subgraph s2["UC-35-04 · Acuse de entrega del consumidor"]
    o10["POST /internal/event-deliveries/{id}/ack"]:::op
  end
  subgraph s3["UC-35-05 · Encolar job con deduplicación"]
    o11["POST /queues/{code}/jobs"]:::op
  end
  subgraph s4["UC-35-06 · Reclamar jobs (SKIP LOCKED)"]
    o13["POST /internal/queues/{code}/claim"]:::op
  end
  subgraph s5["UC-35-07 · Completar job y liberar lock"]
    o14["POST /internal/jobs/{id}/complete"]:::op
  end
  subgraph s6["UC-35-08 · Reintento con backoff o cola muerta"]
    o15["POST /internal/jobs/{id}/fail"]:::op
  end
  subgraph s7["UC-35-09 · Reencolar desde cola muerta"]
    o17["POST /queues/dead-letter/{deadLetterJobId}/redrive"]:::op
  end
  subgraph s8["UC-35-10 · Solicitud consciente del consentimiento"]
    o19["POST /notifications/requests"]:::op
  end
  t29[("+4 tablas más")]
  subgraph s9["UC-35-11 · Entrega multicanal"]
    o24["POST /internal/notifications/{requestId}/deliver"]:::op
  end
  t33[("+1 tablas más")]
  subgraph s10["UC-35-12 · Conciliar acuse del proveedor"]
    o30["POST /webhooks/providers/{providerCode}/receipts"]:::op
  end
  subgraph s11["UC-35-13 · Marcar in-app como leída"]
    o34["POST /notifications/in-app/{id}/read"]:::op
  end
  subgraph s12["ctrl:MessagingController · Operaciones de MessagingController que el README no…"]
    o36["POST /notifications/in-app/read-all"]:::op
    o37["GET /notifications/me"]:::op
    o38["GET /notifications/preferences/me"]:::op
    o39["PUT /notifications/preferences/me"]:::op
  end
  subgraph s13["ctrl:MessagingInternalController · Operaciones de MessagingInternalController q…"]
    o40["GET /internal/notifications/pending"]:::op
  end
  a2 --> o1
  o1 -->|"ACTUALIZA"| t3
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"LEE"| t5
  o4 -->|"CREA"| t6
  o4 -->|"LEE"| t6
  o4 -->|"LEE"| t7
  o4 -->|"LEE"| t8
  o4 -->|"LEE"| t3
  o4 -.-> t9
  a2 --> o10
  o10 -->|"ACTUALIZA"| t6
  o10 -->|"LEE"| t6
  a2 --> o11
  o11 -->|"LEE"| t8
  o11 -->|"CREA"| t12
  o11 -->|"LEE"| t12
  a2 --> o13
  o13 -->|"LEE"| t8
  o13 -->|"LEE"| t12
  a2 --> o14
  o14 -->|"ACTUALIZA"| t12
  o14 -->|"LEE"| t12
  a2 --> o15
  o15 -->|"CREA"| t16
  o15 -->|"LEE"| t8
  o15 -->|"ACTUALIZA"| t12
  o15 -->|"LEE"| t12
  a18 --> o17
  o17 -->|"LEE"| t16
  o17 -->|"LEE"| t8
  o17 -->|"CREA"| t12
  o17 -->|"LEE"| t12
  a2 --> o19
  o19 -->|"LEE"| t20
  o19 -->|"LEE"| t21
  o19 -->|"CREA"| t22
  o19 -->|"LEE"| t22
  o19 -->|"LEE"| t23
  a2 --> o24
  o24 -->|"ACTUALIZA"| t25
  o24 -->|"LEE"| t25
  o24 -->|"CREA"| t26
  o24 -->|"LEE"| t20
  o24 -->|"LEE"| t27
  o24 -->|"CREA"| t28
  o24 -.-> t29
  a31 --> o30
  o30 -->|"CREA"| t32
  o30 -->|"LEE"| t32
  o30 -->|"LEE"| t27
  o30 -->|"ACTUALIZA"| t28
  o30 -->|"LEE"| t28
  o30 -->|"ACTUALIZA"| t22
  o30 -.-> t33
  a35 --> o34
  o34 -->|"ACTUALIZA"| t26
  o34 -->|"LEE"| t26
  a35 --> o36
  o36 -->|"ACTUALIZA"| t26
  o36 -->|"LEE"| t26
  a35 --> o37
  o37 -->|"LEE"| t26
  a35 --> o38
  o38 -->|"LEE"| t20
  o38 -->|"LEE"| t23
  a35 --> o39
  o39 -->|"LEE"| t20
  o39 -->|"CREA"| t23
  o39 -->|"LEE"| t23
  a2 --> o40
  o40 -->|"LEE"| t20
  o40 -->|"ACTUALIZA"| t22
  o40 -->|"LEE"| t22
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:WebPushController`

```mermaid
flowchart LR
  a2(["Cualquier sesión válida"]):::actor
  a4(["USER · MESSAGING_ADMIN"]):::actor
  t6[("iam.devices")]:::tabla
  subgraph s0["ctrl:WebPushController · Operaciones de WebPushController que el README no asig…"]
    o1["DESCONOCIDO /notifications/web-push"]:::op
    o3["GET /notifications/web-push/config"]:::op
    o5["DELETE /notifications/web-push/subscription"]:::op
    o7["PUT /notifications/web-push/subscription"]:::op
  end
  a2 --> o1
  a4 --> o3
  a4 --> o5
  o5 -->|"ACTUALIZA"| t6
  o5 -->|"LEE"| t6
  a4 --> o7
  o7 -->|"ACTUALIZA"| t6
  o7 -->|"CREA"| t6
  o7 -->|"LEE"| t6
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /internal/event-deliveries/{id}/ack

Registrar el acuse del consumidor sobre una entrega

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entrega no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un acuse fallido debe declarar qué falló; PreconditionFailedException: La entrega ya está resuelta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OutboxService.ackDelivery"]:::llamada
  n2 --> n3
  n4{"dto.outcome === 'FAILED' && !dto.errorText"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED Un acuse fallido debe declarar qué falló"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a OutboxRepository.findEventDeliveryForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE messaging.event_deliveries")]:::efecto
  n7 --> n8
  n9{"!delivery"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Entrega no encontrada"]):::error
  n9 -->|"sí"| n10
  n11{"delivery.statusConceptId !== CONCEPTS.EVENT_DELIVERY_DISPATCHED && delivery.statusConceptId !== CONCEPTS.EVEN…"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La entrega ya está resuelta"]):::error
  n11 -->|"sí"| n12
  n13[("ACTUALIZA messaging.event_deliveries · ACTUALIZA messaging.event_deliveries · ACTUALIZA messaging.event_deliv…")]:::efecto
  n11 -->|"no"| n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /internal/events/{domainEventId}/dispatch

Repartir el evento entre sus suscriptores

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Evento de dominio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El evento todavía no está publicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a OutboxService.dispatchEvent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OutboxRepository.findDomainEventById"]:::llamada
  n4 --> n5
  n6[("LEE messaging.domain_events")]:::efecto
  n5 --> n6
  n7{"!event"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Evento de dominio no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OutboxRepository.findOutboxByDomainEvent"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE messaging.outbox_messages")]:::efecto
  n9 --> n10
  n11{"!outbox || outbox.statusConceptId !== CONCEPTS.OUTBOX_PUBLISHED"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED El evento todavía no está publicado"]):::error
  n11 -->|"sí"| n12
  n13["Llama a MessagingTraceService.runInConsumerSpan"]:::llamada
  n11 -->|"no"| n13
  n14["Transacción: startActiveSpan(…)"]:::transaccion
  n13 --> n14
  n15["Intenta"]:::intento
  n14 --> n15
  n16(["↩ (relanza el error capturado)"]):::error
  n15 -->|"si falla"| n16
  n17(("200 Responde con éxito")):::ok
  n15 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /internal/jobs/{id}/complete

Cerrar el trabajo con éxito

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Trabajo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Storage intent requires its lifecycle coordinator; PreconditionFailedException: El trabajo no está en ejecución; PreconditionFailedException: El trabajo está reservado por otro worker |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QueuesService.completeJob"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QueuesRepository.findJobForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE messaging.queued_jobs")]:::efecto
  n5 --> n6
  n7{"!job"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Trabajo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QueuesService.assertGenericJob"]:::llamada
  n7 -->|"no"| n9
  n10{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n9 --> n10
  n11(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n10 -->|"sí"| n11
  n12{"job.statusConceptId !== CONCEPTS.JOB_RUNNING"}:::decision
  n10 -->|"no"| n12
  n13(["422 PRECONDITION_FAILED El trabajo no está en ejecución"]):::error
  n12 -->|"sí"| n13
  n14{"job.lockedBy !== dto.workerId"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED El trabajo está reservado por otro worker"]):::error
  n14 -->|"sí"| n15
  n16[("ACTUALIZA messaging.queued_jobs · ACTUALIZA messaging.queued_jobs · ACTUALIZA messaging.queued_jobs · ACTUALI…")]:::efecto
  n14 -->|"no"| n16
  n17(("200 Responde con éxito")):::ok
  n16 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /internal/jobs/{id}/fail

Registrar el fallo del trabajo

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Trabajo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Storage intent requires its lifecycle coordinator; PreconditionFailedException: El trabajo no está en ejecución; PreconditionFailedException: El trabajo está reservado por otro worker |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QueuesService.failJob"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QueuesRepository.findJobForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE messaging.queued_jobs")]:::efecto
  n5 --> n6
  n7{"!job"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Trabajo no encontrado"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QueuesService.assertGenericJob"]:::llamada
  n7 -->|"no"| n9
  n10{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n9 --> n10
  n11(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n10 -->|"sí"| n11
  n12{"job.statusConceptId !== CONCEPTS.JOB_RUNNING"}:::decision
  n10 -->|"no"| n12
  n13(["422 PRECONDITION_FAILED El trabajo no está en ejecución"]):::error
  n12 -->|"sí"| n13
  n14{"job.lockedBy !== dto.workerId"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED El trabajo está reservado por otro worker"]):::error
  n14 -->|"sí"| n15
  n16[("ACTUALIZA messaging.queued_jobs · ACTUALIZA messaging.queued_jobs · ACTUALIZA messaging.queued_jobs")]:::efecto
  n14 -->|"no"| n16
  n17{"attempts ‹ maxAttempts"}:::decision
  n16 --> n17
  n18[("ACTUALIZA messaging.queued_jobs · ACTUALIZA messaging.queued_jobs")]:::efecto
  n17 -->|"sí"| n18
  n19[("ACTUALIZA messaging.queued_jobs")]:::efecto
  n18 --> n19
  n17 -->|"no"| n19
  n20["Llama a QueuesRepository.createDeadLetterJob"]:::llamada
  n19 --> n20
  n21[("CREA messaging.dead_letter_jobs")]:::efecto
  n20 --> n21
  n22["Llama a QueuesService.deadLetterQueueId"]:::llamada
  n21 --> n22
  n23["Llama a QueuesRepository.findQueueById"]:::llamada
  n22 --> n23
  n24[("LEE messaging.message_queues")]:::efecto
  n23 --> n24
  n25(("200 Responde con éxito")):::ok
  n24 --> n25
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /internal/notifications/{requestId}/deliver

Registrar el intento de entrega ante el proveedor

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de notificación no encontrada; ResourceNotFoundException: El proveedor configurado para el canal no existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación está suprimida; PreconditionFailedException: La notificación ya no admite intentos; PreconditionFailedException: El canal no tiene configuración de proveedor activa; PreconditionFailedException: Una notificación in-app necesita destinatario interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.deliverNotification"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a NotificationsRepository.findRequestForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE messaging.notification_requests")]:::efecto
  n5 --> n6
  n7{"!request"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Solicitud de notificación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"request.statusConceptId === CONCEPTS.NOTIF_SUPPRESSED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La notificación está suprimida"]):::error
  n9 -->|"sí"| n10
  n11{"request.statusConceptId !== CONCEPTS.NOTIF_PENDING && request.statusConceptId !== CONCEPTS.NOTIF_SENDING"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED La notificación ya no admite intentos"]):::error
  n11 -->|"sí"| n12
  n13["Llama a NotificationsRepository.findChannelConfigs"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE messaging.provider_channel_configs")]:::efecto
  n13 --> n14
  n15{"!config"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El canal no tiene configuración de proveedor activa"]):::error
  n15 -->|"sí"| n16
  n17["Llama a NotificationsRepository.countDeliveries"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE messaging.notification_deliveries")]:::efecto
  n17 --> n18
  n19["Llama a NotificationsRepository.findDeliveryByAttempt"]:::llamada
  n18 --> n19
  n20[("LEE messaging.notification_deliveries")]:::efecto
  n19 --> n20
  n21["Llama a NotificationsRepository.findProviderById"]:::llamada
  n20 --> n21
  n22[("LEE messaging.messaging_providers")]:::efecto
  n21 --> n22
  n23{"!provider"}:::decision
  n22 --> n23
  n24(["404 NOT_FOUND El proveedor configurado para el canal no existe"]):::error
  n23 -->|"sí"| n24
  n25["Llama a NotificationsRepository.createDelivery"]:::llamada
  n23 -->|"no"| n25
  n26[("CREA messaging.notification_deliveries")]:::efecto
  n25 --> n26
  n27["Llama a NotificationsRepository.findChannelById"]:::llamada
  n26 --> n27
  n28[("LEE messaging.message_channels")]:::efecto
  n27 --> n28
  n29{"sent && channel?.channelTypeConceptId === CONCEPTS.CHANNEL_TYPE_IN_APP"}:::decision
  n28 --> n29
  n30{"!request.recipientUserId"}:::decision
  n29 -->|"sí"| n30
  n31(["422 PRECONDITION_FAILED Una notificación in-app necesita destinatario interno"]):::error
  n30 -->|"sí"| n31
  n32["Llama a NotificationsRepository.createInAppNotification"]:::llamada
  n30 -->|"no"| n32
  n33[("CREA messaging.in_app_notifications")]:::efecto
  n32 --> n33
  n34[("ACTUALIZA messaging.notification_requests")]:::efecto
  n33 --> n34
  n29 -->|"no"| n34
  n35["Llama a WebPushService.pushToUser"]:::llamada
  n34 --> n35
  n36["Intenta"]:::intento
  n35 --> n36
  n37[("LEE iam.devices")]:::efecto
  n36 --> n37
  n38["Repite: por cada const device de devices"]:::bucle
  n37 --> n38
  n39["Llama a WebPushService.sendTo"]:::llamada
  n38 -->|"cada elemento"| n39
  n40["Intenta"]:::intento
  n39 --> n40
  n41{"status !== undefined && GONE_STATUS_CODES.includes(status)"}:::decision
  n40 -->|"si falla"| n41
  n42["Llama a WebPushService.forget"]:::llamada
  n41 -->|"sí"| n42
  n43["Transacción: transactional(…)"]:::transaccion
  n42 --> n43
  n44[("LEE iam.devices · ACTUALIZA iam.devices")]:::efecto
  n43 --> n44
  n45{"device"}:::decision
  n44 --> n45
  n46[("ACTUALIZA iam.devices")]:::efecto
  n45 -->|"sí"| n46
  n47{"pushTarget"}:::decision
  n40 --> n47
  n46 --> n47
  n45 -->|"no"| n47
  n41 -->|"no"| n47
  n38 -->|"al terminar"| n47
  n48["Llama a WebPushService.pushToUser"]:::llamada
  n47 -->|"sí"| n48
  n49["Intenta"]:::intento
  n48 --> n49
  n50[("LEE iam.devices")]:::efecto
  n49 --> n50
  n51["Repite: por cada const device de devices"]:::bucle
  n50 --> n51
  n52["Llama a WebPushService.sendTo"]:::llamada
  n51 -->|"cada elemento"| n52
  n53["Intenta"]:::intento
  n52 --> n53
  n54{"status !== undefined && GONE_STATUS_CODES.includes(status)"}:::decision
  n53 -->|"si falla"| n54
  n55["Llama a WebPushService.forget"]:::llamada
  n54 -->|"sí"| n55
  n56["Transacción: transactional(…)"]:::transaccion
  n55 --> n56
  n57[("LEE iam.devices · ACTUALIZA iam.devices")]:::efecto
  n56 --> n57
  n58{"device"}:::decision
  n57 --> n58
  n59[("ACTUALIZA iam.devices")]:::efecto
  n58 -->|"sí"| n59
  n60(("201 Responde con éxito")):::ok
  n53 --> n60
  n59 --> n60
  n58 -->|"no"| n60
  n54 -->|"no"| n60
  n51 -->|"al terminar"| n60
  n47 -->|"no"| n60
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. GET /internal/notifications/pending

Listar solicitudes de notificación listas para entregar

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de consulta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.listDeliverable"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a NotificationsRepository.findClaimableRequests"]:::llamada
  n4 --> n5
  n6[("LEE messaging.notification_requests")]:::efecto
  n5 --> n6
  n7["Repite: por cada const request de requests"]:::bucle
  n6 --> n7
  n8[("ACTUALIZA messaging.notification_requests")]:::efecto
  n7 -->|"cada elemento"| n8
  n9["Repite: por cada const channelId de new Set(requests.map((r) =› r.channelId))"]:::bucle
  n8 --> n9
  n7 -->|"al terminar"| n9
  n10["Llama a NotificationsRepository.findChannelById"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE messaging.message_channels")]:::efecto
  n10 --> n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  n9 -->|"al terminar"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /internal/outbox/relay/run

Reclamar y publicar un lote del outbox

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a OutboxService.runRelay"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OutboxRepository.claimPendingOutbox"]:::llamada
  n4 --> n5
  n6[("LEE messaging.outbox_messages")]:::efecto
  n5 --> n6
  n7["Repite: por cada const message de claimed"]:::bucle
  n6 --> n7
  n8[("ACTUALIZA messaging.outbox_messages · ACTUALIZA messaging.outbox_messages · ACTUALIZA messaging.outbox_messag…")]:::efecto
  n7 -->|"cada elemento"| n8
  n9{"attempts › (message.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)"}:::decision
  n8 --> n9
  n10[("ACTUALIZA messaging.outbox_messages · ACTUALIZA messaging.outbox_messages · ACTUALIZA messaging.outbox_messag…")]:::efecto
  n9 -->|"sí"| n10
  n11[("ACTUALIZA messaging.outbox_messages · ACTUALIZA messaging.outbox_messages · ACTUALIZA messaging.outbox_messag…")]:::efecto
  n9 -->|"no"| n11
  n12(("200 Responde con éxito")):::ok
  n10 --> n12
  n11 --> n12
  n7 -->|"al terminar"| n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /internal/queues/{code}/claim

Reclamar un lote de trabajos de la cola

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cola no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cola no está activa; PreconditionFailedException: Storage intent requires its lifecycle coordinator |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QueuesService.claimJobs"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QueuesRepository.findQueueByCode"]:::llamada
  n4 --> n5
  n6[("LEE messaging.message_queues")]:::efecto
  n5 --> n6
  n7{"!queue"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Cola no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"queue.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La cola no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a QueuesRepository.claimReadyJobs"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE messaging.queued_jobs")]:::efecto
  n11 --> n12
  n13["Repite: map(…)"]:::bucle
  n12 --> n13
  n14["Llama a QueuesService.assertGenericJob"]:::llamada
  n13 -->|"cada elemento"| n14
  n15{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n14 --> n15
  n16(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n15 -->|"sí"| n16
  n17(("200 Responde con éxito")):::ok
  n15 -->|"no"| n17
  n13 -->|"al terminar"| n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /notifications/in-app/{id}/read

Marcar una notificación in-app como leída

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Notificación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación es de otro destinatario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.markInAppRead"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a NotificationsRepository.findInAppForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE messaging.in_app_notifications")]:::efecto
  n5 --> n6
  n7{"!notification"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Notificación no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"notification.recipientUserId !== actor.id"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La notificación es de otro destinatario"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA messaging.in_app_notifications · ACTUALIZA messaging.in_app_notifications · ACTUALIZA messaging.in_…")]:::efecto
  n9 -->|"no"| n11
  n12(("200 Responde con éxito")):::ok
  n11 --> n12
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /notifications/in-app/read-all

Marcar toda mi bandeja como leída

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.markAllInAppRead"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a NotificationsRepository.findUnreadInApp"]:::llamada
  n4 --> n5
  n6[("LEE messaging.in_app_notifications")]:::efecto
  n5 --> n6
  n7["Repite: por cada const notification de pending"]:::bucle
  n6 --> n7
  n8[("ACTUALIZA messaging.in_app_notifications · ACTUALIZA messaging.in_app_notifications · ACTUALIZA messaging.in_…")]:::efecto
  n7 -->|"cada elemento"| n8
  n9["Llama a NotificationsRepository.countUnreadInApp"]:::llamada
  n8 --> n9
  n7 -->|"al terminar"| n9
  n10[("LEE messaging.in_app_notifications")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. GET /notifications/preferences/me

Mis preferencias de notificación in-app

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay canal in-app activo: falta correr el seed de mensajería |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.readMyPreferences"]:::llamada
  n2 --> n3
  n4["Llama a NotificationsRepository.findActiveChannelByType"]:::llamada
  n3 --> n4
  n5[("LEE messaging.message_channels")]:::efecto
  n4 --> n5
  n6{"!channel"}:::decision
  n5 --> n6
  n7(["422 PRECONDITION_FAILED No hay canal in-app activo: falta correr el seed de mensajería"]):::error
  n6 -->|"sí"| n7
  n8["Llama a NotificationsRepository.findPreferences"]:::llamada
  n6 -->|"no"| n8
  n9[("LEE messaging.recipient_preferences")]:::efecto
  n8 --> n9
  n10(("200 Responde con éxito")):::ok
  n9 --> n10
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. PUT /notifications/preferences/me

Guardar mis preferencias de notificación in-app

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay canal in-app activo: falta correr el seed de mensajería |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.updateMyPreferences"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a NotificationsRepository.findActiveChannelByType"]:::llamada
  n4 --> n5
  n6[("LEE messaging.message_channels")]:::efecto
  n5 --> n6
  n7{"!channel"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED No hay canal in-app activo: falta correr el seed de mensajería"]):::error
  n7 -->|"sí"| n8
  n9["Llama a NotificationsRepository.findPreferences"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE messaging.recipient_preferences")]:::efecto
  n9 --> n10
  n11["Repite: por cada const change de dto.categories ?? []"]:::bucle
  n10 --> n11
  n12{"row"}:::decision
  n11 -->|"cada elemento"| n12
  n13["Llama a NotificationsRepository.createPreference"]:::llamada
  n12 -->|"no"| n13
  n14[("CREA messaging.recipient_preferences")]:::efecto
  n13 --> n14
  n15{"dto.quietHours !== undefined"}:::decision
  n12 -->|"sí"| n15
  n14 --> n15
  n11 -->|"al terminar"| n15
  n16{"row"}:::decision
  n15 -->|"sí"| n16
  n17["Llama a NotificationsRepository.createPreference"]:::llamada
  n16 -->|"no"| n17
  n18[("CREA messaging.recipient_preferences")]:::efecto
  n17 --> n18
  n19["Llama a NotificationsService.readMyPreferences"]:::llamada
  n16 -->|"sí"| n19
  n18 --> n19
  n15 -->|"no"| n19
  n20["Llama a NotificationsRepository.findActiveChannelByType"]:::llamada
  n19 --> n20
  n21[("LEE messaging.message_channels")]:::efecto
  n20 --> n21
  n22{"!channel"}:::decision
  n21 --> n22
  n23(["422 PRECONDITION_FAILED No hay canal in-app activo: falta correr el seed de mensajería"]):::error
  n22 -->|"sí"| n23
  n24["Llama a NotificationsRepository.findPreferences"]:::llamada
  n22 -->|"no"| n24
  n25[("LEE messaging.recipient_preferences")]:::efecto
  n24 --> n25
  n26(("200 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /notifications/requests

Crear una solicitud de notificación

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.createRequest"]:::llamada
  n2 --> n3
  n4{"!recipientUserId"}:::decision
  n3 --> n4
  n5(["422 PRECONDITION_FAILED La notificación a una dirección externa también necesita el usuario destinatario / La…"]):::error
  n4 -->|"sí"| n5
  n6["Transacción: transactional(…)"]:::transaccion
  n4 -->|"no"| n6
  n7["Llama a NotificationsRepository.findChannelById"]:::llamada
  n6 --> n7
  n8[("LEE messaging.message_channels")]:::efecto
  n7 --> n8
  n9{"!channel"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Canal no encontrado"]):::error
  n9 -->|"sí"| n10
  n11{"channel.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El canal no está activo"]):::error
  n11 -->|"sí"| n12
  n13{"dto.templateId"}:::decision
  n11 -->|"no"| n13
  n14["Llama a NotificationsRepository.findTemplateById"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE messaging.message_templates")]:::efecto
  n14 --> n15
  n16{"!template"}:::decision
  n15 --> n16
  n17(["404 NOT_FOUND Plantilla no encontrada"]):::error
  n16 -->|"sí"| n17
  n18{"template.statusConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED La plantilla no está publicada"]):::error
  n18 -->|"sí"| n19
  n20{"template.channelId !== dto.channelId"}:::decision
  n18 -->|"no"| n20
  n21(["422 PRECONDITION_FAILED La plantilla es de otro canal"]):::error
  n20 -->|"sí"| n21
  n22{"dto.debounceKey"}:::decision
  n20 -->|"no"| n22
  n13 -->|"no"| n22
  n23["Llama a NotificationsRepository.findLiveRequestByDebounceKey"]:::llamada
  n22 -->|"sí"| n23
  n24[("LEE messaging.notification_requests")]:::efecto
  n23 --> n24
  n25["Llama a NotificationsService.evaluateSuppression"]:::llamada
  n24 --> n25
  n22 -->|"no"| n25
  n26["Llama a NotificationsRepository.findPreferences"]:::llamada
  n25 --> n26
  n27[("LEE messaging.recipient_preferences")]:::efecto
  n26 --> n27
  n28["Llama a NotificationsRepository.createNotificationRequest"]:::llamada
  n27 --> n28
  n29[("CREA messaging.notification_requests")]:::efecto
  n28 --> n29
  n30(("201 Responde con éxito")):::ok
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. DESCONOCIDO /notifications/web-push



| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: La dirección de push no pertenece a un servicio de navegador conocido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3{"!isAllowedPushEndpoint(endpoint)"}:::decision
  n2 --> n3
  n4(["400 VALIDATION_FAILED La dirección de push no pertenece a un servicio de navegador conocido"]):::error
  n3 -->|"sí"| n4
  n5(("200 Responde con éxito")):::ok
  n3 -->|"no"| n5
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. PUT /notifications/web-push/subscription

Guarda la suscripción push de este navegador

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: La dirección de push no pertenece a un servicio de navegador conocido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las notificaciones push no están activadas en este entorno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a WebPushController.assertKnownPushService"]:::llamada
  n2 --> n3
  n4{"!isAllowedPushEndpoint(endpoint)"}:::decision
  n3 --> n4
  n5(["400 VALIDATION_FAILED La dirección de push no pertenece a un servicio de navegador conocido"]):::error
  n4 -->|"sí"| n5
  n6["Llama a WebPushService.subscribe"]:::llamada
  n4 -->|"no"| n6
  n7{"!this.vapid"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED Las notificaciones push no están activadas en este entorno"]):::error
  n7 -->|"sí"| n8
  n9["Transacción: transactional(…)"]:::transaccion
  n7 -->|"no"| n9
  n10[("LEE iam.devices")]:::efecto
  n9 --> n10
  n11{"existing"}:::decision
  n10 --> n11
  n12[("ACTUALIZA iam.devices · ACTUALIZA iam.devices · ACTUALIZA iam.devices · ACTUALIZA iam.devices · ACTUALIZA iam…")]:::efecto
  n11 -->|"sí"| n12
  n13[("CREA iam.devices")]:::efecto
  n12 --> n13
  n11 -->|"no"| n13
  n14(("204 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /queues/{code}/jobs

Encolar un trabajo

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cola no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Storage intent requires its lifecycle coordinator; PreconditionFailedException: La cola no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QueuesService.enqueueJob"]:::llamada
  n2 --> n3
  n4["Llama a QueuesService.assertGenericJob"]:::llamada
  n3 --> n4
  n5{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n4 --> n5
  n6(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n5 -->|"sí"| n6
  n7["Transacción: transactional(…)"]:::transaccion
  n5 -->|"no"| n7
  n8["Llama a QueuesRepository.findQueueByCode"]:::llamada
  n7 --> n8
  n9[("LEE messaging.message_queues")]:::efecto
  n8 --> n9
  n10{"!queue"}:::decision
  n9 --> n10
  n11(["404 NOT_FOUND Cola no encontrada"]):::error
  n10 -->|"sí"| n11
  n12{"queue.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n10 -->|"no"| n12
  n13(["422 PRECONDITION_FAILED La cola no está activa"]):::error
  n12 -->|"sí"| n13
  n14["Llama a QueuesRepository.findJobByDedupeKey"]:::llamada
  n12 -->|"no"| n14
  n15[("LEE messaging.queued_jobs")]:::efecto
  n14 --> n15
  n16{"existing"}:::decision
  n15 --> n16
  n17["Llama a QueuesService.assertGenericJob"]:::llamada
  n16 -->|"sí"| n17
  n18{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n17 --> n18
  n19(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n18 -->|"sí"| n19
  n20["Llama a QueuesRepository.createJob"]:::llamada
  n18 -->|"no"| n20
  n16 -->|"no"| n20
  n21[("CREA messaging.queued_jobs")]:::efecto
  n20 --> n21
  n22>"Encola ~code"]:::evento
  n21 --> n22
  n23(("201 Responde con éxito")):::ok
  n22 --> n23
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /queues/dead-letter/{deadLetterJobId}/redrive

Reencolar un trabajo desde la cola muerta

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entrada de cola muerta no encontrada; ResourceNotFoundException: Cola de destino no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Storage intent requires its lifecycle coordinator; PreconditionFailedException: La cola de destino no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QueuesService.redriveDeadLetter"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QueuesRepository.findDeadLetterJobById"]:::llamada
  n4 --> n5
  n6[("LEE messaging.dead_letter_jobs")]:::efecto
  n5 --> n6
  n7{"!dead"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Entrada de cola muerta no encontrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QueuesRepository.findJobById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE messaging.queued_jobs")]:::efecto
  n9 --> n10
  n11["Llama a QueuesService.assertGenericJob"]:::llamada
  n10 --> n11
  n12{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n11 --> n12
  n13(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n12 -->|"sí"| n13
  n14{"original"}:::decision
  n12 -->|"no"| n14
  n15["Llama a QueuesService.assertGenericJob"]:::llamada
  n14 -->|"sí"| n15
  n16{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n16 -->|"sí"| n17
  n18["Llama a QueuesService.assertGenericJob"]:::llamada
  n16 -->|"no"| n18
  n14 -->|"no"| n18
  n19{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n18 --> n19
  n20(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n19 -->|"sí"| n20
  n21{"!original && dead.payloadJson && typeof dead.payloadJson === 'object' && 'ownerToken' in dead.payloadJson &&…"}:::decision
  n19 -->|"no"| n21
  n22(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n21 -->|"sí"| n22
  n23["Llama a QueuesRepository.findQueueById"]:::llamada
  n21 -->|"no"| n23
  n24[("LEE messaging.message_queues")]:::efecto
  n23 --> n24
  n25{"!queue"}:::decision
  n24 --> n25
  n26(["404 NOT_FOUND Cola de destino no encontrada"]):::error
  n25 -->|"sí"| n26
  n27{"queue.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n25 -->|"no"| n27
  n28(["422 PRECONDITION_FAILED La cola de destino no está activa"]):::error
  n27 -->|"sí"| n28
  n29["Llama a QueuesRepository.findJobByDedupeKey"]:::llamada
  n27 -->|"no"| n29
  n30[("LEE messaging.queued_jobs")]:::efecto
  n29 --> n30
  n31{"already"}:::decision
  n30 --> n31
  n32["Llama a QueuesService.assertGenericJob"]:::llamada
  n31 -->|"sí"| n32
  n33{"isStorageJobType(jobType) || dedupeKey?.startsWith('storage-lifecycle:')"}:::decision
  n32 --> n33
  n34(["422 PRECONDITION_FAILED Storage intent requires its lifecycle coordinator"]):::error
  n33 -->|"sí"| n34
  n35["Llama a QueuesRepository.createJob"]:::llamada
  n33 -->|"no"| n35
  n31 -->|"no"| n35
  n36[("CREA messaging.queued_jobs")]:::efecto
  n35 --> n36
  n37(("201 Responde con éxito")):::ok
  n36 --> n37
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 18. POST /webhooks/providers/{providerCode}/receipts

Conciliar el acuse de entrega que envía el proveedor

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Firma del acuse del proveedor inválida |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado; ResourceNotFoundException: No hay entrega con esa referencia de mensaje |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a NotificationsService.recordProviderReceipt"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a NotificationsRepository.findProviderByCode"]:::llamada
  n4 --> n5
  n6[("LEE messaging.messaging_providers")]:::efecto
  n5 --> n6
  n7{"!provider"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Proveedor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"!verifySignature(secret, signedBody, dto.signature)"}:::decision
  n7 -->|"no"| n9
  n10(["401 UNAUTHENTICATED Firma del acuse del proveedor inválida"]):::error
  n9 -->|"sí"| n10
  n11["Llama a NotificationsRepository.findDeliveryByProviderRefForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE messaging.notification_deliveries")]:::efecto
  n11 --> n12
  n13{"!delivery"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND No hay entrega con esa referencia de mensaje"]):::error
  n13 -->|"sí"| n14
  n15["Llama a NotificationsRepository.findReceipt"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE messaging.delivery_receipts")]:::efecto
  n15 --> n16
  n17["Llama a NotificationsRepository.findRequestForUpdate"]:::llamada
  n16 --> n17
  n18[("LEE messaging.notification_requests")]:::efecto
  n17 --> n18
  n19["Llama a NotificationsRepository.createReceipt"]:::llamada
  n18 --> n19
  n20[("CREA messaging.delivery_receipts")]:::efecto
  n19 --> n20
  n21[("ACTUALIZA messaging.notification_deliveries")]:::efecto
  n20 --> n21
  n22{"request"}:::decision
  n21 --> n22
  n23[("ACTUALIZA messaging.notification_requests")]:::efecto
  n22 -->|"sí"| n23
  n24(("200 Responde con éxito")):::ok
  n23 --> n24
  n22 -->|"no"| n24
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| GET /notifications/me | 200, 401, 403, 429 | 1 |
| GET /notifications/web-push/config | 200, 401, 403, 429 | 0 |
| DELETE /notifications/web-push/subscription | 204, 400, 401, 403, 429 | 2 |
