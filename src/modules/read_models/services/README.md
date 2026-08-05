# read_models · services

Los servicios poseen la unidad de trabajo: `em.transactional` para escrituras (con
`flush` del padre antes de los hijos) y `em.fork` para lecturas. Lanzan excepciones
de dominio (`ResourceNotFoundException` → 404, `ConflictException` → 409,
`PreconditionFailedException` → 422).

| Servicio | Casos de uso |
| --- | --- |
| `ReadModelDefinitionsService` | UC-30-01 crear/publicar, UC-30-08 versionar, UC-30-03 refresh, UC-30-04 backfill, UC-30-06 invalidar, UC-30-07 reconciliar, UC-30-12 salud/staleness, UC-30-13 deprecar/retirar |
| `FrontendViewsService` | UC-30-02 publicar contrato de vista, UC-30-05 servir datos, UC-30-11 derivar acciones, UC-30-09 preferencias |
| `PublicProjectionsService` | UC-30-10 proyecciones públicas (slug + directorio) |
