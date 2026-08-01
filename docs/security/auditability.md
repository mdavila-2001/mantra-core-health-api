# Auditabilidad

> Fase 13. Ver [reglas de negocio](../business/business-rules.md) §1 y §7 para el patrón de
> auditoría compartido y el tratamiento de consentimiento.

## Los dos registros de auditoría

| Tabla | Naturaleza | Qué registra |
|---|---|---|
| `audit.audit_log` | **WORM** (Write Once Read Many) | Cambios relevantes — mencionado explícitamente en `ESTADO-Y-PENDIENTES.md` como control transversal ya incorporado |
| `audit.data_access_log` | Append-only | **Lecturas** de datos sensibles — distinto de `audit_log`, que registra cambios |

Regla del estándar de diseño del proyecto: *"toda lectura de datos sensibles deja traza en
`data_access_log`; todo cambio relevante, en `audit_log`"* — dos registros con propósitos
distintos, no uno genérico.

## Auditoría de campos de negocio (universal, no solo el log dedicado)

Además de los logs dedicados, **toda entidad de negocio** lleva `createdBy()`/`touch()`
(`src/common/persistence/audit-fields.ts`) — quién creó y quién modificó por última vez cada fila,
con timestamp. Es el segundo y cuarto nodo de mayor centralidad del sistema (738 y 484 usos, ver
[graphify-audit.md](../reports/graphify-audit.md) §7) — no es un patrón opcional, es casi
universal.

## Acceso de emergencia auditado

`authz.break_glass_sessions` — ver [modelo de amenazas](threat-model.md) §"Por qué el break-glass
importa". La justificación es obligatoria en el momento del acceso, no reconstruida después.

## Derechos del titular (DSAR)

`audit.dsar_requests` — solicitudes de acceso/portabilidad/eliminación bajo GDPR/HIPAA. Módulo
`cross_store_consistency` maneja el evento `DeletionRequested`/`DeletionRequestClosed`
(ver [catálogo de eventos](../events/event-catalog.md)) para propagar una eliminación a través de
los 5 almacenes de datos — no es una operación local a un solo almacén.

## Brecha real: cobertura no verificada

Recomendación textual del propio estándar de diseño del proyecto: *"Cobertura de
`data_access_log` sobre toda lectura de PHI (verificar por `entity_registry.contains_phi`)"* —
es decir, el propio equipo de diseño ya identificó que la cobertura real necesita auditarse contra
`entity_registry`, no asumirse. Esta documentación no puede cerrar esa verificación (requiere una
base real poblada) — ver `GOV-005` en [matriz de trazabilidad](../governance/traceability-matrix.md).

## Ver también

- [Modelo de amenazas](threat-model.md)
- [Clasificación de sensibilidad](../data/classification.md)
- [Retención](../data/retention.md)
