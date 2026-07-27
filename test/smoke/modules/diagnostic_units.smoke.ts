import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { CONCEPTS } from '../../../src/common';

/**
 * Smoke del módulo 23 — Diagnostic Units, Studies, Specialists and Prices.
 *
 * Encadena recursos con `ctx.vars` a partir de una unidad diagnóstica que se crea
 * al inicio: unidad (con un sitio en el alta) → sitio adicional → verificación y
 * publicación → especialidades → oferta de estudio → cronograma de precios →
 * versión de precio (append-only) → cierre de precio → equipamiento (+patch) →
 * acreditación (+renovación) → asignación de especialista → retiro de oferta →
 * reproyección.
 *
 * Referencias cross-módulo (FK no forzadas a otros esquemas): `tenant_id` usa
 * `ctx.tenantId`; `practice_site_id`, `practitioner_role_assignment_id` y los
 * `*_concept_id` aportados por el cliente usan UUID fijos de prueba. Los conceptos
 * de estado/tipo los siembra el propio módulo, así que no se envían desde aquí.
 *
 * Ids expuestos: `vars.duUnitId`, `vars.duSiteId`, `vars.duOfferingId`,
 * `vars.duScheduleId`, `vars.duPriceId`, `vars.duEquipmentId`, `vars.duAccId`.
 */

// UUID fijos para FK cross-módulo no forzadas / *_concept_id aportados por cliente.
// practice_site_id SÍ es FK a practice.practice_sites → usar el sitio sembrado por
// el smoke de practice (ctx.vars.pracSiteId), que corre antes en el registro.
// Estos *_concept_id SÍ son FK a terminology.catalog_concepts → usar un concepto
// realmente sembrado. PRACTITIONER_ROLE no es FK forzada (uuid libre por corrida).
const STUDY_CONCEPT = CONCEPTS.STATE_ACTIVE;
const SPECIALTY_CONCEPT = CONCEPTS.STATE_ACTIVE;
const ACCREDITATION_CONCEPT = CONCEPTS.STATE_ACTIVE;
const EQUIPMENT_TYPE = CONCEPTS.STATE_ACTIVE;
const MODALITY_CONCEPT = CONCEPTS.STATE_ACTIVE;
const PRACTITIONER_ROLE = '88888888-8888-4888-8888-888888888888';

