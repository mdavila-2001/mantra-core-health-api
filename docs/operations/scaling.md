# Escalado

> Fase 14. Ver [ADR-0014](../adr/ADR-0014-despliegue-docker-compose.md) — Docker Compose no da
> escalado automático multi-nodo; esta página documenta cómo escala hoy y qué se necesitaría para
> más.

## Escalado horizontal de `api`

`api` no mantiene estado propio en memoria más allá del contador de métricas del ORM (ver
[métricas](../observability/metrics.md), que es explícitamente "por proceso, se pierde al
reiniciar") — múltiples réplicas son seguras en principio: la sesión vive en JWT (sin estado de
sesión server-side), y la caché compartida (Redis) es común a todas las réplicas. No se verificó
en esta fase un balanceador de carga real delante de `api` en el `docker-compose.yml` (no hay
Nginx/Traefik declarado).

## Escalado independiente de los 20 workers

Cada worker es un servicio Docker separado — escalar `worker-messaging` sin escalar
`worker-billing` es una operación de infraestructura simple (`docker compose up --scale
worker-messaging=3`), coherente con la decisión de diseño de aislar cada dominio en su propio
proceso (ver [procesamiento en segundo plano](../architecture/background-processing.md)).

**Advertencia real:** escalar un worker horizontalmente depende de que su reclamo de trabajo sea
seguro bajo concurrencia. El mecanismo de colas (`SKIP LOCKED`, ver
[reintentos y cola muerta](../events/retries-and-dlq.md)) sí lo es. **No se verificó en esta fase**
si cada uno de los 20 `*WorkerModule` individuales es seguro para correr en paralelo consigo mismo
(algunos ticks de `@nestjs/schedule` podrían asumir instancia única) — brecha a cerrar antes de
escalar cualquier worker más allá de 1 réplica en producción.

## Escalado de los almacenes de datos

Fuera del alcance verificable de esta auditoría estática — `docker-compose.yml` declara una
instancia de cada almacén, sin réplicas ni clustering configurado. La estrategia real de
alta disponibilidad de PostgreSQL/MongoDB/Redis/OpenSearch/MinIO en producción no está
documentada en el repositorio.

## Ver también

- [Despliegue](deployment.md), [Ambientes](environments.md).
