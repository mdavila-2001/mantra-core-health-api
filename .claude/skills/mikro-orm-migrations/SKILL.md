---
name: mikro-orm-migrations
description: "MikroORM 7 (PostgreSQL) workflow for this repo: entity generation by database introspection per schema, runtime config, and migrations. Use when generating/regenerating entities, adding a schema, writing or running migrations, or debugging MikroORM discovery/metadata."
---

# mikro-orm-migrations

Este repo usa **MikroORM 7 con PostgreSQL** y genera entidades **por introspección de la BD**
(no code-first). Hay dos configs separadas a propósito:

- `src/mikro-orm.config.ts` — config de **runtime** (la usan `MikroOrmModule.forRoot` y la CLI).
  `TsMorphMetadataProvider`, entidades en `src/modules/**/entities/*.entity.ts`.
- `src/mikro-orm-generator.config.ts` — config del **generador** por introspección (devDependency,
  fuera de producción).

Las env de BD se cargan y validan con Joi vía `loadDatabaseEnv()` en `src/config/database.env.ts`.

## Generar entidades de un schema (introspección)

Patrón del script existente (`orm:gen:iam`):

```bash
mikro-orm generate-entities \
  --config ./src/mikro-orm-generator.config.ts \
  --schema <schema> \
  --save \
  --path ./src/modules/<dominio>/entities
```

Para un dominio nuevo, añade su script a `package.json` replicando `orm:gen:iam`:
`"orm:gen:<dominio>": "mikro-orm generate-entities --config ./src/mikro-orm-generator.config.ts --schema <schema> --save --path ./src/modules/<dominio>/entities"`.

Tras generar: revisa/actualiza el `entities/index.ts` (barrel) para re-exportar las nuevas entidades,
ya que `MikroOrmModule.forFeature(Object.values(entities))` depende de él.

## CLI

```bash
yarn orm <comando>          # alias de mikro-orm (usa src/mikro-orm.config.ts)
yarn orm migration:create   # nueva migración
yarn orm migration:up       # aplicar
yarn orm migration:down     # revertir
yarn orm schema:update --dump  # ver el diff SQL sin aplicar (inspección segura)
```

## Reglas

- **No editar a mano** entidades generadas salvo necesidad puntual; preferir regenerar.
- Mantén el `entities/index.ts` sincronizado tras cada generación.
- `discovery: { warnWhenNoEntities: false }` ya está configurado; si MikroORM no descubre una entidad,
  suele ser un path mal puesto en el barrel o un decorador faltante, no la config.
- Entidades runtime se descubren desde `dist/**` en prod y `src/**` en dev (`entitiesTs`).
- No introduzcas una devDependency del generador en runtime; por eso las configs están separadas.
- Comentarios en **español** (ver el estilo en `src/mikro-orm.config.ts`).
- **Logging** (regla base, ver `project-conventions`): en runtime el ORM emite por pino a
  través de su puente (`orm-catalog`); no añadas `console` en configs, generadores ni scripts
  de `tools/`. Un script CLI puntual puede usar `console`, pero el código que corre dentro de
  la app, no.

## Persistencia poliglota

Además de Postgres, el proyecto usa MongoDB, OpenSearch, Redis y S3/pgvector. MikroORM cubre **solo**
la capa relacional Postgres. Para consistencia entre stores, revisa el módulo `cross_store_consistency`
(`graphify query "cross store consistency"`).
