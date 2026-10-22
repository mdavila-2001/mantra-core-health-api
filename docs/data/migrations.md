# Migraciones

> Ver [ADR-0021](../adr/ADR-0021-fuente-unica-de-ddl.md) para la decisión vigente, y
> [ADR-0016](../adr/ADR-0016-migraciones-sql-plano.md) para la que quedó superada.
> La política completa vive en el workspace:
> `Mantra Core Health Context/docs/architecture/ddl-sources.md`.

## Cómo cambia el esquema realmente

**No hay migraciones versionadas gestionadas por MikroORM, y este repositorio no
declara esquema.** El esquema se declara en los 64 diagramas `.puml` del modelo
canónico y se materializa en `SQL/`, en la raíz del workspace, que es lo que
`docker-compose.yml` monta en `postgres-init`.

El flujo real de cambio de esquema, de arriba hacia abajo:

1. **Modelo:** editar `Mantra Core Health Context/modules/diagram_NN_*.puml` y la nota
   de entidad correspondiente en el vault (`SALUD/Entidades/E <schema>.<tabla>.md`).
2. **DDL:** `python salud-db/gen_ddl.py NN` (y `gen_integrity.py` / `gen_apply.py` si
   cambió el conjunto de archivos). Nunca editar `SQL/` a mano.
3. **Base:** reconstruir con `python salud-db/rebuild_stack.py`, o —si la base ya está
   poblada y no se puede reconstruir— escribir un ALTER idempotente y fechado en
   `SQL/patches/` y aplicarlo con `psql`. `SQL/patches/` está fuera de `apply_all.sql`.
4. **Entidades:** `python salud-db/gen_entities.py NN`.
5. **Catálogo declarativo:** `yarn orm:catalog` (índices y FK desde la bóveda; requiere
   `SALUD_VAULT` apuntando a `<workspace>/Mantra Core Health Vault/SALUD`).
6. **Verificar las cuatro capas:** `yarn build` y arrancar con
   `ORM_SCHEMA_SYNC=dry-run ORM_VERIFY_FIDELITY=true` (`yarn orm:schema:dump`), leyendo
   la línea de `SchemaFidelityService`. Con `off` el chequeo **no** corre.

Lo que **no** se deriva de los `.puml` —la política de RLS, los seeds de desarrollo—
también vive en `SQL/patches/`, fechado y aplicado a mano.

> [!warning] No crear una carpeta de migraciones en este repositorio
> `database/SQL/99_migrations` existió y se eliminó dos veces (v4.0.8 y v4.0.9). Nadie
> la aplicaba: el compose aplica `database/SQL` (o el modelo, si se exportan las
> variables), así que su DDL solo corría a mano contra bases de desarrollo y cada
> arranque limpio producía un esquema distinto del que el código daba por hecho.
> `yarn ddl:sources` falla si reaparece.

## `ORM_SCHEMA_SYNC` — lo que MikroORM sí controla en el arranque

Control de sincronización en el arranque (`src/orm/bootstrap/schema-bootstrap.service.ts`):

| Modo | Comportamiento |
|---|---|
| `off` | No toca la estructura de la base. **Ojo:** el chequeo de fidelidad tampoco corre — `onApplicationBootstrap` retorna antes. |
| `dry-run` | Registra en log el DDL que aplicaría, sin ejecutarlo, y **sí** verifica fidelidad. Es el modo para auditar deriva. |
| `safe` | Aplica DDL **aditivo** en el arranque (nunca destructivo), con advisory lock. |

El default del **código** sigue siendo `safe` (`src/orm/config/orm.env.ts`), pero `.env`
y `.env.example` fijan **`off`** desde 2026-07-30 y no debe volver a `safe`: con `safe`
la aplicación crea en la base lo que el modelo no declara, que es la dirección de cambio
que el protocolo de las cuatro capas prohíbe.

## Riesgo residual

Sin una tabla `migrations` que registre qué se aplicó y cuándo, reproducir el esquema de
un punto en el tiempo depende del modelo y de los patches fechados, no de una
herramienta que lo garantice. Lo que sí está garantizado ahora es que **hay una sola
fuente**: `rebuild_stack.py` verifica la igualdad `tablas en la base == CREATE TABLE en
SQL/` y `FKs en la base == FKs en SQL/` en cada reconstrucción, y `yarn ddl:sources`
falla si aparece una segunda. `DATA-001` en la
[matriz de trazabilidad](../governance/traceability-matrix.md) se atiende por esa vía.

## Evidencia

`Mantra Core Health Context/docs/architecture/ddl-sources.md`,
`salud-db/check_ddl_sources.py`, `salud-db/rebuild_stack.py`, `SQL/patches/`,
`src/orm/bootstrap/schema-bootstrap.service.ts`, `src/orm/config/orm.env.ts`,
`package.json` (`orm:catalog`, `orm:audit`, `orm:schema:dump`, `ddl:sources`).
