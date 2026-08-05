# Health checks

> Fase 14. Estado real, verificado en código — no lo que "debería" haber.

## Lo que existe: liveness únicamente

`GET /health` (`src/app.controller.ts`, `@Public()`) responde `{ status: 'ok' }` mientras el
proceso esté vivo y aceptando conexiones. El propio comentario del código lo declara sin
ambigüedad: *"Sonda de liveness pública... No exige JWT ni toca la base: responde 200 mientras el
proceso esté vivo. La readiness con verificación de base de datos queda pendiente."*

## Lo que no existe: readiness

No hay un endpoint que verifique conectividad real a PostgreSQL/MongoDB/Redis/OpenSearch/MinIO
antes de declarar el proceso "listo para recibir tráfico". Un contenedor puede reportar `200` en
`/health` mientras su conexión a la base está caída.

## `@nestjs/terminus` — dependencia sin usar

`package.json` declara `@nestjs/terminus` (biblioteca estándar de Nest para health checks
enriquecidos: `TypeOrmHealthIndicator`, `HttpHealthIndicator`, etc.) como dependencia, pero **no
se encontró ningún import de `@nestjs/terminus` en `src/`** — está instalada pero no integrada.
Hallazgo real de esta auditoría, no una suposición: probablemente destinada a una implementación
de readiness que no se completó, o dependencia obsoleta. Se documenta como brecha, no se asume
cuál de las dos.

## Registro de health checks a nivel de datos (`platform_ops`)

Existe un mecanismo **distinto**, orientado a datos: `platform_ops.health_checks` +
`platform_ops.health_check_runs` — un registro de definiciones de chequeo y sus ejecuciones,
consultable como historial. No es el mismo concepto que un endpoint HTTP de readiness de
Kubernetes/Docker; es más cercano a un log estructurado de resultados de chequeos, posiblemente
ejecutados por un worker o proceso externo no identificado en esta fase.

## `docker-compose.yml` — sin healthcheck propio para `api` ni los workers

Los 5 almacenes de datos (`postgres`, `mongodb`, `redis`, `opensearch`) declaran `healthcheck:` en
`docker-compose.yml`. **`api` y los 20 `worker-*` no tienen bloque `healthcheck:` propio** — solo
`restart: always`, que reinicia ante un *crash*, no ante un proceso colgado mientras sigue vivo.

## Consecuencia real

Sin readiness, un despliegue puede enrutar tráfico a una instancia de `api` que arrancó pero no
puede hablar con PostgreSQL — el liveness la reportaría sana. Es un riesgo operativo real,
clasificado como brecha en esta auditoría, no un problema teórico.

## Acción recomendada

1. Completar la integración de `@nestjs/terminus` (o remover la dependencia si no se va a usar) e
   implementar `GET /health/ready` con verificación real de los 5 almacenes.
2. Añadir `healthcheck:` a los servicios `api`/`worker-*` en `docker-compose.yml`.

## Ver también

- [Despliegue](deployment.md), [Escalado](scaling.md), [Métricas](../observability/metrics.md).
