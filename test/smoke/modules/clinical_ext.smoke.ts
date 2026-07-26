import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { CONCEPTS } from '../../../src/common';

/**
 * Smoke del módulo Clinical-Ext (18 — Care Coordination, Alerts and Decision
 * Support). Encadena sus propios recursos con `ctx.vars`: equipo de cuidado con
 * miembros → transferencia de liderazgo; regla CDS → publicación → evaluación →
 * alertas → acknowledge/override; order set → aplicación; referencia → respuesta;
 * brechas de cuidado → cierre; calendario de inmunización → proyección; sesión de
 * telesalud → join → end.
 *
 * Depende de `ctx.vars.patientProfileId` (poblado por Profiles, que corre antes) y
 * de `ctx.tenantId` / `ctx.adminUserId`. Los `*_concept_id` que aporta el cliente
 * usan conceptos reales ya sembrados (`STATE_ACTIVE`, `STATE_REVOKED`) como
 * stand-in: las columnas de conceptos de clinical_ext no tienen FK forzada, así que
 * la semántica no importa, solo que la fila exista.
 *
 * Nota de rutas: los sufijos `:accion` de la spec se realizan como segmento de ruta
 * (`/set-responsible`, `/acknowledge`, `/override`, `/apply`, `/respond`, `/close`,
 * `/versions/publish`, `/join`, `/end`) por compatibilidad con el router (Express 5).
 */
const CID = CONCEPTS.STATE_ACTIVE;
const CID2 = CONCEPTS.STATE_REVOKED;
/** Encuentro clínico sintético válido (uuid) por corrida para la sesión virtual. */
const encounterUuid = (u: number): string =>
  `00000000-0000-4000-8000-${String(u).padStart(12, '0')}`;

