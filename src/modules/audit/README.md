# Módulo 10 — Audit, Provenance and Version Histories

Auditoría WORM (append-only), cadena hash tamper-evidence, provenance
quién-qué-cuándo, historial de versiones point-in-time, DSAR, exportación de
evidencia, retención/archivado, detección de anomalías, moderación/gobernanza y
acceso de tercero gobernado.

## Endpoints

| UC | Método / Ruta | Resumen | Permiso |
|----|---------------|---------|---------|
| UC-10-01 | `POST /audit/data-access` | Registrar acceso/lectura clínica (accounting WORM) + provenance | `SECURITY_ADMIN` |
| UC-10-04 | `POST /audit/events` | Registrar provenance de un cambio y **sellar la cadena hash** (incluye UC-10-03) | `SECURITY_ADMIN` |
| UC-10-05 | `GET /audit/history/{entity}/{id}?as_of=` | Consultar historial / línea de tiempo (audita la propia lectura) | `SECURITY_ADMIN` |
| UC-10-06 | `POST /audit/integrity/verify` | Verificar integridad tamper-evidence y atestar | `SECURITY_ADMIN` |
| UC-10-07 | `POST /compliance/audit-export` | Exportar evidencia de auditoría (idempotente por `query_hash`) | `SECURITY_ADMIN` |
| UC-10-08 | `POST /privacy/dsar` · `PATCH /privacy/dsar/{id}` | Tramitar DSAR (máquina de estados) | `SECURITY_ADMIN` |
| UC-10-09 | `POST /audit/retention/apply` | Aplicar retención / archivado / litigation-hold | `SECURITY_ADMIN` |
| UC-10-10 | `POST /audit/anomaly/scan` | Detectar acceso anómalo | `SECURITY_ADMIN` |
| UC-10-11 | `POST /moderation/decisions` | Registrar decisión de moderación / gobernanza | `SECURITY_ADMIN` |
| UC-10-12 | `POST /audit/third-party-access` | Registrar acceso delegado / de tercero gobernado | `SECURITY_ADMIN` |

### Casos de uso sin endpoint HTTP

- **UC-10-02** (versionar aggregate) — patrón trigger `AFTER`/outbox en la tx del
  cambio de negocio; se inserta en `audit.<tabla>_history`. El helper de versionado
  vive en `ModerationRepository.recordHistory` y en la lectura de `HistoryRepository`.
- **UC-10-03** (sellar cadena hash) — plegado en línea al insertar `audit_log`
  (`AuditLogRepository.append`), expuesto vía `POST /audit/events`.
- **UC-10-13** (proyección cross-store a search/time_series) — consumidor de
  `messaging.outbox_events`; nunca modifica las tablas WORM de origen.

## Entidades y reglas de persistencia

- **Append-only (WORM)**: `audit_log`, `data_access_log`, `patient_content_access_log`,
  `analytics_governance_log`, `moderation_events`, `delegated_access_audit_log`,
  `insurance_decision_access_log`, `identity_verification_access_log`,
  `pharmacy_inventory_access_log` y todas las `*_history`. Solo tienen `recorded_at`
  / `recorded_by_user_id` (u `occurred_at`): no se fija `rowVersion` ni `updated_at`,
  no se hace `UPDATE` ni `DELETE` (las correcciones son filas nuevas).
- **Con ciclo de vida**: `dsar_requests` (tiene `row_version` optimista +
  `created_at`/`updated_at`); se usa `createdBy()`/`touch()` y nunca se fija
  `row_version`.
- **Cadena hash** (`audit_log`): cada fila enlaza con la anterior de su partición de
  tenant (`previous_hash`) y sella `record_hash = H(previous_hash || contenido ||
  recorded_at)`. La verificación recomputa y coteja los eslabones.
- FKs planas uuid: MikroORM no ordena inserts → `await tx.flush()` entre padre e
  hijo (p. ej. `dsar_requests` antes de su gobernanza/provenance). `em.create(...,
  { partial: true })` en todos los inserts.

## Conceptos

Declarados en `audit.concepts.ts` con prefijo `audit` (`AUDIT_CONCEPT_SEEDS`, `AUD`).
Cubren acciones, bases legales, propósitos de uso, decisiones, gobernanza, tipos y
estados DSAR, jurisdicciones, tipos/acciones/razones de moderación y operaciones de
versionado. El resultado reutiliza los transversales `CONCEPTS.OUTCOME_SUCCESS/FAILURE`.

## Logs

Pino estructurado por operación (`audit.event.record`, `audit.integrity.verify`,
`audit.dsar.update`, …). Nunca se registran secretos ni PHI; solo ids y metadatos.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/`em`) y `controllers/*.controller.spec.ts`
  (mockean servicios). `jest src/modules/audit` verde.
- Smoke transversal: `test/smoke/modules/audit.smoke.ts` (`AUDIT_SMOKE`).
