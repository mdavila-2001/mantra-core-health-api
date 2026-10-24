# Integraciones externas

Gestiona proveedores, conexiones tenantizadas, referencias a credenciales, endpoints versionados,
mensajería saliente, reintentos, callbacks entrantes y suscripciones de webhook. Persiste en el
esquema PostgreSQL `integrations`; los workers consumen los endpoints internos de descubrimiento,
despacho, reintento y correlación.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/integrations -name '*.controller.ts' | wc -l
  find src/modules/integrations -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/integrations -name '*.entity.ts' | wc -l
  find src/modules/integrations -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **4 controllers, 15 rutas HTTP, 10 entidades y 4 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 10 de 10 archivos `*.entity.ts`): `external_providers`, `inbound_messages`, `integration_endpoints`, `integration_field_mappings`, `message_responses`, `message_retries`, `outbound_messages`, `provider_connections`, `provider_credentials`, `webhook_subscriptions`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /integrations/connections/:id/credentials\\:rotate` | SECURITY_ADMIN | `integrations-connections` |
| `POST /integrations/connections/:id\\:pause` | SECURITY_ADMIN | `integrations-connections` |
| `POST /integrations/messages\\:outbound` | sesión | `integrations-messages` |
| `GET /integrations/messages/pending-dispatch` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:dispatch` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `GET /integrations/messages/pending-retry` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:retry` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:dead-letter` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `GET /integrations/messages/pending-correlation` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:correlate` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/providers` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/providers/:id/connections` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/providers/:id/endpoints` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/providers/:id/webhook-subscriptions` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/webhooks/inbound` | pública | `integrations-webhooks` |


## Contenido

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/integrations -name '*.controller.ts' | wc -l
  find src/modules/integrations -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/integrations -name '*.entity.ts' | wc -l
  find src/modules/integrations -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **4 controllers, 15 rutas HTTP, 10 entidades y 4 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 10 de 10 archivos `*.entity.ts`): `external_providers`, `inbound_messages`, `integration_endpoints`, `integration_field_mappings`, `message_responses`, `message_retries`, `outbound_messages`, `provider_connections`, `provider_credentials`, `webhook_subscriptions`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /integrations/connections/:id/credentials\\:rotate` | SECURITY_ADMIN | `integrations-connections` |
| `POST /integrations/connections/:id\\:pause` | SECURITY_ADMIN | `integrations-connections` |
| `POST /integrations/messages\\:outbound` | sesión | `integrations-messages` |
| `GET /integrations/messages/pending-dispatch` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:dispatch` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `GET /integrations/messages/pending-retry` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:retry` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:dead-letter` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `GET /integrations/messages/pending-correlation` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/messages/:id\\:correlate` | SYSTEM, SECURITY_ADMIN | `integrations-messages` |
| `POST /integrations/providers` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/providers/:id/connections` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/providers/:id/endpoints` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/providers/:id/webhook-subscriptions` | SECURITY_ADMIN | `integrations-providers` |
| `POST /integrations/webhooks/inbound` | pública | `integrations-webhooks` |

## Rutas

| Ruta | Rol | DTO | Resultado |
| --- | --- | --- | --- |
| `POST /integrations/providers` | `SECURITY_ADMIN` | `RegisterProviderDto` | proveedor activo |
| `POST /integrations/providers/:id/connections` | `SECURITY_ADMIN` | `ProvisionConnectionDto` | conexión y credencial |
| `POST /integrations/providers/:id/endpoints` | `SECURITY_ADMIN` | `PublishEndpointDto` | endpoint y mapeos |
| `POST /integrations/providers/:id/webhook-subscriptions` | `SECURITY_ADMIN` | `CreateWebhookSubscriptionDto` | suscripción creada o actualizada |
| `POST /integrations/connections/:id/credentials:rotate` | `SECURITY_ADMIN` | `RotateCredentialDto` | nueva credencial |
| `POST /integrations/connections/:id:pause` | `SECURITY_ADMIN` | — | conexión pausada y mensajes retenidos |
| `POST /integrations/messages:outbound` | JWT | `EnqueueOutboundDto` | mensaje encolado idempotentemente |
| `GET /integrations/messages/pending-*` y acciones `:dispatch`, `:retry`, `:dead-letter`, `:correlate` | `SYSTEM` o `SECURITY_ADMIN` | `DispatchMessageDto` donde aplica | trabajo del worker |
| `POST /integrations/webhooks/inbound` | pública | `InboundWebhookDto` | callback recibido tras HMAC |

