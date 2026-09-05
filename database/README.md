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
| `docker-compose.yml` (desarrollo) | `../mantra-core-health-model/{SQL,NoSQL}` | Que quien edita el DDL vea el efecto sin copiar nada |
| `docker-compose.coolify.yml` (despliegue) | `./database/SQL`, `./database/NoSQL` | Que el servidor tenga el esquema con solo clonar el repo |

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
