# Ambientes

> Fase 14. `docker-compose.yml` es la única especificación de topología de despliegue encontrada
> en el repositorio — ver [ADR-0014](../adr/ADR-0014-despliegue-docker-compose.md).

## Ambientes reales verificados

| Ambiente | Evidencia | Notas |
|---|---|---|
| Desarrollo local | `.env.example`, `docker compose up`, `yarn start:dev` | Verificado y usado durante esta auditoría (Fase 0-18) |
| Staging / Producción | No verificado en esta fase | `docker-compose.yml` no distingue explícitamente ambientes (no hay `docker-compose.prod.yml` ni overlays); `NODE_ENV=production` en el compose apunta a que ese mismo archivo se usa como base de producción, pero no se confirmó contra infraestructura real |

## Variables que cambian comportamiento por ambiente

Ver [variables de entorno](../getting-started/environment-variables.md). Las más críticas para
diferenciar comportamiento entre ambientes:

| Variable | Efecto |
|---|---|
| `NODE_ENV` | Deshabilita `/docs` y `/reference` en `production` |
| `RLS_ENFORCE` | Aislamiento de tenant — **debe verificarse explícitamente por ambiente**, ver `SEC-001` |
| `ORM_SCHEMA_SYNC` | `off` en entornos donde un DBA gestiona el DDL externamente; `safe` por defecto |
| `RATE_LIMIT_DISABLED` | Solo para pruebas de integración/generación de documentación — nunca en producción |

## Brecha real

Sin un archivo o documentación que declare explícitamente las diferencias de configuración entre
staging y producción (si existen como ambientes separados), ni la topología de red/DNS real fuera
de `docker-compose.yml`. Se documenta como brecha, no se inventa una topología de producción sin
evidencia.

## Ver también

- [Despliegue](deployment.md), [Configuración](configuration.md).
