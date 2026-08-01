# Runbook: Cola detenida

> Fase 14. Ver [visión general de eventos](../../events/overview.md) y
> [reintentos y cola muerta](../../events/retries-and-dlq.md) para el mecanismo completo.

## Síntoma

Jobs se acumulan en `ready` sin pasar a `running`, o `queued_jobs`/`outbox_messages` crecen sin
drenarse; notificaciones o efectos secundarios esperados (recordatorios de citas, reportes) no
ocurren.

## Diagnóstico

1. Confirmar que el worker correspondiente está vivo:
   `docker compose ps worker-messaging` (y el worker específico dueño de la cola afectada, ver
   [procesamiento en segundo plano](../../architecture/background-processing.md) para el mapeo
   worker↔dominio).
2. Verificar `MESSAGING_QUEUE_CODES` del worker — si la cola afectada no está en esa lista, el
   worker nunca la reclama (configuración, no fallo).
3. Revisar si hay jobs atascados en `running` más allá de `visibility_timeout_s` — indicaría un
   worker que reclamó y murió sin completar ni fallar explícitamente.
4. Revisar `dead_letter_jobs` — si están acumulándose ahí, el problema no es que la cola esté
   detenida, es que los jobs fallan sistemáticamente (ver causa raíz del fallo, no solo la cola).

## Mitigación

- Worker caído: reiniciar (`docker compose restart worker-<dominio>`).
- Jobs atascados en `running` por crash sin limpieza: verificar si `visibility_timeout_s` los
  libera automáticamente al expirar, o si requieren intervención manual.
- Cola muerta creciendo: diagnosticar la causa raíz del fallo antes de hacer `redrive` masivo
  (`POST /queues/dead-letter/:id/redrive`) — reencolar sin corregir la causa solo repite el fallo.

## Escalación

Equipo dueño del dominio afectado (ver [catálogo de módulos](../../modules/index.md) para
identificar el módulo), `MESSAGING_ADMIN` si el problema es del propio mecanismo de colas.
