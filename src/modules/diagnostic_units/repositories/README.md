# Repositorios — diagnostic_units

Acceso a datos del módulo 23. Cada repositorio es **stateless**: sus métodos
reciben el `EntityManager` activo como primer parámetro, de modo que el servicio
controla la transacción (`em.transactional`) y varios repositorios participan en
el mismo `flush` atómico. No hay reglas de negocio aquí, solo construcción de
consultas y materialización.

| Repositorio | Tabla | Notas |
|---|---|---|
| `DiagnosticUnitsReadRepository` | varias tablas M23 + relaciones de solo lectura | listado/detalle aislados por tenant; filtra vigencia y visibilidad pública |
| `DiagnosticUnitsRepository` | `diagnostic_units` | alta PENDING/ACTIVE; `findByCode` sobre UK (tenant, code) |
| `DiagnosticUnitSitesRepository` | `diagnostic_unit_sites` | `countActiveForUnit` (precondición de verify) |
| `DiagnosticUnitSpecialtiesRepository` | `diagnostic_unit_specialties` | upsert vigente; `verifyOpenForUnit` |
| `DiagnosticUnitAccreditationsRepository` | `diagnostic_unit_accreditations` | alta PENDING; `verifyOpenForUnit` |
| `DiagnosticUnitPractitionerAssignmentsRepository` | `diagnostic_unit_practitioner_assignments` | `findActiveOverlap` (evita solape) |
| `DiagnosticStudyOfferingsRepository` | `diagnostic_study_offerings` | `findByStudyCode` sobre UK (unidad, study_code) |
| `DiagnosticStudyComponentsRepository` | `diagnostic_study_components` | append-only (solo `created_at`) |
| `DiagnosticPriceSchedulesRepository` | `diagnostic_price_schedules` | `findByCode` sobre UK (unidad, code) |
| `DiagnosticStudyPricesRepository` | `diagnostic_study_prices` | versionado append-only: `findActive`, `maxVersion` |
| `DiagnosticEquipmentRepository` | `diagnostic_equipment` | `findBySerial` sobre UK (sitio, serial) |

Convenciones: `em.create(Entity, {...}, { partial: true })`, `createdBy(actorId)`
para las marcas de auditoría y `rowVersion` **nunca** se fija (tiene `DEFAULT 1`).
