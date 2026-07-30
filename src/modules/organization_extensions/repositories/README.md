# Repositorios — Organization Extensions

Acceso a datos stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la transacción y el `flush`. No contienen
reglas de negocio, sólo consultas y construcción de entidades (`em.create(...,
{ partial: true })` con `createdBy`).

| Repositorio | Tabla | Métodos clave |
|-------------|-------|---------------|
| `HospitalsRepository` | `hospitals` | `findById`, `findByTenantOrPractice` (guard 1:1), `create` |
| `HospitalServiceLinesRepository` | `hospital_service_lines` | `findByIdForHospital`, `create` |
| `FacilityLicensesRepository` | `facility_licenses` | `findById`, `findByNumber` (unicidad), `countVerifiedForTenant` (guard de activación), `create` |
| `OrganizationAffiliationsRepository` | `organization_affiliations` | `findById`, `findActiveDuplicate`, `create` |
| `OrganizationDataBoundariesRepository` | `organization_data_boundaries` | `findActiveByTenantAndType`, `countActiveForTenant`, `create` |
