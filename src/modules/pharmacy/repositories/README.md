# Repositorios — Pharmacy

Acceso a datos de `pharmacy.*`. Stateless: cada método recibe el `EntityManager`
activo como primer parámetro para que el servicio controle la unidad de trabajo y
la transacción. No hay reglas de negocio aquí; solo consultas y `em.create(...,
{ partial: true })`.

- `pharmacies.repository.ts` — farmacias (findById, findByTenantAndCode, create).
- `pharmacy-licenses.repository.ts` — licencias (create, findById, countUnverified).
- `pharmacy-sites.repository.ts` — sedes (findById, findByPharmacyAndCode, create).
- `pharmacy-products.repository.ts` — productos (findById, findByPharmacyAndCode, findByPharmacyAndStatus, create).
- `pharmacy-product-identifiers.repository.ts` — identificadores GTIN/NDC (create; solo `created_*`).
- `pharmacy-price-lists.repository.ts` — listas de precios (findById, findByPharmacyAndCode, create).
- `pharmacy-product-prices.repository.ts` — precios versionados (maxVersionNumber, findActiveBy*, create; sin `row_version`).
- `pharmacy-integration-connections.repository.ts` — conexiones (findById, findByPharmacyAndConnection, create con auto-referencia).
- `pharmacy-external-product-mappings.repository.ts` — mapeos externos (findByConnectionAndProduct, findActiveByProduct, create).
