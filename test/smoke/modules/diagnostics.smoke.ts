import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { CONCEPTS } from '../../../src/common';

/**
 * Concepto real ya sembrado (terminology.catalog_concepts) reutilizado como
 * stand-in para los `*_concept_id` que el cliente aporta (tipo de espécimen,
 * código de prueba, modalidad, etc.). Las columnas tienen FK forzada a
 * catalog_concepts, así que no sirve un UUID inexistente; la semántica no importa
 * para el smoke, solo que la fila exista. Los estados que fija el servicio salen
 * de `diagnostics.concepts.ts` (sembrados por el agregador de conceptos).
 */
const CID = CONCEPTS.STATE_ACTIVE;

/**
 * Smoke del módulo Diagnostics (20). Encadena sus propios recursos con `ctx.vars`:
 * espécimen (soporte) -> acesión (UC-01) -> contenedor+custodia (UC-03) ->
 * orden de trabajo (UC-04) -> verificación (UC-06) -> versión de informe (UC-07)
 * -> liberación (UC-08) -> crítico (UC-09) -> acuse (UC-10); e imagen: endpoint
 * (soporte) -> STOW-RS (UC-11) -> dosis (UC-13); más calidad+provenance (UC-14).
 *
 * Depende de recursos de módulos que corren antes: `ctx.vars.patientProfileId`
 * (Profiles), `ctx.vars.clinServiceRequestId`, `ctx.vars.clinObservationId`,
 * `ctx.vars.clinReportId` (Clinical), y `ctx.tenantId` / `ctx.adminUserId`.
 *
 * Fallbacks documentados (padres cross-schema no creables por endpoint ni
 * disponibles como var en el smoke):
 *  - UC-20-05 (mensaje de analizador): la corrida necesita un `analyzer_device_id`
 *    (iam.devices) sembrado pero no expuesto como var → se cubre con 401/404.
 *  - UC-20-12 (media clínica): `file_id` (common.files) NOT NULL sin var → se
 *    cubre con 401/validación 400.
 */
