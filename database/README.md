# `database/` — el DDL, versionado

Copia versionada del modelo de datos canónico. **No se edita aquí.**

## Por qué existe

El esquema se genera y se edita en `~/…/alovida/SQL` y `~/…/alovida/NoSQL`,
carpetas **hermanas** de este repositorio que no están bajo git. Eso funciona
mientras todo el mundo trabaja en la misma máquina, y se rompe en el momento en
que alguien despliega: Coolify —o CI, o cualquier VPS— clona **este**
repositorio y nada más.

Sin esta copia, `postgres-init` arranca con `/init/SQL` vacío, la base queda sin
una sola tabla y la aplicación responde 500 en la primera escritura. El
`.gitignore` de este repositorio ya lo dejaba escrito hace tiempo («SÍ se
versiona»); lo que faltaba era la carpeta.

## Quién monta qué

| Compose | Monta | Para qué |
|---|---|---|
| `docker-compose.yml` (desarrollo) | `../SQL`, `../NoSQL` | Que quien edita el DDL vea el efecto sin copiar nada |
| `docker-compose.coolify.yml` (despliegue) | `./database/SQL`, `./database/NoSQL` | Que el servidor tenga el esquema con solo clonar el repo |

## Cómo se mantiene al día

```bash
yarn db:vendor         # copia ../SQL y ../NoSQL a database/
yarn db:vendor:check   # falla si difieren — para CI y antes de desplegar
```

El `--delete` de la sincronización es deliberado: un archivo retirado del
modelo tiene que desaparecer también de la copia, o un despliegue aplicaría DDL
que el modelo ya no declara.

## Lo que esta carpeta NO resuelve

`database/SQL` reproduce el DDL canónico, y el DDL canónico **no cubre todo el
modelo**. Medido contra una base recién construida desde aquí: 130 diferencias
con las entidades de MikroORM (82 tablas ausentes —`pharma_lab`, `surveys` y
`audio_assets` enteros—, 22 columnas y 26 divergencias de obligatoriedad; ver
`REGISTRO-DEFECTOS.md`, B-7 y B-8).

Las lecturas no se enteran, porque MikroORM proyecta `select "p0".*`. **Las
altas sí**, porque un INSERT nombra cada columna: es el origen del
`column "…" of relation "…" does not exist` que reventaba el alta de paciente.

Por eso el despliegue tiene un paso propio, `api-migrate`, que corre `seed-cli`
con `ORM_SCHEMA_SYNC=safe` y cierra el hueco de forma aditiva antes de que la
API acepte tráfico. Es un parche de despliegue, no el arreglo: el arreglo es
promover esos módulos por el camino canónico (`.puml` → `gen_ddl.py` → `SQL/`).
