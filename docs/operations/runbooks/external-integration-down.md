# Runbook: Integración externa caída

> Fase 14. Ver [mapa de integraciones](../../architecture/integration-map.md) §3.

## Síntoma

Llamadas salientes desde `integrations`/`payments` fallan; webhooks entrantes de un proveedor
dejan de llegar o de reconciliarse (`POST /webhooks/providers/:code/receipts`).

## Diagnóstico

1. Confirmar si el problema es de red/DNS hacia el proveedor, o de credenciales
   (`gateway_connections` — configuración por conexión, no variable de entorno global, ver
   [mapa de integraciones](../../architecture/integration-map.md) §3).
2. Verificar si el webhook entrante falla por firma inválida
   (`verifySignature`, fail-closed — ver [semántica de entrega](../../events/delivery-semantics.md))
   antes de asumir que el proveedor dejó de enviar.
3. Revisar `dead_letter_jobs`/`outbox_messages` para llamadas salientes que fallaron y agotaron
   reintentos.

## Mitigación

- Si es firma inválida en webhooks entrantes: confirmar con el proveedor si rotó su secreto —
  actualizar `gateway_connections.webhook_secret_ref` en consecuencia (ver el hallazgo real en
  `payments-transactions.service.ts`, [mapa de integraciones](../../architecture/integration-map.md) §3).
- Si es indisponibilidad del proveedor: las llamadas salientes reintentan según la configuración
  de su cola (ver [reintentos y cola muerta](../../events/retries-and-dlq.md)); monitorear
  `dead_letter_jobs` para saber cuándo escaló más allá de un reintento razonable.
- Comunicar a los flujos de negocio afectados (facturación, pagos) si la integración caída
  bloquea un flujo crítico (ver [flujos críticos](../../business/critical-workflows.md)).

## Escalación

Equipo dueño de la integración específica, `INTEGRATION_CONTRACTS`/`MESSAGING_ADMIN`.
