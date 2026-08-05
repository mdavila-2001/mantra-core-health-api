# 02 · Catálogo de spans de negocio

> Fase 8. Inventario de los spans que **el código de este repositorio crea a mano**, por qué
> existen y qué datos llevan. Los spans automáticos (HTTP, Express, NestJS, PostgreSQL, Redis,
> MongoDB) no se catalogan aquí: los define la instrumentación, no el proyecto.

## Criterio de selección

Un span manual solo se justifica cuando responde una pregunta que los spans técnicos **no**
pueden responder. Instrumentar cada método produciría trazas de cien spans donde ninguno significa
nada. Los cinco spans de este catálogo cumplen al menos uno de estos criterios:

1. La operación tiene varios caminos de fallo que el cliente no distingue (autenticación).
2. La operación cruza procesos o momentos (outbox).
3. La operación depende de un tercero cuya latencia no es visible de otro modo (notificaciones).
4. La operación no nace de una petición HTTP y, sin traza raíz, su trabajo sería invisible
   (los 30 jobs programados).

## Convención

| Elemento | Regla |
| --- | --- |
| Nombre | `<dominio>.<acción>`, estable, **sin identificadores dinámicos** |
| Productor / consumidor | `<destino> publish` / `<destino> process`, con `SpanKind` explícito |
| Atributos | namespace `app.*` (ver `src/observability/telemetry.constants.ts`) |
| Eventos | hitos internos; nunca llevan datos personales |

---

## `iam.authenticate`

| | |
| --- | --- |
| **Archivo** | [src/modules/iam/services/iam-auth.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/iam/services/iam-auth.service.ts) |
| **Módulo** | `iam` |
| **Operación** | Autenticación por identificador + contraseña (UC-01-04) |
| **Kind** | `INTERNAL` |

**Atributos**

| Atributo | Valor | Cardinalidad |
| --- | --- | --- |
| `app.module` | `iam` | baja |
| `app.operation` | `authenticate` | baja |
| `app.entity.type` | `iam.users` | baja |
| `app.entity.id` | id del usuario, **solo tras autenticar** | alta, permitida |
| `iam.auth.subject_kind` | `email` \| `national_id` | baja |

**Eventos**

| Evento | Atributos | Significado |
| --- | --- | --- |
| `auth.rejected` | `reason: no-subject` | El cuerpo no traía identificador |
| `auth.rejected` | `reason: no-credential` | No existe credencial activa |
| `auth.rejected` | `reason: user-not-active` | La cuenta existe pero no está activa |
| `auth.rejected` | `reason: bad-password` | Contraseña incorrecta |
| `auth.session.issued` | — | Sesión y refresh token emitidos |

**Motivo de negocio.** Los cuatro caminos de fallo devuelven al cliente el **mismo 401 opaco**, a
propósito: distinguirlos le diría a un atacante si un usuario existe. El span es el único lugar
donde queda registrado cuál ocurrió, del lado del servidor, sin filtrarlo. Convierte "los usuarios
se quejan de que no pueden entrar" en una respuesta concreta.

**Riesgos de privacidad.** No se registran contraseña, correo, documento de identidad ni IP. El
`subject_kind` dice *qué tipo* de identificador se usó, nunca su valor. El `userId` solo aparece
cuando la autenticación ya tuvo éxito.

---

## `iam.patient.self-register`

| | |
| --- | --- |
| **Archivo** | [src/modules/iam/services/iam-patient-self-registration.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/iam/services/iam-patient-self-registration.service.ts) |
| **Módulo** | `iam` |
| **Operación** | Auto-registro de paciente |
| **Kind** | `INTERNAL` |

**Atributos**

| Atributo | Valor | Cardinalidad |
| --- | --- | --- |
| `app.module` | `iam` | baja |
| `app.operation` | `patient.self-register` | baja |
| `app.entity.type` | `iam.users` | baja |
| `app.entity.id` | id del usuario creado | alta, permitida |
| `iam.registration.with_email` | booleano | baja |
| `iam.registration.email_sent` | booleano | baja |

