# Recuperación ante desastres

> Fase 14. **Sin estrategia de backup/restore documentada ni probada** identificada en el
> repositorio. `docker-compose.yml` declara volúmenes nombrados para los 5 almacenes de datos
> (persistencia local), pero eso no es una estrategia de backup — es solo persistencia entre
> reinicios de contenedor en la misma máquina.

## Estado real

| Almacén | Persistencia declarada | Backup real verificado |
|---|---|---|
| PostgreSQL | Volumen `postgres_data` | No verificado |
| MongoDB | Volumen `mongodb_data` | No verificado |
| Redis | Volumen `redis_data` | No aplica normalmente (estado efímero por diseño, ver [ADR-0008](../adr/ADR-0008-cache-redis.md)) |
| OpenSearch | Volumen `opensearch_data` | No verificado |
| MinIO | Volumen `minio_data` | No verificado |

Un volumen Docker local **no sobrevive** a la pérdida del host — no es una estrategia de
recuperación ante desastres por sí solo.

## Por qué esto es crítico en este sistema específicamente

El activo principal (PHI, datos financieros de 1184 entidades) vive en PostgreSQL. Sin backup
verificado y sin ejercicio de restauración probado, una pérdida de la base de datos primaria no
tiene un camino de recuperación conocido y confiable — sería una afirmación no verificada, no un
plan.

## Qué se necesita para una estrategia de DR real

1. Backup automatizado y verificado de PostgreSQL (al menos), con retención acorde a
   [retención de datos](../data/retention.md) y requisitos legales (HIPAA/GDPR, ver
   [modelo de amenazas](../security/threat-model.md)).
2. Backup de MongoDB, OpenSearch y MinIO según su criticidad real (no verificada en esta fase cuál
   de los tres tiene datos no reconstruibles desde PostgreSQL).
3. **Al menos un ejercicio de restauración documentado** — un backup nunca probado no es una
   garantía, es una suposición.
4. Definir RPO (pérdida de datos aceptable) y RTO (tiempo de recuperación aceptable) — ninguno de
   los dos está definido en el repositorio.

## Declaración explícita de esta auditoría

**No se declara este sistema "listo para producción" en materia de recuperación ante desastres.**
Es la brecha operativa de mayor severidad encontrada en Fase 14, junto con
[health checks](health-checks.md) y [rollback](rollback.md). Ver `OPS-004` en
[matriz de trazabilidad](../governance/traceability-matrix.md).

## Ver también

- [Retención](../data/retention.md), [Rollback](rollback.md).
