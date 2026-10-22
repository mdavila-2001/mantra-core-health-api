import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Practice (14 — Care Organizations, Sites, Units, Spaces and
 * Workforce). Encadena recursos con `ctx.vars` a partir de una práctica raíz que
 * se crea al inicio (bootstrap): sitio → unidad clínica → espacio de atención →
 * servicio → acreditación (+verify) → rol de profesional → apoyo → inventario
 * (+movimiento) y, al final, el desmantelamiento en cascada del sitio.
 *
 * Referencias cross-módulo: `tenant_id` de la práctica usa `ctx.tenantId`;
 * `admin_user_id` se resuelve por defecto al actor; `practitioner_profile_id`
 * usa `ctx.vars.practitionerProfileId` (poblado por profiles) con respaldo al
 * `adminUserId` (su FK no está forzada). Los conceptos de tipo/estado los siembra
 * el propio módulo, así que el smoke no envía ids de concepto.
 *
 * Ids expuestos: `vars.pracPracticeId`, `vars.pracSiteId`, `vars.pracUnitId`,
 * `vars.pracServiceId`, `vars.pracAccreditationId`, `vars.pracRoleId`,
 * `vars.pracItemId`.
 */
export const PRACTICE_SMOKE: SmokeCase[] = [
  // ---- bootstrap: práctica raíz --------------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /practices',
    name: 'setup: práctica raíz',
    method: 'post',
    path: () => '/practices',
    body: (c) => ({
      tenantId: c.tenantId,
      code: `PRAC-${c.u}`,
      name: 'Clínica Alovida',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pracPracticeId = String(b.id);
    },
  },
  {
    module: 'Practice',
    endpoint: 'POST /practices',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/practices',
    auth: false,
    body: (c) => ({ tenantId: c.tenantId, code: `PRAC-${c.u}-x`, name: 'x' }),
    expectedStatus: 401,
  },
  {
    module: 'Practice',
    endpoint: 'POST /practices',
    name: 'límite: validación (name faltante)',
    method: 'post',
    path: (c) => '/practices',
    body: (c) => ({ tenantId: c.tenantId, code: `PRAC-${c.u}-y` }),
    expectedStatus: 400,
  },

  // ---- UC-14-01: sitio ------------------------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/sites',
    name: 'happy: alta de sitio',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/sites`,
    body: (c) => ({
      code: `SITE-${c.u}`,
      name: 'Sede Central',
      managingTenantId: c.tenantId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pracSiteId = String(b.id);
    },
  },
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/sites',
    name: 'límite: práctica inexistente',
    method: 'post',
    path: () => `/practices/${UUID_ABSENT}/sites`,
    body: (c) => ({ code: `SITE-${c.u}-x`, name: 'x' }),
    expectedStatus: 404,
  },

  // ---- UC-14-04: unidad clínica ---------------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /sites/{siteId}/clinical-units',
    name: 'happy: alta de unidad',
    method: 'post',
    path: (c) => `/sites/${c.vars.pracSiteId}/clinical-units`,
    body: (c) => ({ code: `UNIT-${c.u}`, name: 'Cardiología' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pracUnitId = String(b.id);
    },
  },
  {
    module: 'Practice',
    endpoint: 'POST /sites/{siteId}/clinical-units',
    name: 'límite: sitio inexistente',
    method: 'post',
    path: () => `/sites/${UUID_ABSENT}/clinical-units`,
    body: (c) => ({ code: `UNIT-${c.u}-x`, name: 'x' }),
    expectedStatus: 404,
  },

  // ---- UC-14-05: espacio de atención ----------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /sites/{siteId}/care-spaces',
    name: 'happy: alta de espacio',
    method: 'post',
    path: (c) => `/sites/${c.vars.pracSiteId}/care-spaces`,
    body: (c) => ({
      code: `SPACE-${c.u}`,
      name: 'Cama 101',
      clinicalUnitId: c.vars.pracUnitId,
      capacity: 1,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Practice',
    endpoint: 'POST /sites/{siteId}/care-spaces',
    name: 'límite: sitio inexistente',
    method: 'post',
    path: () => `/sites/${UUID_ABSENT}/care-spaces`,
    body: (c) => ({ code: `SPACE-${c.u}-x`, name: 'x' }),
    expectedStatus: 404,
  },

  // ---- UC-14-06: servicio de salud ------------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/healthcare-services',
    name: 'happy: publicar servicio',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/healthcare-services`,
    body: (c) => ({
      practiceSiteId: c.vars.pracSiteId,
      clinicalUnitId: c.vars.pracUnitId,
      appointmentRequired: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pracServiceId = String(b.id);
    },
  },
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/healthcare-services',
    name: 'límite: sin auth',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/healthcare-services`,
    auth: false,
    body: () => ({}),
    expectedStatus: 401,
  },

  // ---- UC-14-02: acreditación -----------------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/accreditations',
    name: 'happy: registrar acreditación',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/accreditations`,
    body: (c) => ({
      practiceSiteId: c.vars.pracSiteId,
      accreditationNumber: `ACC-${c.u}`,
      issuerName: 'ISO Board',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pracAccreditationId = String(b.id);
    },
  },
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/accreditations',
    name: 'límite: práctica inexistente',
    method: 'post',
    path: () => `/practices/${UUID_ABSENT}/accreditations`,
    body: () => ({ accreditationNumber: 'x' }),
    expectedStatus: 404,
  },

  // ---- UC-14-03: verificar acreditación -------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /accreditations/{id}/verify',
    name: 'happy: verificar acreditación',
    method: 'post',
    path: (c) => `/accreditations/${c.vars.pracAccreditationId}/verify`,
    body: () => ({ decision: 'VERIFIED' }),
    expectedStatus: 200,
  },
  {
    module: 'Practice',
    endpoint: 'POST /accreditations/{id}/verify',
    name: 'límite: acreditación inexistente',
    method: 'post',
    path: () => `/accreditations/${UUID_ABSENT}/verify`,
    body: () => ({ decision: 'VERIFIED' }),
    expectedStatus: 404,
  },

  // ---- UC-14-07: ajuste de práctica (upsert) --------------------------------
  {
    module: 'Practice',
    endpoint: 'PUT /practices/{practiceId}/settings/{settingKey}',
    name: 'happy: upsert (insert)',
    method: 'put',
    path: (c) =>
      `/practices/${c.vars.pracPracticeId}/settings/booking.window.days`,
    body: () => ({ valueJson: { days: 30 } }),
    expectedStatus: 200,
  },
  {
    module: 'Practice',
    endpoint: 'PUT /practices/{practiceId}/settings/{settingKey}',
    name: 'happy: upsert (update)',
    method: 'put',
    path: (c) =>
      `/practices/${c.vars.pracPracticeId}/settings/booking.window.days`,
    body: () => ({ valueJson: { days: 45 } }),
    expectedStatus: 200,
  },
  {
    module: 'Practice',
    endpoint: 'PUT /practices/{practiceId}/settings/{settingKey}',
    name: 'límite: práctica inexistente',
    method: 'put',
    path: () => `/practices/${UUID_ABSENT}/settings/x`,
    body: () => ({ valueJson: {} }),
    expectedStatus: 404,
  },

  // ---- UC-14-08: rol de profesional -----------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/role-assignments',
    name: 'happy: asignar rol',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/role-assignments`,
    body: (c) => ({
      practitionerProfileId: c.vars.practitionerProfileId ?? c.adminUserId,
      practiceSiteId: c.vars.pracSiteId,
      clinicalUnitId: c.vars.pracUnitId,
      healthcareServiceId: c.vars.pracServiceId,
      isPrimary: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pracRoleId = String(b.id);
    },
  },
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/role-assignments',
    name: 'límite: validación (perfil faltante)',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/role-assignments`,
    body: () => ({ isPrimary: true }),
    expectedStatus: 400,
  },

  // ---- UC-14-09: personal de apoyo ------------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /role-assignments/{roleId}/support-assignments',
    name: 'happy: adjuntar apoyo',
    method: 'post',
    path: (c) => `/role-assignments/${c.vars.pracRoleId}/support-assignments`,
    setup: async (c) => {
      await c.orm.em
        .fork()
        .getConnection()
        .execute(
          `INSERT INTO profiles.secretary_profiles
          (profile_id, role_concept_id, created_at, updated_at,
           created_by_user_id, updated_by_user_id, row_version)
         VALUES (?, NULL, now(), now(), ?, ?, 1)
         ON CONFLICT (profile_id) DO NOTHING`,
          [c.vars.patientProfileId, c.adminUserId, c.adminUserId],
        );
    },
    body: (c) => ({ supportProfileId: c.vars.patientProfileId }),
    expectedStatus: 201,
  },
  {
    module: 'Practice',
    endpoint: 'POST /role-assignments/{roleId}/support-assignments',
    name: 'límite: rol inexistente',
    method: 'post',
    path: (c) => `/role-assignments/${UUID_ABSENT}/support-assignments`,
    body: (c) => ({ supportProfileId: c.adminUserId }),
    expectedStatus: 404,
  },

  // ---- UC-14-10: insumo de inventario ---------------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/inventory-items',
    name: 'happy: alta de insumo',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/inventory-items`,
    body: (c) => ({
      name: `Gasa-${c.u}`,
      lotNumber: `LOT-${c.u}`,
      reorderLevel: '10',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pracItemId = String(b.id);
    },
  },
  {
    module: 'Practice',
    endpoint: 'POST /practices/{practiceId}/inventory-items',
    name: 'límite: validación (name faltante)',
    method: 'post',
    path: (c) => `/practices/${c.vars.pracPracticeId}/inventory-items`,
    body: () => ({ lotNumber: 'x' }),
    expectedStatus: 400,
  },

  // ---- UC-14-11: movimiento de inventario -----------------------------------
  {
    module: 'Practice',
    endpoint: 'POST /inventory-items/{itemId}/movements',
    name: 'happy: entrada de stock',
    method: 'post',
    path: (c) => `/inventory-items/${c.vars.pracItemId}/movements`,
    body: () => ({ direction: 'IN', quantity: 25 }),
    expectedStatus: 201,
  },
  {
    module: 'Practice',
    endpoint: 'POST /inventory-items/{itemId}/movements',
    name: 'límite: salida sin stock suficiente',
    method: 'post',
    path: (c) => `/inventory-items/${c.vars.pracItemId}/movements`,
    body: () => ({ direction: 'OUT', quantity: 9999 }),
    expectedStatus: 422,
  },
  {
    module: 'Practice',
    endpoint: 'POST /inventory-items/{itemId}/movements',
    name: 'límite: insumo inexistente',
    method: 'post',
    path: () => `/inventory-items/${UUID_ABSENT}/movements`,
    body: () => ({ direction: 'IN', quantity: 1 }),
    expectedStatus: 404,
  },

  // ---- UC-14-12: desmantelar sitio en cascada -------------------------------
  {
    module: 'Practice',
    endpoint: 'DELETE /practices/{practiceId}/sites/{siteId}',
    name: 'happy: desmantelar sitio',
    method: 'delete',
    path: (c) =>
      `/practices/${c.vars.pracPracticeId}/sites/${c.vars.pracSiteId}`,
    expectedStatus: 200,
  },
  {
    module: 'Practice',
    endpoint: 'DELETE /practices/{practiceId}/sites/{siteId}',
    name: 'límite: sitio inexistente',
    method: 'delete',
    path: (c) => `/practices/${c.vars.pracPracticeId}/sites/${UUID_ABSENT}`,
    expectedStatus: 404,
  },
];