**Eventos**

| Evento | Significado |
| --- | --- |
| `registration.persisted` | La transacción confirmó cuenta, persona y perfil |

**Motivo de negocio.** El registro escribe **nueve filas en nueve tablas** de cuatro esquemas
(`iam.users`, `iam.credentials`, `iam.user_global_roles`, `profiles.persons`,
`profiles.person_profiles`, `profiles.patient_profiles`, `profiles.person_account_links`,
`common.identifiers`, `directory.tenant_memberships`), más dos si se aporta correo
(`common.contact_points` e `iam.email_verifications`). Sobre esas escrituras, el
`HistoryMirrorSubscriber` sella además la revisión 1 en `audit.users_history` y
`audit.patient_profiles_history`, dentro de la misma transacción.

Luego encola el correo de verificación **fuera** de la transacción, a propósito: si la mensajería
falla, la cuenta ya creada no debe deshacerse. Eso crea un estado intermedio legítimo ("registrado
pero sin correo") que sin traza es indistinguible de un fallo. Los dos booleanos separan las dos
preguntas: si el flujo incluía correo y si el correo llegó a enviarse.

**Riesgos de privacidad.** No se registra el documento de identidad, ni el correo, ni la fecha de
nacimiento, ni el nombre. Solo booleanos e identificadores internos ya creados.

---

## `messaging.outbox publish`

| | |
| --- | --- |
| **Archivo** | [src/modules/messaging/services/outbox.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/messaging/services/outbox.service.ts) |
| **Módulo** | `messaging` |
| **Operación** | Publicación transaccional de un evento de dominio (UC-35-01) |
| **Kind** | **`PRODUCER`** |

**Atributos**

| Atributo | Valor |
| --- | --- |
| `app.module` / `app.operation` | `messaging` / `outbox.publish` |
| `app.event.type` | tipo del evento (p. ej. `OrderPlaced`) |
| `app.event.id` | `domainEventId` |
| `app.entity.type` / `app.entity.id` | agregado que produjo el hecho |
| `app.tenant.id` | tenant |
| `messaging.system` | `postgresql_outbox` |
| `messaging.destination.name` | `messaging.outbox_messages` |
| `messaging.operation.type` | `publish` |
| `messaging.message.id` | id del mensaje de outbox |
| `messaging.outbox.duplicate` | `true` si la clave de idempotencia ya existía |

**Motivo de negocio.** Es el punto donde el contexto de la petición HTTP se **guarda dentro del
evento** para que el consumidor, en otro proceso y otro momento, continúe la misma traza. Sin este
span la cadena "el usuario hizo X → se publicó el evento → el worker lo entregó" se rompe en el
primer eslabón.

**Detalle de implementación crítico.** El carrier viaja en `metadataJson`, **nunca** en
`payloadJson`: el payload alimenta `deriveIdempotencyKey`, y un `traceparent` (distinto en cada
petición) haría que el mismo hecho publicado dos veces generara claves distintas y rompiera la
idempotencia del outbox. Con la telemetría apagada el carrier viene vacío y la metadata se escribe
exactamente igual que antes de esta iniciativa.

**Riesgos de privacidad.** No se copia el payload del evento en los atributos.

---

## `messaging.outbox process`

| | |
| --- | --- |
| **Archivo** | [src/modules/messaging/services/outbox.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/messaging/services/outbox.service.ts) |
| **Módulo** | `messaging` |
| **Operación** | Fan-out del evento a sus suscriptores (UC-35-03) |
| **Kind** | **`CONSUMER`** |

**Atributos**: los mismos identificadores de evento, más `messaging.operation.type: process`,
`app.result.count` (suscriptores alcanzados) y `messaging.outbox.filtered_out` (descartados por
filtro de suscripción).

**Motivo de negocio.** Cierra el salto asíncrono. El span se crea como **hijo del contexto extraído
de la metadata**, de modo que publicación y consumo comparten `trace_id` y una sola traza cuenta la
historia completa. Además se **enlaza** (`links`) con el span del tick del worker que lo procesó,
para conservar el camino inverso: desde una ejecución del worker se llega a todos los eventos que
atendió.

**Compatibilidad.** Un evento anterior a esta iniciativa no tiene `_trace`; el carrier extraído es
`{}`, el span cuelga de la traza del tick y el procesamiento es idéntico. No hay ninguna rama
especial para mensajes antiguos.

---

## `notification.dispatch`

| | |
| --- | --- |
| **Archivo** | [src/worker/jobs/messaging/notification-delivery.job.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/worker/jobs/messaging/notification-delivery.job.ts) |
| **Módulo** | `messaging` (proceso `redesa-worker-messaging`) |
| **Operación** | Intento de entrega contra el proveedor externo (UC-35-11) |
| **Kind** | `INTERNAL` |

**Atributos**

| Atributo | Valor |
| --- | --- |
| `app.module` / `app.operation` | `messaging` / `notification.dispatch` |
| `app.entity.type` | `messaging.notification_requests` |
| `app.entity.id` | id de la solicitud |
| `messaging.channel.id` | canal (correo, SMS, …) |
| `messaging.delivery.outcome` | `SENT` \| `FAILED` |

**Eventos**: `provider.attempt.started` y `provider.attempt.finished` acotan exactamente el tiempo
que tardó el tercero, separándolo del tiempo propio del worker.

**Motivo de negocio.** Es la única frontera con un sistema que no controlamos. Sin estos dos
eventos, "el envío tardó" no distingue entre un proveedor lento y un worker saturado.

**Riesgos de privacidad.** **Nunca** se registra la dirección del destinatario (correo, teléfono)
ni el contenido del mensaje. El canal es de baja cardinalidad y sirve para comparar proveedores.

---

## Spans raíz de procesos programados

| | |
| --- | --- |
| **Archivo** | [src/worker/run-tick.util.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/worker/run-tick.util.ts) |
| **Nombre** | el mismo `operation` que ya viajaba en los logs, p. ej. `worker.messaging.outbox-relay` |
| **Cobertura** | **los 30 jobs** de los 20 procesos worker, con una sola instrumentación |

**Atributos**: `app.job.name` (baja cardinalidad) y `app.job.execution.id` (UUID por ejecución).

**Motivo de negocio.** Los ticks no nacen de una petición HTTP: sin una traza raíz, su trabajo no
tendría contexto que propagar y las llamadas del worker a la API aparecerían en Jaeger como
peticiones sueltas sin origen. Que el nombre del span sea idéntico al `operation` del log es
deliberado: buscar `worker.messaging.outbox-relay` devuelve lo mismo en el agregador de logs y en
el buscador de trazas.

**Política de error.** `runTick` no propaga los fallos —tumbaría el scheduler de todos los jobs del
proceso—, así que el span se marca explícitamente antes de absorber el error. Sin esa marca, un
tick fallido aparecería como exitoso en Jaeger.

**Evidencia real.** Verificado contra Jaeger: una traza rooteada en
`worker.messaging.outbox-relay` (servicio `redesa-worker-messaging`) contiene, en la misma traza,
`POST /internal/outbox/relay/run`, `MessagingInternalController.runRelay` y sus consultas SQL del
servicio `redesa-api`.

---

## Cómo añadir un span nuevo

1. Comprobar que responde una pregunta que los spans automáticos no responden.
2. Inyectar `TracingService` (no `@opentelemetry/*`).
3. Usar `<dominio>.<acción>` y atributos de `APP_ATTR`.
4. Revisar la [política de privacidad](04-data-privacy-policy.md) antes de añadir cualquier valor.
5. Añadirlo a este catálogo. Un span no documentado no existe para quien opera el sistema.

## Ver también

- [Diseño de la arquitectura](01-architecture-design.md)
- [Política de privacidad de datos](04-data-privacy-policy.md)
- [Guía para desarrolladores](README.md)
