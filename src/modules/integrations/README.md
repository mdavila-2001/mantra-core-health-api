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

Revisión 2026-10-05: **7 suites y 53 pruebas aprobadas**. Las pruebas son unitarias con mocks;
faltan pruebas de aislamiento entre tenants, bóveda de secretos, carrera de callbacks y contrato
`status + code + reason`. El detalle y plan de corrección están en
[`docs/revision-backend-2026-10-04/modulos/integrations.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/integrations.md).
