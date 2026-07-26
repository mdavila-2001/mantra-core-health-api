# clinical_ext / repositories

Acceso a datos stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la unidad de trabajo y la transacción, y
para que sean triviales de mockear. Ninguna regla de negocio vive aquí; solo
construcción de consultas y `em.create(..., { partial: true })` con `createdBy`.

- `CareTeamsRepository` — `care_teams` (findById, create).
- `CareTeamMembersRepository` — `care_team_members` (findById, findByTeam, findResponsible, create).
- `CdsRulesRepository` — `cds_rules` (findById, findByCode, findActive, create).
- `ClinicalAlertsRepository` — `clinical_alerts` (findById, create).
- `DrugInteractionsRepository` — `drug_interactions` (findByPair en cualquier orden, create).
- `OrderSetsRepository` — `order_sets` + `order_set_items` (findById, findByCode, itemsBySet, create, createItem).
- `ReferralsRepository` — `referrals` (findById, findDuplicate, create).
- `CareGapsRepository` — `care_gaps` (findById, findOpen, create).
- `ImmunizationSchedulesRepository` — `immunization_schedules` (findActive, create).
- `VirtualEncountersRepository` — `virtual_encounters` (findById, findByEncounter, create).
