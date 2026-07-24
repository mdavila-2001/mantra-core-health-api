---
name: orm-catalog
description: "Núcleo de persistencia relacional de este repo (src/orm): catálogo del modelo oficial (schemas, tipos, índices, FKs, físico), las 7 capas de bootstrap que inyectan el DDL al arrancar, verificación de fidelidad entidad-tabla y observabilidad del ORM. Usar al tocar arranque/DDL, índices, claves foráneas, hypertables, extensiones, el catálogo o el motivo de un fallo de fidelidad."
---

# orm-catalog

`src/orm/` es el **único** lugar que sabe de PostgreSQL. Los 59 módulos de dominio solo
aportan entidades y consumen el `EntityManager`; ninguno configura conexión ni crea
estructura. Antes de tocar nada, lee `src/orm/README.md` y `src/orm/bootstrap/README.md`
(escritos para responder sin abrir código). Para el modelo: `graphify query "orm bootstrap layer"`.

## El reparto de responsabilidades (regla estructural)

- **La metadata de las entidades manda sobre tablas y columnas** — lo sincroniza MikroORM.
- **El catálogo manda sobre índices y restricciones** — lo aplican las capas 05 y 06.

Las entidades se generan por introspección y mapean las columnas FK como `uuid` escalares,
sin `@ManyToOne` (5993 referencias entre 57 módulos → acoplarían todo). MikroORM por eso no
emite ninguna FK; el catálogo paga ese precio. **Consecuencia que hay que respetar:** la capa
de tablas filtra del diff todo `drop index` y `drop constraint`, o borraría en cada arranque
lo que las capas siguientes crean (ver `bootstrap/layers/04-tables.layer.ts`).

## Las 7 capas de bootstrap (orden fijo)

```
src/orm/bootstrap/layers/
  01-extensions.layer.ts    extensiones (pgvector, etc.)
  02-schemas.layer.ts       los 57 schemas
  03-types.layer.ts         tipos nativos (solo terminology.technical_data_type)
  04-tables.layer.ts        tablas/columnas vía MikroORM; FILTRA drops de índices/constraints
  05-indexes.layer.ts       ~7313 índices desde el catálogo
  06-foreign-keys.layer.ts  5993 FKs desde el catálogo
  07-physical.layer.ts      físico: hypertables de TimescaleDB, etc.
```

Idempotente y no destructivo. Corren bajo advisory lock para no colisionar entre réplicas.
`ORM_SCHEMA_SYNC=safe` (por defecto) aplica; `dry-run` imprime sin ejecutar; `off` no toca nada.

## El catálogo como datos (`src/orm/catalog/`)

`schemas.catalog.ts`, `types.catalog.ts`, `extensions.catalog.ts`, `physical.catalog.ts` y las
carpetas troceadas `indexes/` (72 archivos) y `foreign-keys/` (65 archivos). **Zona prohibida
para lectura exploratoria** (quema decenas de miles de tokens): usa sus README o `yarn orm:audit`.
El catálogo se regenera desde la bóveda con `yarn orm:catalog` — no se edita a mano.

## Fidelidad y observabilidad

- `fidelity/` verifica en runtime que cada una de las 1159 entidades coincide con su tabla.
  Un fallo de fidelidad = entidad y tabla divergen; se corrige el DDL/catálogo y se regenera,
  nunca la entidad a mano.
- `observability/` = `orm.logger.ts` (puente al logger de NestJS, español) y `query-metrics.ts`
  (consultas lentas + contadores).

## Reglas

- **Nada de índices ni FKs en las entidades** — van en `src/orm/catalog/`.
- Cambio de estructura ⇒ se ajusta DDL/catálogo y se **regenera** (`yarn orm:gen` / `yarn orm:catalog`),
  no se edita la entidad.
- Verifica antes de arrancar en real: `yarn orm:schema:dump` (dry-run imprime el DDL).
- Cuadra cifras con `yarn orm:audit`; nunca vuelques `catalog/indexes` ni `catalog/foreign-keys`.
- Comentarios y logs en **español**, sin emojis. Tras editar: `graphify update .`.
- **Logging (regla base, ver `project-conventions`)**: la observabilidad del ORM
  (`observability/orm.logger.ts`) puentea al `Logger` de `@nestjs/common`, que `main.ts`
  enruta a pino; **no** uses `console`. Consultas lentas → `warn` como objeto con clave `msg`
  y campos (`tookMs`, `rows`, `query`) para poder filtrarlas. No abras un pino propio aquí.
