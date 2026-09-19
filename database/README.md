# `database/` — el DDL, versionado

Copia versionada del modelo de datos canónico. **No se edita aquí.**

## Por qué existe

El esquema se genera y se edita en **`mantra-core-health-model`**, un
repositorio propio que se clona como hermano de éste (commit `19ef5a17`, que
cerró el bloqueante B-2). Que tenga repositorio propio arregla el versionado
del modelo; **no** arregla el despliegue, porque Coolify —o CI, o cualquier
VPS— clona **este** repositorio y nada más.

Sin esta copia, `postgres-init` arranca con `/init/SQL` vacío, la base queda sin
una sola tabla y la aplicación responde 500 en la primera escritura. El
`.gitignore` de este repositorio ya lo dejaba escrito hace tiempo («SÍ se
versiona»); lo que faltaba era la carpeta.

## Quién monta qué

| Compose | Monta | Para qué |
|---|---|---|
| `docker-compose.yml` (desarrollo) | `./database/{SQL,NoSQL}` por defecto | Que levantar el perfil `local-db` funcione con solo clonar este repo |
| `docker-compose.coolify.yml` (despliegue) | `./database/SQL`, `./database/NoSQL` | Que el servidor tenga el esquema con solo clonar el repo |

### Editar el modelo y verlo en el contenedor

Para que `docker-compose.yml` aplique el modelo en caliente (sin pasar por
`yarn db:vendor` en cada cambio), exportar `SQL_MODEL_DIR`/`NOSQL_MODEL_DIR`
apuntando al repositorio hermano antes de levantar el perfil `local-db`:

```bash
export SQL_MODEL_DIR=../mantra-core-health-model/SQL
export NOSQL_MODEL_DIR=../mantra-core-health-model/NoSQL
docker compose --profile local-db up -d postgres postgres-init mongodb mongo-init opensearch opensearch-init
```

En Windows, la alternativa (`yarn db:vendor`) necesita `rsync` en WSL — no
corre en PowerShell ni en Git Bash a secas.

## Verificar una base limpia

`yarn db:verify-clean-init` levanta un proyecto compose efímero, aplica el DDL
por defecto, corre los seeds y revisa la fidelidad del ORM contra el esquema
resultante. Declara como heredadas las diferencias de `pharma_lab` y
`polyglot_storage` (ver más abajo) y falla ante cualquier otra.

## Cómo se mantiene al día

```bash
yarn db:vendor         # copia el modelo a database/
yarn db:vendor:check   # falla si difieren — para CI y antes de desplegar
```

El `--delete` de la sincronización es deliberado: un archivo retirado del
modelo tiene que desaparecer también de la copia, o un despliegue aplicaría DDL
que el modelo ya no declara.

## Lo que esta carpeta NO resuelve

`database/SQL` reproduce el DDL canónico, y el DDL canónico **no cubre todo el
modelo**. Medido contra una base recién construida desde aquí (02/09/2026): 71
diferencias con las entidades de MikroORM — 45 tablas ausentes (`pharma_lab`
entero entre ellas: es B-8 de `REGISTRO-DEFECTOS.md`, todavía abierto), 2
columnas, y 24 columnas que la base exige NOT NULL mientras la entidad las
declara opcionales.

Las lecturas no se enteran, porque MikroORM proyecta `select "p0".*`. **Las
altas sí**, porque un INSERT nombra cada columna: es el origen del
`column "…" of relation "…" does not exist` que reventaba el alta de paciente.

Por eso el despliegue tiene un paso propio, `api-migrate`, que corre `seed-cli`
con `ORM_SCHEMA_SYNC=safe` y cierra el hueco de forma aditiva antes de que la
API acepte tráfico. Es un parche de despliegue, no el arreglo: el arreglo es
promover esos módulos por el camino canónico (`.puml` → `gen_ddl.py` → `SQL/`).
