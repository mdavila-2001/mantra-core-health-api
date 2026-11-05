# Health checks

> Fase 14. Estado real, verificado en código — no lo que "debería" haber.

## API: liveness y readiness

- `GET /health` y `GET /liveness` (`src/app.controller.ts`, `@Public()`) responden mientras el
  proceso esté vivo, sin tocar dependencias: una dependencia caída no debe provocar reinicios.
- `GET /readiness` (`AppReadinessService`, `src/app-readiness.service.ts`) prueba PostgreSQL,
  MongoDB, Redis y OpenSearch con un plazo de 3 s cada uno y, con `RLS_ENFORCE=true`, que el rol de
  runtime no tenga `BYPASSRLS` ni sea superusuario. Si alguna falla responde `503`
  `DEPENDENCY_UNAVAILABLE` con el estado de cada chequeo.

La sonda de PostgreSQL también comprueba que la base esté realmente lista, y cuando eso es lo único
que falla el `503` lleva un `reason` propio en lugar del genérico
`SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE`:

| `reason` | Qué dice | Cómo se cierra |
|---|---|---|
| `SYSTEM_SCHEMA_INTEGRITY_INCOMPLETE` | El bootstrap del DDL dejó FKs o únicos de integridad sin aplicar (por datos huérfanos) | Corregir los datos y reiniciar; `SCHEMA_INTEGRITY_ENFORCE=false` es la válvula explícita |
| `SYSTEM_SEED_CORE_INCOMPLETE` | Un seed núcleo falló en este proceso (fuera de producción, sin `SEED_CORE_FAILURE_FATAL=true`), o con `SEED_ON_BOOT=false` faltan conceptos del catálogo interno en la base | Sembrar con `yarn seed:boot` y revisar el log del arranque |

Con `SEED_ON_BOOT=false` la sonda compara los ids de los conceptos que el código declara contra
`terminology.catalog_concepts` (una consulta, cacheada cuando pasa). Es una sonda por **contenido**:
la base no guarda un marcador de versión del seed, así que detecta un concepto que falta, no un valor
que cambió conservando su id.

`@nestjs/terminus` figura en `package.json`, pero la readiness no lo usa.

## Workers

Cada worker expone `GET /health`/`/liveness`, `/readiness` y `/status` en `WORKER_HEALTH_PORT`
(9100 por defecto) — ver `src/worker/README.md`.

## Registro de health checks a nivel de datos (`platform_ops`)

Existe un mecanismo **distinto**, orientado a datos: `platform_ops.health_checks` +
`platform_ops.health_check_runs` — un registro de definiciones de chequeo y sus ejecuciones,
consultable como historial. No es el mismo concepto que un endpoint HTTP de readiness de
Kubernetes/Docker; es más cercano a un log estructurado de resultados de chequeos, posiblemente
ejecutados por un worker o proceso externo no identificado en esta fase.

## `docker-compose.yml`

Los almacenes de datos, la API y los workers declaran `healthcheck:`. La API consulta
`http://localhost:3000/health` y cada worker `http://localhost:9100/health` con el `fetch` nativo
de Node (la imagen no trae `curl`). Es una sonda de liveness: un contenedor sano puede seguir sin
poder hablar con una dependencia, y eso sólo lo dice `/readiness`.

## Ver también

- [Despliegue](deployment.md), [Escalado](scaling.md), [Métricas](../observability/metrics.md).
