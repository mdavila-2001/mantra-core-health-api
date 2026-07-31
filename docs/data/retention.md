# Retención

> Fase 11. Igual que [clasificación](classification.md): el mecanismo es real e implementado; la
> política efectiva por tabla es un dato de configuración, no verificable por lectura estática.

## El mecanismo: `system_ops.retention_policies`

| Campo | Propósito |
|---|---|
| `retention_period_days` | Días que el dato debe conservarse |
| `legal_basis_concept_id` | Base legal de la retención (`terminology.catalog_concepts`) |
| `disposition_concept_id` | Qué ocurre al vencer: purgar, anonimizar, archivar (concepto gobernado, no enum) |
| `jurisdiction_concept_id` | Jurisdicción legal aplicable (relevante para operación multi-país) |

Vinculado a cada tabla vía `entity_registry.retention_policy_id`; la ejecución real de la
retención (el barrido que aplica la disposición) se registra en
`system_ops.retention_executions` — hay trazabilidad de que la política no solo existe, sino que
se ejecutó.

## Partición como prerrequisito de retención a escala

El estándar de modelado del proyecto es explícito: toda tabla append-only de alto volumen
(eventos, auditoría, telemetría, series de tiempo) debe declarar un `partition_spec`
(`system_ops.partition_specs`: estrategia `range` por fecha, intervalo, tiers hot/warm/cold,
destino de archivado). Cita textual del estándar interno: *"Sin partición declarada, purgar o
archivar una tabla de miles de millones de filas es inviable — es la diferencia entre un modelo
que escala 10 años y uno que colapsa."*

## Excepciones conocidas al borrado — WORM y evidencia inmutable

No todo dato es purgable por política de retención estándar:

- `audit.audit_log` — protección WORM (Write Once Read Many), mencionada explícitamente en
  `ESTADO-Y-PENDIENTES.md` como control transversal ya incorporado.
- `consent.consent_evidence` — append-only e inmutable por diseño (ver
  [reglas de negocio](../business/business-rules.md) §7): un consentimiento no se borra, se
  revoca hacia adelante.
- Tablas `*_history` (`<<HISTORY>>`) — versionado histórico, no un log purgable con la misma
  política que datos operativos.

Cualquier política de retención debe reconciliarse con estas excepciones — un barrido genérico
que ignore la naturaleza WORM/append-only de estas tablas sería una violación de su propio diseño.

## Retención en almacenes no relacionales

`nosql-consistency-and-deletion` (documento de arquitectura interno): las proyecciones entre
almacenes son de consistencia eventual y entrega al menos una vez — la corrección se logra con
idempotencia, versionado monotónico, hashes, checkpoints y reconciliación, no con "exactamente una
vez" de extremo a extremo. Esto es relevante para retención/eliminación: un `DELETE` en PostgreSQL
no garantiza propagación instantánea a MongoDB/OpenSearch — depende de `cross_store_consistency`
(ver [ADR-0018](../adr/ADR-0018-consistencia-transaccional.md)).

## Lo que esta auditoría no puede verificar de forma estática

Igual que en [clasificación](classification.md): si `retention_policies`/`retention_executions`
están efectivamente poblados y ejecutándose contra las 1184 entidades es una pregunta de datos en
tiempo de ejecución, no de código. Se documenta el mecanismo, no se asume su cobertura real.

## Ver también

- [Clasificación de sensibilidad](classification.md)
- Auditabilidad (Fase 13, en construcción)
