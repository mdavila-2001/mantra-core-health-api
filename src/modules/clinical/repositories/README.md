# Clinical — Repositorios

Repositorios **stateless**: cada método recibe el `EntityManager` activo como
primer parámetro para que el servicio controle la unidad de trabajo/transacción y
los repos sean triviales de mockear. No contienen reglas de negocio; solo
construcción de consultas y `em.create(..., { partial: true })` con los campos de
auditoría de `createdBy(actor)`. `row_version` se omite (DEFAULT 1 en BD).

| Repositorio | Tablas | Métodos destacados |
|-------------|--------|--------------------|
| `CareEpisodesRepository` | `care_episodes` | `findActiveByPatient` (unicidad), `create` |
| `EncountersRepository` | `encounters`, `encounter_participants`, `encounter_locations` | `create`, `createParticipant`, `createLocation`, `findActive*` |
| `ObservationsRepository` | `observations` + `components`/`ranges`/`performers`/`notes` | `create`, `createComponent`, `createReferenceRange`, `createPerformer`, `createNote`, `findComponents` |
| `ServiceRequestsRepository` | `service_requests` | `findById`, `create` |
| `DiagnosticReportsRepository` | `diagnostic_reports` | `findById`, `create` |
| `ConditionsRepository` | `conditions` | `findActiveByCode`, `create` |
| `AllergyIntolerancesRepository` | `allergy_intolerances`, `allergy_reactions` | `findActiveBySubstance`, `create`, `createReaction` |
| `MedicationRequestsRepository` | `medication_requests` | `findById`, `create` |
| `MedicationRecordsRepository` | `medication_records` | `findById`, `create` |
| `ProceduresRepository` | `procedures` | `findById`, `create` |
| `ImmunizationsRepository` | `immunizations` | `findByPatientVaccineDose`, `create` |