## Estructura y datos

- [`controllers/`](./controllers/README.md): adaptadores HTTP.
- [`dto/`](./dto/README.md): contratos de entrada/salida.
- [`services/`](./services/README.md): transiciones, transacciones y despacho HTTP.
- [`repositories/`](./repositories/README.md): acceso a datos.
- [`entities/`](./entities/README.md): tablas `external_providers`, `provider_connections`,
  `provider_credentials`, `integration_endpoints`, `integration_field_mappings`, mensajes,
  reintentos y suscripciones.
- `integrations.concepts.ts`: IDs deterministas de estados, tipos y protocolos.
- `integrations.module.ts`: composición NestJS y `HttpDispatcherService`.

## Probar

```bash
corepack yarn test src/modules/integrations --runInBand --silent
```

Las pruebas son unitarias con mocks de repositorio y EntityManager; cubren el aislamiento entre
tenants, la resolución del secreto de la credencial activa y la deduplicación de callbacks. La
unicidad `(connection_id, signature)` y la serialización por lock se prueban contra un doble de la
base, no contra PostgreSQL.

## Alcance por tenant y secretos

- **El tenant sale del contexto.** `tenantId` en el cuerpo de `POST /providers/:id/connections` y de
  `.../webhook-subscriptions` es opcional y, si llega, debe coincidir con el activo
  (`412 INTEGRATIONS_TENANT_MISMATCH`). Sin tenant activo se responde `412 TENANT_REQUIRED`.
- **Mensaje → conexión → tenant.** Encolar, despachar, reintentar, enviar a dead-letter y correlacionar
  resuelven la conexión del recurso por `id + tenantId` antes de leer o mutar. Un recurso de otro
  tenant responde igual que uno inexistente: `404`, mismo mensaje y `reason`
  `INTEGRATIONS_RESOURCE_NOT_AVAILABLE`, sin `details`. Los listados de descubrimiento
  (`pending-dispatch`, `pending-retry`, `pending-correlation`) se acotan a las conexiones del tenant.
- **`SYSTEM` sin tenant** es el único actor que barre todas las conexiones (los jobs internos de
  despacho, reintento y correlación); con `X-Tenant-Id` queda acotado a ese tenant.
- **Callback → conexión → saliente.** La correlación sólo alcanza salientes de la misma conexión que
  recibió el callback y bloquea el callback (`FOR UPDATE`): dos correlaciones simultáneas producen una
  sola respuesta.
- **El secreto lo da la credencial activa.** El despacho se firma y el callback se verifica con la
  referencia (`secretRef`) de la credencial activa de la conexión, resuelta por
  `IntegrationsSecretsService` (`env:WEBHOOK_SECRET_<NOMBRE>`, ver `common/crypto/secret-ref.ts`). Para
  una rotación con ventana, la referencia admite dos entradas: `env:..._V2,env:..._V1` (firma con la
  primera; valen ambas al verificar). Rotar la credencial retira la anterior. Sin credencial activa o
  con una referencia que no resuelve se responde `412
  INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE`; no hay retroceso a una clave derivada del UUID.
- **Callbacks idempotentes.** Un lock transaccional por `(conexión, firma)` serializa las entregas
  simultáneas y el índice único `uq_inbound_messages_connection_id_signature`
  (`database/SQL/patches/2026-10-24_integrations_inbound_signature_unique.sql`) es el respaldo: la
  entrega perdedora responde como duplicado de la primera.
