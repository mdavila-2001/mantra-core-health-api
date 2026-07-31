# Runbook: API no disponible

> Fase 14. Procedimiento basado en los mecanismos reales del sistema (guards globales, health
> checks, dependencias declaradas en `docker-compose.yml`).

## Síntoma

`GET /health` no responde, o el proceso `api` no acepta conexiones.

## Diagnóstico

1. `docker compose ps api` — ¿el contenedor está `Up` o reinició en bucle?
2. `docker compose logs api --tail 200` — buscar el error de arranque real. Recordar: el logger
   pino con `bufferLogs: true` retiene los logs de arranque, deberían aparecer completos.
3. Verificar las dependencias declaradas en `depends_on` (ver
   [despliegue](../deployment.md) §"Orden de arranque"): `postgres`, `postgres-init`, `mongodb`,
   `mongo-init`, `opensearch`, `opensearch-init`, `redis` — si alguna no está `service_healthy`
   o `service_completed_successfully`, `api` no arrancará.
4. Verificar variables de entorno requeridas (`ConfigModule` aborta el arranque si falta alguna,
   ver [configuración](../configuration.md)) — el log de arranque debe indicar cuál falta.

## Mitigación

- Si es un fallo de dependencia (Postgres/Mongo/Redis/OpenSearch no disponible): resolver la
  dependencia primero (ver [base de datos degradada](database-degraded.md)), luego reiniciar `api`.
- Si es un fallo de configuración: corregir la variable de entorno y redesplegar.
- Si el proceso arrancó pero no responde (colgado, no crasheado): **recordar que no hay
  readiness real** (ver [health checks](../health-checks.md)) — `restart: always` no lo detecta
  automáticamente si el proceso sigue "vivo" pero sin responder. Reinicio manual:
  `docker compose restart api`.

## Escalación

Si el fallo persiste tras resolver las dependencias obvias, escalar a `SRE`/`PLATFORM_ADMIN` (ver
[actores y roles](../../business/actors-and-roles.md)).

## Post-incidente

Registrar en `system_ops.security_incidents` si hay sospecha de causa maliciosa; de lo contrario,
documentar causa raíz para [mantenimiento](../maintenance.md).
