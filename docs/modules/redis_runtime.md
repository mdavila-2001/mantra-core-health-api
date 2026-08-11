<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/redis_runtime/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `redis_runtime`

**Fuente:** [`src/modules/redis_runtime/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/redis_runtime/README.md)
· 1 controllers · 1 services · 0 repositories · 0 entidades · 3 DTO

---

# MÓDULO 56 — `redis_runtime`

Runtime de baja latencia sobre Redis **real** (contenedor `mantra-redesa-redis-1`,
`REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` del entorno; por defecto
`localhost:6380`). Vía `ioredis`.

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

## Gancho de integración (bonus, no implementado aquí)

`common/services/contact-points.service.ts` marca hoy `verified=true` a ciegas.
Con este módulo puede exigir un OTP real: emitir con `putChallenge(tenant,
'contact:{contactPointId}', otp, ttl)` y confirmar con `verifyChallenge(...)`
antes de marcar verificado. La modificación de `contact-points` queda para otra
fase.

