# Arquitectura de datos

> Fase 11. Ver [ADR-0002](../adr/ADR-0002-orm-mikroorm.md) y [ADR-0003](../adr/ADR-0003-postgresql-poliglota.md)
> para las decisiones que explican este modelo.

## Resumen

- **1184 entidades** implementadas en **57 schemas** PostgreSQL (uno por módulo de negocio),
  generadas por introspección del DDL real — nunca editadas a mano.
- **1179/1184** tienen descripción de negocio verificada contra la bóveda de diseño SALUD (ver
  [catálogo de entidades](entity-catalog.md)).
- Foreign keys modeladas como columnas `uuid` escalares (no relaciones `@ManyToOne` de MikroORM),
  declaradas aparte en `src/orm/catalog/foreign-keys/` y aplicadas en el arranque.
- Índices declarados aparte en `src/orm/catalog/indexes/`, no en las entidades.
- Bloqueo optimista (`row_version`) en la mayoría de las tablas de negocio (no en tablas de
  asociación/enlace puras).
- Valores cerrados resueltos contra `terminology.catalog_concepts`, no enums nativos (excepción
  única: `terminology.technical_data_type`).

## Por qué el DDL manda sobre el código

`src/modules/README.md`: "las entidades se generan, no se escriben". Si algo no cuadra entre el
modelo de negocio y el código, se corrige el DDL (`database/SQL/99_migrations`) y se regenera con
`yarn orm:gen` — nunca se parchea la entidad TypeScript directamente. Ver
[ADR-0016](../adr/ADR-0016-migraciones-sql-plano.md).

## Los 5 almacenes y su rol

Ver [mapa de integraciones](../architecture/integration-map.md) §2 para el detalle de PostgreSQL,
MongoDB, Redis, OpenSearch y MinIO. Solo PostgreSQL tiene entidades ORM propias — los otros 4 se
encapsulan en sus módulos dedicados (`document_store`, `redis_runtime`, `search_platform`,
`object_storage`) sin mapeo MikroORM.

## Fuente de verdad del modelo de diseño

El "modelo canónico SALUD v4.0.x" vive en una bóveda de diseño (Obsidian) externa a este
repositorio, versionada aparte. `tools/catalog/generate-catalog.mjs` y este mismo portal
(`tools/docs/generate-data-catalog.mjs`) la leen para producir tanto el catálogo ORM
(`src/orm/catalog/`) como la documentación (`docs/data/entity-catalog.md`) — dos derivados de la
misma fuente, no dos fuentes independientes que puedan divergir entre sí.

## Cómo llega el código a los datos

Conviven dos caminos, a propósito y de forma temporal:

1. **El heredado**: el servicio inyecta `EntityManager` y se lo pasa al repositorio. Lo usan 59 de
   los 60 módulos.
2. **El de puertos**: el servicio depende de puertos de dominio y abre transacciones por la sesión
   del módulo; el enrutado decide la conexión. Lo usa el módulo piloto.

La migración es módulo a módulo y reversible por configuración. Ver
[ADR-0022](../adr/ADR-0022-puertos-persistencia-read-write.md) y
[rutas de lectura y escritura](read-write-routing.md).

## Ver también

- [Catálogo de entidades](entity-catalog.md) — las 1184 entidades reales, por schema.
- [Inventario de accesos a datos](data-access-inventory.md) — la auditoría del punto de partida.
- [Rutas de lectura y escritura](read-write-routing.md) — puertos, adaptadores y enrutado.
- [Configuración de conexiones](connection-configuration.md) — variables de entorno de la capa.
- [Roles y privilegios de PostgreSQL](postgres-roles-and-privileges.md) — mínimo privilegio.
- [Restricciones e índices](constraints-and-indexes.md)
- [Migraciones](migrations.md)
- [Seeds](seeds.md)
- [Clasificación de sensibilidad](classification.md)
- [Retención](retention.md)
