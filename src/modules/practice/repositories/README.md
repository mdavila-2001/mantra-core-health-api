# Practice · repositories

Acceso a datos del esquema `practice`. Todos los repositorios son **stateless**:
cada método recibe el `EntityManager` activo como primer parámetro, de modo que el
servicio controla la unidad de trabajo/transacción y varios repositorios participan
del mismo `flush` atómico. No contienen reglas de negocio (viven en los servicios).

| Repositorio | Tabla | Notas |
|---|---|---|
| `PracticesRepository` | `practices` | organización raíz (bootstrap) |
| `PracticeSitesRepository` | `practice_sites` | `findByPracticeAndCode` para unicidad de código |
| `PracticeAccreditationsRepository` | `practice_accreditations` | verificación/caducidad |
| `ClinicalUnitsRepository` | `clinical_units` | `findBySite` para cascada/validación de padre |
| `CareSpacesRepository` | `care_spaces` | `findBySite` para cascada |
| `HealthcareServicesRepository` | `healthcare_services` | `findBySite` para suspensión en cascada |
| `PracticeSettingsRepository` | `practice_settings` | `findByPracticeAndKey` para upsert |
| `PractitionerRoleAssignmentsRepository` | `practitioner_role_assignments` | `findBySite` para cascada |
| `PractitionerSupportAssignmentsRepository` | `practitioner_support_assignments` | apoyo a un rol |
| `InventoryItemsRepository` | `inventory_items` | stock actual |
| `InventoryMovementsRepository` | `inventory_movements` | append-only, sin auditoría/versión |

Reglas: FKs son columnas uuid planas → el servicio hace `flush` del padre antes de
crear hijos. `createdBy(actor.id)` puebla auditoría; `rowVersion` nunca se fija a
mano (`inventory_movements` no tiene ni auditoría ni versión).
