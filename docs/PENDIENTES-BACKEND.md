# Pendientes de backend

Notas de brechas cerradas o abiertas del lado de la API, referenciadas desde los carriles que las
tocan. No existía este archivo al 2026-09-25 (verificado con `find`); se crea acá porque el carril
de Farmacia (Marcelo, 2026-09-25) lo referencia como convención.

## 2026-09-25 — Sedes sueltas y filtro por farmacia (Farmacia · carriles 42 y 47)

Brecha cerrada: `GET /pharmacy/sites` (sedes publicadas del tenant, con Haversine y filtro por
texto) y `pharmacyId` en `GET /pharmacy/products` (filtro por catálogo de una sola farmacia).
Antes, esas dos consultas sólo existían en el mock del front (`pharmacy.handlers.ts`).

- Rama: `marcelo/pharmacy-sites-y-filtro-por-farmacia-2026-09-25`.
- `PharmacySitePriceDto.requiresPrescription` se agregó (no existía en el DTO real; el mock y el
  front ya lo declaraban, así que se cerró la brecha acá).
- **Bloqueante conocido, no cerrado por este carril**: `yarn docs:openapi:generate` y `yarn
  postman:generate` no pueden bootstrapear la app — `UnknownDependenciesException` en
  `PractitionerSettlementBatchesService` de `InsuranceModule`. Es anterior a este carril y ajeno a
  `pharmacy`; hace falta que el dueño de `InsuranceModule` lo resuelva antes de que cualquier
  carril pueda regenerar OpenAPI o Postman.
