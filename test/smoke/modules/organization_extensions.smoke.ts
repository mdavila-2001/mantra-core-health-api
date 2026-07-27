import type { SmokeCase, SmokeCtx } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Organization Extensions (22 — Healthcare Organization
 * Specializations). Encadena el ciclo de vida completo: especializar un hospital
 * → registrar y verificar su licencia de instalación → activar el hospital
 * (guard de licencia verificada) → definir y retirar una línea de servicio; y en
 * paralelo: definir una frontera de datos del tenant participante → declarar una
 * afiliación (que la incluye) → terminarla.
 *
 * Referencias cross-módulo (`tenant_id`, `practice_id`, `participating_tenant_id`)
 * son columnas uuid sin FK forzada en BD, así que se derivan por corrida a partir
 * de `ctx.u` para no colisionar con las reglas de unicidad de la app (hospital
 * 1:1 por tenant/practice, licencia por número, frontera por tenant/tipo). El
 * único FK forzado que se encadena es `hospital_service_lines.hospital_id`.
 *
 * Ids expuestos: `vars.orgextHospitalId`, `vars.orgextLicenseId`,
 * `vars.orgextLineId`, `vars.orgextAffiliationId`.
 */

/** UUID estable por corrida (y por eje `tag`) para tenants/practices sin FK forzada. */
const runUuid = (u: number, tag: string): string =>
  `00000000-0000-4000-8000-${tag}${String(u).padStart(11, '0').slice(-11)}`;

// hospitals.tenant_id es FK a directory.tenants → usar el tenant sembrado.
const hospitalTenant = (c: SmokeCtx) => c.tenantId;
const hospitalPractice = (c: SmokeCtx) => c.vars.pracPracticeId;
// data_boundaries.tenant_id también es FK a directory.tenants → tenant sembrado.
// (Las afiliaciones exigen dos tenants distintos; con uno solo su happy-path queda
// documentado como limitación por falta de un segundo tenant sembrado.)
const participatingTenant = (c: SmokeCtx) => c.tenantId;