export const CLINICAL_EXT_SMOKE: SmokeCase[] = [
  // ---- UC-18-01: crear equipo de cuidado con miembros -----------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /care-teams', name: 'happy: equipo con 2 miembros',
    method: 'post', path: () => '/care-teams',
    body: (c) => ({
      patientProfileId: c.vars.patientProfileId,
      tenantId: c.tenantId,
      name: 'Equipo longitudinal',
      members: [
        { practitionerProfileId: c.vars.practitionerProfileId ?? c.vars.patientProfileId, memberRoleConceptId: CID, isResponsible: true },
        { practitionerProfileId: c.vars.patientProfileId, memberRoleConceptId: CID2 },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.cextCareTeamId = String(b.id);
      const members = (b.members ?? []) as Array<{ id: string }>;
      c.vars.cextMember1 = String(members[0]?.id);
      c.vars.cextMember2 = String(members[1]?.id);
    },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /care-teams', name: 'límite: sin auth',
    method: 'post', path: () => '/care-teams', auth: false,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, tenantId: c.tenantId, members: [] }),
    expectedStatus: 401,
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /care-teams', name: 'límite: validación (sin miembros)',
    method: 'post', path: () => '/care-teams',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, tenantId: c.tenantId, members: [] }),
    expectedStatus: 400,
  },

  // ---- UC-18-02: designar miembro responsable -------------------------------
  {
    module: 'ClinicalExt', endpoint: 'PATCH /care-teams/{id}/members/{memberId}/set-responsible', name: 'happy: transferir liderazgo',
    method: 'patch', path: (c) => `/care-teams/${c.vars.cextCareTeamId}/members/${c.vars.cextMember2}/set-responsible`,
    body: () => ({}), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /care-teams/{id}/members/{memberId}/set-responsible', name: 'límite: equipo inexistente',
    method: 'patch', path: () => `/care-teams/${UUID_ABSENT}/members/${UUID_ABSENT}/set-responsible`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-18-13 (precondición): crear regla CDS -----------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /cds-rules', name: 'happy: crear regla borrador',
    method: 'post', path: () => '/cds-rules',
    body: (c) => ({ tenantId: c.tenantId, code: `CDS-${c.u}`, name: 'Regla de alergia', messageTemplate: 'Posible alergia' }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.cextRuleId = String(b.id); },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /cds-rules', name: 'límite: sin auth',
    method: 'post', path: () => '/cds-rules', auth: false,
    body: (c) => ({ code: `x-${c.u}`, name: 'x' }), expectedStatus: 401,
  },

  // ---- UC-18-13: publicar versión -------------------------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /cds-rules/{id}/versions/publish', name: 'happy: publicar (activa la regla)',
    method: 'post', path: (c) => `/cds-rules/${c.vars.cextRuleId}/versions/publish`,
    body: () => ({ messageTemplate: 'Alerta de decisión clínica' }), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /cds-rules/{id}/versions/publish', name: 'límite: regla inexistente',
    method: 'post', path: () => `/cds-rules/${UUID_ABSENT}/versions/publish`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-18-03: evaluar reglas CDS y generar alertas -----------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /cds/evaluate', name: 'happy: genera alerta',
    method: 'post', path: () => '/cds/evaluate',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, tenantId: c.tenantId, sourceResourceType: 'allergy_intolerance' }),
    expectedStatus: 201,
    capture: (b, c) => {
      const alerts = (b.alerts ?? []) as Array<{ id: string }>;
      c.vars.cextAlertId = String(alerts[0]?.id);
    },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /cds/evaluate', name: 'happy: segunda pasada (alerta para override)',
    method: 'post', path: () => '/cds/evaluate',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, tenantId: c.tenantId }),
    expectedStatus: 201,
    capture: (b, c) => {
      const alerts = (b.alerts ?? []) as Array<{ id: string }>;
      c.vars.cextAlertId2 = String(alerts[0]?.id);
    },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /cds/evaluate', name: 'límite: validación (falta patientProfileId)',
    method: 'post', path: () => '/cds/evaluate', body: (c) => ({ tenantId: c.tenantId }), expectedStatus: 400,
  },

  // ---- UC-18-05: acknowledge / override -------------------------------------
  {
    module: 'ClinicalExt', endpoint: 'PATCH /clinical-alerts/{id}/acknowledge', name: 'happy: reconocer alerta',
    method: 'patch', path: (c) => `/clinical-alerts/${c.vars.cextAlertId}/acknowledge`,
    body: () => ({}), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /clinical-alerts/{id}/override', name: 'happy: override con motivo',
    method: 'patch', path: (c) => `/clinical-alerts/${c.vars.cextAlertId2}/override`,
    body: () => ({ reason: 'Beneficio supera el riesgo' }), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /clinical-alerts/{id}/acknowledge', name: 'límite: alerta inexistente',
    method: 'patch', path: () => `/clinical-alerts/${UUID_ABSENT}/acknowledge`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-18-04: interacción medicamentosa (dato de referencia + chequeo) ----
  {
    module: 'ClinicalExt', endpoint: 'POST /drug-interactions', name: 'happy: registrar par de interacción',
    method: 'post', path: () => '/drug-interactions',
    body: () => ({ substanceAConceptId: CID, substanceBConceptId: CID2, mechanismText: 'Sinergia', managementText: 'Ajustar dosis' }),
    expectedStatus: 201,
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /cds/check-interactions', name: 'happy: detecta interacción',
    method: 'post', path: () => '/cds/check-interactions',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, substanceConceptIds: [CID, CID2] }),
    expectedStatus: 201,
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /cds/check-interactions', name: 'límite: validación (una sola sustancia)',
    method: 'post', path: (c) => '/cds/check-interactions',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, substanceConceptIds: [CID] }), expectedStatus: 400,
  },

  // ---- UC-18-06 (precondición): crear order set -----------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /order-sets', name: 'happy: crear order set con ítems',
    method: 'post', path: () => '/order-sets',
    body: (c) => ({
      tenantId: c.tenantId, code: `OS-${c.u}`, name: 'Protocolo sepsis',
      items: [
        { codeConceptId: CID, defaultDoseText: '1 g', isSelectedDefault: true },
        { codeConceptId: CID2, isSelectedDefault: false },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.cextOrderSetId = String(b.id); },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /order-sets', name: 'límite: sin auth',
    method: 'post', path: () => '/order-sets', auth: false,
    body: (c) => ({ code: `x-${c.u}`, name: 'x', items: [] }), expectedStatus: 401,
  },

  // ---- UC-18-06: aplicar order set ------------------------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /order-sets/{id}/apply', name: 'happy: fan-out de órdenes',
    method: 'post', path: (c) => `/order-sets/${c.vars.cextOrderSetId}/apply`,
    body: (c) => ({ encounterId: encounterUuid(c.u), patientProfileId: c.vars.patientProfileId }),
    expectedStatus: 201,
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /order-sets/{id}/apply', name: 'límite: order set inexistente',
    method: 'post', path: (c) => `/order-sets/${UUID_ABSENT}/apply`,
    body: (c) => ({ encounterId: encounterUuid(c.u), patientProfileId: c.vars.patientProfileId }), expectedStatus: 404,
  },

  // ---- UC-18-07: emitir referencia ------------------------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /referrals', name: 'happy: emitir referencia',
    method: 'post', path: () => '/referrals',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, targetTenantId: c.tenantId, specialtyConceptId: CID, reasonText: 'Evaluación por especialidad' }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.cextReferralId = String(b.id); },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /referrals', name: 'límite: validación (falta patientProfileId)',
    method: 'post', path: () => '/referrals', body: () => ({ reasonText: 'x' }), expectedStatus: 400,
  },

  // ---- UC-18-08: responder referencia ---------------------------------------
  {
    module: 'ClinicalExt', endpoint: 'PATCH /referrals/{id}/respond', name: 'happy: aceptar referencia',
    method: 'patch', path: (c) => `/referrals/${c.vars.cextReferralId}/respond`,
    body: () => ({ decision: 'ACCEPT' }), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /referrals/{id}/respond', name: 'límite: referencia inexistente',
    method: 'patch', path: () => `/referrals/${UUID_ABSENT}/respond`,
    body: () => ({ decision: 'REJECT' }), expectedStatus: 404,
  },

  // ---- UC-18-09: recomputar brechas de cuidado ------------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /care-gaps/recompute', name: 'happy: abre brecha nueva',
    method: 'post', path: () => '/care-gaps/recompute',
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, gaps: [{ gapTypeConceptId: CID, measureConceptId: CID2, dueDate: '2026-12-31' }] }),
    expectedStatus: 201,
    capture: (b, c) => {
      const ids = (b.openedIds ?? []) as string[];
      c.vars.cextGapId = String(ids[0]);
    },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /care-gaps/recompute', name: 'límite: sin auth',
    method: 'post', path: () => '/care-gaps/recompute', auth: false,
    body: (c) => ({ patientProfileId: c.vars.patientProfileId, gaps: [] }), expectedStatus: 401,
  },

  // ---- UC-18-10: cerrar brecha ----------------------------------------------
  {
    module: 'ClinicalExt', endpoint: 'PATCH /care-gaps/{id}/close', name: 'happy: cerrar brecha',
    method: 'patch', path: (c) => `/care-gaps/${c.vars.cextGapId}/close`,
    body: () => ({ closedByResourceType: 'immunization' }), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /care-gaps/{id}/close', name: 'límite: brecha inexistente',
    method: 'patch', path: () => `/care-gaps/${UUID_ABSENT}/close`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-18-11 (precondición): calendario de inmunización ------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /immunization-schedules', name: 'happy: registrar dosis del calendario',
    method: 'post', path: () => '/immunization-schedules',
    body: () => ({ vaccineConceptId: CID, name: 'BCG dosis 1', recommendedAgeDays: 0, doseNumber: 1 }),
    expectedStatus: 201,
  },

  // ---- UC-18-11: proyectar plan de inmunización -----------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /patients/{id}/immunization-plan/project', name: 'happy: proyecta y abre brechas',
    method: 'post', path: (c) => `/patients/${c.vars.patientProfileId}/immunization-plan/project`,
    body: () => ({ birthDate: '2026-01-01' }), expectedStatus: 201,
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /patients/{id}/immunization-plan/project', name: 'límite: validación (falta birthDate)',
    method: 'post', path: (c) => `/patients/${c.vars.patientProfileId}/immunization-plan/project`,
    body: () => ({}), expectedStatus: 400,
  },

  // ---- UC-18-12: telesalud (crear / join / end) -----------------------------
  {
    module: 'ClinicalExt', endpoint: 'POST /virtual-encounters', name: 'happy: iniciar sesión',
    method: 'post', path: () => '/virtual-encounters',
    body: (c) => ({ encounterId: encounterUuid(c.u), meetingUrl: 'https://meet.example/abc', meetingId: 'abc' }),
    expectedStatus: 201,
    capture: (b, c) => { c.vars.cextVencId = String(b.id); },
  },
  {
    module: 'ClinicalExt', endpoint: 'POST /virtual-encounters', name: 'límite: validación (falta encounterId)',
    method: 'post', path: () => '/virtual-encounters', body: () => ({ meetingId: 'x' }), expectedStatus: 400,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /virtual-encounters/{id}/join', name: 'happy: unirse',
    method: 'patch', path: (c) => `/virtual-encounters/${c.vars.cextVencId}/join`,
    body: () => ({}), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /virtual-encounters/{id}/end', name: 'happy: finalizar',
    method: 'patch', path: (c) => `/virtual-encounters/${c.vars.cextVencId}/end`,
    body: () => ({}), expectedStatus: 200,
  },
  {
    module: 'ClinicalExt', endpoint: 'PATCH /virtual-encounters/{id}/join', name: 'límite: sesión inexistente',
    method: 'patch', path: () => `/virtual-encounters/${UUID_ABSENT}/join`,
    body: () => ({}), expectedStatus: 404,
  },
];
