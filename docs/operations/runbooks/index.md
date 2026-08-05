# Runbooks

> Fase 14. Los 10 runbooks mínimos exigidos por el plan maestro (§17), todos basados en
> mecanismos reales del sistema — no procedimientos genéricos.

| Runbook | Cuándo usarlo |
|---|---|
| [API no disponible](api-unavailable.md) | `GET /health` no responde o el contenedor `api` no acepta conexiones |
| [Aumento de errores 5xx](5xx-increase.md) | Clientes reciben `code: "INTERNAL"` con frecuencia creciente |
| [Base de datos degradada](database-degraded.md) | Latencia elevada o errores de conexión hacia PostgreSQL u otro almacén |
| [Migración fallida](migration-failed.md) | Un cambio de esquema falla al aplicarse o al arrancar la app |
| [Cola detenida](queue-stalled.md) | Jobs/eventos se acumulan sin procesarse |
| [Integración externa caída](external-integration-down.md) | Llamadas salientes o webhooks entrantes de un proveedor fallan |
| [Tokens o autenticación fallando](auth-failing.md) | Login o validación de JWT falla masivamente |
| [Consumo elevado de recursos](high-resource-usage.md) | CPU/memoria elevada en `api` o un worker |
| [Recuperación desde backup](restore-from-backup.md) | Pérdida de datos — **procedimiento no probado, ver advertencia en el propio runbook** |
| [Rollback de despliegue](deployment-rollback.md) | Un despliegue reciente causó una regresión |

Ver también [operación](../maintenance.md), [observabilidad](../../observability/alerts.md).
