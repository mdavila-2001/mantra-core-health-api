import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo pharmacy_inventory (25). Usa la farmacia y la sede que siembra
 * el smoke de pharmacy (`ctx.vars.pharmacyId` / `ctx.vars.pharmacySiteId`, corre
 * antes) para ubicaciones de inventario y proveedores, más casos límite 401/404.
 * Dispensaciones/reservas/recuentos dependen de lotes y recepciones de mercadería
 * (cadena larga de inventario); se cubren con su caso de autenticación.
 */
export const PHARMACY_INVENTORY_SMOKE: SmokeCase[] = [
  // ubicación de inventario en una sede
  {
    module: 'PharmacyInventory', endpoint: 'POST /pharmacy/:siteId/inventory-locations', name: 'happy: ubicación',
    method: 'post', path: (c) => `/pharmacy/${c.vars.pharmacySiteId}/inventory-locations`,
    body: (c) => ({ code: `LOC-${c.u}`, name: 'Estante A', controlledAccess: false }),
    expectedStatus: 201, capture: (b, c) => { c.vars.pinvLocationId = String(b.id); },
  },
  {
    module: 'PharmacyInventory', endpoint: 'POST /pharmacy/:siteId/inventory-locations', name: 'límite: sin auth',
    method: 'post', path: (c) => `/pharmacy/${c.vars.pharmacySiteId}/inventory-locations`, auth: false,
    body: (c) => ({ code: `x-${c.u}`, name: 'x' }), expectedStatus: 401,
  },
  // proveedor de la farmacia
  {
    module: 'PharmacyInventory', endpoint: 'POST /pharmacy/:pharmacyId/suppliers', name: 'happy: proveedor',
    method: 'post', path: (c) => `/pharmacy/${c.vars.pharmacyId}/suppliers`,
    body: (c) => ({ supplierTenantId: c.tenantId, supplierCode: `SUP-${c.u}` }),
    expectedStatus: 201, capture: (b, c) => { c.vars.pinvSupplierId = String(b.id); },
  },
  {
    module: 'PharmacyInventory', endpoint: 'POST /pharmacy/:pharmacyId/purchase-orders', name: 'límite: farmacia inexistente',
    method: 'post', path: () => `/pharmacy/${UUID_ABSENT}/purchase-orders`,
    body: (c) => ({ supplierId: c.vars.pinvSupplierId }), expectedStatus: 404,
  },
  // dispensación: depende de lote/inventario → se cubre 401
  {
    module: 'PharmacyInventory', endpoint: 'POST /pharmacy/:pharmacyId/dispensations', name: 'límite: sin auth (dispensación requiere lote)',
    method: 'post', path: (c) => `/pharmacy/${c.vars.pharmacyId}/dispensations`, auth: false,
    body: () => ({}), expectedStatus: 401,
  },
];
