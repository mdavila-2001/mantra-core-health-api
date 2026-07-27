import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Pharmacy (24). Encadena el ciclo completo sobre `ctx.vars`:
 *  - alta de farmacia con licencia inicial (DRAFT / PENDING);
 *  - verificación de la licencia -> la farmacia pasa a ACTIVE;
 *  - sede, producto (con identificadores), lista de precios y precio versionado;
 *  - conexión de integración y mapeo de producto externo;
 *  - proyección de catálogo, retiro de producto y cierre de la lista de precios.
 *
 * `ctx.tenantId` es el tenant sembrado por defecto (FK plana, no verificada);
 * `ctx.adminUserId` es un usuario real (FK válida para created_by).
 */
export const PHARMACY_SMOKE: SmokeCase[] = [
  // --- UC-24-01: alta de farmacia con licencia ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies',
    name: 'happy: alta de farmacia con licencia inicial',
    method: 'post',
    path: () => '/pharmacies',
    body: (c) => ({
      tenantId: c.tenantId,
      code: `PH-${c.u}`,
      legalName: 'Farmacia Central SA',
      tradeName: 'FarmaCentral',
      license: { licenseNumber: `LIC-${c.u}` },
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pharmacyId = String(b.id);
      c.vars.pharmacyLicenseId = String(b.licenseId);
    },
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/pharmacies',
    auth: false,
    body: (c) => ({
      tenantId: c.tenantId,
      code: `PH-X-${c.u}`,
      legalName: 'X',
      license: { licenseNumber: 'L' },
    }),
    expectedStatus: 401,
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies',
    name: 'límite: falta legalName -> 400',
    method: 'post',
    path: () => '/pharmacies',
    body: (c) => ({
      tenantId: c.tenantId,
      code: `PH-Y-${c.u}`,
      license: { licenseNumber: 'L' },
    }),
    expectedStatus: 400,
  },

  // --- UC-24-03: verificar licencia y aprobar farmacia ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify',
    name: 'happy: verifica licencia y activa la farmacia',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/licenses/${c.vars.pharmacyLicenseId}/verify`,
    body: () => ({ approve: true }),
    expectedStatus: 200,
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify',
    name: 'límite: licencia inexistente -> 404',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/licenses/${UUID_ABSENT}/verify`,
    body: () => ({ approve: true }),
    expectedStatus: 404,
  },

  // --- UC-24-02: registrar sede ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/sites',
    name: 'happy: registra sede dispensadora',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/sites`,
    body: (c) => ({
      practiceSiteId: c.vars.pracSiteId,
      code: `SITE-${c.u}`,
      name: 'Sede Principal',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pharmacySiteId = String(b.id);
    },
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/sites',
    name: 'límite: farmacia inexistente -> 404',
    method: 'post',
    path: () => `/pharmacies/${UUID_ABSENT}/sites`,
    body: (c) => ({
      practiceSiteId: UUID_ABSENT,
      code: `SITE-X-${c.u}`,
      name: 'X',
    }),
    expectedStatus: 404,
  },

  // --- UC-24-04: publicar producto con identificadores ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/products',
    name: 'happy: publica producto con GTIN',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/products`,
    body: (c) => ({
      productCode: `PROD-${c.u}`,
      brandName: 'Paracetamol 500',
      genericName: 'Paracetamol',
      requiresPrescription: false,
      identifiers: [{ identifierType: 'GTIN', identifierValue: `0000${c.u}` }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pharmacyProductId = String(b.id);
    },
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/products',
    name: 'límite: falta productCode -> 400',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/products`,
    body: () => ({ brandName: 'x' }),
    expectedStatus: 400,
  },

  // --- UC-24-05: crear lista de precios ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/price-lists',
    name: 'happy: crea lista de precios pública',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/price-lists`,
    body: (c) => ({
      code: `PL-${c.u}`,
      priceListType: 'PUBLIC',
      publicVisibility: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pharmacyPriceListId = String(b.id);
    },
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/price-lists',
    name: 'límite: INSURER sin insurerTenantId -> 422',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/price-lists`,
    body: (c) => ({ code: `PL-INS-${c.u}`, priceListType: 'INSURER' }),
    expectedStatus: 422,
  },

  // --- UC-24-06: versionar precio ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices',
    name: 'happy: fija precio (versión 1)',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/price-lists/${c.vars.pharmacyPriceListId}/prices`,
    body: (c) => ({
      pharmacyProductId: c.vars.pharmacyProductId,
      unitAmount: 12.5,
      patientAmount: 12.5,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices',
    name: 'límite: producto inexistente -> 404',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/price-lists/${c.vars.pharmacyPriceListId}/prices`,
    body: () => ({ pharmacyProductId: UUID_ABSENT, unitAmount: 5 }),
    expectedStatus: 404,
  },

  // --- UC-24-07: conexión de integración ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/integration-connections',
    name: 'happy: establece conexión de integración',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/integration-connections`,
    body: () => ({
      integrationMode: 'REALTIME',
      supportsStockQuery: true,
      supportsPriceQuery: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.pharmacyConnectionId = String(b.id);
    },
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/integration-connections',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/integration-connections`,
    auth: false,
    body: () => ({ integrationMode: 'REALTIME' }),
    expectedStatus: 401,
  },

  // --- UC-24-08: mapear producto externo ---
  {
    module: 'Pharmacy',
    endpoint:
      'POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings',
    name: 'happy: mapea producto a código externo',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/integration-connections/${c.vars.pharmacyConnectionId}/product-mappings`,
    body: (c) => ({
      pharmacyProductId: c.vars.pharmacyProductId,
      externalProductCode: `EXT-${c.u}`,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Pharmacy',
    endpoint:
      'POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings',
    name: 'límite: mapeo duplicado -> 409',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/integration-connections/${c.vars.pharmacyConnectionId}/product-mappings`,
    body: (c) => ({
      pharmacyProductId: c.vars.pharmacyProductId,
      externalProductCode: `EXT2-${c.u}`,
    }),
    expectedStatus: 409,
  },

  // --- UC-24-11: proyección de catálogo ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/projections',
    name: 'happy: proyecta catálogo y precios',
    method: 'post',
    path: (c) => `/pharmacies/${c.vars.pharmacyId}/projections`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/projections',
    name: 'límite: farmacia inexistente -> 404',
    method: 'post',
    path: () => `/pharmacies/${UUID_ABSENT}/projections`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // --- UC-24-09: retirar producto ---
  {
    module: 'Pharmacy',
    endpoint: 'DELETE /pharmacies/{pharmacyId}/products/{productId}',
    name: 'happy: retira producto (soft-delete)',
    method: 'delete',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/products/${c.vars.pharmacyProductId}`,
    expectedStatus: 200,
  },
  {
    module: 'Pharmacy',
    endpoint: 'DELETE /pharmacies/{pharmacyId}/products/{productId}',
    name: 'límite: producto ya retirado -> 422',
    method: 'delete',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/products/${c.vars.pharmacyProductId}`,
    expectedStatus: 422,
  },

  // --- UC-24-10: cerrar lista de precios ---
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close',
    name: 'happy: cierra la lista de precios',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/price-lists/${c.vars.pharmacyPriceListId}/close`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Pharmacy',
    endpoint: 'POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close',
    name: 'límite: lista ya cerrada -> 422',
    method: 'post',
    path: (c) =>
      `/pharmacies/${c.vars.pharmacyId}/price-lists/${c.vars.pharmacyPriceListId}/close`,
    body: () => ({}),
    expectedStatus: 422,
  },
];
