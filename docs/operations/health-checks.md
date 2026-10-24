# Health checks

> Fase 14. Estado real, verificado en código — no lo que "debería" haber.

## API: liveness y readiness

- `GET /health` y `GET /liveness` (`src/app.controller.ts`, `@Public()`) responden mientras el
  proceso esté vivo, sin tocar dependencias: una dependencia caída no debe provocar reinicios.
- `GET /readiness` (`AppReadinessService`, `src/app-readiness.service.ts`) prueba PostgreSQL,
  MongoDB, Redis y OpenSearch con un plazo de 3 s cada uno y, con `RLS_ENFORCE=true`, que el rol de
  runtime no tenga `BYPASSRLS` ni sea superusuario. Si alguna falla responde `503`
  `DEPENDENCY_UNAVAILABLE` con el estado de cada chequeo.

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
