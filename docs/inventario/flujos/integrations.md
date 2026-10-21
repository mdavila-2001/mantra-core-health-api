<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `integrations`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 15 (13 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [integrations](../endpoints/integrations.md)

## Proceso: src / modules / integrations

- **Código:** `integrations` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 15
- **Actores:** Cualquier sesión válida · Público (sin sesión) · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/integrations/README.md`

### Para qué sirve

Agrupa los componentes relacionados con **integrations** y mantiene cohesionada esta responsabilidad del sistema.

_Fuente: `src/modules/integrations/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:IntegrationsConnectionsController` | Operaciones de IntegrationsConnectionsController que el README no asigna a un caso de uso | POST /integrations/connections/{id}:pause | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /integrations/connections/{id}/credentials:rotate | SECURITY_ADMIN | MEDIO | 5 |
| `ctrl:IntegrationsMessagesController` | Operaciones de IntegrationsMessagesController que el README no asigna a un caso de uso | POST /integrations/messages:outbound | Cualquier sesión válida | ALTO | 3 |
|  |  | POST /integrations/messages/{id}:correlate | SYSTEM · SECURITY_ADMIN | MEDIO | 5 |
|  |  | POST /integrations/messages/{id}:dead-letter | SYSTEM · SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /integrations/messages/{id}:dispatch | SYSTEM · SECURITY_ADMIN | MEDIO | 6 |
|  |  | POST /integrations/messages/{id}:retry | SYSTEM · SECURITY_ADMIN | MEDIO | 4 |
|  |  | GET /integrations/messages/pending-correlation | SYSTEM · SECURITY_ADMIN | BAJO | 1 |
|  |  | GET /integrations/messages/pending-dispatch | SYSTEM · SECURITY_ADMIN | BAJO | 1 |
|  |  | GET /integrations/messages/pending-retry | SYSTEM · SECURITY_ADMIN | BAJO | 2 |
| `ctrl:IntegrationsProvidersController` | Operaciones de IntegrationsProvidersController que el README no asigna a un caso de uso | POST /integrations/providers | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /integrations/providers/{id}/connections | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /integrations/providers/{id}/endpoints | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /integrations/providers/{id}/webhook-subscriptions | SECURITY_ADMIN | MEDIO | 4 |
| `ctrl:IntegrationsWebhooksController` | Operaciones de IntegrationsWebhooksController que el README no asigna a un caso de uso | POST /integrations/webhooks/inbound | Público (sin sesión) | ALTO | 3 |

### Diagrama — etapas `ctrl:IntegrationsConnectionsController`, `ctrl:IntegrationsMessagesController`, `ctrl:IntegrationsProvidersController`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a8(["Cualquier sesión válida"]):::actor
  a10(["SYSTEM · SECURITY_ADMIN"]):::actor
  a29(["Público (sin sesión)"]):::actor
  t3[("integrations.outbound_messages")]:::tabla
  t4[("integrations.provider_connections")]:::tabla
  t6[("integrations.provider_credentials")]:::tabla
  t11[("integrations.inbound_messages")]:::tabla
  t12[("integrations.message_responses")]:::tabla
  t14[("integrations.message_retries")]:::tabla
  t16[("integrations.external_providers")]:::tabla
  t17[("integrations.integration_endpoints")]:::tabla
  t25[("integrations.integration_field_mappings")]:::tabla
  t27[("integrations.webhook_subscriptions")]:::tabla
  subgraph s0["ctrl:IntegrationsConnectionsController · Operaciones de IntegrationsConnections…"]
    o1["POST /integrations/connections/{id}:pause"]:::op
    o5["POST /integrations/connections/{id}/credentials:rotate"]:::op
  end
  subgraph s1["ctrl:IntegrationsMessagesController · Operaciones de IntegrationsMessagesContro…"]
    o7["POST /integrations/messages:outbound"]:::op
    o9["POST /integrations/messages/{id}:correlate"]:::op
    o13["POST /integrations/messages/{id}:dead-letter"]:::op
    o15["POST /integrations/messages/{id}:dispatch"]:::op
    o18["POST /integrations/messages/{id}:retry"]:::op
    o19["GET /integrations/messages/pending-correlation"]:::op
    o20["GET /integrations/messages/pending-dispatch"]:::op
    o21["GET /integrations/messages/pending-retry"]:::op
  end
  subgraph s2["ctrl:IntegrationsProvidersController · Operaciones de IntegrationsProvidersCont…"]
    o22["POST /integrations/providers"]:::op
    o23["POST /integrations/providers/{id}/connections"]:::op
    o24["POST /integrations/providers/{id}/endpoints"]:::op
    o26["POST /integrations/providers/{id}/webhook-subscriptions"]:::op
  end
  subgraph s3["ctrl:IntegrationsWebhooksController · Operaciones de IntegrationsWebhooksContro…"]
    o28["POST /integrations/webhooks/inbound"]:::op
  end
  a2 --> o1
  o1 -->|"ACTUALIZA"| t3
  o1 -->|"ACTUALIZA"| t4
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"ACTUALIZA"| t4
  o5 -->|"LEE"| t4
  o5 -->|"ACTUALIZA"| t6
  o5 -->|"CREA"| t6
  o5 -->|"LEE"| t6
  a8 --> o7
  o7 -->|"CREA"| t3
  o7 -->|"LEE"| t3
  o7 -->|"LEE"| t4
  a10 --> o9
  o9 -->|"ACTUALIZA"| t11
  o9 -->|"LEE"| t11
  o9 -->|"CREA"| t12
  o9 -->|"ACTUALIZA"| t3
  o9 -->|"LEE"| t3
  a10 --> o13
  o13 -->|"CREA"| t14
  o13 -->|"LEE"| t14
  o13 -->|"ACTUALIZA"| t3
  o13 -->|"LEE"| t3
  a10 --> o15
  o15 -->|"LEE"| t16
  o15 -->|"LEE"| t17
  o15 -->|"CREA"| t12
  o15 -->|"ACTUALIZA"| t3
  o15 -->|"LEE"| t3
  o15 -->|"LEE"| t4
  a10 --> o18
  o18 -->|"CREA"| t14
  o18 -->|"LEE"| t14
  o18 -->|"ACTUALIZA"| t3
  o18 -->|"LEE"| t3
  a10 --> o19
  o19 -->|"LEE"| t11
  a10 --> o20
  o20 -->|"LEE"| t3
  a10 --> o21
  o21 -->|"LEE"| t14
  o21 -->|"LEE"| t3
  a2 --> o22
  o22 -->|"CREA"| t16
  o22 -->|"LEE"| t16
  a2 --> o23
  o23 -->|"LEE"| t16
  o23 -->|"CREA"| t4
  o23 -->|"CREA"| t6
  a2 --> o24
  o24 -->|"LEE"| t16
  o24 -->|"CREA"| t17
  o24 -->|"LEE"| t17
  o24 -->|"CREA"| t25
  a2 --> o26
  o26 -->|"LEE"| t16
  o26 -->|"ACTUALIZA"| t27
  o26 -->|"CREA"| t27
  o26 -->|"LEE"| t27
  a29 --> o28
  o28 -->|"CREA"| t11
  o28 -->|"LEE"| t11
  o28 -->|"LEE"| t4
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /integrations/connections/{id}:pause

Pausar una conexión en fallo (circuit breaker)

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsConnectionsService.pauseConnection"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7{"!connection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Conexión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"connection.stateConceptId !== INTEG.CONN_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La conexión no está activa"]):::error
  n9 -->|"sí"| n10
  n11[("ACTUALIZA integrations.provider_connections")]:::efecto
  n9 -->|"no"| n11
  n12["Llama a OutboundMessagesRepository.holdQueuedForConnection"]:::llamada
  n11 --> n12
  n13[("ACTUALIZA integrations.outbound_messages")]:::efecto
  n12 --> n13
  n14(("200 Responde con éxito")):::ok
  n13 --> n14
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /integrations/connections/{id}/credentials:rotate

Rotar/expirar la credencial de una conexión

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsConnectionsService.rotateCredential"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7{"!connection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Conexión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"connection.stateConceptId !== INTEG.CONN_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La conexión no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ProviderCredentialsRepository.findActiveByConnection"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE integrations.provider_credentials")]:::efecto
  n11 --> n12
  n13["Llama a ProviderCredentialsRepository.create"]:::llamada
  n12 --> n13
  n14[("CREA integrations.provider_credentials")]:::efecto
  n13 --> n14
  n15{"current"}:::decision
  n14 --> n15
  n16[("ACTUALIZA integrations.provider_credentials")]:::efecto
  n15 -->|"sí"| n16
  n17[("ACTUALIZA integrations.provider_connections")]:::efecto
  n16 --> n17
  n15 -->|"no"| n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /integrations/messages:outbound

Encolar un mensaje saliente (idempotente)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsMessagingService.enqueueOutbound"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7{"!connection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Conexión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"connection.stateConceptId !== INTEG.CONN_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La conexión no está activa"]):::error
  n9 -->|"sí"| n10
  n11["Llama a OutboundMessagesRepository.findByIdempotencyKey"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE integrations.outbound_messages")]:::efecto
  n11 --> n12
  n13["Llama a OutboundMessagesRepository.create"]:::llamada
  n12 --> n13
  n14[("CREA integrations.outbound_messages")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /integrations/messages/{id}:correlate

Procesar callback/respuesta asíncrona del proveedor

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Mensaje entrante no encontrado; ResourceNotFoundException: No hay mensaje saliente correlacionado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje entrante no está en estado recibido; PreconditionFailedException: El mensaje entrante no tiene correlación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsMessagingService.correlate"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a InboundMessagesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.inbound_messages")]:::efecto
  n5 --> n6
  n7{"!inbound"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Mensaje entrante no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"inbound.statusConceptId !== INTEG.INBOUND_RECEIVED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El mensaje entrante no está en estado recibido"]):::error
  n9 -->|"sí"| n10
  n11{"!inbound.correlationId"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED El mensaje entrante no tiene correlación"]):::error
  n11 -->|"sí"| n12
  n13["Llama a OutboundMessagesRepository.findByCorrelationId"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE integrations.outbound_messages")]:::efecto
  n13 --> n14
  n15{"!outbound"}:::decision
  n14 --> n15
  n16(["404 NOT_FOUND No hay mensaje saliente correlacionado"]):::error
  n15 -->|"sí"| n16
  n17[("ACTUALIZA integrations.outbound_messages")]:::efecto
  n15 -->|"no"| n17
  n18["Llama a MessageResponsesRepository.create"]:::llamada
  n17 --> n18
  n19[("CREA integrations.message_responses")]:::efecto
  n18 --> n19
  n20[("ACTUALIZA integrations.inbound_messages")]:::efecto
  n19 --> n20
  n21(("200 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /integrations/messages/{id}:dead-letter

Enviar a dead-letter tras agotar reintentos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Mensaje no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje no está en estado fallido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsMessagingService.deadLetter"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OutboundMessagesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.outbound_messages")]:::efecto
  n5 --> n6
  n7{"!message"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Mensaje no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"message.statusConceptId !== INTEG.MSG_FAILED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El mensaje no está en estado fallido"]):::error
  n9 -->|"sí"| n10
  n11["Llama a MessageRetriesRepository.maxAttempt"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE integrations.message_retries")]:::efecto
  n11 --> n12
  n13[("ACTUALIZA integrations.outbound_messages")]:::efecto
  n12 --> n13
  n14["Llama a MessageRetriesRepository.create"]:::llamada
  n13 --> n14
  n15[("CREA integrations.message_retries")]:::efecto
  n14 --> n15
  n16(("200 Responde con éxito")):::ok
  n15 --> n16
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /integrations/messages/{id}:dispatch

Despachar un mensaje y registrar su respuesta

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Mensaje no encontrado; ResourceNotFoundException: Conexión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje no está en cola; PreconditionFailedException: El proveedor no tiene base_url configurada para el despacho |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsMessagingService.dispatch"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OutboundMessagesRepository.findByIdForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE integrations.outbound_messages")]:::efecto
  n5 --> n6
  n7{"!message"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Mensaje no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"message.statusConceptId !== INTEG.MSG_QUEUED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El mensaje no está en cola"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE integrations.provider_connections")]:::efecto
  n11 --> n12
  n13{"!connection"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Conexión no encontrada"]):::error
  n13 -->|"sí"| n14
  n15["Llama a ExternalProvidersRepository.findById"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE integrations.external_providers")]:::efecto
  n15 --> n16
  n17{"!provider?.baseUrl"}:::decision
  n16 --> n17
  n18(["422 PRECONDITION_FAILED El proveedor no tiene base_url configurada para el despacho"]):::error
  n17 -->|"sí"| n18
  n19{"message.endpointId"}:::decision
  n17 -->|"no"| n19
  n20["Llama a IntegrationEndpointsRepository.findById"]:::llamada
  n19 -->|"sí"| n20
  n21[("LEE integrations.integration_endpoints")]:::efecto
  n20 --> n21
  n22[("ACTUALIZA integrations.outbound_messages · ACTUALIZA integrations.outbound_messages")]:::efecto
  n21 --> n22
  n19 -->|"no"| n22
  n23["Llama a MessageResponsesRepository.create"]:::llamada
  n22 --> n23
  n24[("CREA integrations.message_responses")]:::efecto
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

#### 7. POST /integrations/messages/{id}:retry

Programar un reintento con backoff exponencial

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Mensaje no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje no está en estado fallido; PreconditionFailedException: Se agotaron los reintentos (usar dead-letter) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsMessagingService.retry"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a OutboundMessagesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.outbound_messages")]:::efecto
  n5 --> n6
  n7{"!message"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Mensaje no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"message.statusConceptId !== INTEG.MSG_FAILED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El mensaje no está en estado fallido"]):::error
  n9 -->|"sí"| n10
  n11["Llama a MessageRetriesRepository.maxAttempt"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE integrations.message_retries")]:::efecto
  n11 --> n12
  n13{"attemptNumber › MAX_ATTEMPTS"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED Se agotaron los reintentos (usar dead-letter)"]):::error
  n13 -->|"sí"| n14
  n15["Llama a MessageRetriesRepository.create"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA integrations.message_retries")]:::efecto
  n15 --> n16
  n17[("ACTUALIZA integrations.outbound_messages · ACTUALIZA integrations.outbound_messages")]:::efecto
  n16 --> n17
  n18(("200 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. GET /integrations/messages/pending-retry

Listar mensajes FAILED candidatos a reintento o dead-letter

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
  n3["Llama a IntegrationsMessagingService.listFailedForRetry"]:::llamada
  n2 --> n3
  n4["Llama a OutboundMessagesRepository.findFailed"]:::llamada
  n3 --> n4
  n5[("LEE integrations.outbound_messages")]:::efecto
  n4 --> n5
  n6["Repite: map(…)"]:::bucle
  n5 --> n6
  n7["Llama a MessageRetriesRepository.maxAttempt"]:::llamada
  n6 -->|"cada elemento"| n7
  n8[("LEE integrations.message_retries")]:::efecto
  n7 --> n8
  n9(("200 Responde con éxito")):::ok
  n8 --> n9
  n6 -->|"al terminar"| n9
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /integrations/providers

Registrar un proveedor externo

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un proveedor con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsProvidersService.registerProvider"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ExternalProvidersRepository.findByCode"]:::llamada
  n4 --> n5
  n6[("LEE integrations.external_providers")]:::efecto
  n5 --> n6
  n7{"clash"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un proveedor con ese código"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ExternalProvidersRepository.create"]:::llamada
  n7 -->|"no"| n9
  n10[("CREA integrations.external_providers")]:::efecto
  n9 --> n10
  n11(("201 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /integrations/providers/{id}/connections

Aprovisionar una conexión de tenant y su credencial

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsConnectionsService.provisionConnection"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ExternalProvidersRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.external_providers")]:::efecto
  n5 --> n6
  n7{"!provider"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Proveedor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"provider.stateConceptId !== INTEG.PROVIDER_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El proveedor no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a ProviderConnectionsRepository.create"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA integrations.provider_connections")]:::efecto
  n11 --> n12
  n13["Llama a ProviderCredentialsRepository.create"]:::llamada
  n12 --> n13
  n14[("CREA integrations.provider_credentials")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /integrations/providers/{id}/endpoints

Publicar un endpoint versionado y su mapeo de campos

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un endpoint con esa versión para el proveedor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsProvidersService.publishEndpoint"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ExternalProvidersRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.external_providers")]:::efecto
  n5 --> n6
  n7{"!provider"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Proveedor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"provider.stateConceptId !== INTEG.PROVIDER_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El proveedor no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a IntegrationEndpointsRepository.findByProviderAndVersion"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE integrations.integration_endpoints")]:::efecto
  n11 --> n12
  n13{"existing"}:::decision
  n12 --> n13
  n14(["409 CONFLICT Ya existe un endpoint con esa versión para el proveedor"]):::error
  n13 -->|"sí"| n14
  n15["Llama a IntegrationEndpointsRepository.createEndpoint"]:::llamada
  n13 -->|"no"| n15
  n16[("CREA integrations.integration_endpoints")]:::efecto
  n15 --> n16
  n17["Repite: por cada const m de mappings"]:::bucle
  n16 --> n17
  n18["Llama a IntegrationEndpointsRepository.createFieldMapping"]:::llamada
  n17 -->|"cada elemento"| n18
  n19[("CREA integrations.integration_field_mappings")]:::efecto
  n18 --> n19
  n20(("201 Responde con éxito")):::ok
  n19 --> n20
  n17 -->|"al terminar"| n20
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /integrations/providers/{id}/webhook-subscriptions

Gestionar (crear/actualizar) una suscripción de webhook

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsProvidersService.createWebhookSubscription"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ExternalProvidersRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.external_providers")]:::efecto
  n5 --> n6
  n7{"!provider"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Proveedor no encontrado"]):::error
  n7 -->|"sí"| n8
  n9{"provider.stateConceptId !== INTEG.PROVIDER_ACTIVE"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El proveedor no está activo"]):::error
  n9 -->|"sí"| n10
  n11["Llama a WebhookSubscriptionsRepository.findByLogicalKey"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE integrations.webhook_subscriptions")]:::efecto
  n11 --> n12
  n13{"existing"}:::decision
  n12 --> n13
  n14[("ACTUALIZA integrations.webhook_subscriptions · ACTUALIZA integrations.webhook_subscriptions · ACTUALIZA integ…")]:::efecto
  n13 -->|"sí"| n14
  n15["Llama a WebhookSubscriptionsRepository.create"]:::llamada
  n14 --> n15
  n13 -->|"no"| n15
  n16[("CREA integrations.webhook_subscriptions")]:::efecto
  n15 --> n16
  n17(("201 Responde con éxito")):::ok
  n16 --> n17
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /integrations/webhooks/inbound

Recibir un mensaje entrante (idempotencia por firma)

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Firma del webhook inválida |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsWebhooksService.receiveInbound"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7{"!connection"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Conexión no encontrada"]):::error
  n7 -->|"sí"| n8
  n9{"!verifySignature(secret, rawBody, dto.signature)"}:::decision
  n7 -->|"no"| n9
  n10(["401 UNAUTHENTICATED Firma del webhook inválida"]):::error
  n9 -->|"sí"| n10
  n11{"dto.signature"}:::decision
  n9 -->|"no"| n11
  n12["Llama a InboundMessagesRepository.findByConnectionAndSignature"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE integrations.inbound_messages")]:::efecto
  n12 --> n13
  n14["Llama a InboundMessagesRepository.create"]:::llamada
  n13 --> n14
  n11 -->|"no"| n14
  n15[("CREA integrations.inbound_messages")]:::efecto
  n14 --> n15
  n16(("201 Responde con éxito")):::ok
  n15 --> n16
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
| GET /integrations/messages/pending-correlation | 200, 400, 401, 403, 429 | 1 |
| GET /integrations/messages/pending-dispatch | 200, 400, 401, 403, 429 | 1 |
