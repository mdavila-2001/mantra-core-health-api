# ADR-0016: Migraciones — DDL SQL plano fuera de MikroORM

## Estado
Aceptado, con riesgo residual documentado.

## Contexto
El modelo tiene 1184 entidades generadas por introspección (`yarn orm:gen`) — el DDL es la fuente
de verdad, las entidades TypeScript son un derivado, no al revés.

## Fuerzas y restricciones
- La regla del proyecto es "no editar entidades a mano; si algo no cuadra, corregir el DDL y
  regenerar" (`src/modules/README.md`) — el DDL manda.
- El DDL real vive en `database/SQL/99_migrations` (SQL plano), no en el sistema de migraciones
  de MikroORM.

## Opciones consideradas
Migraciones versionadas por el ORM (`mikro-orm migration:create`) vs. DDL SQL plano gestionado
aparte: el código usa la segunda opción.

## Decisión
El esquema de base de datos se gestiona con SQL plano en `database/SQL/99_migrations`, fuera del
sistema de migraciones de MikroORM. Las entidades se regeneran desde ese DDL con `yarn orm:gen`.

## Consecuencias positivas
- Control total y explícito del DDL, sin depender de que el generador de migraciones del ORM
  produzca el SQL óptimo para cada cambio.
- Coherente con la decisión de no modelar FK como relaciones ORM (ADR-0002) — el modelo de datos
  es, en esencia, gobernado fuera del ORM.

## Consecuencias negativas
- **Sin el historial de migraciones versionado que da el ORM**, reproducir el esquema exacto de
  un punto en el tiempo depende de disciplina externa sobre el SQL plano, no de una herramienta
  que lo garantice.
- Mayor riesgo de deriva entre entornos si el SQL no se aplica de forma idéntica en todos.

## Riesgos
`DATA-001` en la [matriz de trazabilidad](../governance/traceability-matrix.md) — clasificado
`HIGH`, abierto. Este ADR documenta la decisión, no resuelve el riesgo operativo que conlleva.

## Evidencia
`database/SQL/99_migrations/`, `src/modules/README.md`, `package.json` (`orm:gen`).

## Plan de revisión
Evaluar en Fase 11 (catálogo de datos) si se requiere adoptar migraciones versionadas por
herramienta para reducir el riesgo de deriva entre entornos.