export const ORGANIZATION_EXTENSIONS_SMOKE: SmokeCase[] = [
  // ---- UC-22-01: especializar hospital -------------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/hospitals',
    name: 'happy: especializar hospital',
    method: 'post',
    path: () => '/orgext/hospitals',
    body: (c) => ({
      tenantId: hospitalTenant(c),
      practiceId: hospitalPractice(c),
      licensedBedCapacity: 120,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgextHospitalId = String(b.id);
    },
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/hospitals',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/orgext/hospitals',
    auth: false,
    body: (c) => ({
      tenantId: hospitalTenant(c),
      practiceId: hospitalPractice(c),
    }),
    expectedStatus: 401,
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/hospitals',
    name: 'límite: validación (practiceId faltante)',
    method: 'post',
    path: () => '/orgext/hospitals',
    body: (c) => ({ tenantId: hospitalTenant(c) }),
    expectedStatus: 400,
  },

  // ---- UC-22-05: registrar licencia ----------------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/facility-licenses',
    name: 'happy: registrar licencia',
    method: 'post',
    path: () => '/orgext/facility-licenses',
    body: (c) => ({ tenantId: hospitalTenant(c), licenseNumber: `LIC-${c.u}` }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgextLicenseId = String(b.id);
    },
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/facility-licenses',
    name: 'límite: número duplicado',
    method: 'post',
    path: () => '/orgext/facility-licenses',
    body: (c) => ({ tenantId: hospitalTenant(c), licenseNumber: `LIC-${c.u}` }),
    expectedStatus: 409,
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/facility-licenses',
    name: 'límite: validación (licenseNumber faltante)',
    method: 'post',
    path: () => '/orgext/facility-licenses',
    body: (c) => ({ tenantId: hospitalTenant(c) }),
    expectedStatus: 400,
  },

  // ---- UC-22-06: verificar licencia ----------------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/facility-licenses/{id}/verify',
    name: 'happy: verificar licencia',
    method: 'post',
    path: (c) => `/orgext/facility-licenses/${c.vars.orgextLicenseId}/verify`,
    body: () => ({ decision: 'VERIFY' }),
    expectedStatus: 200,
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/facility-licenses/{id}/verify',
    name: 'límite: licencia inexistente',
    method: 'post',
    path: () => `/orgext/facility-licenses/${UUID_ABSENT}/verify`,
    body: () => ({ decision: 'VERIFY' }),
    expectedStatus: 404,
  },

  // ---- UC-22-02: activar hospital ------------------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/hospitals/{id}/activate',
    name: 'happy: activar hospital',
    method: 'post',
    path: (c) => `/orgext/hospitals/${c.vars.orgextHospitalId}/activate`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/hospitals/{id}/activate',
    name: 'límite: hospital inexistente',
    method: 'post',
    path: () => `/orgext/hospitals/${UUID_ABSENT}/activate`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // ---- UC-22-03: definir línea de servicio ---------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/hospitals/{id}/service-lines',
    name: 'happy: definir línea',
    method: 'post',
    path: (c) => `/orgext/hospitals/${c.vars.orgextHospitalId}/service-lines`,
    body: () => ({ referralRequired: true }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgextLineId = String(b.id);
    },
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/hospitals/{id}/service-lines',
    name: 'límite: hospital inexistente',
    method: 'post',
    path: () => `/orgext/hospitals/${UUID_ABSENT}/service-lines`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // ---- UC-22-04: retirar línea de servicio ---------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'DELETE /orgext/hospitals/{id}/service-lines/{lineId}',
    name: 'happy: retirar línea',
    method: 'delete',
    path: (c) =>
      `/orgext/hospitals/${c.vars.orgextHospitalId}/service-lines/${c.vars.orgextLineId}`,
    expectedStatus: 200,
  },
  {
    module: 'OrgExtensions',
    endpoint: 'DELETE /orgext/hospitals/{id}/service-lines/{lineId}',
    name: 'límite: línea inexistente',
    method: 'delete',
    path: (c) =>
      `/orgext/hospitals/${c.vars.orgextHospitalId}/service-lines/${UUID_ABSENT}`,
    expectedStatus: 404,
  },

  // ---- UC-22-08: definir frontera de datos ---------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/data-boundaries',
    name: 'happy: definir frontera',
    method: 'post',
    path: () => '/orgext/data-boundaries',
    body: (c) => ({
      tenantId: participatingTenant(c),
      dataControllerTenantId: participatingTenant(c),
    }),
    expectedStatus: 201,
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/data-boundaries',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/orgext/data-boundaries',
    auth: false,
    body: (c) => ({
      tenantId: participatingTenant(c),
      dataControllerTenantId: participatingTenant(c),
    }),
    expectedStatus: 401,
  },

  // ---- UC-22-07: declarar afiliación ---------------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/affiliations',
    name: 'happy: declarar afiliación',
    method: 'post',
    path: () => '/orgext/affiliations',
    body: (c) => ({
      primaryTenantId: c.tenantId,
      participatingTenantId: participatingTenant(c),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.orgextAffiliationId = String(b.id);
    },
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/affiliations',
    name: 'límite: primario == participante (422)',
    method: 'post',
    path: () => '/orgext/affiliations',
    body: (c) => ({
      primaryTenantId: c.tenantId,
      participatingTenantId: c.tenantId,
    }),
    expectedStatus: 422,
  },

  // ---- UC-22-09: terminar afiliación ---------------------------------------
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/affiliations/{id}/terminate',
    name: 'happy: terminar afiliación',
    method: 'post',
    path: (c) => `/orgext/affiliations/${c.vars.orgextAffiliationId}/terminate`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'OrgExtensions',
    endpoint: 'POST /orgext/affiliations/{id}/terminate',
    name: 'límite: afiliación inexistente',
    method: 'post',
    path: () => `/orgext/affiliations/${UUID_ABSENT}/terminate`,
    body: () => ({}),
    expectedStatus: 404,
  },
];
