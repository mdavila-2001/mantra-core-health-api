## Resumen

<!-- Qué cambia y por qué. -->

## Casilla documental (obligatoria)

Este PR cambia:

- [ ] Rutas HTTP, DTO o controllers → regeneré el contrato: `yarn docs:openapi:generate` y comprobé `yarn docs:openapi:lint`.
- [ ] Entidades o el modelo de datos → el cambio empieza en los `.puml`, nunca en la entidad ni en la base ([ADR-0021](../docs/adr/ADR-0021-fuente-unica-de-ddl.md), [ADR-0022](../docs/adr/ADR-0022-generacion-de-entidades.md)); corrí `yarn ddl:sources && yarn orm:catalog && python ../salud-db/gen_entities.py all && yarn format && yarn docs:tsdoc && yarn orm:audit` y actualicé `docs/data/entity-catalog.md` con `yarn docs:data:sync` si aplica.
- [ ] Eventos de dominio (`publishDomainEvent`) → actualicé `docs/events/event-catalog.md` y `asyncapi/asyncapi.yaml`.
- [ ] Permisos, roles o el mecanismo de autorización → actualicé `docs/api/authorization.md` y/o `docs/business/actors-and-roles.md`.
- [ ] Un README de módulo (`src/modules/<módulo>/README.md`) → corrí `yarn docs:modules:sync`.
- [ ] Una decisión arquitectónica nueva → añadí un ADR (`docs/adr/`, ver plantilla en `docs/adr/index.md`).
- [ ] Nada de lo anterior — no requiere actualización documental.

## Verificación

- [ ] `yarn build`
- [ ] `yarn test`
- [ ] `yarn docs:validate` (Redocly + AsyncAPI + cobertura + enlaces)
- [ ] `yarn docs:build` (MkDocs `--strict`)
