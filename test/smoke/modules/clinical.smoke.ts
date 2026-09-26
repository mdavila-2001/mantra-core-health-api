import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { CONCEPTS } from '../../../src/common';

/**
 * Concepto real ya sembrado (terminology.catalog_concepts) reutilizado como
 * stand-in para los `*_concept_id` que el cliente aporta (código de observación,
 * sustancia, vacuna, medicamento, manifestación, unidad). Las columnas tienen FK
 * forzada a catalog_concepts, así que no sirve un UUID inexistente; la semántica
 * del concepto no importa para el smoke, solo que la fila exista.
 */
const CID = CONCEPTS.STATE_ACTIVE;

/**
 * Smoke del módulo Clinical (08). Encadena sus propios recursos con `ctx.vars`:
 * abre un episodio, hace check-in de un encuentro, registra una observación,
 * crea una orden de servicio, emite y libera un reporte diagnóstico, registra
 * condición/alergia/medicación/procedimiento/inmunización y cierra el encuentro.
 *
 * Depende de `ctx.vars.patientProfileId` (poblado por Profiles, que corre antes)
 * y de `ctx.tenantId` / `ctx.adminUserId`. Los `*_concept_id` usan los conceptos
 * del propio módulo (`clinical.concepts.ts`), que no tienen FK forzada en la BD.
 *
 * Nota de rutas: los sufijos `:accion` de la spec se realizan como segmento de
 * ruta (`/check-in`, `/{id}/close`, `/{id}/amend`, `/{id}/release`) por
 * compatibilidad con el router (Express 5); el método y la intención se preservan.
 */
