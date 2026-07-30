# Controladores de mensajería

Capa HTTP: recibe, delega y devuelve. Sin lógica de negocio.

## Controladores

Tres, porque tienen tres públicos distintos:

- **`MessagingController`** (sin prefijo) — lo que llaman los módulos de negocio y los usuarios:
  `/queues/*`, `/notifications/*`.
- **`MessagingInternalController`** (`/internal`) — lo que llaman los workers. Va aparte para que
  quede claro que no es superficie de cliente: son operaciones que asumen un worker con su propio
  ciclo de vida y su propia reserva de trabajo.
- **`ProviderWebhooksController`** (`/webhooks/providers`) — lo que llama un proveedor externo.

`MessagingController` no declara prefijo porque sus rutas cuelgan de dos raíces distintas
(`/queues` y `/notifications`) que el caso de uso fija así.

## Rutas

| Método | Ruta | UC |
| --- | --- | --- |
| `POST` | `/queues/:code/jobs` | 05 |
| `POST` | `/queues/dead-letter/:deadLetterJobId/redrive` | 09 |
| `POST` | `/notifications/requests` | 10 |
| `POST` | `/notifications/in-app/:id/read` | 13 |
| `POST` | `/internal/outbox/relay/run` | 02 |
| `POST` | `/internal/events/:domainEventId/dispatch` | 03 |
| `POST` | `/internal/event-deliveries/:id/ack` | 04 |
| `POST` | `/internal/queues/:code/claim` | 06 |
| `POST` | `/internal/jobs/:id/complete` | 07 |
| `POST` | `/internal/jobs/:id/fail` | 08 |
| `POST` | `/internal/notifications/:requestId/deliver` | 11 |
| `POST` | `/webhooks/providers/:providerCode/receipts` | 12 |

UC-35-01 no aparece: no es un endpoint. Ver el README del módulo.

## Decisiones de ruteo

- **`/queues/dead-letter/:id/redrive` frente a `/queues/:code/jobs`**: `dead-letter` es un literal y
  `:code` un parámetro. Nest los distingue por especificidad, y aquí además llevan sufijos distintos
  (`/redrive` y `/jobs`), así que no hay ambigüedad posible.
- **`:code` y `:providerCode` no llevan `ParseUUIDPipe`**: son códigos legibles elegidos al crear la
  cola o registrar el proveedor, no identificadores.
- **UC-35-13 sin cuerpo**: marcar leído no aporta datos; quién lo marca sale de la sesión.

## Códigos de estado

`201 Created` en lo que crea recurso (05, 09, 10, 11). `200 OK` en lo que actúa sobre algo existente
o devuelve un lote (02, 03, 04, 06, 07, 08, 12, 13).

Las respuestas con `duplicate: true` también son `2xx`: lo repetido no es un error en este módulo.

## Permisos

`MESSAGING_ADMIN` en todo. `SYSTEM` en lo que operan los workers (02–08, 11) y en el encolado y la
solicitud de notificación (05, 10). `USER` sólo en 13, y el servicio comprueba además que la
notificación sea suya.

`/webhooks/providers/:providerCode/receipts` es `@Public()`: quien llama es un proveedor externo sin
sesión. La verificación de firma está pendiente (ver README del módulo).

## Pruebas

- `messaging.controller.spec.ts` (4)
- `messaging-internal.controller.spec.ts` (7)
- `provider-webhooks.controller.spec.ts` (2)
