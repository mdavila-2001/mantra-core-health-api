# Despliegue

> Fase 14. Ver [ADR-0014](../adr/ADR-0014-despliegue-docker-compose.md) para la decisión
> arquitectónica. Esta página es el procedimiento real, derivado de `docker-compose.yml` y
> `Dockerfile`.

## Imagen — una sola para 18 procesos

`api` y los 20 `worker-*` comparten **la misma imagen Docker** (`mantra-redesa-api:local`,
construida una sola vez desde `Dockerfile`) — solo cambia el `command` de cada servicio. El
`Dockerfile` es multi-stage: `deps` → `build` → `prod-deps` → `runtime`
(`node:24-bookworm-slim`), `CMD ["node", "dist/main.js"]` como default (sobreescrito por
`command:` en cada servicio worker).

## Orden de arranque — por qué `depends_on` no es solo "espera a que esté sano"

`api` (y cada worker) declara `depends_on` con condiciones específicas, no solo
`service_healthy`:

```yaml
depends_on:
  postgres:        { condition: service_healthy }
  postgres-init:    { condition: service_completed_successfully }
  mongodb:          { condition: service_healthy }
  mongo-init:       { condition: service_completed_successfully }
  opensearch:       { condition: service_healthy }
  opensearch-init:  { condition: service_completed_successfully }
  redis:            { condition: service_healthy }
```

Razón explícita en el propio `docker-compose.yml`: **no basta con que Postgres esté sano** —
`TerminologySeedService` corre en `OnApplicationBootstrap` y necesita el esquema ya aplicado
(`postgres-init` completado), o la API arranca contra una base sin tablas en un
`docker compose up` desde cero. Mismo razonamiento para Mongo/OpenSearch
(`document_store`/`search_platform` asumen sus colecciones/índices ya creados).

## Apagado ordenado

Cada worker llama `app.enableShutdownHooks()` (`src/worker/bootstrap.ts`) — responde a `SIGTERM`
con cierre ordenado, no un `kill -9` que corte trabajo a mitad de un job reclamado.

## Política de reinicio

`restart: always` en todos los servicios de aplicación e infraestructura — el propio Docker
reinicia un contenedor caído. **No hay `healthcheck:` propio para `api` ni para los workers**
(solo los 5 almacenes de datos lo tienen) — ver [health checks](health-checks.md) para la
implicación real de esta brecha.

## Procedimiento real de despliegue (desarrollo/verificado en esta auditoría)

```bash
docker compose build
docker compose up -d
```

Sin evidencia en el repositorio de un pipeline de despliegue automatizado (CI/CD hacia un registro
de imágenes, blue-green, canary) — ver [gestión de cambios](../governance/change-management.md) para lo que sí existe en
materia de CI.

## Ver también

- [Ambientes](environments.md), [Health checks](health-checks.md), [Rollback](rollback.md).
