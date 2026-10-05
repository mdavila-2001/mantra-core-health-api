# Revisión backend — `messaging`

Fecha: 2026-10-05. Alcance leído: controladores HTTP y webhook, DTOs, servicios,
repositorios, entidades, gateway WebSocket, pruebas unitarias, worker de mensajería y DDL
`database/SQL/35_messaging`.

## Resultado

Se confirmaron dos fallas altas. No se observó un bypass de la bandeja in-app ni del
webhook: la bandeja se filtra por `recipientUserId`, el marcado exige el mismo actor y el
webhook verifica HMAC antes de mutar una entrega.

### MSG-01 — Alta — el índice único impide entregar un evento a más de una suscripción

**Evidencia.** `OutboxService.fanOutToSubscribers()` recorre todas las suscripciones que
coinciden y crea una entrega con `attemptNumber: 1` para cada una
([`src/modules/messaging/services/outbox.service.ts:477`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/outbox.service.ts#L477),
[`src/modules/messaging/services/outbox.service.ts:498`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/outbox.service.ts#L498)).
La tabla contiene `subscription_id` precisamente para distinguir esos destinos
([`database/SQL/35_messaging/02_tables.sql:65`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/35_messaging/02_tables.sql#L65)).
Sin embargo, el DDL impone unicidad en `(domain_event_id, attempt_number)`
([`database/SQL/35_messaging/04_indexes.sql:49`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/35_messaging/04_indexes.sql#L49)).
Como el servicio siempre usa intento `1` para la primera entrega, el segundo suscriptor
provoca violación de unicidad y revierte la transacción completa.

**Impacto.** Un evento publicado con dos suscripciones activas no se distribuye a ninguna;
los consumidores aguas abajo no reciben el hecho. Los tests actuales sólo ejercen un
suscriptor y usan repositorios simulados
([`src/modules/messaging/services/outbox.service.spec.ts:280`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/outbox.service.spec.ts#L280)),
por lo que no revelan la restricción real.

**Plan de corrección.** Sustituir el índice por unicidad en
`(domain_event_id, subscription_id)`, que corresponde a la idempotencia declarada por el
servicio; preparar migración compatible y revisar cualquier dato duplicado antes de crearla.
Mantener `attempt_number` como atributo del intento o modelar una tabla de intentos si se
necesita más de uno por entrega. Añadir una prueba de integración con dos suscripciones y
una repetición de despacho.

| Caso | Resultado exigido |
| --- | --- |
| Correcto | Dos suscripciones activas del mismo evento crean dos filas, una por `subscription_id`, y ambos jobs quedan encolados. |
| Límite | Una sola suscripción conserva una entrega; reintentar el mismo despacho devuelve esa entrega sin duplicarla. |
| Error | Una suscripción con cola inexistente o inactiva registra el aviso y no impide crear las entregas de las demás. |
| Falla catalogada | Evento inexistente: `404`, `NOT_FOUND`, motivo estable `DOMAIN_EVENT_NOT_FOUND`; evento aún no publicado: `422`, `PRECONDITION_FAILED`, motivo `DOMAIN_EVENT_NOT_PUBLISHED`. |

### MSG-02 — Alta — la API admite dirección externa que el esquema rechaza con error de base

**Evidencia.** El DTO hace opcionales tanto `recipientUserId` como `recipientAddress` y
presenta la segunda como destino de canal externo
([`src/modules/messaging/dto/messaging.dto.ts:614`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/dto/messaging.dto.ts#L614),
[`src/modules/messaging/dto/messaging.dto.ts:622`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/dto/messaging.dto.ts#L622)).
El servicio sólo rechaza cuando faltan ambos
([`src/modules/messaging/services/notifications.service.ts:120`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/notifications.service.ts#L120))
y pasa `recipientUserId` indefinido al repositorio
([`src/modules/messaging/services/notifications.service.ts:213`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/notifications.service.ts#L213)).
El repositorio persiste ese valor directamente
([`src/modules/messaging/repositories/notifications.repository.ts:266`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/repositories/notifications.repository.ts#L266)),
pero `notification_requests.recipient_user_id` es `NOT NULL`
([`database/SQL/35_messaging/02_tables.sql:260`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/database/SQL/35_messaging/02_tables.sql#L260)).

**Impacto.** Una petición válida según el contrato HTTP con sólo `recipientAddress` llega al
flush y falla por restricción `NOT NULL`; no hay una excepción de dominio que traduzca ese
caso, de modo que se expone como `500 INTERNAL` en vez de una falla catalogada. El módulo no
puede crear notificaciones para un destinatario externo pese a anunciarlo.

**Plan de corrección.** Elegir y hacer consistente un contrato: si se soporta destinatario
externo, volver nullable `recipient_user_id` mediante migración y exigir una referencia de
destinatario o endpoint válida; si toda solicitud debe mapear a usuario ALOVIDA, hacer
`recipientUserId` obligatorio y rechazar sólo-dirección antes de persistir. En ambos casos,
validar la combinación en DTO/servicio y lanzar una `DomainException` con razón estable,
sin delegar la validación al driver.

| Caso | Resultado exigido |
| --- | --- |
| Correcto | Destinatario interno válido crea la solicitud pendiente o suprimida y conserva su evidencia. |
| Límite | Canal externo con sólo dirección sigue el contrato elegido y persiste todos los campos obligatorios, sin error del ORM. |
| Error | Cuerpo sin usuario ni dirección es rechazado antes de abrir la operación de persistencia. |
| Falla catalogada | Combinación de destinatario no permitida: `422`, `PRECONDITION_FAILED`, razón `NOTIFICATION_RECIPIENT_INVALID`; canal inexistente: `404`, `NOT_FOUND`, razón `MESSAGE_CHANNEL_NOT_FOUND`. |

## Controles verificados y cobertura pendiente

- La ruta pública de acuses sólo llama al servicio después de `@Public`; el servicio busca el
  proveedor y verifica HMAC antes de buscar o cambiar una entrega
  ([`provider-webhooks.controller.ts:32`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/controllers/provider-webhooks.controller.ts#L32),
  [`notifications.service.ts:523`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/notifications.service.ts#L523)).
- `markInAppRead` bloquea la modificación de una bandeja ajena y `listMine` filtra las filas y
  el contador por el usuario autenticado
  ([`notifications.service.ts:634`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/notifications.service.ts#L634),
  [`notifications.service.ts:767`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/notifications.service.ts#L767)).
- Relay, reclamo de cola y reclamo de notificaciones usan bloqueo pesimista parcial; completar
  y fallar un job también comprueban `lockedBy`.
- Falta una prueba de integración contra PostgreSQL para MSG-01 y una prueba HTTP/de
  persistencia de sólo `recipientAddress` para MSG-02. Las pruebas dirigidas son unitarias con
  repositorios simulados, por lo que no validan las restricciones del DDL.

## Verificación ejecutada

`corepack yarn test src/modules/messaging --runInBand --silent` — 9 suites, 123 pruebas aprobadas.