export const CLINICAL_SMOKE: SmokeCase[] = [
  // ---- UC-08-01: abrir episodio ---------------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/care-episodes',
    name: 'happy: abrir episodio',
    method: 'post',
    path: () => '/clinical/care-episodes',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      tenantId: c.tenantId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.clinEpisodeId = String(b.id);
    },
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/care-episodes',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/clinical/care-episodes',
    auth: false,
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      tenantId: c.tenantId,
    }),
    expectedStatus: 401,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/care-episodes',
    name: 'límite: validación (falta tenantId)',
    method: 'post',
    path: () => '/clinical/care-episodes',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId }),
    expectedStatus: 400,
  },

  // ---- UC-08-02: check-in de encuentro --------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/encounters/check-in',
    name: 'happy: check-in',
    method: 'post',
    path: () => '/clinical/encounters/check-in',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      tenantId: c.tenantId,
      episodeId: c.vars.clinEpisodeId,
      participants: [
        {
          practitionerProfileId:
            c.vars.practitionerProfileId ?? c.vars.patientProfileId,
        },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.clinEncounterId = String(b.id);
    },
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/encounters/check-in',
    name: 'límite: episodio inexistente',
    method: 'post',
    path: () => '/clinical/encounters/check-in',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      tenantId: c.tenantId,
      episodeId: UUID_ABSENT,
    }),
    expectedStatus: 404,
  },

  // ---- UC-08-03: registrar observación --------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/observations',
    name: 'happy: observación de signos vitales',
    method: 'post',
    path: () => '/clinical/observations',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      encounterId: c.vars.clinEncounterId,
      codeConceptId: CID,
      quantityValue: 120,
      quantityUnitConceptId: CID,
      components: [{ codeConceptId: CID, quantityValue: 80 }],
      notes: ['Presión arterial en reposo'],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.clinObservationId = String(b.id);
    },
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/observations',
    name: 'límite: sin valor (precondición)',
    method: 'post',
    path: () => '/clinical/observations',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      codeConceptId: UUID_ABSENT,
    }),
    expectedStatus: 422,
  },

  // ---- UC-08-04: enmendar observación ---------------------------------------
  {
    module: 'Clinical',
    endpoint: 'PATCH /clinical/observations/{id}/amend',
    name: 'happy: enmienda',
    method: 'patch',
    path: (c) => `/clinical/observations/${c.vars.clinObservationId}/amend`,
    body: () => ({ note: 'Corrección de unidad', valueDecimal: 118 }),
    expectedStatus: 200,
  },
  {
    module: 'Clinical',
    endpoint: 'PATCH /clinical/observations/{id}/amend',
    name: 'límite: observación inexistente',
    method: 'patch',
    path: () => `/clinical/observations/${UUID_ABSENT}/amend`,
    body: () => ({ note: 'x' }),
    expectedStatus: 404,
  },

  // ---- UC-08-05: orden de servicio ------------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/service-requests',
    name: 'happy: orden de laboratorio',
    method: 'post',
    path: () => '/clinical/service-requests',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      encounterId: c.vars.clinEncounterId,
      codeConceptId: CID,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.clinServiceRequestId = String(b.id);
    },
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/service-requests',
    name: 'límite: encuentro inexistente',
    method: 'post',
    path: () => '/clinical/service-requests',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      codeConceptId: UUID_ABSENT,
      encounterId: UUID_ABSENT,
    }),
    expectedStatus: 404,
  },

  // ---- UC-08-06: reporte diagnóstico ----------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/diagnostic-reports',
    name: 'happy: emitir reporte',
    method: 'post',
    path: () => '/clinical/diagnostic-reports',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      serviceRequestId: c.vars.clinServiceRequestId,
      codeConceptId: CID,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.clinReportId = String(b.id);
    },
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/diagnostic-reports',
    name: 'límite: orden inexistente',
    method: 'post',
    path: () => '/clinical/diagnostic-reports',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      codeConceptId: UUID_ABSENT,
      serviceRequestId: UUID_ABSENT,
    }),
    expectedStatus: 404,
  },

  // ---- UC-08-07: liberar resultados (D-E: obsoleta, BR-17/CL-46) ------------
  // No escribía diagnostic_release_events: lo liberado por acá no llegaba a
  // «Mis resultados» (CV-02). D-E fijó un solo camino canónico
  // (diagnostics/reports/:reportId/versions/:versionId/release) y ésta quedó
  // sin borrar pero devolviendo 422 siempre, para no simular una liberación
  // que el paciente nunca ve.
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/diagnostic-reports/{id}/release',
    name: 'obsoleta: un reporte liberable igual devuelve 422 (D-E)',
    method: 'post',
    path: (c) => `/clinical/diagnostic-reports/${c.vars.clinReportId}/release`,
    body: () => ({}),
    expectedStatus: 422,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/diagnostic-reports/{id}/release',
    name: 'límite: reporte inexistente',
    method: 'post',
    path: () => `/clinical/diagnostic-reports/${UUID_ABSENT}/release`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // ---- UC-08-08: condición --------------------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/conditions',
    name: 'happy: registrar condición',
    method: 'post',
    path: () => '/clinical/conditions',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      encounterId: c.vars.clinEncounterId,
      codeConceptId: CID,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/conditions',
    name: 'límite: duplicado activo (conflicto)',
    method: 'post',
    path: () => '/clinical/conditions',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      codeConceptId: CID,
    }),
    expectedStatus: 409,
  },

  // ---- UC-08-09: alergia ----------------------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/allergy-intolerances',
    name: 'happy: registrar alergia',
    method: 'post',
    path: () => '/clinical/allergy-intolerances',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      substanceConceptId: CID,
      reactions: [{ manifestationConceptId: CID, description: 'Urticaria' }],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/allergy-intolerances',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/clinical/allergy-intolerances',
    auth: false,
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      substanceConceptId: UUID_ABSENT,
    }),
    expectedStatus: 401,
  },

  // ---- UC-08-10: prescribir medicación --------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/medication-requests',
    name: 'happy: prescribir',
    method: 'post',
    path: () => '/clinical/medication-requests',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      encounterId: c.vars.clinEncounterId,
      medicationConceptId: CID,
      doseText: '500 mg',
      frequencyText: 'c/8h',
      quantityDecimal: 21,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.clinMedRequestId = String(b.id);
    },
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/medication-requests',
    name: 'límite: validación (falta medicationConceptId)',
    method: 'post',
    path: () => '/clinical/medication-requests',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
    }),
    expectedStatus: 400,
  },

  // ---- ALOVIDA D-05: política de firma de recetas ----------------------------
  // El harness trunca los datos de negocio, así que la política sembrada por el
  // paquete no existe en este contexto: se crea una comodín propia para ejercitar
  // la regla y se desactiva al terminar (los smokes posteriores emiten sin firmar).
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/prescription-signature-policies',
    name: 'setup: política de firma comodín (D-05)',
    method: 'post',
    path: () => '/clinical/prescription-signature-policies',
    body: (c) => ({
      tenantId: c.tenantId,
      signatureRequired: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.clinSignaturePolicyId = String(b.id);
    },
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/medication-requests/{id}/issue',
    name: 'límite: emitir sin firma con política vigente (D-05)',
    method: 'post',
    path: (c) =>
      `/clinical/medication-requests/${c.vars.clinMedRequestId}/issue`,
    body: () => ({}),
    // PreconditionFailedException del proyecto = 422 (no la 412 de Nest).
    expectedStatus: 422,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/medication-requests/{id}/sign',
    name: 'happy: firmar la receta (D-05)',
    method: 'post',
    path: (c) =>
      `/clinical/medication-requests/${c.vars.clinMedRequestId}/sign`,
    body: () => ({}),
    expectedStatus: 200,
  },

  // La administración solo acepta recetas ya emitidas (DRAFT -> ISSUED).
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/medication-requests/{id}/issue',
    name: 'setup: emitir prescripción (firmada, bajo política vigente)',
    method: 'post',
    path: (c) =>
      `/clinical/medication-requests/${c.vars.clinMedRequestId}/issue`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/prescription-signature-policies/{id}/deactivate',
    name: 'teardown: desactivar la política de firma (D-05)',
    method: 'post',
    path: (c) =>
      `/clinical/prescription-signature-policies/${c.vars.clinSignaturePolicyId}/deactivate`,
    body: () => ({}),
    expectedStatus: 200,
  },

  // ---- UC-08-11: administrar medicación -------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/medication-records',
    name: 'happy: administrar dosis final',
    method: 'post',
    path: () => '/clinical/medication-records',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      requestId: c.vars.clinMedRequestId,
      medicationConceptId: CID,
      doseDecimal: 500,
      isFinalDose: true,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/medication-records',
    name: 'límite: prescripción inexistente',
    method: 'post',
    path: () => '/clinical/medication-records',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      medicationConceptId: UUID_ABSENT,
      requestId: UUID_ABSENT,
    }),
    expectedStatus: 404,
  },

  // ---- UC-08-12: procedimiento ----------------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/procedures',
    name: 'happy: registrar procedimiento',
    method: 'post',
    path: () => '/clinical/procedures',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      encounterId: c.vars.clinEncounterId,
      codeConceptId: CID,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/procedures',
    name: 'límite: orden inexistente',
    method: 'post',
    path: () => '/clinical/procedures',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      codeConceptId: UUID_ABSENT,
      serviceRequestId: UUID_ABSENT,
    }),
    expectedStatus: 404,
  },

  // ---- UC-08-13: inmunización -----------------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/immunizations',
    name: 'happy: registrar inmunización',
    method: 'post',
    path: () => '/clinical/immunizations',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      vaccineConceptId: CID,
      doseNumber: 1,
      lotNumber: 'LOT-42',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/immunizations',
    name: 'límite: doble dosis (conflicto)',
    method: 'post',
    path: () => '/clinical/immunizations',
    body: (c) => ({
      custodianTenantId: c.tenantId,
      patientProfileId: c.vars.patientProfileId,
      vaccineConceptId: CID,
      doseNumber: 1,
    }),
    expectedStatus: 409,
  },

  // ---- UC-08-14: cerrar encuentro -------------------------------------------
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/encounters/{id}/close',
    name: 'happy: cerrar encuentro',
    method: 'post',
    path: (c) => `/clinical/encounters/${c.vars.clinEncounterId}/close`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Clinical',
    endpoint: 'POST /clinical/encounters/{id}/close',
    name: 'límite: encuentro inexistente',
    method: 'post',
    path: () => `/clinical/encounters/${UUID_ABSENT}/close`,
    body: () => ({}),
    expectedStatus: 404,
  },
];
