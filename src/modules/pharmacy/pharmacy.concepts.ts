import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo pharmacy (prefijo `pharmacy:`).
 *
 * El esquema es "concept-driven": estados, tipos y modos no son enums de columna
 * sino filas de `terminology.catalog_concepts` referenciadas por FK
 * (`*_concept_id`). Aquí se declaran solo los conceptos que los endpoints de
 * pharmacy necesitan para que TODA columna `*_concept_id` NOT NULL de sus inserts
 * tenga un valor determinista y sembrado.
 *
 * `PHARMACY_CONCEPT_SEEDS` lo consume el agregador central del seed; `PHARM` es el
 * mapa `nombre -> UUID` determinista que consumen servicios y repositorios.
 */
export const { seeds: PHARMACY_CONCEPT_SEEDS, ids: PHARM } = defineModuleConcepts('pharmacy', {
  // --- Estado de farmacia (pharmacies.status_concept_id) ---
  PHARMACY_DRAFT: { code: 'PHARM_PHARMACY_DRAFT', display: 'Pharmacy draft' },
  PHARMACY_ACTIVE: { code: 'PHARM_PHARMACY_ACTIVE', display: 'Pharmacy active' },

  // --- Estado de verificación (pharmacies / licenses / mappings) ---
  VERIFICATION_PENDING: { code: 'PHARM_VERIFICATION_PENDING', display: 'Verification pending' },
  VERIFICATION_VERIFIED: { code: 'PHARM_VERIFICATION_VERIFIED', display: 'Verification verified' },
  VERIFICATION_REJECTED: { code: 'PHARM_VERIFICATION_REJECTED', display: 'Verification rejected' },

  // --- Tipo de farmacia / propiedad ---
  PHARMACY_TYPE_RETAIL: { code: 'PHARM_TYPE_RETAIL', display: 'Retail pharmacy' },
  OWNERSHIP_PRIVATE: { code: 'PHARM_OWNERSHIP_PRIVATE', display: 'Private ownership' },

  // --- Licencias (pharmacy_licenses.license_type_concept_id) ---
  LICENSE_TYPE_OPERATING: { code: 'PHARM_LICENSE_TYPE_OPERATING', display: 'Operating license' },

  // --- Sedes (pharmacy_sites) ---
  SITE_ACTIVE: { code: 'PHARM_SITE_ACTIVE', display: 'Pharmacy site active' },
  SITE_TYPE_DISPENSING: { code: 'PHARM_SITE_TYPE_DISPENSING', display: 'Dispensing site' },
  DISPENSING_MODE_ONSITE: { code: 'PHARM_DISPENSING_MODE_ONSITE', display: 'On-site dispensing' },

  // --- Productos (pharmacy_products.status_concept_id) ---
  PRODUCT_ACTIVE: { code: 'PHARM_PRODUCT_ACTIVE', display: 'Pharmacy product active' },
  PRODUCT_RETIRED: { code: 'PHARM_PRODUCT_RETIRED', display: 'Pharmacy product retired' },

  // --- Identificadores de producto (pharmacy_product_identifiers) ---
  IDENTIFIER_TYPE_GTIN: { code: 'PHARM_IDENTIFIER_TYPE_GTIN', display: 'GTIN identifier' },
  IDENTIFIER_TYPE_NDC: { code: 'PHARM_IDENTIFIER_TYPE_NDC', display: 'NDC identifier' },

  // --- Listas de precios (pharmacy_price_lists) ---
  PRICE_LIST_DRAFT: { code: 'PHARM_PRICE_LIST_DRAFT', display: 'Price list draft' },
  PRICE_LIST_ACTIVE: { code: 'PHARM_PRICE_LIST_ACTIVE', display: 'Price list active' },
  PRICE_LIST_CLOSED: { code: 'PHARM_PRICE_LIST_CLOSED', display: 'Price list closed' },
  PRICE_LIST_TYPE_PUBLIC: { code: 'PHARM_PRICE_LIST_TYPE_PUBLIC', display: 'Public price list' },
  PRICE_LIST_TYPE_INSURER: { code: 'PHARM_PRICE_LIST_TYPE_INSURER', display: 'Insurer price list' },

  // --- Precios versionados (pharmacy_product_prices.status_concept_id) ---
  PRICE_ACTIVE: { code: 'PHARM_PRICE_ACTIVE', display: 'Product price active' },
  PRICE_SUPERSEDED: { code: 'PHARM_PRICE_SUPERSEDED', display: 'Product price superseded' },

  // --- Integración (pharmacy_integration_connections) ---
  CONNECTION_ACTIVE: { code: 'PHARM_CONNECTION_ACTIVE', display: 'Integration connection active' },
  INTEGRATION_MODE_REALTIME: { code: 'PHARM_INTEGRATION_MODE_REALTIME', display: 'Real-time integration' },
  INTEGRATION_MODE_BATCH: { code: 'PHARM_INTEGRATION_MODE_BATCH', display: 'Batch integration' },

  // --- Mapeos externos (pharmacy_external_product_mappings.status/verification) ---
  MAPPING_INACTIVE: { code: 'PHARM_MAPPING_INACTIVE', display: 'External mapping inactive' },

  // --- Moneda por defecto (default_currency / currency) ---
  CURRENCY_USD: { code: 'PHARM_CURRENCY_USD', display: 'US Dollar' },
});

/** Mapea el código de tipo de lista de precios (DTO) a su concept id. */
export const PRICE_LIST_TYPE_CONCEPT_BY_CODE: Record<'PUBLIC' | 'INSURER', string> = {
  PUBLIC: PHARM.PRICE_LIST_TYPE_PUBLIC,
  INSURER: PHARM.PRICE_LIST_TYPE_INSURER,
};

/** Mapea el código de tipo de identificador de producto (DTO) a su concept id. */
export const IDENTIFIER_TYPE_CONCEPT_BY_CODE: Record<'GTIN' | 'NDC', string> = {
  GTIN: PHARM.IDENTIFIER_TYPE_GTIN,
  NDC: PHARM.IDENTIFIER_TYPE_NDC,
};

/** Mapea el código de modo de integración (DTO) a su concept id. */
export const INTEGRATION_MODE_CONCEPT_BY_CODE: Record<'REALTIME' | 'BATCH', string> = {
  REALTIME: PHARM.INTEGRATION_MODE_REALTIME,
  BATCH: PHARM.INTEGRATION_MODE_BATCH,
};
