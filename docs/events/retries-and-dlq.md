# Reintentos y cola muerta

> Fase 12. Derivado de `message_queues.entity.ts` y `src/modules/messaging/README.md`.

## Configuración por cola

Cada `message_queues` declara sus propios parámetros — no hay una política global única:

| Campo | Propósito |
|---|---|
| `default_priority` | Prioridad por defecto de los jobs de esa cola |
| `default_max_attempts` | Cuántas veces se reintenta un job antes de ir a cola muerta |
| `visibility_timeout_s` | Cuánto tiempo un job reclamado (`running`) queda invisible para otros workers antes de considerarse abandonado |
| `dead_letter_queue_id` | FK a otra `message_queues` — **cada cola puede encadenar a su propia cola muerta**, no hay una DLQ global única |

## Ciclo de vida de un job

```
ready → (claim, SKIP LOCKED) → running
  running --/complete--> succeeded
  running --/fail, quedan intentos--> ready (con backoff)
  running --/fail, agotó intentos--> dead_letter_jobs
```

`dead_letter_jobs` es **append-only** (`src/modules/messaging/README.md`) — un job muerto no se
edita, se conserva como evidencia.

## Reencolado desde cola muerta

`POST /queues/dead-letter/:deadLetterJobId/redrive` (UC-35-09) crea un **job nuevo** — no revive
el job muerto original. La evidencia del fallo original se conserva intacta en
`dead_letter_jobs`; el redrive es una operación explícita, no automática.

## Reclamo concurrente seguro

`POST /internal/queues/:code/claim` usa `SKIP LOCKED` — múltiples instancias de un worker (o
varios workers distintos apuntando a la misma cola) pueden reclamar en paralelo sin bloquearse
entre sí ni reclamar el mismo job dos veces.

## Relay del outbox — el mismo patrón aplicado a la publicación

`POST /internal/outbox/relay/run` (UC-35-02) también usa `FOR UPDATE SKIP LOCKED` para reclamar
mensajes pendientes de publicar. Si se agotan los intentos, el mensaje pasa a `failed` — un evento
de dominio que nunca logró publicarse queda visible como fallo, no se pierde silenciosamente
(sigue existiendo en `domain_events`, que es inmutable).

## Qué esta documentación no puede confirmar

Los valores reales de `default_max_attempts`/`visibility_timeout_s`/estrategia de backoff
configurados por cola en un entorno real son datos, no código — no verificables sin consultar
`message_queues` en una base real. Se documenta el mecanismo configurable, no valores inventados.

## Ver también

- [Visión general](overview.md), [Semántica de entrega](delivery-semantics.md).
