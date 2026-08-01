# ADR-0002: ORM — MikroORM

## Estado
Aceptado.

## Contexto
1184 entidades sobre PostgreSQL, generadas por introspección del DDL real (`yarn orm:gen`), con
bloqueo optimista (`row_version`) y necesidad de un catálogo propio de índices/foreign keys
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
persistencia sobre PostgreSQL, con generación de entidades por introspección y catálogo de
índices/FK mantenido fuera de las entidades (`src/orm/catalog/`).

## Consecuencias positivas
- Bloqueo optimista de primera clase (`row_version`) — 353 usos de
  `PreconditionFailedException` en producción de código lo confirman como patrón real, no teórico.
- Desacoplar FK de relaciones de ORM evita ciclos de import entre los 60 módulos (confirmado:
  `graphify-out/GRAPH_REPORT.md` reporta 0 ciclos de import).

## Consecuencias negativas
- Sin `@ManyToOne` reales, cargar datos relacionados exige joins/queries explícitos en el
  repositorio en vez de navegación de grafo de objetos — más código explícito, menos "mágico".
- Generación por introspección significa que el DDL es la fuente de verdad, no el código
  TypeScript — un cambio de modelo siempre empieza en SQL.

## Riesgos
Ver `DATA-001` en la [matriz de trazabilidad](../governance/traceability-matrix.md): el DDL vive
en SQL plano (`database/SQL/99_migrations`), no en migraciones versionadas por MikroORM — ver
[ADR-0016](ADR-0016-migraciones-sql-plano.md).

## Evidencia
`package.json`, `src/modules/README.md`, `src/orm/catalog/`, `tools/catalog/generate-catalog.mjs`.

## Plan de revisión
Revisar si el volumen de entidades (1184) empieza a hacer inviable el flujo de introspección
manual.
