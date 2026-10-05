# Revisión del módulo `integrations` — ALOVIDA

Fecha: 2026-10-05. Se revisaron controladores, DTO, servicios, repositorios, entidades, DDL de
`database/SQL/12_integrations`, pruebas unitarias y los jobs consumidores. No se modificó código.

## Resultado y alcance

| Severidad | Hallazgos |
| --- | ---: |
| Crítica | 1 |
| Alta | 2 |
| Media | 1 |
| Baja | 0 |

La unidad administra proveedores globales, conexiones por tenant, credenciales, endpoints,
mensajes de salida, reintentos, callbacks y suscripciones. Hay controles reales: JWT por defecto,
roles en administración y workers, transacciones para las mutaciones, `FOR UPDATE` al despachar,
y protección SSRF para el POST saliente. El webhook es la única ruta pública y rechaza firmas
inválidas antes de persistir.

No se revisó una ejecución contra PostgreSQL ni un proveedor externo real. Las pruebas existentes
usan repositorios simulados, por lo que no comprueban aislamiento tenant, índices ni carreras.

## Mapa operativo

| Ruta | Acceso declarado | Caso de uso |
| --- | --- | --- |
| `POST /integrations/providers` | `SECURITY_ADMIN` | registrar proveedor |
| `POST /integrations/providers/:id/connections` | `SECURITY_ADMIN` | crear conexión y credencial |
| `POST /integrations/providers/:id/endpoints` | `SECURITY_ADMIN` | publicar endpoint/mapeos |
| `POST /integrations/providers/:id/webhook-subscriptions` | `SECURITY_ADMIN` | alta o actualización lógica de suscripción |
| `POST /integrations/connections/:id/credentials:rotate`, `:pause` | `SECURITY_ADMIN` | rotar o pausar conexión |
| `POST /integrations/messages:outbound` | JWT, sin rol específico | encolar salida |
| `GET /integrations/messages/pending-*`, `POST /integrations/messages/:id:*` | `SYSTEM` o `SECURITY_ADMIN` | trabajo de despacho, reintento y correlación |
| `POST /integrations/webhooks/inbound` | pública; HMAC propio | recibir callback |

Entidades: `external_providers`, `provider_connections`, `provider_credentials`,
`integration_endpoints`, `integration_field_mappings`, `outbound_messages`,
`message_responses`, `message_retries`, `inbound_messages` y `webhook_subscriptions`.

## Hallazgos confirmados

### INT-01 — Crítica — recursos de tenant se resuelven por UUID sin cotejar el tenant activo

Los guardias globales resuelven el tenant del request, pero el interceptor sólo contrasta los
`tenantId` explícitos del cuerpo con ese valor; no puede autorizar un UUID ya persistido. Las
conexiones, mensajes y callbacks se leen por `{ id }` sin tenant:

