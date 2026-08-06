<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/diagnostics/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `diagnostics`

**Fuente:** [`src/modules/diagnostics/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/diagnostics/README.md)
· 4 controllers · 5 services · 5 repositories · 36 entidades · 6 DTO

---

# Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica

Implementa los 14 casos de uso del módulo 20 más 4 endpoints de soporte (altas de
padres que el módulo no expone como UC pero que los flujos necesitan). Sigue el
patrón de capas de `iam`: controladores finos → servicios con la unidad de trabajo
(`em.transactional`) → repositorios stateless (reciben el `EntityManager`).

## Endpoints (UC → ruta / método)

| UC | Método y ruta | Descripción |
|----|---------------|-------------|
| soporte | `POST /diagnostics/specimens` | Alta de espécimen (padre de acesión/orden/custodia) |
| UC-20-01 | `POST /diagnostics/accessions` | Acesionar especímenes recibidos |
| UC-20-02 | `POST /diagnostics/specimens/{id}/rejection` | Rechazar espécimen y solicitar recolección |
| soporte | `POST /diagnostics/specimens/{id}/containers` | Alta de contenedor |
| UC-20-03 | `POST /diagnostics/containers/{id}/custody-events` | Cadena de custodia / traslado |
| UC-20-04 | `POST /diagnostics/work-orders` | Abrir orden de trabajo y desglosar pruebas |
| soporte | `POST /diagnostics/analyzer-runs` | Abrir corrida de analizador |
| UC-20-05 | `POST /diagnostics/analyzer-runs/{id}/messages` | Ingerir mensaje de resultado (LIS/HL7/ASTM) |
| UC-20-06 | `POST /diagnostics/results/{observationId}/verifications` | Verificar (técnica/facultativa) |
| UC-20-07 | `POST /diagnostics/reports/{reportId}/versions` | Crear/enmendar versión de informe |
| UC-20-08 | `POST /diagnostics/reports/{reportId}/versions/{versionId}/release` | Validar y liberar |
| UC-20-09 | `POST /diagnostics/critical-results` | Detectar y notificar resultado crítico |
| UC-20-10 | `POST /diagnostics/critical-results/{id}/acknowledge` | Acusar recibo / escalar |
| soporte | `POST /diagnostics/imaging-endpoints` | Alta de endpoint DICOM |
| UC-20-11 | `POST /dicomweb/studies` | Ingestar estudio DICOM (STOW-RS) |
| UC-20-12 | `POST /diagnostics/clinical-media` | Adjuntar media clínica / imagen |
| UC-20-13 | `POST /diagnostics/imaging-studies/{id}/dose-events` | Registrar dosis de radiación |
| UC-20-14 | `POST /diagnostics/data-quality-events` | Evento de calidad de datos + provenance |

## Entidades (esquema `diagnostics`)

Especímenes: `specimens`, `laboratory_accessions`, `accession_specimens`,
`specimen_chain_of_custody_events`, `specimen_rejection_events`,
`specimen_containers`, `specimen_container_events`. Laboratorio:
`laboratory_work_orders`, `laboratory_work_order_tests`, `analyzer_runs`,
`analyzer_result_messages`, `result_verifications`. Informe:
`diagnostic_report_versions`, `diagnostic_report_results`,
`diagnostic_report_files`, `diagnostic_release_events`,
`critical_result_notifications`. Imagen: `imaging_endpoints`, `imaging_studies`,
`imaging_series`, `imaging_instances`, `dicom_object_locations`,
`imaging_procedure_steps`, `radiation_dose_events`. Media/calidad:
`clinical_media`, `media_annotations`, `diagnostic_data_quality_events`,
`diagnostic_provenance_links`.

## Reglas de negocio y persistencia

- Las FK son columnas uuid planas → los servicios hacen `flush` del padre antes de
  crear hijos (`em.transactional`, `{ partial: true }` en cada `create`).
- `rowVersion` nunca se fija (DEFAULT 1 en BD). Auditoría con `createdBy(actor.id)`
  en entidades con `created_at/updated_at`; las tablas append-only fijan solo
  `created_at` (o `recorded_at` en versiones de informe y eventos de liberación).
- Estados/tipos que fija el servidor salen de `diagnostics.concepts.ts` (`DIAG`);
  los valores que aporta el cliente (tipo de espécimen, código de prueba,
  modalidad, formato de mensaje…) llegan por DTO.
- Idempotencia: mensaje de analizador por `(run, message_control_id)`, estudio
  DICOM por `dicom_study_instance_uid`, media por `file_id`, crítico por
  `observation_id`. Versiones de informe inmutables: la enmienda crea una nueva
  versión que apunta a la previa (`supersedesVersionId`).
- Excepciones de dominio: `ResourceNotFoundException` (404),
  `ConflictException` (409), `PreconditionFailedException` (422).

## Permisos y auth

Guard JWT global; todos los endpoints exigen autenticación (401 sin token). No se
restringe por rol específico porque los actores son de laboratorio/imagen/sistema
(flebotomista, técnico, patólogo, PACS, worker), no administradores de seguridad.

## Logs

Pino estructurado por operación (`diagnostics.<área>.<acción>`), con ids de
recurso pero sin PHI ni secretos. Se registra inicio de la operación y los
rechazos de regla de negocio.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/em; happy + not-found +
  conflict + precondición) y `controllers/*.controller.spec.ts` (delegación).
- Smoke transversal: `test/smoke/modules/diagnostics.smoke.ts`
  (`DIAGNOSTICS_SMOKE`). Encadena espécimen→acesión→orden→verificación→informe→
  liberación e imagen (endpoint→STOW-RS→dosis). UC-20-05 (device) y UC-20-12
  (file) se cubren con 401/404/400 por falta de un padre cross-schema disponible.