export const DIAGNOSTIC_UNITS_SMOKE: SmokeCase[] = [
  // ---- UC-23-01: alta de unidad con sitio ----------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units',
    name: 'happy: alta de unidad',
    method: 'post',
    path: () => '/diagnostic-units',
    body: (c) => ({
      tenantId: c.tenantId,
      code: `DU-${c.u}`,
      name: 'Laboratorio Redesa',
      sites: [
        { practiceSiteId: c.vars.pracSiteId, sampleCollectionAvailable: true },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.duUnitId = String(b.id);
    },
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/diagnostic-units',
    auth: false,
    body: (c) => ({ tenantId: c.tenantId, code: `DU-${c.u}-x`, name: 'x' }),
    expectedStatus: 401,
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units',
    name: 'límite: validación (name faltante)',
    method: 'post',
    path: () => '/diagnostic-units',
    body: (c) => ({ tenantId: c.tenantId, code: `DU-${c.u}-y` }),
    expectedStatus: 400,
  },

  // ---- UC-23-02: sitio adicional -------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/sites',
    name: 'happy: alta de sitio',
    method: 'post',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/sites`,
    body: (c) => ({
      practiceSiteId: c.vars.pracSiteId,
      accessionPrefix: 'AX',
      imagingAvailable: false,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.duSiteId = String(b.id);
    },
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/sites',
    name: 'límite: unidad inexistente',
    method: 'post',
    path: () => `/diagnostic-units/${UUID_ABSENT}/sites`,
    body: (c) => ({ practiceSiteId: c.vars.pracSiteId }),
    expectedStatus: 404,
  },

  // ---- UC-23-02: actualizar sitio ------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'PATCH /diagnostic-unit-sites/{siteId}',
    name: 'happy: actualizar sitio',
    method: 'patch',
    path: (c) => `/diagnostic-unit-sites/${c.vars.duSiteId}`,
    body: () => ({ accessionPrefix: 'AY', sampleCollectionAvailable: true }),
    expectedStatus: 200,
  },

  // ---- UC-23-03: verificar y publicar --------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/verify-and-publish',
    name: 'happy: verificar',
    method: 'post',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/verify-and-publish`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/verify-and-publish',
    name: 'límite: unidad inexistente',
    method: 'post',
    path: () => `/diagnostic-units/${UUID_ABSENT}/verify-and-publish`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // ---- UC-23-04: especialidades --------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'PUT /diagnostic-units/{id}/specialties',
    name: 'happy: declarar especialidades',
    method: 'put',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/specialties`,
    body: () => ({
      specialties: [{ specialtyConceptId: SPECIALTY_CONCEPT, isPrimary: true }],
    }),
    expectedStatus: 200,
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'PUT /diagnostic-units/{id}/specialties',
    name: 'límite: validación (lista vacía)',
    method: 'put',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/specialties`,
    body: () => ({ specialties: [] }),
    expectedStatus: 400,
  },

  // ---- UC-23-05: oferta de estudio -----------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/study-offerings',
    name: 'happy: publicar oferta',
    method: 'post',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/study-offerings`,
    body: (c) => ({
      studyCode: `ST-${c.u}`,
      studyConceptId: STUDY_CONCEPT,
      displayName: 'Hemograma completo',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.duOfferingId = String(b.id);
    },
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/study-offerings',
    name: 'límite: sin auth',
    method: 'post',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/study-offerings`,
    auth: false,
    body: (c) => ({
      studyCode: `ST-${c.u}-x`,
      studyConceptId: STUDY_CONCEPT,
      displayName: 'x',
    }),
    expectedStatus: 401,
  },

  // ---- UC-23-06: cronograma de precios -------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/price-schedules',
    name: 'happy: crear cronograma',
    method: 'post',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/price-schedules`,
    body: (c) => ({ code: `PS-${c.u}`, publicVisibility: true }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.duScheduleId = String(b.id);
    },
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/price-schedules',
    name: 'límite: unidad inexistente',
    method: 'post',
    path: (c) => `/diagnostic-units/${UUID_ABSENT}/price-schedules`,
    body: (c) => ({ code: `PS-${c.u}-x` }),
    expectedStatus: 404,
  },

  // ---- UC-23-07: versionar precio ------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /price-schedules/{scheduleId}/study-prices',
    name: 'happy: fijar precio',
    method: 'post',
    path: (c) => `/price-schedules/${c.vars.duScheduleId}/study-prices`,
    body: (c) => ({
      diagnosticStudyOfferingId: c.vars.duOfferingId,
      baseAmount: '120.00',
      patientAmount: '120.00',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.duPriceId = String(b.id);
    },
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /price-schedules/{scheduleId}/study-prices',
    name: 'límite: cronograma inexistente',
    method: 'post',
    path: (c) => `/price-schedules/${UUID_ABSENT}/study-prices`,
    body: (c) => ({
      diagnosticStudyOfferingId: c.vars.duOfferingId,
      baseAmount: '10',
    }),
    expectedStatus: 404,
  },

  // ---- UC-23-08: cerrar precio ---------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /study-prices/{priceId}/close',
    name: 'happy: cerrar precio',
    method: 'post',
    path: (c) => `/study-prices/${c.vars.duPriceId}/close`,
    body: () => ({}),
    expectedStatus: 200,
  },

  // ---- UC-23-09: equipamiento ----------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-unit-sites/{siteId}/equipment',
    name: 'happy: registrar equipo',
    method: 'post',
    path: (c) => `/diagnostic-unit-sites/${c.vars.duSiteId}/equipment`,
    body: (c) => ({
      equipmentTypeConceptId: EQUIPMENT_TYPE,
      modalityConceptId: MODALITY_CONCEPT,
      serialNumber: `SN-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.duEquipmentId = String(b.id);
    },
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-unit-sites/{siteId}/equipment',
    name: 'límite: sitio inexistente',
    method: 'post',
    path: () => `/diagnostic-unit-sites/${UUID_ABSENT}/equipment`,
    body: () => ({ equipmentTypeConceptId: EQUIPMENT_TYPE }),
    expectedStatus: 404,
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'PATCH /diagnostic-equipment/{id}',
    name: 'happy: actualizar equipo',
    method: 'patch',
    path: (c) => `/diagnostic-equipment/${c.vars.duEquipmentId}`,
    body: () => ({ model: 'XN-1000' }),
    expectedStatus: 200,
  },

  // ---- UC-23-11: acreditación + renovación ---------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/accreditations',
    name: 'happy: registrar acreditación',
    method: 'post',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/accreditations`,
    body: () => ({
      accreditationConceptId: ACCREDITATION_CONCEPT,
      accreditationNumber: 'ISO-1',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.duAccId = String(b.id);
    },
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-unit-accreditations/{id}/renew',
    name: 'happy: renovar acreditación',
    method: 'post',
    path: (c) => `/diagnostic-unit-accreditations/${c.vars.duAccId}/renew`,
    body: () => ({ accreditationNumber: 'ISO-2' }),
    expectedStatus: 201,
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-unit-accreditations/{id}/renew',
    name: 'límite: acreditación inexistente',
    method: 'post',
    path: () => `/diagnostic-unit-accreditations/${UUID_ABSENT}/renew`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // ---- UC-23-10: asignar especialista --------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/practitioner-assignments',
    name: 'happy: asignar especialista',
    method: 'post',
    path: (c) =>
      `/diagnostic-units/${c.vars.duUnitId}/practitioner-assignments`,
    body: (c) => ({
      practitionerRoleAssignmentId: PRACTITIONER_ROLE,
      diagnosticUnitSiteId: c.vars.duSiteId,
      maySignReports: true,
    }),
    expectedStatus: 201,
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/practitioner-assignments',
    name: 'límite: unidad inexistente',
    method: 'post',
    path: () => `/diagnostic-units/${UUID_ABSENT}/practitioner-assignments`,
    body: () => ({ practitionerRoleAssignmentId: PRACTITIONER_ROLE }),
    expectedStatus: 404,
  },

  // ---- UC-23-08: retirar oferta --------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'DELETE /diagnostic-study-offerings/{id}',
    name: 'happy: retirar oferta',
    method: 'delete',
    path: (c) => `/diagnostic-study-offerings/${c.vars.duOfferingId}`,
    expectedStatus: 200,
  },
  {
    module: 'DiagnosticUnits',
    endpoint: 'DELETE /diagnostic-study-offerings/{id}',
    name: 'límite: oferta inexistente',
    method: 'delete',
    path: () => `/diagnostic-study-offerings/${UUID_ABSENT}`,
    expectedStatus: 404,
  },

  // ---- UC-23-12: reproyección ----------------------------------------------
  {
    module: 'DiagnosticUnits',
    endpoint: 'POST /diagnostic-units/{id}/reproject',
    name: 'happy: reproyectar',
    method: 'post',
    path: (c) => `/diagnostic-units/${c.vars.duUnitId}/reproject`,
    body: () => ({}),
    expectedStatus: 200,
  },
];
