# Clasificación de sensibilidad

> Fase 11. El sistema tiene un **mecanismo real** de clasificación de datos gobernado por tabla —
> no es una convención informal ni algo que esta documentación inventa.

## El mecanismo: `system_ops.entity_registry`

Cada tabla del modelo puede (y, según el estándar de modelado del proyecto, debe) inscribirse en
`system_ops.entity_registry` con:

| Campo | Propósito |
|---|---|
| `classification_id` → `system_ops.data_classifications` | Nivel de sensibilidad (`code`, `name`, `rank`, `is_pii`, `is_phi`, `handling_rules_json`) |
| `contains_pii` / `contains_phi` | Flags directos en el propio registro de la entidad |
| `domain_id` → `system_ops.data_domains` | Dominio de negocio al que pertenece |
| `retention_policy_id` → `system_ops.retention_policies` | Ver [retención](retention.md) |
| `owner_team` | Equipo dueño del dato |
| `partition_spec_id` → `system_ops.partition_specs` | Estrategia de partición para tablas de alto volumen |

`system_ops.data_classifications` modela niveles de clasificación explícitos, cada uno con
`is_pii`/`is_phi` y `handling_rules_json` (reglas de manejo en JSON) — no es un enum fijo de 2-3
niveles hardcodeado, es un catálogo gobernado, coherente con el patrón general del modelo
(terminología gobernada, no enums, ver [ADR-0002](../adr/ADR-0002-orm-mikroorm.md)).

## Regla de diseño del proyecto (verificada en la bóveda de arquitectura)

> "Marcar `contains_pii`/`contains_phi` en `entity_registry`; cubrir con `anonymization_rules` y
> `data_residency_policies`." — estándar de modelado de datos del proyecto (documento de
> arquitectura interno, "Estándar de modelado de datos — convenciones datacenter").

## Lo que esta auditoría **no puede** verificar de forma estática

El mecanismo de clasificación (las tablas `entity_registry`/`data_classifications`) **existe e
implementa correctamente** en código (`src/modules/system_ops/entities/`). Si cada una de las 1184
entidades tiene efectivamente una fila de `entity_registry` poblada con su clasificación correcta
es una pregunta sobre **datos en una base real**, no sobre código — no verificable por lectura
estática del repositorio. Se documenta como brecha de verificación, no se asume ni el mejor ni el
peor caso.

## Clasificación por defecto recomendada para datos de salud

En ausencia de verificación de la población real de `entity_registry`, y dado que el dominio es
salud, la postura conservadora correcta es: **toda tabla que referencia a `profiles.patient_profiles`,
`clinical.*`, `diagnostics.*`, `pharmacy.*`, o que porta `*_concept_id` de naturaleza clínica, se
trata como PHI hasta que se verifique lo contrario** — no al revés.

## Acción pendiente

Verificar contra una base real qué porcentaje de las 1184 entidades tiene `entity_registry`
poblado, y completar las que falten — candidato para un script de auditoría análogo a
`yarn orm:audit`, no existente en esta fase. Ver `GOV-005` en
[matriz de trazabilidad](../governance/traceability-matrix.md).

## Ver también

- Modelo de amenazas (Fase 13, en construcción) — cómo estas clasificaciones
  alimentan los controles STRIDE del sistema.
- Auditabilidad (Fase 13, en construcción).
