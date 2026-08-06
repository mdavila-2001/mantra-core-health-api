# ADR-0021: El esquema se declara en el modelo canónico, no en este repositorio

## Estado
Aceptado (2026-08-05, v4.0.9). Supera a
[ADR-0016](ADR-0016-migraciones-sql-plano.md) en cuanto a *dónde* vive el DDL.

## Contexto

[ADR-0016](ADR-0016-migraciones-sql-plano.md) decidió gestionar el esquema con SQL
plano fuera de MikroORM, y lo ubicó en `database/SQL/99_migrations` dentro de este
repositorio. En paralelo existe el modelo canónico del workspace: 64 diagramas
`.puml` de los que `gen_ddl.py` deriva `SQL/`, que es lo que el `docker-compose.yml`
monta en `postgres-init`.

Eran dos fuentes de DDL sin nada que las contrastara, y esa ambigüedad se cobró dos
incidentes:

- **v4.0.8 (2026-07-30)** — un merge de `dev` trajo `database/` con seis migraciones
  sueltas. Se promovieron al modelo y se eliminó el directorio.
- **v4.0.9 (2026-08-05)** — otro merge lo devolvió, con los montajes del compose
  apuntando de nuevo a esa copia, y encima se escribieron cinco migraciones más. Esta
  vez el daño se consumó: **`iam.email_verifications` no existía en base limpia y los
  27 casos de registro del smoke respondían 500**.

El detalle importante es que **nadie aplicaba `99_migrations`**. `docker/db-init/
init-postgres.sh` recorre lo que le monta el compose, y el compose monta `../SQL`. Las
once migraciones acumuladas solo habían corrido a mano contra bases de desarrollo, así
que cada arranque limpio producía un esquema distinto del que el código daba por hecho.

## Decisión

**El esquema PostgreSQL se declara en los `.puml` del modelo canónico y se materializa
en `SQL/` y `NoSQL/`, en la raíz del workspace. Este repositorio es un consumidor del
esquema, no un declarante:** no contiene DDL, ni copias del toolkit, ni una carpeta de
migraciones propia. `database/` se eliminó.

El DDL que legítimamente no se deriva de los `.puml` —la política de RLS, los seeds de
desarrollo— y los ALTER sobre bases ya pobladas viven en `SQL/patches/`, fuera de
`apply_all.sql`.

La política completa, con la tabla de qué va dónde y el recorrido para agregar una
tabla, está en `Mantra Core Health Context/docs/architecture/ddl-sources.md` (espejo en
el vault: `SALUD/Arquitectura/fuentes-de-ddl.md`).

## Consecuencias positivas

- Una sola respuesta a «¿qué tablas tiene el sistema?», y es la misma que materializa
  un arranque limpio.
- El cambio de esquema pasa por el modelo, de modo que el vault, el DDL, la base y las
  entidades del ORM se mantienen contrastables entre sí (protocolo de las cuatro capas).
- Desaparece el vector de deriva que documentaba el `database/README.md`: la aplicación
  creando por su cuenta, con `ORM_SCHEMA_SYNC=safe`, lo que el modelo no declara.

## Consecuencias negativas

- Este repositorio **deja de ser autocontenido**: para reconstruir la base hace falta
  el workspace completo, no solo el backend. Es el precio de no tener dos verdades.
- Agregar una tabla cuesta más pasos que escribir un `CREATE TABLE`. Ese costo es
  deliberado: el atajo es más rápido hoy y más caro el día del arranque limpio.

## Cumplimiento

`salud-db/check_ddl_sources.py` (o `yarn ddl:sources`) falla con código 1 si reaparece
`database/SQL`, si el compose vuelve a montar `./database/...` en un servicio de init,
o si aparece un `.sql` con `CREATE TABLE` fuera de `SQL/` y `NoSQL/`. Corre como paso
0/4 de `rebuild_stack.py`, antes del `down -v`.

No hay CI en este repositorio (no existe `.github/`), así que el chequeo no bloquea
ningún pipeline: vale por estar en el camino que se ejecuta de verdad.

## Riesgos

`DATA-001` en la [matriz de trazabilidad](../governance/traceability-matrix.md) queda
atendido por ese chequeo. El riesgo residual es humano: alguien puede ignorar un fallo
del script, y un merge puede volver a traer `database/` una tercera vez. La diferencia
con antes es que ahora se ve.

## Evidencia

`Mantra Core Health Context/docs/architecture/ddl-sources.md`,
`salud-db/check_ddl_sources.py`, `SQL/patches/`, veredicto PASS de
`salud-db/rebuild_stack.py` con 1 180 tablas · 6 661 FKs · 9 107 índices.
