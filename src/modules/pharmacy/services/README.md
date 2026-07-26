# Servicios — Pharmacy

Poseen la unidad de trabajo: escrituras con `em.transactional`, lecturas con
`em.fork()`. Hacen `flush` del padre antes de crear los hijos (las FK son columnas
uuid planas y MikroORM no ordena inserts entre entidades no relacionadas). Fijan
`createdAt/updatedAt` con `createdBy`/`touch`; nunca fijan `row_version`.

- `pharmacies.service.ts` — UC-24-01 (alta + licencia), UC-24-03 (verificar/aprobar).
- `pharmacy-sites.service.ts` — UC-24-02 (sede; exige farmacia ACTIVE).
- `pharmacy-products.service.ts` — UC-24-04 (publicar), UC-24-09 (retirar en cascada).
- `pharmacy-pricing.service.ts` — UC-24-05 (lista), UC-24-06 (versionar), UC-24-10 (cerrar).
- `pharmacy-integration.service.ts` — UC-24-07 (conexión), UC-24-08 (mapeo).
- `pharmacy-catalog.service.ts` — UC-24-11 (proyección read-only).

Excepciones de dominio: `ResourceNotFoundException` (404), `ConflictException`
(409), `PreconditionFailedException` (422).