export const DIAGNOSTICS_SMOKE: SmokeCase[] = [
  // ---- Soporte: alta de espécimen (padre de acesión/orden/custodia) ----------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/specimens', name: 'happy: alta de espécimen',
    method: 'post', path: () => '/diagnostics/specimens',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      custodianTenantId: c.tenantId,
      specimenTypeConceptId: CID,
    }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagSpecimenId = String(b.id); },
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/specimens', name: 'límite: sin auth',
    method: 'post', path: () => '/diagnostics/specimens', auth: false,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, custodianTenantId: c.tenantId, specimenTypeConceptId: CID }),
    expectedStatus: 401,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/specimens', name: 'límite: validación (falta specimenTypeConceptId)',
    method: 'post', path: () => '/diagnostics/specimens',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, custodianTenantId: c.tenantId }),
    expectedStatus: 400,
  },

  // ---- Segundo espécimen para el flujo de rechazo (UC-02) --------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/specimens', name: 'happy: espécimen para rechazo',
    method: 'post', path: () => '/diagnostics/specimens',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, custodianTenantId: c.tenantId, specimenTypeConceptId: CID }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagRejectSpecimenId = String(b.id); },
  },

  // ---- UC-20-01: acesionar --------------------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/accessions', name: 'happy: acesionar espécimen',
    method: 'post', path: () => '/diagnostics/accessions',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      custodianTenantId: c.tenantId,
      specimenIds: [c.vars.diagSpecimenId],
    }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagAccessionId = String(b.id); },
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/accessions', name: 'límite: espécimen inexistente',
    method: 'post', path: () => '/diagnostics/accessions',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, custodianTenantId: c.tenantId, specimenIds: [UUID_ABSENT] }),
    expectedStatus: 404,
  },

  // ---- UC-20-02: rechazar ---------------------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/specimens/{id}/rejection', name: 'happy: rechazar espécimen',
    method: 'post', path: (c) => `/diagnostics/specimens/${c.vars.diagRejectSpecimenId}/rejection`,
    body: () => ({ rejectionReasonConceptId: CID, recollectionRequired: true }),
    expectedStatus: 201,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/specimens/{id}/rejection', name: 'límite: espécimen inexistente',
    method: 'post', path: () => `/diagnostics/specimens/${UUID_ABSENT}/rejection`,
    body: () => ({ rejectionReasonConceptId: CID }), expectedStatus: 404,
  },

  // ---- Soporte: contenedor (padre de custodia UC-03) ------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/specimens/{id}/containers', name: 'happy: alta de contenedor',
    method: 'post', path: (c) => `/diagnostics/specimens/${c.vars.diagSpecimenId}/containers`,
    body: () => ({ containerIdentifier: `CT-${Date.now()}`, containerTypeConceptId: CID }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagContainerId = String(b.id); },
  },

  // ---- UC-20-03: cadena de custodia -----------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/containers/{id}/custody-events', name: 'happy: custodia/traslado',
    method: 'post', path: (c) => `/diagnostics/containers/${c.vars.diagContainerId}/custody-events`,
    body: (c) => ({ specimenId: c.vars.diagSpecimenId, temperatureCelsius: '4.0', sealIdentifier: 'SEAL-1' }),
    expectedStatus: 201,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/containers/{id}/custody-events', name: 'límite: contenedor inexistente',
    method: 'post', path: (c) => `/diagnostics/containers/${UUID_ABSENT}/custody-events`,
    body: (c) => ({ specimenId: c.vars.diagSpecimenId }), expectedStatus: 404,
  },

  // ---- UC-20-04: orden de trabajo -------------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/work-orders', name: 'happy: abrir orden y desglosar pruebas',
    method: 'post', path: () => '/diagnostics/work-orders',
    body: (c) => ({
      laboratoryAccessionId: c.vars.diagAccessionId,
      custodianTenantId: c.tenantId,
      tests: [
        {
          serviceRequestId: c.vars.clinServiceRequestId,
          testCodeConceptId: CID,
          specimenId: c.vars.diagSpecimenId,
        },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.diagWorkOrderId = String(b.id);
      if (Array.isArray(b.testIds) && b.testIds.length) c.vars.diagWorkOrderTestId = String(b.testIds[0]);
    },
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/work-orders', name: 'límite: acesión inexistente',
    method: 'post', path: (c) => '/diagnostics/work-orders',
    body: (c) => ({
      laboratoryAccessionId: UUID_ABSENT,
      custodianTenantId: c.tenantId,
      tests: [{ serviceRequestId: c.vars.clinServiceRequestId ?? UUID_ABSENT, testCodeConceptId: CID }],
    }),
    expectedStatus: 404,
  },

  // ---- UC-20-05: corrida de analizador + mensaje (fallback 404/401) ---------
  // La corrida requiere un analyzer_device_id (iam.devices) sembrado que el smoke
  // no expone como var; se cubre el endpoint con validación y auth.
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/analyzer-runs', name: 'límite: sin auth',
    method: 'post', path: () => '/diagnostics/analyzer-runs', auth: false,
    body: () => ({ analyzerDeviceId: UUID_ABSENT, runIdentifier: 'R-1', custodianTenantId: UUID_ABSENT }),
    expectedStatus: 401,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/analyzer-runs', name: 'límite: validación (falta runIdentifier)',
    method: 'post', path: (c) => '/diagnostics/analyzer-runs',
    body: (c) => ({ analyzerDeviceId: UUID_ABSENT, custodianTenantId: c.tenantId }), expectedStatus: 400,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/analyzer-runs/{id}/messages', name: 'límite: corrida inexistente',
    method: 'post', path: () => `/diagnostics/analyzer-runs/${UUID_ABSENT}/messages`,
    body: () => ({ payloadHash: 'h1' }), expectedStatus: 404,
  },

  // ---- UC-20-06: verificar resultado ----------------------------------------
  // verifiable_id no tiene FK forzada: se usa la observación clínica o un stand-in.
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/results/{observationId}/verifications', name: 'happy: verificar (técnico)',
    method: 'post', path: (c) => `/diagnostics/results/${c.vars.clinObservationId ?? c.vars.patientProfileId}/verifications`,
    body: (c) => ({ level: 'TECHNICAL', verifiedByProfileId: c.vars.practitionerProfileId ?? c.vars.patientProfileId, custodianTenantId: c.tenantId }),
    expectedStatus: 201,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/results/{observationId}/verifications', name: 'límite: validación (falta level)',
    method: 'post', path: (c) => `/diagnostics/results/${c.vars.patientProfileId}/verifications`,
    body: (c) => ({ verifiedByProfileId: c.vars.patientProfileId, custodianTenantId: c.tenantId }),
    expectedStatus: 400,
  },

  // ---- UC-20-07: versión de informe -----------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/reports/{reportId}/versions', name: 'happy: crear versión',
    method: 'post', path: (c) => `/diagnostics/reports/${c.vars.clinReportId}/versions`,
    body: (c) => ({
      custodianTenantId: c.tenantId,
      conclusionText: 'Hallazgos dentro de límites normales.',
      results: c.vars.clinObservationId ? [{ observationId: c.vars.clinObservationId }] : [],
    }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagReportVersionId = String(b.id); },
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/reports/{reportId}/versions', name: 'límite: sin auth',
    method: 'post', path: (c) => `/diagnostics/reports/${c.vars.clinReportId}/versions`, auth: false,
    body: (c) => ({ custodianTenantId: c.tenantId }), expectedStatus: 401,
  },

  // ---- UC-20-08: liberar versión --------------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/reports/{reportId}/versions/{versionId}/release', name: 'happy: liberar',
    method: 'post',
    path: (c) => `/diagnostics/reports/${c.vars.clinReportId}/versions/${c.vars.diagReportVersionId}/release`,
    body: () => ({ patientVisibility: 'VISIBLE' }), expectedStatus: 200,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/reports/{reportId}/versions/{versionId}/release', name: 'límite: versión inexistente',
    method: 'post', path: (c) => `/diagnostics/reports/${c.vars.clinReportId}/versions/${UUID_ABSENT}/release`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-20-09: detectar crítico -------------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/critical-results', name: 'happy: detectar crítico',
    method: 'post', path: () => '/diagnostics/critical-results',
    body: (c) => ({
      observationId: c.vars.clinObservationId,
      patientProfileId: c.vars.patientProfileId,
      custodianTenantId: c.tenantId,
      escalationDueInMinutes: 30,
    }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagCriticalId = String(b.id); },
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/critical-results', name: 'límite: validación (falta observationId)',
    method: 'post', path: (c) => '/diagnostics/critical-results',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, custodianTenantId: c.tenantId }),
    expectedStatus: 400,
  },

  // ---- UC-20-10: acusar / escalar -------------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/critical-results/{id}/acknowledge', name: 'happy: acusar recibo',
    method: 'post', path: (c) => `/diagnostics/critical-results/${c.vars.diagCriticalId}/acknowledge`,
    body: (c) => ({ acknowledgedByProfileId: c.vars.practitionerProfileId ?? c.vars.patientProfileId }),
    expectedStatus: 200,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/critical-results/{id}/acknowledge', name: 'límite: notificación inexistente',
    method: 'post', path: (c) => `/diagnostics/critical-results/${UUID_ABSENT}/acknowledge`,
    body: (c) => ({ acknowledgedByProfileId: c.vars.patientProfileId }), expectedStatus: 404,
  },

  // ---- Soporte: endpoint DICOM (padre de STOW-RS) ---------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/imaging-endpoints', name: 'happy: alta de endpoint DICOM',
    method: 'post', path: () => '/diagnostics/imaging-endpoints',
    body: (c) => ({ baseUri: 'https://pacs.example/dicomweb', tenantId: c.tenantId }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagImagingEndpointId = String(b.id); },
  },

  // ---- UC-20-11: STOW-RS ----------------------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /dicomweb/studies', name: 'happy: ingestar estudio DICOM',
    method: 'post', path: () => '/dicomweb/studies',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      imagingEndpointId: c.vars.diagImagingEndpointId,
      custodianTenantId: c.tenantId,
      dicomStudyInstanceUid: `1.2.840.${Date.now()}`,
      series: [
        {
          dicomSeriesInstanceUid: `1.2.840.${Date.now()}.1`,
          modalityConceptId: CID,
          instances: [{ dicomSopInstanceUid: `1.2.840.${Date.now()}.1.1`, sopClassConceptId: CID }],
        },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.diagImagingStudyId = String(b.id); },
  },
  {
    module: 'Diagnostics', endpoint: 'POST /dicomweb/studies', name: 'límite: endpoint inexistente',
    method: 'post', path: (c) => '/dicomweb/studies',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      imagingEndpointId: UUID_ABSENT,
      custodianTenantId: c.tenantId,
      dicomStudyInstanceUid: `1.2.840.${Date.now()}.x`,
      series: [{ dicomSeriesInstanceUid: 's1', instances: [] }],
    }),
    expectedStatus: 404,
  },

  // ---- UC-20-12: media clínica (fallback: file_id sin var) ------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/clinical-media', name: 'límite: sin auth',
    method: 'post', path: () => '/diagnostics/clinical-media', auth: false,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, fileId: UUID_ABSENT, custodianTenantId: c.tenantId }),
    expectedStatus: 401,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/clinical-media', name: 'límite: validación (falta fileId)',
    method: 'post', path: (c) => '/diagnostics/clinical-media',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, custodianTenantId: c.tenantId }),
    expectedStatus: 400,
  },

  // ---- UC-20-13: dosis de radiación -----------------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/imaging-studies/{id}/dose-events', name: 'happy: registrar dosis',
    method: 'post', path: (c) => `/diagnostics/imaging-studies/${c.vars.diagImagingStudyId}/dose-events`,
    body: () => ({ doseLengthProduct: '350.5', effectiveDoseMsv: '7.2' }),
    expectedStatus: 201,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/imaging-studies/{id}/dose-events', name: 'límite: estudio inexistente',
    method: 'post', path: () => `/diagnostics/imaging-studies/${UUID_ABSENT}/dose-events`,
    body: () => ({ doseLengthProduct: '1' }), expectedStatus: 404,
  },

  // ---- UC-20-14: calidad de datos + provenance ------------------------------
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/data-quality-events', name: 'happy: evento de calidad + provenance',
    method: 'post', path: () => '/diagnostics/data-quality-events',
    body: (c) => ({
      targetId: c.vars.diagSpecimenId,
      ruleCode: 'SPEC_VOLUME_LOW',
      custodianTenantId: c.tenantId,
      targetTypeConceptId: CID,
      severityConceptId: CID,
      provenanceSourceId: c.vars.diagAccessionId,
      provenanceSourceTypeConceptId: CID,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Diagnostics', endpoint: 'POST /diagnostics/data-quality-events', name: 'límite: validación (falta ruleCode)',
    method: 'post', path: (c) => '/diagnostics/data-quality-events',
    body: (c) => ({ targetId: c.vars.diagSpecimenId, custodianTenantId: c.tenantId }),
    expectedStatus: 400,
  },
];
