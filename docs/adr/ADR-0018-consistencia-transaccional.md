# ADR-0018: Consistencia transaccional — transacción por agregado + outbox, sin sagas

## Estado
Aceptado.

## Contexto
Un cambio de negocio (p. ej. confirmar una cita, capturar un pago) suele necesitar escribir el
propio agregado **y** registrar un evento de dominio para otros consumidores, de forma atómica.
Con 5 almacenes de datos distintos, la consistencia entre ellos no puede ser transaccional
end-to-end.

## Fuerzas y restricciones
- PostgreSQL da transacciones ACID reales dentro de sí mismo.
- No hay transacciones distribuidas entre PostgreSQL, MongoDB, Redis, OpenSearch y MinIO — cada
  uno tiene su propio motor de consistencia.
- `row_version` (optimistic locking) protege contra escrituras concurrentes dentro de una misma
  fila/transacción PostgreSQL.

## Opciones consideradas
Sagas distribuidas con compensación vs. transacción local + outbox + reconciliación asíncrona: el
código implementa la segunda — no hay evidencia de un orquestador de sagas formal (aunque
`SAGA_ORCHESTRATOR` existe como rol, sugiriendo que el patrón se usa puntualmente, no como
mecanismo transversal).

## Decisión
Consistencia fuerte dentro de una transacción PostgreSQL (agregado + evento outbox en el mismo
commit); consistencia eventual entre PostgreSQL y los almacenes secundarios, reconciliada por
`cross_store_consistency` (con su propio worker).

## Consecuencias positivas
- Garantías fuertes donde más importan (dinero, medicación, agenda) — todo dentro de PostgreSQL.
- Sin la complejidad operativa de un orquestador de sagas transversal para cada flujo.

## Consecuencias negativas
- Ventana de inconsistencia real entre PostgreSQL y MongoDB/OpenSearch/Redis hasta que
  `cross_store_consistency` reconcilie — su implementación está en curso
  (`ESTADO-Y-PENDIENTES.md`), no completa.
- El rol `SAGA_ORCHESTRATOR` sugiere que existen flujos con necesidad real de compensación
  multi-paso — no documentados en detalle en esta fase.

## Riesgos
Ver `OPS-001` en la [matriz de trazabilidad](../governance/traceability-matrix.md) —
`cross_store_consistency` como pieza de esta estrategia aún no está completa.

## Evidencia
`src/modules/cross_store_consistency/`, rol `SAGA_ORCHESTRATOR` en
[actores y roles](../business/actors-and-roles.md), ADR-0002 (`row_version`).

## Plan de revisión
Revisar cuando `cross_store_consistency` complete su implementación.
