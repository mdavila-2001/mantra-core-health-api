# database/ — Esquema y datos de REDESA

Todo lo relativo al **esquema de base de datos** vive aquí, autocontenido dentro del
repo para que funcione igual en Mac, Windows y Linux. `docker-compose.yml` (en la raíz
del repo) consume la salida generada de esta carpeta para inicializar las bases.

## Estructura

```
database/
├── salud-db/                       # Toolkit de generación (scripts Python + apply.ps1)
├── Mantra Core Health Context/
│   └── modules/                    # ← .puml canónicos (fuente de verdad). LOS PONES TÚ.
├── Mantra Core Health Vault/       # Vault Obsidian: notas FK que resuelven destinos (36 MB)
├── SQL/                            # GENERADO: DDL relacional + apply_all.sql / apply_deferred.sql
└── NoSQL/                          # GENERADO: mongo .js, opensearch .json, timescale/pgvector .sql
```

Los generadores calculan sus rutas como `REPO = <carpeta salud-db>.parent`, es decir
**esta** carpeta `database/`. Por eso `salud-db/`, `Mantra Core Health Context/`,
`Mantra Core Health Vault/`, `SQL/` y `NoSQL/` deben ser hermanas aquí dentro.

## Pipeline de generación

Requiere Python 3 (solo stdlib, sin `pip install`). Desde `database/salud-db/`:

```bash
python3 gen_ddl.py all       # SQL/<NN>_<schema>/{01_schema,02_tables,03_fk_intra,04_indexes,90_fk_deferred}.sql
python3 gen_apply.py         # SQL/apply_all.sql  (+ apply_deferred.sql, FK cross-schema)
python3 gen_nosql.py all     # NoSQL/<NN>_<modulo>_<motor>/  (55 mongo, 56 redis, 57 opensearch, 58 timescale, 59 pgvector)
python3 gen_entities.py all  # (opcional) entidades MikroORM TS para src/  — reutiliza el mismo parseo
```

`gen_ddl` necesita los `.puml` en `Mantra Core Health Context/modules/` y el vault en
`Mantra Core Health Vault/SALUD/FK/`. Sin los `.puml` no genera nada (temperatura-0:
no inventa esquema).

## Cómo lo usa docker-compose

`.env` apunta los servicios de init a la salida generada:

```
SQL_INIT_DIR=./database/SQL
NOSQL_INIT_DIR=./database/NoSQL
```

- `postgres-init` → aplica `SQL/apply_all.sql` → `SQL/apply_deferred.sql` + los stores PG
  de `NoSQL/58_*` (TimescaleDB) y `NoSQL/59_*` (pgvector). Idempotente.
- `mongo-init`    → `NoSQL/55_document_store_mongodb/`.
- `opensearch-init` → `NoSQL/57_search_platform_opensearch/*.mapping.json`.

## Seeds (datos de arranque)

`load_seeds.py` carga los seeds contra el stack ya levantado (Postgres/Mongo/Redis/OpenSearch).
Ver su cabecera para flags (`--skip-prod`, `--skip-mock`, `--only NN`).

## Qué se versiona y qué no

Ver `.gitignore` de la raíz. Se versiona la **salida generada** (`SQL/`, `NoSQL/`) —
es lo que necesita el arranque en cualquier máquina sin correr Python— y el toolkit y
los `.puml`. El **vault Obsidian** (36 MB, ~9k notas) queda fuera de git por peso: solo
hace falta para regenerar, no en runtime.
