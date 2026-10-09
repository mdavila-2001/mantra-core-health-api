<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/redis_runtime/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `redis_runtime`

**Fuente:** [`src/modules/redis_runtime/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/redis_runtime/README.md)
· 1 controllers · 1 services · 0 repositories · 0 entidades · 3 DTO

---

# MÓDULO 56 — `redis_runtime`

Runtime de baja latencia sobre Redis **real** (contenedor `mantra-redesa-redis-1`,
`REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` del entorno; por defecto
`localhost:6380`). Vía `ioredis`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/redis_runtime -name '*.controller.ts' | wc -l
  find src/modules/redis_runtime -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/redis_runtime -name '*.entity.ts' | wc -l
  find src/modules/redis_runtime -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 5 rutas HTTP, 0 entidades y 1 servicio**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /redis-runtime/cache` | PLATFORM_OPERATOR | `redis-runtime` |
| `GET /redis-runtime/cache/:key` | PLATFORM_OPERATOR | `redis-runtime` |
| `DELETE /redis-runtime/cache/:key` | PLATFORM_OPERATOR | `redis-runtime` |
| `POST /redis-runtime/locks` | PLATFORM_OPERATOR | `redis-runtime` |
| `DELETE /redis-runtime/locks/:key` | PLATFORM_OPERATOR | `redis-runtime` |

## Qué ofrece

- **Caché con TTL**: `setWithTtl` / `get` / `del`.
- **Contadores con ventana** (rate / uso): `incrWithWindow` (fija TTL en el 1er incremento).
- **Locks distribuidos**: `acquireLock` (`SET NX PX` + token aleatorio) y
  `releaseLock` (CAS vía script Lua fijo: sólo borra si el token coincide).
- **Challenge store** (OTP y similares): `putChallenge` guarda el **hash SHA-256**
  del secreto con TTL; `verifyChallenge` valida en tiempo constante y **consume**
  el challenge al acertar (single-use).

## Aislamiento por tenant

Todas las claves se prefijan con `{tenantId}:{kind}:{key}` (`cache`, `counter`,
`lock`, `challenge`). El tenant sale del contexto de request (`X-Tenant-Id`,
verificado por `TenantContextInterceptor`). No se expone `EVAL` arbitrario ni
acceso a claves crudas cross-tenant.

## Endpoints (gobernados con `@Roles('PLATFORM_OPERATOR')`)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/redis-runtime/cache` | Escribir `{ key, value, ttlSec }` |
| `GET` | `/redis-runtime/cache/:key` | Leer valor por clave |
| `DELETE` | `/redis-runtime/cache/:key` | Borrar clave |
| `POST` | `/redis-runtime/locks` | Adquirir lock `{ key, ttlSec }` → `{ acquired, token }` |
| `DELETE` | `/redis-runtime/locks/:key?token=…` | Liberar lock (CAS con token) |

## Ciclo de vida

`RedisRuntimeModule` provee un cliente ioredis compartido (conexión perezosa) y
lo cierra limpiamente en `onModuleDestroy` (`quit()`). Exporta
`RedisRuntimeService` para reutilizarlo desde otros módulos.

> **Nota:** este módulo no se registra en `src/app.module.ts` en esta fase (regla
> de la tarea). Para activarlo, añadir `RedisRuntimeModule` a los `imports` del
> `AppModule`.

## Auditoría vigente

La revisión de octubre de 2026 detectó que el consumo de challenges usa `GET` y `DEL` separados, por lo que debe hacerse atómico antes de usarlo para OTP o confirmaciones. El plan y las pruebas están en [`docs/revision-backend-2026-10-04/modulos/redis_runtime.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/redis_runtime.md).

```bash
corepack yarn test src/modules/redis_runtime --runInBand --silent
```

## Gancho de integración (bonus, no implementado aquí)

`common/services/contact-points.service.ts` marca hoy `verified=true` a ciegas.
Con este módulo puede exigir un OTP real: emitir con `putChallenge(tenant,
'contact:{contactPointId}', otp, ttl)` y confirmar con `verifyChallenge(...)`
antes de marcar verificado. La modificación de `contact-points` queda para otra
fase.
