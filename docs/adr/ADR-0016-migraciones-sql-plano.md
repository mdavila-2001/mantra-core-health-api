# ADR-0016: Migraciones — DDL SQL plano fuera de MikroORM

## Estado

**Superado por [ADR-0021](ADR-0021-fuente-unica-de-ddl.md) (2026-08-05).**

La decisión de gestionar el esquema con SQL plano fuera de MikroORM **sigue vigente**.
Lo que queda superado es *dónde* vive ese SQL: `database/SQL/99_migrations` ya no
existe. El esquema se declara en los `.puml` del modelo canónico y se materializa en
`SQL/`, en la raíz del workspace.

El riesgo que este ADR documentaba como residual —«mayor riesgo de deriva entre
entornos si el SQL no se aplica de forma idéntica en todos»— **se materializó dos
veces**, en v4.0.8 y v4.0.9. El detalle y la política que lo reemplaza están en
`Mantra Core Health Context/docs/architecture/ddl-sources.md`.

## Contexto (histórico)

El modelo tiene ~1 184 entidades y el DDL es la fuente de verdad; las entidades
TypeScript son un derivado, no al revés. Eso no cambió.

## Decisión (histórica)

El esquema se gestionaba con SQL plano en `database/SQL/99_migrations`, fuera del
sistema de migraciones de MikroORM.

## Por qué se superó

`database/SQL/99_migrations` era una **segunda** fuente de DDL, paralela al `SQL/`
canónico de la raíz, sin nada que contrastara una contra otra. En la práctica:

- **Nadie la aplicaba.** `docker/db-init/init-postgres.sh` recorre lo que monta el
  compose, y el compose monta `../SQL`. Las 11 migraciones acumuladas nunca corrieron
  en un arranque limpio.
- El efecto se consumó en v4.0.9: `iam.email_verifications` no existía en base limpia
  y los 27 casos de registro del smoke respondían 500.
- El `database/README.md` afirmaba, además, que la fuente autoritativa era el
  bootstrap del ORM con `ORM_SCHEMA_SYNC=safe` — es decir, la aplicación creando en la
  base lo que el modelo no declara, que es la dirección de cambio que el protocolo de
  las cuatro capas prohíbe.

## Qué hacer ahora

Ver [ADR-0021](ADR-0021-fuente-unica-de-ddl.md) y
`Mantra Core Health Context/docs/architecture/ddl-sources.md`. En resumen: el cambio
de esquema empieza en el `.puml` y baja por `gen_ddl.py`; los ALTERs sobre bases ya
pobladas y el DDL que no se deriva del modelo viven en `SQL/patches/`, fuera de
`apply_all.sql`.

## Riesgos

`DATA-001` en la [matriz de trazabilidad](../governance/traceability-matrix.md) se
atiende ahora con el chequeo `salud-db/check_ddl_sources.py` (`yarn ddl:sources`), que
falla si reaparece una segunda fuente de DDL.
