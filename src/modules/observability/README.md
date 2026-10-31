# observability — portal «Sistema» (módulo 70)

Captura **persistida** de peticiones HTTP, errores y consultas SQL de la API, y su lectura bajo
`GET /admin/observability/*`. Es la parte «Sistema» del portal de observabilidad y gobierno
(`docs/trabajo/2026-10-31-portal-observabilidad-gobierno/02-observabilidad-sistema.md` del front).

Esta entrega cubre H2 (captura HTTP), H3 (errores), H4 (SQL) y la lectura base de H7.
**No** cubre latidos de workers, sondas de dependencias, rollups, SLO ni alertas (H5/H6): esas
cifras salen como `null` con `reason` (`WORKERS_NOT_REPORTING`, `DEPENDENCIES_NOT_PROBED`,
`SLO_NOT_COMPUTED`).

## Piezas

| Pieza | Dónde | Qué hace |
|---|---|---|
| Sinks en memoria | `src/observability/capture/` | `HttpSink` (minuto × método × plantilla × **código exacto**), `ErrorSink` (huella + eventos), `SqlSink` (minuto × huella × operación), `SlowRequestSink`, contexto de petición (ALS), resolutor `operation_key`/`module_code` |
| Middleware | `src/observability/http-sli/http-sli.middleware.ts` | El de `http-sli`, ahora también alimenta el sink y abre el contexto. `/admin/ops/traffic*` sigue leyendo `time_series.service_sli_series` (doble escritura) |
| Filtro de errores | `src/common/filters/all-exceptions.filter.ts` | Llama a `ErrorSink` sin cambiar el cuerpo ni el log |
| Logger del ORM | `src/orm/observability/orm.logger.ts` | `logQuery` alimenta `SqlSink` (MikroORM lo invoca en cada consulta con `took`, con o sin `debug`: ver `orm.logger.spec.ts`) |
| Volcado | `application/observability-flush.service.ts` | Cada `OBSERVABILITY_FLUSH_SECONDS` una transacción por lote, `ON CONFLICT DO NOTHING`, reintento una vez, nunca lanza; vuelca también al apagar (SIGTERM) |
| Lecturas | `application/observability-read.service.ts` + `infrastructure/observability-read.repository.ts` | Sobre común, `null`+`reason`, paginación keyset |

## Configuración

| Variable | Por defecto | |
|---|---|---|
| `OBSERVABILITY_ENABLED` | `false` | Enciende captura y volcado. Un valor que no sea `true`/`false` **aborta el arranque** |
| `OBSERVABILITY_FLUSH_SECONDS` | `30` | 15–3600 |
| `OBSERVABILITY_SLOW_REQUEST_MS` | `2000` | 50–600000. Umbral de «petición lenta» |
| `OBSERVABILITY_ACTOR_HASH_SECRET` | — | ≥ 16 caracteres. **Fail-closed**: sólo `development`/`test` tienen secreto por defecto; en otro entorno sin secreto no se guarda `actor_hash` |
| `ORM_SLOW_QUERY_MS` | `200` | (existente) umbral de consulta lenta; también marca la petición como `slow` en `slow_request_samples` |

## Idempotencia y multi-instancia

- Cada arranque genera un `instance_id` nuevo (`observability.instances`).
- La clave primaria de cada serie **es** su clave de idempotencia
  (`time, instance_id, flush_seq, método, plantilla, código`). El sink asigna `flush_seq` al
  drenar; reintentar el mismo lote choca con la clave y se descarta. Las series son append-only
  (un trigger prohíbe el `UPDATE`), así que no hay «upsert que suma»: sólo `DO NOTHING`.
- `error_groups.occurrences_total` sube **sólo por filas de `error_events` realmente insertadas**
  (más las ocurrencias sin evento del lote, que no se repiten si el lote ya estaba aplicado).
- La huella del error es `sha256(code|reason|exceptionType|método|plantilla|3 marcos propios)`:
  la misma causa desde dos instancias es un solo grupo.
