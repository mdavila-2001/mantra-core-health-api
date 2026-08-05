# clinical_ext / services

Casos de uso del módulo. Cada servicio inyecta `EntityManager`
(`@mikro-orm/postgresql`) + sus repositorios + `PinoLogger`, posee la unidad de
trabajo con `em.transactional`, hace `flush` del padre antes de los hijos (FKs son
columnas uuid planas) y lanza excepciones de dominio (`ResourceNotFoundException`,
`ConflictException`, `PreconditionFailedException`).

- `CareTeamsService` — UC-18-01 (crear equipo + miembros), UC-18-02 (transferir liderazgo).
- `CdsService` — UC-18-13 (crear/publicar/rollback regla), UC-18-03 (evaluar → alertas),
  UC-18-04 (interacciones → alertas) + alta de datos de interacción.
- `ClinicalAlertsService` — UC-18-05 (acknowledge / override).
- `OrderSetsService` — crear plantilla + UC-18-06 (aplicar / fan-out).
- `ReferralsService` — UC-18-07 (emitir), UC-18-08 (responder).
- `CareGapsService` — UC-18-09 (recomputar), UC-18-10 (cerrar), UC-18-11 (proyectar
  inmunización) + alta de calendario.
- `VirtualEncountersService` — UC-18-12 (crear / join / end).

Specs unitarios (`*.spec.ts`) mockean repos y `EntityManager`
(`transactional: (cb) => cb(txMock)`): happy path, not-found, conflicto y rechazos
de regla de negocio.
