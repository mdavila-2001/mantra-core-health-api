# Runbook: Base de datos degradada

> Fase 14. Cubre PostgreSQL (almacén primario) — para los otros 4 almacenes, el diagnóstico inicial
> es análogo (verificar `docker compose ps`/`healthcheck`), con menor severidad relativa salvo que
> el flujo específico dependa críticamente de ellos.

## Síntoma

Latencia elevada o errores de conexión hacia PostgreSQL; consultas lentas reportadas en logs
(`tookMs` por encima de `ORM_SLOW_QUERY_MS`, ver [logs](../../observability/logging.md)).

## Diagnóstico

1. `docker compose ps postgres` — ¿`healthy`?
2. Revisar `slowestQuery`/`failedQueries` si se tiene acceso a inspeccionar el proceso (no expuesto
   por endpoint, ver `GAP` en [métricas](../../observability/metrics.md)) — alternativa: grep de
   logs por `"consulta lenta"`.
3. Verificar si el degradado coincide con una migración/DDL reciente aplicado
   (ver [migraciones](../../data/migrations.md)) — un índice faltante tras un cambio de esquema es
   una causa común.
4. Verificar si `RLS_ENFORCE=true` añade sobrecarga inesperada de evaluación de política en
   consultas de alto volumen (no cuantificado en esta fase).

## Mitigación

- Conexión completamente caída: verificar `DB_HOST`/`DB_PORT`/credenciales, reiniciar el
  contenedor `postgres` si aplica, o escalar a infraestructura si es un servicio gestionado.
- Degradación de latencia: identificar la consulta lenta específica (log), evaluar si falta un
  índice (ver [restricciones e índices](../../data/constraints-and-indexes.md)) — un índice nuevo
  requiere pasar por el flujo de cambio de esquema (los `.puml` del modelo canónico → `SQL/` (ver [ADR-0021](../../adr/ADR-0021-fuente-unica-de-ddl.md)) → `yarn
  orm:catalog`).

## Escalación

`SRE`/`DATA_PLATFORM_ADMIN` (ver [actores y roles](../../business/actors-and-roles.md)).

## Impacto en workers

Los 20 workers dependen de `api` (no de la base directamente, ver
[procesamiento en segundo plano](../../architecture/background-processing.md)) — una base
degradada se manifiesta primero como latencia/errores en `api`, y en cascada como fallos en las
llamadas `/internal/*` de los workers.
