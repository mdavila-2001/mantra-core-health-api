<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/integrations/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `integrations`

**Fuente:** [`src/modules/integrations/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/integrations/README.md)
· 4 controllers · 4 services · 9 repositories · 10 entidades · 9 DTO

---

# src / modules / integrations

Agrupa los componentes relacionados con **integrations** y mantiene cohesionada esta responsabilidad del sistema.

<<<<<<< HEAD
## Contenido
=======
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
>>>>>>> 8a44a3cc (docs(modules): rutas HTTP, entidades e imports medidos en los 62 READMEs restantes)

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/integrations/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/integrations/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/integrations/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/integrations/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/integrations/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `integrations.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `integrations.module.ts` | Composición de dependencias del módulo NestJS. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