- Estados de grupo: `NEW → SEEN | RESOLVED | IGNORED`. Un evento posterior a `resolved_at` en un
  grupo `RESOLVED` lo vuelve a `NEW` y marca `regressed_at`.
- `error_events` tiene RLS por `actor_tenant_id`: la inserción **no usa `RETURNING`** (aviso de F1).

## Privacidad

Sólo plantillas de ruta, huellas de consulta, códigos y conteos. Nunca la URL real, query, cuerpo,
cabeceras, IP, `user_id` ni parámetros SQL. `actor_hash` es un HMAC con secreto propio. Un 5xx
**no** guarda su mensaje interno salvo con `API_ERROR_DIAGNOSTICS=true`; un 4xx guarda el mensaje
que ya ve el cliente con UUID y números largos plegados (`:uuid`, `:n`).

## Autorización

> **Advertencia sobre `@PlatformScopeOptional()`.** Hace que «sin `X-Tenant-Id`» signifique
> «alcance plataforma» para quien tiene un rol de plataforma global. En una ruta de **sólo
> lectura** es lo deseado; **puesto en la clase** se heredaría en cualquier ruta que se agregue
> después —incluida una que mute— y esa ruta dejaría de exigir una organización sin que nadie lo
> haya decidido. Aquí va **por método**, y una prueba
> (`observability.controller.auth.spec.ts`) falla si aparece a nivel de clase o falta en un `GET`.

- Todas las lecturas: `@Roles(...OPS_READ_ROLES)` (`PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN`; `SUPERADMIN` por el comodín) + `@PlatformScopeOptional()`.
- `PATCH /errors/groups/:id`: `@Roles('PLATFORM_ADMIN','SRE')`, **sin** `@PlatformScopeOptional`: exige
  organización elegida (membresía + `X-Tenant-Id`) o un rol global con resolución propia
  (`SUPERADMIN`). Es la decisión conservadora: una mutación no hereda el atajo de plataforma.
  Auditado (`ERROR_GROUP_STATE_CHANGED`), con `expectedVersion` (409 `CONCURRENCY_CONFLICT`) y
  motivo obligatorio al resolver o ignorar.
- No se amplió `PRIVILEGED_TENANT_ROLES`.

## Rutas (esta entrega)

`summary`, `timeseries`, `endpoints`, `modules`, `coverage`, `errors/groups`, `errors/groups/:id`,
`errors/events`, `requests/:requestId`, `PATCH errors/groups/:id`, `sql/statements`,
`sql/statements/:hash`, `sql/slow`. Faltan (H5/H6/H7): `modules/heatmap`, `workers`, `dependencies`, `slo`.

Sobre común: `{window:{from,to,interval,timezone}, freshness:{lastFlushAt,lagSeconds,droppedFlushes}, notMeasured[], generatedAt}`.
`tz` por parámetro (por defecto `America/La_Paz`); ventana inválida → 422 `VALIDATION_FAILED` con `reason`
(`INVALID_DATE`, `EMPTY_WINDOW`, `WINDOW_TOO_LARGE`, `INTERVAL_TOO_FINE`, `INVALID_TIMEZONE`).
Un cubo sin fila es «sin dato», no cero.

## Ruta de falla controlada

`GET /internal/observability/selftest/fail?kind=throw|type` (rol `SYSTEM`; `SUPERADMIN` pasa por el
comodín). **Sólo existe con `NODE_ENV !== 'production'`** (el módulo no la registra y el handler
responde 404 si se leyó tarde). Está excluida de la medición HTTP —para que las cuentas de una carga
conocida sean exactas— pero su error sí se captura.

## Límites conocidos

- `module_code` sale de `data_catalog.catalog_operations`; si está vacío, `UNKNOWN` (no se inventa).
- `occurrences_24h` de la tabla no se mantiene (lo calcula la lectura desde los eventos de 24 h).
- Percentiles estimados desde el histograma; `approximate: true`.
- `droppedFlushes` es el contador de **esta** instancia desde que arrancó.
