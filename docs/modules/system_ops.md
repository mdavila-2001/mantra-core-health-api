<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/system_ops/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `system_ops`

**Fuente:** [`src/modules/system_ops/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/system_ops/README.md)
· 8 controllers · 7 services · 8 repositories · 30 entidades · 10 DTO

---

# Módulo `system_ops` (11) — Data Governance & System Operations

Gobierno de datos y operaciones de sistema: catálogo de entidades/campos,
políticas (escritura, retención, anonimización, residencia, backup), transferencias
transfronterizas, legal holds, barridos de retención, frameworks/evaluaciones/
remediación y publicación de drafts genéricos.

## Endpoints (UC → ruta)

| UC | Método y ruta | Descripción |
|----|---------------|-------------|
| UC-11-01 | `POST /admin/governance/entity-registry` | Registrar dominio, clasificación y catalogar entidad + campos |
| UC-11-02 | `POST /admin/governance/write-policies` | Definir política de escritura |
| UC-11-02 | `PATCH /admin/governance/entity-registry/{id}/write-policy` | Vincular política de escritura a una entidad |
| UC-11-03 | `POST /admin/governance/retention-policies` | Definir política de retención (base legal) |
| UC-11-03 | `PATCH /admin/governance/entity-registry/{id}/retention` | Aplicar retención a una entidad (razón obligatoria) |
| UC-11-04 | `POST /admin/governance/anonymization-rules` | Definir regla de anonimización |
| UC-11-04 | `PATCH /admin/governance/field-registry/{id}` | Asignar regla / masking a un campo |
| UC-11-05 | `POST /internal/governance/retention-executions/run` | Ejecutar barrido de retención (excluye objetivos bajo legal hold) |
| UC-11-06 | `POST /admin/governance/residency-policies` | Definir política de residencia |
| UC-11-06 | `POST /admin/governance/tenant-residency-bindings` | Vincular tenant a política de residencia |
| UC-11-07 | `POST /admin/governance/cross-border-transfers` | Registrar transferencia transfronteriza (append-only) |
| UC-11-08 | `POST /admin/governance/legal-holds` | Colocar legal hold |
| UC-11-08 | `POST /admin/governance/legal-holds/{id}/release` | Levantar legal hold ACTIVE |
| UC-11-09 | `POST /admin/ops/backup-policies` | Definir política de backup (RPO/RTO/inmutabilidad) |
| UC-11-10 | `POST /internal/ops/restore-test-runs` | Registrar prueba de restauración con evidencia |
| UC-11-11 | `POST /admin/governance/operational-frameworks` | Publicar framework con controles (jerárquicos) |
| UC-11-12 | `POST /admin/governance/workload-assessments` | Iniciar evaluación de workload |
| UC-11-12 | `PUT /admin/governance/workload-assessments/{id}/control-results` | Registrar (UPSERT) resultados de control |
| UC-11-13 | `POST /admin/governance/assessments/{id}/findings` | Abrir hallazgo |
| UC-11-13 | `POST /admin/governance/assessments/{id}/remediation-plans` | Crear plan + acciones de remediación |
| UC-11-14 | `POST /admin/governance/remediation-actions/{id}/verify` | Verificar acción (cierra hallazgo/plan si procede) |
| UC-11-14 | `PATCH /admin/governance/findings/{id}` | Actualizar hallazgo |
| UC-11-15 | `POST /admin/governance/drafts` | Guardar draft genérico |
| UC-11-15 | `POST /admin/governance/drafts/{id}/publish` | Publicar draft y materializarlo |

> Las rutas de "acción" siguen la convención del repo `/{recurso}/{id}/{accion}`
> (p. ej. `/legal-holds/{id}/release`), equivalente a las notas `:release`/`:run`/
> `:publish`/`:verify` del `.puml`.

## Entidades principales

`data_domains`, `data_classifications`, `entity_registry`, `field_registry`,
`write_policies`, `retention_policies`, `anonymization_rules`, `retention_executions`,
`record_revisions`, `legal_holds`, `data_residency_policies`,
`tenant_residency_bindings`, `cross_border_transfer_events`, `backup_policies`,
`restore_test_runs`, `operational_frameworks`, `operational_framework_controls`,
`workload_assessments`, `assessment_control_results`, `assessment_findings`,
`remediation_plans`, `remediation_actions`, `governance_change_log`, `draft_records`.

## Reglas de negocio

- **UPSERT por code** en dominios/clasificaciones/políticas (unicidad).
- **Legal hold ACTIVE excluye** objetivos del barrido de retención (UC-11-05 ⊃ UC-11-08).
- **Idempotencia** por `transfer_reference` (transferencias) y `publish_reference` (drafts).
- **Segregación de funciones**: el verificador de una acción no puede ser el asignado.
- **Cierre condicional**: un hallazgo se cierra y un plan se completa solo cuando
  todas las acciones asociadas están VERIFIED.
- **Backup**: `rpo_seconds <= rto_seconds`; la prueba de restauración compara
  medidos vs objetivo y señala `objectiveBreached`.
- Cada cambio de gobierno deja rastro en `governance_change_log`; los barridos y
  publicaciones dejan `record_revisions` (append-only).

## Permisos y auth

Guard global JWT. Todos los endpoints exigen `@Roles('SECURITY_ADMIN')` (incluidos
los `internal/*` de workers, al no existir un principal de servicio dedicado).

## Persistencia

`EntityManager` de `@mikro-orm/postgresql`; escrituras en `em.transactional`. FK
son columnas uuid planas → `flush` padre-antes-de-hijo. `createdBy(actor.id)` para
auditoría; nunca se fija `row_version`. Conceptos de estado/tipo vía `SYSOPS.*`
(archivo `system_ops.concepts.ts`) y `CONCEPTS.*` transversales (`STATE_ACTIVE`,
`STATE_REVOKED`).

## Logs

Pino estructurado (`operation`, ids); nunca secretos ni PHI.

## Tests

- Unit: `services/*.service.spec.ts` y `controllers/*.spec.ts` (repos/em/servicios
  mockeados). `npx jest src/modules/system_ops`.
- Smoke de contrato: `test/smoke/modules/system_ops.smoke.ts`
  (`export const SYSTEM_OPS_SMOKE`).

