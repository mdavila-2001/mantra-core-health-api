# Practice · services

Reglas de negocio y orquestación de la unidad de trabajo. Cada servicio inyecta
`EntityManager` (`@mikro-orm/postgresql`) y usa `em.transactional`; hace `flush`
del padre antes de crear hijos (FKs son columnas uuid planas). Estados/tipos se
fijan con `PRAC.*` (ver `practice.concepts.ts`); auditoría con `createdBy`/`touch`.

| Servicio | UC | Método |
|---|---|---|
| `PracticeSitesService` | bootstrap | `createPractice` |
| `PracticeSitesService` | UC-14-01 | `createSite` (valida práctica ACTIVE, unicidad de código) |
| `PracticeSitesService` | UC-14-12 | `decommissionSite` (cascada: units→RETIRED, spaces→RETIRED/CLOSED, services→SUSPENDED, roles→ENDED) |
| `PracticeAccreditationsService` | UC-14-02 / 03 | `create` (PENDING) · `verify` (→VERIFIED/EXPIRED) |
| `ClinicalStructureService` | UC-14-04 / 05 / 06 | `createClinicalUnit` · `createCareSpace` · `publishHealthcareService` |
| `PracticeSettingsService` | UC-14-07 | `upsert` (por `practice_id`+`setting_key`) |
| `PracticeWorkforceService` | UC-14-08 / 09 | `assignRole` · `attachSupport` (rol padre ACTIVE) |
| `PracticeInventoryService` | UC-14-10 / 11 | `createItem` (stock 0) · `recordMovement` (ajusta stock, invariante >= 0) |
| `PractitionerSitesService` | UC-14-15 / ALV-005 | `createOwnSite` · `deleteOwnSite` · `listSitesOfPractitioner` · `resolveSitesForResources` |
| `OwnSiteProvisioningService` | ALV-005/006 · P20 | `provision` (práctica OFFICE + dirección WORK + sede + rol activo, sin abrir transacción propia — la usan `PractitionerSitesService` y el auto-registro de profesional de `iam`) |

Excepciones de dominio: `ResourceNotFoundException` (404), `ConflictException`
(409, código duplicado), `PreconditionFailedException` (412, estado/coherencia,
stock insuficiente). Logs Pino estructurados; nunca secretos/PHI.
