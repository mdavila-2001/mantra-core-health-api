# ADR-0002: ORM — MikroORM

## Estado
Aceptado. **Corregido el 2026-08-07:** este ADR describía la generación de entidades como
introspección de la base (`yarn orm:gen`). Nunca fue así — ver
[ADR-0022](ADR-0022-generacion-de-entidades.md). La decisión de fondo (MikroORM) no cambia.

## Contexto
1 186 entidades sobre PostgreSQL, generadas desde los `.puml` del modelo canónico con
`python salud-db/gen_entities.py` (la misma fuente que el DDL), con bloqueo optimista
(`row_version`) y necesidad de un catálogo propio de índices/foreign keys
(`src/orm/catalog/`) separado de las entidades.

## Fuerzas y restricciones
- Las entidades **no se editan a mano** — se regeneran desde el DDL (`src/modules/README.md`).
- Las foreign keys se modelan como `uuid` escalares, no relaciones `@ManyToOne`, para evitar que
  5993 referencias entre 57+ módulos fuercen imports cruzados y ciclos.
- Soporte nativo de `version: true` para optimistic locking.

## Opciones consideradas
Alternativas típicas (TypeORM, Prisma, Knex + SQL a mano): sin registro histórico de la
comparación original — se documenta la decisión ya tomada.

## Decisión
MikroORM 7 (`@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`) como capa de
persistencia sobre PostgreSQL, con generación de entidades desde el modelo canónico —no por
introspección— y catálogo de índices/FK mantenido fuera de las entidades (`src/orm/catalog/`).

## Consecuencias positivas
- Bloqueo optimista de primera clase (`row_version`) — 353 usos de
  `PreconditionFailedException` en producción de código lo confirman como patrón real, no teórico.
- Desacoplar FK de relaciones de ORM evita ciclos de import entre los 60 módulos (confirmado:
  `graphify-out/GRAPH_REPORT.md` reporta 0 ciclos de import).

## Consecuencias negativas
- Sin `@ManyToOne` reales, cargar datos relacionados exige joins/queries explícitos en el
  repositorio en vez de navegación de grafo de objetos — más código explícito, menos "mágico".
- Generar desde los `.puml` significa que el modelo canónico es la fuente de verdad, no el
  código TypeScript — un cambio de modelo nunca empieza en la entidad.

## Riesgos
Ver `DATA-001` en la [matriz de trazabilidad](../governance/traceability-matrix.md): el DDL vive
en SQL plano (los `.puml` del modelo canónico → `SQL/` (ver [ADR-0021](ADR-0021-fuente-unica-de-ddl.md))), no en migraciones versionadas por MikroORM — ver
[ADR-0016](ADR-0016-migraciones-sql-plano.md).

## Evidencia
`package.json` (sin `orm:gen` desde v4.0.10), `src/modules/README.md`, `src/orm/catalog/`,
`tools/catalog/generate-catalog.mjs`, `salud-db/gen_entities.py`,
[ADR-0022](ADR-0022-generacion-de-entidades.md).

## Plan de revisión
Revisar si el volumen de entidades (1 186) empieza a hacer inviable el flujo de regeneración
manual.
