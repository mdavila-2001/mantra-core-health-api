# Runbook: Consumo elevado de recursos

> Fase 14.

## Síntoma

CPU/memoria elevada en `api` o alguno de los 20 workers.

## Diagnóstico

1. Identificar qué contenedor específico (`docker stats`) — `api` vs. un worker específico
   apunta a causas muy distintas.
2. Si es `api`: revisar volumen de requests (sin métricas HTTP expuestas hoy, ver
   [métricas](../../observability/metrics.md) — usar logs de `pino-http` como proxy) y consultas
   lentas del ORM (posible causa de CPU alta en la propia base, no en el proceso Node).
3. Si es un worker: revisar el tamaño de la cola que procesa (`queued_jobs` pendientes) — un
   backlog grande puede hacer que el tick procese lotes más grandes de lo normal.
4. Revisar si coincide con un job de alto volumen conocido (generación de reportes, barrido de
   reconciliación en `cross_store_consistency`, reembedding en `vector_rag`).

## Mitigación

- Backlog legítimo de un worker: es esperado que consuma más recursos temporalmente — verificar
  que no está en un bucle de reintento sin progreso (ver [cola detenida](queue-stalled.md)).
- Fuga de memoria sospechada: reiniciar el proceso afectado como mitigación inmediata,
  investigar causa raíz por separado (no verificado en esta fase ningún proceso de profiling
  documentado).
- `api` bajo carga legítima alta: `ThrottlerGuard` ya limita abuso; escalar horizontalmente si el
  volumen es real (ver [escalado](../scaling.md)).

## Escalación

`SRE`/`PLATFORM_ADMIN`.
