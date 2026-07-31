# Runbook: Aumento de errores 5xx

> Fase 14.

## Síntoma

Clientes reciben `code: "INTERNAL"` (ver [modelo de error](../../api/error-model.md)) con
frecuencia creciente.

## Diagnóstico

1. Buscar en logs las líneas `nivel: error` de `AllExceptionsFilter` — **contienen el stack
   completo** (a diferencia de lo que ve el cliente). Correlacionar por `correlationId` si se
   tiene el de un caso reportado por un cliente.
2. Revisar consultas lentas/fallidas del ORM (`query-metrics.ts` — ver
   [métricas](../../observability/metrics.md)) vía log, ya que no hay endpoint de métricas
   expuesto todavía.
3. Verificar salud de los 5 almacenes de datos (`docker compose ps`).
4. Si el aumento coincide con un despliegue reciente: sospechar del cambio de código antes que de
   infraestructura.

## Mitigación

- Causa de infraestructura (base caída/degradada): ver
  [base de datos degradada](database-degraded.md).
- Causa de código (bug introducido en el último despliegue): ver [rollback](../rollback.md).
- Si es un patrón de entrada específico (un endpoint, un tipo de payload): considerar
  `ThrottlerGuard` no es una mitigación de bug, solo de volumen — no confundir ambas causas.

## Escalación

`SRE`, y si se sospecha causa de seguridad, `SECURITY_ADMIN` (ver
[modelo de amenazas](../../security/threat-model.md)).
