# Alertas

> Fase 14. **Sin sistema de alertas configurado** identificado en el repositorio — consecuencia de
> las brechas de [métricas](metrics.md) y [dashboards](dashboards.md): no hay backend de métricas
> del que disparar una alerta basada en umbral.

## Candidatos a alerta, una vez exista backend de métricas

Derivados de mecanismos reales ya instrumentados en código, listos para convertirse en alerta en
cuanto se expongan como métrica:

| Señal | Fuente real | Por qué alertar |
|---|---|---|
| Consultas lentas del ORM por encima de umbral sostenido | `query-metrics.ts` (`slowQueries`, `ORM_SLOW_QUERY_MS`) | Degradación de base de datos antes de que impacte a usuarios |
| Consultas fallidas del ORM | `query-metrics.ts` (`failedQueries`) | Posible problema de conectividad o esquema |
| Jobs acumulados en `dead_letter_jobs` | `messaging` (ver [reintentos y cola muerta](../events/retries-and-dlq.md)) | Un dominio dejó de procesar su cola sin que nadie lo note |
| Outbox en `failed` sin publicar | `messaging.outbox_messages` | Eventos de dominio que nunca llegaron a sus consumidores |
| Cuentas bloqueadas por `account_lockouts` en ráfaga | `iam.account_lockouts` | Posible ataque de fuerza bruta/credential stuffing en curso |
| Uso de `break_glass_sessions` | `authz.break_glass_sessions` | Acceso de emergencia a PHI — merece revisión, no solo registro |
| Incidentes en `system_ops.security_incidents` | Ver [modelo de amenazas](../security/threat-model.md) | Por definición, requiere respuesta activa |

## Qué se necesita para tener alertas reales

1. Backend de métricas/logs con capacidad de alerta (Prometheus Alertmanager, o alertas sobre el
   agregador de logs).
2. Definir umbrales reales por señal (no existen valores de referencia verificados en esta fase).
3. Definir a quién notifica cada alerta — roles candidatos: `SRE`, `SECURITY_ADMIN`,
   `INCIDENT_COMMANDER` (ver [actores y roles](../business/actors-and-roles.md)), sin proceso de
   guardia/on-call documentado en esta fase.

## Ver también

- [Métricas](metrics.md), [Dashboards](dashboards.md), [Respuesta a incidentes](../security/incident-response.md).
