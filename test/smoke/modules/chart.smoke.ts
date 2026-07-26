import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Chart (15). Encadena el ciclo de vida de una nota clínica
 * versionada con `ctx.vars`: crea una nota (cabecera + versión 1 borrador), añade
 * una versión, registra hallazgos de examen sobre el borrador, la firma, la
 * cofirma, la libera al paciente, la retiene y finalmente enmienda la nota
 * firmada. Después ejercita documentos gobernados (con un archivo real creado en
 * Common), planes de cuidado con actividades y la asignación de plantillas.
 *
 * Depende de `ctx.vars.patientProfileId` (poblado por Profiles, que corre antes).
 * Ids expuestos: `vars.chartNoteId`, `vars.chartVersionId`, `vars.chartPlanId`,
 * `vars.chartActivityId`.
 *
 * Nota: los recursos de nota/versión no exponen un endpoint de lectura de sus
 * actividades hijas, así que el plan captura su propia actividad no es posible
 * por HTTP; UC-15-11 se cubre con su caso límite (plan/actividad inexistente).
 */
export const CHART_SMOKE: SmokeCase[] = [
  // ---- UC-15-01: crear nota clínica versionada ------------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/notes', name: 'happy: crear nota (borrador SOAP)',
    method: 'post', path: () => '/charts/notes',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      authorProfileId: c.vars.practitionerProfileId ?? c.vars.patientProfileId,
      subjectiveText: 'Paciente refiere cefalea',
      objectiveText: 'PA 120/80',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.chartNoteId = String(b.noteId);
      c.vars.chartVersionId = String(b.versionId);
    },
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes', name: 'límite: sin auth',
    method: 'post', path: () => '/charts/notes', auth: false,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, authorProfileId: c.vars.patientProfileId }),
    expectedStatus: 401,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes', name: 'límite: validación (falta patientProfileId)',
    method: 'post', path: () => '/charts/notes',
    body: () => ({ subjectiveText: 'x' }), expectedStatus: 400,
  },

  // ---- UC-15-08: hallazgos de examen físico (sobre el borrador) --------------
  {
    module: 'Chart', endpoint: 'POST /charts/notes/versions/{versionId}/exam-findings',
    name: 'happy: registrar hallazgos',
    method: 'post', path: (c) => `/charts/notes/versions/${c.vars.chartVersionId}/exam-findings`,
    body: () => ({ findings: [{ isNormal: true, findingText: 'Auscultación normal' }], objectiveText: 'Sin hallazgos' }),
    expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes/versions/{versionId}/exam-findings',
    name: 'límite: versión inexistente',
    method: 'post', path: () => `/charts/notes/versions/${UUID_ABSENT}/exam-findings`,
    body: () => ({ findings: [{ isNormal: true }] }), expectedStatus: 404,
  },

  // ---- UC-15-02: editar borrador (nueva versión) ----------------------------
  {
    module: 'Chart', endpoint: 'PUT /charts/notes/{noteId}/versions', name: 'happy: nueva versión',
    method: 'put', path: (c) => `/charts/notes/${c.vars.chartNoteId}/versions`,
    body: (c) => ({
      authorProfileId: c.vars.practitionerProfileId ?? c.vars.patientProfileId,
      assessmentText: 'Cefalea tensional',
    }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.chartVersionId = String(b.versionId); },
  },
  {
    module: 'Chart', endpoint: 'PUT /charts/notes/{noteId}/versions', name: 'límite: nota inexistente',
    method: 'put', path: () => `/charts/notes/${UUID_ABSENT}/versions`,
    body: (c) => ({ authorProfileId: c.vars.patientProfileId }), expectedStatus: 404,
  },

  // ---- UC-15-03: firmar y sellar versión ------------------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/notes/{noteId}/versions/{versionId}/sign',
    name: 'happy: firmar versión',
    method: 'post',
    path: (c) => `/charts/notes/${c.vars.chartNoteId}/versions/${c.vars.chartVersionId}/sign`,
    body: (c) => ({ signerProfileId: c.practitionerSubtypeId }),
    expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes/{noteId}/versions/{versionId}/sign',
    name: 'límite: doble firma (ya no es borrador)',
    method: 'post',
    path: (c) => `/charts/notes/${c.vars.chartNoteId}/versions/${c.vars.chartVersionId}/sign`,
    body: (c) => ({ signerProfileId: c.practitionerSubtypeId }),
    expectedStatus: 422,
  },

  // ---- UC-15-04: cofirmar (cadena de firmas) --------------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/notes/{noteId}/versions/{versionId}/cosign',
    name: 'happy: cofirmar versión',
    method: 'post',
    path: (c) => `/charts/notes/${c.vars.chartNoteId}/versions/${c.vars.chartVersionId}/cosign`,
    body: (c) => ({ signerProfileId: c.adminUserId }),
    expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes/{noteId}/versions/{versionId}/cosign',
    name: 'límite: versión inexistente',
    method: 'post',
    path: (c) => `/charts/notes/${c.vars.chartNoteId}/versions/${UUID_ABSENT}/cosign`,
    body: (c) => ({ signerProfileId: c.adminUserId }), expectedStatus: 404,
  },

  // ---- UC-15-06: liberar versión al paciente --------------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/notes/versions/{versionId}/release',
    name: 'happy: liberar al paciente',
    method: 'post', path: (c) => `/charts/notes/versions/${c.vars.chartVersionId}/release`,
    body: () => ({ policyVersion: '1.0' }), expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes/versions/{versionId}/release',
    name: 'límite: versión inexistente',
    method: 'post', path: () => `/charts/notes/versions/${UUID_ABSENT}/release`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-15-07: retener versión (motivo legal) -----------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/notes/versions/{versionId}/withhold',
    name: 'happy: retener del paciente',
    method: 'post', path: (c) => `/charts/notes/versions/${c.vars.chartVersionId}/withhold`,
    body: () => ({ policyVersion: '1.0' }), expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes/versions/{versionId}/withhold',
    name: 'límite: versión inexistente',
    method: 'post', path: () => `/charts/notes/versions/${UUID_ABSENT}/withhold`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-15-05: enmendar nota firmada --------------------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/notes/{noteId}/amendments', name: 'happy: enmendar nota',
    method: 'post', path: (c) => `/charts/notes/${c.vars.chartNoteId}/amendments`,
    body: (c) => ({
      authorProfileId: c.vars.practitionerProfileId ?? c.vars.patientProfileId,
      amendmentReasonText: 'Corrección de dosis',
      planText: 'Ibuprofeno 400mg c/8h',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/notes/{noteId}/amendments', name: 'límite: nota inexistente',
    method: 'post', path: () => `/charts/notes/${UUID_ABSENT}/amendments`,
    body: (c) => ({ authorProfileId: c.vars.patientProfileId, amendmentReasonText: 'x' }),
    expectedStatus: 404,
  },

  // ---- UC-15-09: documento gobernado (crea antes un archivo real) -----------
  {
    module: 'Chart', endpoint: 'POST /common/files', name: 'setup: archivo para documento',
    method: 'post', path: () => '/common/files',
    body: (c) => ({
      originalName: `chart-${c.u}.pdf`,
      category: 'DOCUMENT',
      sensitivity: 'PHI',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      contentHash: `hash-${c.u}`,
      storageUri: `s3://bucket/chart-${c.u}.pdf`,
    }),
    expectedStatus: 201, capture: (b, c) => { c.vars.chartFileId = String(b.id); },
  },
  {
    module: 'Chart', endpoint: 'POST /charts/documents', name: 'happy: adjuntar documento con archivo',
    method: 'post', path: () => '/charts/documents',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      tenantId: c.tenantId,
      title: 'Resultado de laboratorio',
      files: [{ fileId: c.vars.chartFileId, contentRole: 'PRIMARY', ordinal: 0 }],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/documents', name: 'happy: documento sin archivos',
    method: 'post', path: () => '/charts/documents',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, tenantId: c.tenantId, title: 'Nota externa' }),
    expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/documents', name: 'límite: validación (falta title)',
    method: 'post', path: () => '/charts/documents',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, tenantId: c.tenantId }),
    expectedStatus: 400,
  },

  // ---- UC-15-10: plan de cuidado con actividades ----------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/care-plans', name: 'happy: crear plan con actividades',
    method: 'post', path: () => '/charts/care-plans',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      goalText: 'Control de presión arterial',
      activities: [{ detailText: 'Caminata diaria' }, { detailText: 'Dieta hiposódica' }],
    }),
    expectedStatus: 201, capture: (b, c) => { c.vars.chartPlanId = String(b.id); },
  },
  {
    module: 'Chart', endpoint: 'POST /charts/care-plans', name: 'límite: sin auth',
    method: 'post', path: () => '/charts/care-plans', auth: false,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId }), expectedStatus: 401,
  },

  // ---- UC-15-11: actualizar actividad (solo caso límite; hijo no legible por HTTP) ---
  {
    module: 'Chart', endpoint: 'PATCH /charts/care-plans/{planId}/activities/{activityId}',
    name: 'límite: plan inexistente',
    method: 'patch', path: () => `/charts/care-plans/${UUID_ABSENT}/activities/${UUID_ABSENT}`,
    body: () => ({ status: 'COMPLETED' }), expectedStatus: 404,
  },
  {
    module: 'Chart', endpoint: 'PATCH /charts/care-plans/{planId}/activities/{activityId}',
    name: 'límite: actividad inexistente en plan real',
    method: 'patch', path: (c) => `/charts/care-plans/${c.vars.chartPlanId}/activities/${UUID_ABSENT}`,
    body: () => ({ status: 'IN_PROGRESS' }), expectedStatus: 404,
  },

  // ---- UC-15-12: asignar plantilla de chart ---------------------------------
  {
    module: 'Chart', endpoint: 'POST /charts/templates/{templateId}/assignments',
    name: 'happy: asignar plantilla (default)',
    method: 'post', path: (c) => `/charts/templates/${c.chartTemplateId}/assignments`,
    body: (c) => ({ practitionerProfileId: c.practitionerSubtypeId, isDefault: true }),
    expectedStatus: 201,
  },
  {
    module: 'Chart', endpoint: 'POST /charts/templates/{templateId}/assignments',
    name: 'límite: sin auth',
    method: 'post', path: () => `/charts/templates/${UUID_ABSENT}/assignments`, auth: false,
    body: () => ({ isDefault: false }), expectedStatus: 401,
  },
];