- [`provider-connections.repository.ts:53`](../../../src/modules/integrations/repositories/provider-connections.repository.ts#L53)
  y [`outbound-messages.repository.ts:69-105`](../../../src/modules/integrations/repositories/outbound-messages.repository.ts#L69-L105)
  realizan las búsquedas por ID, idempotencia y correlación sin scope.
- [`integrations-messaging.service.ts:92-143`](../../../src/modules/integrations/services/integrations-messaging.service.ts#L92-L143)
  permite al endpoint autenticado sin rol elegir cualquier `connectionId`; las transiciones de
  reintento, dead-letter y correlación también parten de UUIDs sin tenant
  ([líneas 267-441](../../../src/modules/integrations/services/integrations-messaging.service.ts#L267-L441)).
- Rotar o pausar usa `findById` de conexión ([`integrations-connections.service.ts:143-242`](../../../src/modules/integrations/services/integrations-connections.service.ts#L143-L242)).
  `RLS_ENFORCE` sólo envuelve el request si la variable vale `true`
  ([`tenant-context.interceptor.ts:128-145`](../../../src/common/tenant/tenant-context.interceptor.ts#L128-L145));
  con su valor normal desactivado el servicio no tiene segunda barrera.

Un usuario autenticado de A que conozca una conexión de B puede encolar un payload hacia el
proveedor de B. Un administrador de A puede rotar su credencial o detener la conexión; los jobs
con `SYSTEM` además pueden alterar cualquier mensaje conocido. Puede causar salida de información
clínica hacia un tercero, indisponibilidad o cambio de secreto en otro tenant.

**Plan de corrección.** Obtener el tenant del contexto en cada servicio, rechazar el caso sin
tenant salvo el actor `SYSTEM` estrictamente interno, y sustituir los resolvers por
`findByIdInTenant(id, tenantId)`. La cadena mensaje → conexión → proveedor/endpoint y callback →
conexión → mensaje saliente debe verificarse completa antes de leer o mutar. Derivar el tenant al
crear conexiones y suscripciones en vez de confiar en el DTO; devolver 404 uniforme para recursos
fuera de alcance. Activar RLS es defensa adicional, no reemplazo de esta autorización.

### INT-02 — Alta — los secretos registrados no autentican webhooks ni despachos

El alta y la rotación persisten `secretRef` como referencia de bóveda
([`integrations-connections.service.ts:102-109`](../../../src/modules/integrations/services/integrations-connections.service.ts#L102-L109),
[`165-173`](../../../src/modules/integrations/services/integrations-connections.service.ts#L165-L173)),
pero los dos flujos HMAC lo ignoran. En su lugar derivan una clave desde una única raíz y el UUID
de conexión ([`integrations-webhooks.service.ts:67-75`](../../../src/modules/integrations/services/integrations-webhooks.service.ts#L67-L75),
[`integrations-messaging.service.ts:207-216`](../../../src/modules/integrations/services/integrations-messaging.service.ts#L207-L216)).
La propia función declara que es un puente y que debe reemplazarse por secreto real por conexión
([`webhook-signature.ts:56-72`](../../../src/common/crypto/webhook-signature.ts#L56-L72)).

El proveedor no recibe ni puede reproducir el secreto derivado a partir de una `secretRef`; una
firma HMAC real será rechazada. Rotar la credencial tampoco invalida el material usado por la
verificación. La ruta pública queda operable sólo para quien conozca la raíz de plataforma o para
un simulador que replique ese atajo.

**Plan de corrección.** Añadir un adaptador de bóveda que resuelva la referencia de la credencial
activa para cada conexión, usarlo para firmar el despacho y validar el callback, y conservar una
ventana explícita de claves anterior/nueva durante rotación si el proveedor lo exige. Eliminar la
derivación de producción, registrar sólo IDs de referencia y fallar de forma catalogada cuando la
bóveda no entregue un secreto activo.

### INT-03 — Alta — la deduplicación de callbacks no es atómica

El webhook consulta primero por `(connectionId, signature)` y después inserta
([`inbound-messages.repository.ts:60-67`](../../../src/modules/integrations/repositories/inbound-messages.repository.ts#L60-L67),
[`integrations-webhooks.service.ts:77-111`](../../../src/modules/integrations/services/integrations-webhooks.service.ts#L77-L111)).
Sin embargo, el DDL sólo declara la clave primaria de `inbound_messages`
([`02_tables.sql:99-115`](../../../database/SQL/12_integrations/02_tables.sql#L99-L115)) y los índices no incluyen
firma ni la pareja de deduplicación ([`04_indexes.sql:67-75`](../../../database/SQL/12_integrations/04_indexes.sql#L67-L75)).

Dos entregas concurrentes con la misma firma ven ausencia antes de cualquiera de los `flush` y
ambas se persisten. Después las dos pueden entrar al descubrimiento de correlación, producir dos
respuestas para el mismo saliente y repetir efectos del consumidor.

**Plan de corrección.** Declarar `UNIQUE (connection_id, signature)` para firmas no nulas en una
migración; usar `INSERT ... ON CONFLICT` o capturar la violación y releer la fila existente dentro
de la transacción. Definir una clave de entrega del proveedor si éste reutiliza la firma para
eventos distintos, y proteger la correlación con bloqueo/estado condicional.

### INT-04 — Media — los fallos del módulo no exponen `reason` estable

No existe `integrations.error-reasons.ts`. Las excepciones de dominio reciben objetos como
`{ connectionId }` o `{ messageId }`, sin `details.reason` ([`integrations-messaging.service.ts:96-104`](../../../src/modules/integrations/services/integrations-messaging.service.ts#L96-L104),
[`267-288`](../../../src/modules/integrations/services/integrations-messaging.service.ts#L267-L288)); el
contrato de `DomainException` no lo añade automáticamente
([`domain.exception.ts:22-29`](../../../src/common/errors/domain.exception.ts#L22-L29)). Las colisiones de los
índices y las carreras de INT-03 por tanto pueden salir como 500 de ORM.

**Plan de corrección.** Crear catálogo del módulo y emitir, entre otras, `INTEGRATION_CONNECTION_OUT_OF_SCOPE`,
`INTEGRATION_CONNECTION_INACTIVE`, `WEBHOOK_SIGNATURE_INVALID`, `WEBHOOK_DELIVERY_DUPLICATE` y
`INTEGRATION_SECRET_UNAVAILABLE`; cada una debe llevar status, `ErrorCode` y `reason`. Traducir
las violaciones de índice de idempotencia/suscripción antes de que lleguen al filtro genérico.

## Plan de pruebas exigido

| Hallazgo | Caso | Prueba propuesta | Resultado esperado |
| --- | --- | --- | --- |
| INT-01 | Correcto | integración: usuario A encola con conexión A y administra A | 201/200, sólo filas y tránsito de A |
| INT-01 | Límite | actor `SYSTEM` firmado opera un barrido explícito cross-tenant | sólo el ámbito declarado; sin tenants contradictorios |
| INT-01 | Error | usuario/admin A usa UUID de conexión o mensaje de B | 404; no se envía, rota, pausa ni cambia B |
| INT-01 | Falla catalogada | UUID inexistente o fuera de alcance | `404/NOT_FOUND/INTEGRATION_CONNECTION_OUT_OF_SCOPE` |
| INT-02 | Correcto | callback firmado con secreto resuelto de la credencial activa | 201 y mensaje `RECEIVED` |
| INT-02 | Límite | rotación: firma vieja sólo durante ventana documentada y nueva inmediatamente | aceptación exacta según ventana, sin secreto en logs |
| INT-02 | Error | firma de otra conexión/proveedor | 401 sin insertar callback |
| INT-02 | Falla catalogada | referencia ausente o bóveda indisponible | `503/DEPENDENCY_UNAVAILABLE/INTEGRATION_SECRET_UNAVAILABLE` |
| INT-03 | Correcto | una entrega firmada crea una sola fila | 201, `duplicate: false` |
| INT-03 | Límite | dos POST concurrentes misma clave de entrega | una fila; una respuesta es duplicado |
| INT-03 | Error | misma firma bajo conexiones distintas | filas independientes si ambos secretos son válidos |
| INT-03 | Falla catalogada | conflicto de índice durante reentrega | `200/409` documentado, `CONFLICT/WEBHOOK_DELIVERY_DUPLICATE`, nunca 500 |
| INT-04 | Correcto | estado inválido de mensaje propio | respuesta de dominio con `code` y `reason` |
| INT-04 | Límite | `deadLetter` repetido | operación idempotente estable |
| INT-04 | Error | conexión pausada al encolar | 422 sin fila saliente |
| INT-04 | Falla catalogada | proveedor/conexión inexistente | `404/NOT_FOUND/INTEGRATION_RESOURCE_NOT_FOUND` |

## Orden de ejecución

1. **Ola 0 (L):** INT-01, con pruebas de dos tenants y RLS activado en integración.
2. **Ola 1 (M):** INT-02 y catálogo INT-04; completar la integración con la bóveda antes de aceptar webhooks de producción.
3. **Ola 2 (M):** INT-03, migración de unicidad y prueba PostgreSQL de concurrencia.

## Verificación ejecutada

`corepack yarn test src/modules/integrations --runInBand --silent` — **7 suites y 53 pruebas aprobadas**.
Las suites cubren transiciones y delegación con mocks; no hay pruebas de dos tenants, almacenamiento
real de secretos, carrera de entregas ni aserciones de `status + code + reason`.
