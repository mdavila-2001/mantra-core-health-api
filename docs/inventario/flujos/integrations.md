<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `integrations`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 15 (13 con decisiones propias, 2 sin ellas)
- Inventario de endpoints del módulo: [integrations](../endpoints/integrations.md)

## Proceso: Integraciones externas

- **Código:** `integrations` · **Agrupación:** AGRUPACION_POR_CONTROLADOR · **Operaciones:** 15
- **Actores:** Público (sin sesión) · SECURITY_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/integrations/README.md`

### Para qué sirve

Gestiona proveedores, conexiones tenantizadas, referencias a credenciales, endpoints versionados, mensajería saliente, reintentos, callbacks entrantes y suscripciones de webhook. Persiste en el esquema PostgreSQL `integrations`; los workers consumen los endpoints internos de descubrimiento, despacho, reintento y correlación.

_Fuente: `src/modules/integrations/README.md:3`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `ctrl:IntegrationsConnectionsController` | Operaciones de IntegrationsConnectionsController que el README no asigna a un caso de uso | POST /integrations/connections/{id}:pause | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /integrations/connections/{id}/credentials:rotate | SECURITY_ADMIN | MEDIO | 4 |
| `ctrl:IntegrationsMessagesController` | Operaciones de IntegrationsMessagesController que el README no asigna a un caso de uso | POST /integrations/messages:outbound | SYSTEM · SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /integrations/messages/{id}:correlate | SYSTEM · SECURITY_ADMIN | MEDIO | 6 |
|  |  | POST /integrations/messages/{id}:dead-letter | SYSTEM · SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /integrations/messages/{id}:dispatch | SYSTEM · SECURITY_ADMIN | MEDIO | 7 |
|  |  | POST /integrations/messages/{id}:retry | SYSTEM · SECURITY_ADMIN | MEDIO | 4 |
|  |  | GET /integrations/messages/pending-correlation | SYSTEM · SECURITY_ADMIN | BAJO | 2 |
|  |  | GET /integrations/messages/pending-dispatch | SYSTEM · SECURITY_ADMIN | BAJO | 2 |
|  |  | GET /integrations/messages/pending-retry | SYSTEM · SECURITY_ADMIN | BAJO | 3 |
| `ctrl:IntegrationsProvidersController` | Operaciones de IntegrationsProvidersController que el README no asigna a un caso de uso | POST /integrations/providers | SECURITY_ADMIN | MEDIO | 2 |
|  |  | POST /integrations/providers/{id}/connections | SECURITY_ADMIN | MEDIO | 3 |
|  |  | POST /integrations/providers/{id}/endpoints | SECURITY_ADMIN | MEDIO | 4 |
|  |  | POST /integrations/providers/{id}/webhook-subscriptions | SECURITY_ADMIN | MEDIO | 4 |
| `ctrl:IntegrationsWebhooksController` | Operaciones de IntegrationsWebhooksController que el README no asigna a un caso de uso | POST /integrations/webhooks/inbound | Público (sin sesión) | ALTO | 4 |

### Diagrama — etapas `ctrl:IntegrationsConnectionsController`, `ctrl:IntegrationsMessagesController`, `ctrl:IntegrationsProvidersController`…

```mermaid
flowchart LR
  a2(["SECURITY_ADMIN"]):::actor
  a8(["SYSTEM · SECURITY_ADMIN"]):::actor
  a29(["Público (sin sesión)"]):::actor
  t3[("integrations.outbound_messages")]:::tabla
  t4[("integrations.provider_connections")]:::tabla
  t6[("integrations.provider_credentials")]:::tabla
  t10[("integrations.inbound_messages")]:::tabla
  t11[("integrations.message_responses")]:::tabla
  t13[("integrations.message_retries")]:::tabla
  t15[("integrations.external_providers")]:::tabla
  t16[("integrations.integration_endpoints")]:::tabla
  t25[("integrations.integration_field_mappings")]:::tabla
  t27[("integrations.webhook_subscriptions")]:::tabla
  subgraph s0["ctrl:IntegrationsConnectionsController · Operaciones de IntegrationsConnections…"]
    o1["POST /integrations/connections/{id}:pause"]:::op
    o5["POST /integrations/connections/{id}/credentials:rotate"]:::op
  end
  t17[("+1 tablas más")]
  subgraph s1["ctrl:IntegrationsMessagesController · Operaciones de IntegrationsMessagesContro…"]
    o7["POST /integrations/messages:outbound"]:::op
    o9["POST /integrations/messages/{id}:correlate"]:::op
    o12["POST /integrations/messages/{id}:dead-letter"]:::op
    o14["POST /integrations/messages/{id}:dispatch"]:::op
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
  o1 -->|"LEE"| t3
  o1 -->|"LEE"| t4
  a2 --> o5
  o5 -->|"LEE"| t4
  o5 -->|"ACTUALIZA"| t6
  o5 -->|"CREA"| t6
  o5 -->|"LEE"| t6
  a8 --> o7
  o7 -->|"CREA"| t3
  o7 -->|"LEE"| t3
  o7 -->|"LEE"| t4
  a8 --> o9
  o9 -->|"ACTUALIZA"| t10
  o9 -->|"LEE"| t10
  o9 -->|"CREA"| t11
  o9 -->|"ACTUALIZA"| t3
  o9 -->|"LEE"| t3
  o9 -->|"LEE"| t4
  a8 --> o12
  o12 -->|"CREA"| t13
  o12 -->|"LEE"| t13
  o12 -->|"LEE"| t3
  o12 -->|"LEE"| t4
  a8 --> o14
  o14 -->|"LEE"| t15
  o14 -->|"LEE"| t16
  o14 -->|"CREA"| t11
  o14 -->|"ACTUALIZA"| t3
  o14 -->|"LEE"| t3
  o14 -->|"LEE"| t4
  o14 -.-> t17
  a8 --> o18
  o18 -->|"CREA"| t13
  o18 -->|"LEE"| t13
  o18 -->|"LEE"| t3
  o18 -->|"LEE"| t4
  a8 --> o19
  o19 -->|"LEE"| t10
  o19 -->|"LEE"| t4
  a8 --> o20
  o20 -->|"LEE"| t3
  o20 -->|"LEE"| t4
  a8 --> o21
  o21 -->|"LEE"| t13
  o21 -->|"LEE"| t3
  o21 -->|"LEE"| t4
  a2 --> o22
  o22 -->|"CREA"| t15
  o22 -->|"LEE"| t15
  a2 --> o23
  o23 -->|"LEE"| t15
  o23 -->|"CREA"| t4
  o23 -->|"CREA"| t6
  a2 --> o24
  o24 -->|"LEE"| t15
  o24 -->|"CREA"| t16
  o24 -->|"LEE"| t16
  o24 -->|"CREA"| t25
  a2 --> o26
  o26 -->|"LEE"| t15
  o26 -->|"ACTUALIZA"| t27
  o26 -->|"CREA"| t27
  o26 -->|"LEE"| t27
  a29 --> o28
  o28 -->|"CREA"| t10
  o28 -->|"LEE"| t10
  o28 -->|"LEE"| t4
  o28 -->|"LEE"| t6
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
  n5["Llama a ProviderConnectionsRepository.findByIdInScope"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7{"connection.stateConceptId !== INTEG.CONN_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La conexión no está activa"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OutboundMessagesRepository.holdQueuedForConnection"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE integrations.outbound_messages")]:::efecto
  n9 --> n10
  n11["Repite: por cada const message de queued"]:::bucle
  n10 --> n11
  n12[("ACTUALIZA integrations.outbound_messages")]:::efecto
  n11 -->|"cada elemento"| n12
  n13(("200 Responde con éxito")):::ok
  n12 --> n13
  n11 -->|"al terminar"| n13
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
  n5["Llama a ProviderConnectionsRepository.findByIdInScope"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7{"connection.stateConceptId !== INTEG.CONN_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La conexión no está activa"]):::error
  n7 -->|"sí"| n8
  n9["Llama a ProviderCredentialsRepository.findActiveByConnection"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE integrations.provider_credentials")]:::efecto
  n9 --> n10
  n11["Llama a ProviderCredentialsRepository.create"]:::llamada
  n10 --> n11
  n12[("CREA integrations.provider_credentials")]:::efecto
  n11 --> n12
  n13{"current"}:::decision
  n12 --> n13
  n14[("ACTUALIZA integrations.provider_credentials")]:::efecto
  n13 -->|"sí"| n14
  n15(("200 Responde con éxito")):::ok
  n14 --> n15
  n13 -->|"no"| n15
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
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia ya está en uso |
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
  n5["Llama a ProviderConnectionsRepository.findByIdInScope"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7{"connection.stateConceptId !== INTEG.CONN_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La conexión no está activa"]):::error
  n7 -->|"sí"| n8
  n9["Llama a OutboundMessagesRepository.findByIdempotencyKey"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE integrations.outbound_messages")]:::efecto
  n9 --> n10
  n11{"existing && existing.connectionId !== connection.id"}:::decision
  n10 --> n11
  n12(["409 CONFLICT La clave de idempotencia ya está en uso"]):::error
  n11 -->|"sí"| n12
  n13["Llama a OutboundMessagesRepository.create"]:::llamada
  n11 -->|"no"| n13
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay mensaje saliente correlacionado |
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
  n7["Llama a ProviderConnectionsRepository.findByIdInScope"]:::llamada
  n6 --> n7
  n8[("LEE integrations.provider_connections")]:::efecto
  n7 --> n8
  n9["Llama a InboundMessagesRepository.findByIdForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE integrations.inbound_messages")]:::efecto
  n9 --> n10
  n11{"!inbound"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"inbound.statusConceptId !== INTEG.INBOUND_RECEIVED"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El mensaje entrante no está en estado recibido"]):::error
  n13 -->|"sí"| n14
  n15{"!inbound.correlationId"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El mensaje entrante no tiene correlación"]):::error
  n15 -->|"sí"| n16
  n17["Llama a OutboundMessagesRepository.findByCorrelationIdInConnection"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE integrations.outbound_messages")]:::efecto
  n17 --> n18
  n19{"!outbound"}:::decision
  n18 --> n19
  n20(["404 NOT_FOUND No hay mensaje saliente correlacionado"]):::error
  n19 -->|"sí"| n20
  n21[("ACTUALIZA integrations.outbound_messages")]:::efecto
  n19 -->|"no"| n21
  n22["Llama a MessageResponsesRepository.create"]:::llamada
  n21 --> n22
  n23[("CREA integrations.message_responses")]:::efecto
  n22 --> n23
  n24[("ACTUALIZA integrations.inbound_messages")]:::efecto
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

#### 5. POST /integrations/messages/{id}:dead-letter

Enviar a dead-letter tras agotar reintentos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
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
  n5["Llama a IntegrationsMessagingService.resolveMessageInScope"]:::llamada
  n4 --> n5
  n6["Llama a OutboundMessagesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE integrations.outbound_messages")]:::efecto
  n6 --> n7
  n8["Llama a ProviderConnectionsRepository.findByIdInScope"]:::llamada
  n7 --> n8
  n9[("LEE integrations.provider_connections")]:::efecto
  n8 --> n9
  n10{"message.statusConceptId !== INTEG.MSG_FAILED"}:::decision
  n9 --> n10
  n11(["422 PRECONDITION_FAILED El mensaje no está en estado fallido"]):::error
  n10 -->|"sí"| n11
  n12["Llama a MessageRetriesRepository.maxAttempt"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE integrations.message_retries")]:::efecto
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje no está en cola; PreconditionFailedException: El proveedor no tiene base_url configurada para el despacho; PreconditionFailedException: La conexión no tiene un secreto activo disponible; PreconditionFailedException: El cuerpo del despacho excede el tamaño permitido |
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
  n5["Llama a OutboundMessagesRepository.findById"]:::llamada
  n4 --> n5
  n6[("LEE integrations.outbound_messages")]:::efecto
  n5 --> n6
  n7["Llama a ProviderConnectionsRepository.findByIdInScope"]:::llamada
  n6 --> n7
  n8[("LEE integrations.provider_connections")]:::efecto
  n7 --> n8
  n9["Llama a OutboundMessagesRepository.findByIdForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE integrations.outbound_messages")]:::efecto
  n9 --> n10
  n11{"!message || message.connectionId !== connection.id"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"message.statusConceptId !== INTEG.MSG_QUEUED"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El mensaje no está en cola"]):::error
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
  n22["Llama a IntegrationsSecretsService.resolveActiveSecrets"]:::llamada
  n21 --> n22
  n19 -->|"no"| n22
  n23["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n22 --> n23
  n24[("LEE integrations.provider_connections")]:::efecto
  n23 --> n24
  n25["Llama a ProviderCredentialsRepository.findActiveByConnection"]:::llamada
  n24 --> n25
  n26[("LEE integrations.provider_credentials")]:::efecto
  n25 --> n26
  n27{"!secrets"}:::decision
  n26 --> n27
  n28(["422 PRECONDITION_FAILED La conexión no tiene un secreto activo disponible"]):::error
  n27 -->|"sí"| n28
  n29["Llama a HttpDispatcherService.post"]:::llamada
  n27 -->|"no"| n29
  n30{"requestBytes › MAX_DISPATCH_REQUEST_BYTES"}:::decision
  n29 --> n30
  n31(["422 PRECONDITION_FAILED El cuerpo del despacho excede el tamaño permitido"]):::error
  n30 -->|"sí"| n31
  n32["Intenta"]:::intento
  n30 -->|"no"| n32
  n33{"error instanceof PreconditionFailedException"}:::decision
  n32 -->|"si falla"| n33
  n34(["↩ (relanza el error capturado)"]):::error
  n33 -->|"sí"| n34
  n35[("ACTUALIZA integrations.outbound_messages · ACTUALIZA integrations.outbound_messages")]:::efecto
  n32 --> n35
  n33 -->|"no"| n35
  n36["Llama a MessageResponsesRepository.create"]:::llamada
  n35 --> n36
  n37[("CREA integrations.message_responses")]:::efecto
  n36 --> n37
  n38(("200 Responde con éxito")):::ok
  n37 --> n38
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
  n5["Llama a IntegrationsMessagingService.resolveMessageInScope"]:::llamada
  n4 --> n5
  n6["Llama a OutboundMessagesRepository.findById"]:::llamada
  n5 --> n6
  n7[("LEE integrations.outbound_messages")]:::efecto
  n6 --> n7
  n8["Llama a ProviderConnectionsRepository.findByIdInScope"]:::llamada
  n7 --> n8
  n9[("LEE integrations.provider_connections")]:::efecto
  n8 --> n9
  n10{"message.statusConceptId !== INTEG.MSG_FAILED"}:::decision
  n9 --> n10
  n11(["422 PRECONDITION_FAILED El mensaje no está en estado fallido"]):::error
  n10 -->|"sí"| n11
  n12["Llama a MessageRetriesRepository.maxAttempt"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE integrations.message_retries")]:::efecto
  n12 --> n13
  n14{"attemptNumber › MAX_ATTEMPTS"}:::decision
  n13 --> n14
  n15(["422 PRECONDITION_FAILED Se agotaron los reintentos (usar dead-letter)"]):::error
  n14 -->|"sí"| n15
  n16["Llama a MessageRetriesRepository.create"]:::llamada
  n14 -->|"no"| n16
  n17[("CREA integrations.message_retries")]:::efecto
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
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsMessagingService.listFailedForRetry"]:::llamada
  n2 --> n3
  n4["Llama a IntegrationsMessagingService.scopedConnectionIds"]:::llamada
  n3 --> n4
  n5["Llama a ProviderConnectionsRepository.findIdsByTenant"]:::llamada
  n4 --> n5
  n6[("LEE integrations.provider_connections")]:::efecto
  n5 --> n6
  n7["Llama a OutboundMessagesRepository.findFailed"]:::llamada
  n6 --> n7
  n8[("LEE integrations.outbound_messages")]:::efecto
  n7 --> n8
  n9["Repite: map(…)"]:::bucle
  n8 --> n9
  n10["Llama a MessageRetriesRepository.maxAttempt"]:::llamada
  n9 -->|"cada elemento"| n10
  n11[("LEE integrations.message_retries")]:::efecto
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no tiene un secreto activo disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a IntegrationsWebhooksService.receiveInbound"]:::llamada
  n2 --> n3
  n4["Intenta"]:::intento
  n3 --> n4
  n5["Llama a IntegrationsWebhooksService.persistInbound"]:::llamada
  n4 --> n5
  n6["Transacción: transactional(…)"]:::transaccion
  n5 --> n6
  n7["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n6 --> n7
  n8[("LEE integrations.provider_connections")]:::efecto
  n7 --> n8
  n9{"!connection"}:::decision
  n8 --> n9
  n10(["404 NOT_FOUND Conexión no encontrada"]):::error
  n9 -->|"sí"| n10
  n11["Llama a IntegrationsSecretsService.resolveActiveSecrets"]:::llamada
  n9 -->|"no"| n11
  n12["Llama a ProviderConnectionsRepository.findById"]:::llamada
  n11 --> n12
  n13[("LEE integrations.provider_connections")]:::efecto
  n12 --> n13
  n14["Llama a ProviderCredentialsRepository.findActiveByConnection"]:::llamada
  n13 --> n14
  n15[("LEE integrations.provider_credentials")]:::efecto
  n14 --> n15
  n16{"!secrets"}:::decision
  n15 --> n16
  n17(["422 PRECONDITION_FAILED La conexión no tiene un secreto activo disponible"]):::error
  n16 -->|"sí"| n17
  n18{"!signature || !secrets.some((secret) =› verifySignature(secret, rawBody, signature))"}:::decision
  n16 -->|"no"| n18
  n19(["401 UNAUTHENTICATED Firma del webhook inválida"]):::error
  n18 -->|"sí"| n19
  n20["Llama a InboundMessagesRepository.findByConnectionAndSignature"]:::llamada
  n18 -->|"no"| n20
  n21[("LEE integrations.inbound_messages")]:::efecto
  n20 --> n21
  n22["Llama a InboundMessagesRepository.create"]:::llamada
  n21 --> n22
  n23[("CREA integrations.inbound_messages")]:::efecto
  n22 --> n23
  n24{"error instanceof UniqueConstraintViolationException && signature"}:::decision
  n4 -->|"si falla"| n24
  n25["Llama a InboundMessagesRepository.findByConnectionAndSignature"]:::llamada
  n24 -->|"sí"| n25
  n26[("LEE integrations.inbound_messages")]:::efecto
  n25 --> n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 --> n27
  n24 -->|"no"| n27
  n28(("201 Responde con éxito")):::ok
  n23 --> n28
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
| GET /integrations/messages/pending-correlation | 200, 401, 403, 429 | 2 |
| GET /integrations/messages/pending-dispatch | 200, 401, 403, 429 | 2 |
