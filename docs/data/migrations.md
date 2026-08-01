# Migraciones

> Fase 11. Ver [ADR-0016](../adr/ADR-0016-migraciones-sql-plano.md) para la decisión completa y
> sus consecuencias.

## Cómo cambia el esquema realmente

**No hay migraciones versionadas gestionadas por MikroORM.** El DDL real vive como SQL plano en
`database/SQL/99_migrations`. El flujo real de cambio de esquema:

1. Modificar el DDL en `database/SQL/99_migrations` (o el origen que alimenta esa carpeta).
2. Aplicar el DDL a la base.
3. Regenerar el catálogo declarativo: `yarn orm:catalog` (índices y FK desde la bóveda de diseño).
4. Regenerar entidades MikroORM por introspección: `yarn orm:gen`.
5. Verificar fidelidad: `yarn orm:audit` contra `graphify-out/fidelity-audit.json`.

## `ORM_SCHEMA_SYNC` — lo que MikroORM sí controla en el arranque

No son migraciones versionadas, pero sí hay un control de sincronización en el arranque de la
aplicación (`src/orm/bootstrap/schema-bootstrap.service.ts`):

| Modo | Comportamiento |
|---|---|
| `off` | No toca la estructura de la base en el arranque. Modo esperado cuando manda un DBA externo, o en pruebas de integración/generación de documentación (para no mutar una base compartida). |
| `dry-run` | Solo registra en log el DDL que aplicaría, sin ejecutarlo. |
| `safe` | Aplica DDL **aditivo** en el arranque (nunca destructivo) — seguro incluso con varias réplicas gracias a un advisory lock. |

Default: `safe` (`src/orm/config/orm.env.ts`).

## Por qué no es un problema resuelto

Sin migraciones versionadas por herramienta, reproducir el esquema exacto de un punto en el
tiempo depende de disciplina externa sobre el SQL plano — no hay una tabla `migrations` que
registre qué se aplicó y cuándo, a diferencia de un flujo estándar de Rails/TypeORM/Prisma
Migrate. Riesgo clasificado `HIGH`, abierto (`DATA-001` en
[matriz de trazabilidad](../governance/traceability-matrix.md)).

## Evidencia

`database/SQL/99_migrations/`, `src/orm/bootstrap/schema-bootstrap.service.ts`,
`src/orm/config/orm.env.ts` (`ORM_SCHEMA_SYNC`), `package.json` (`orm:gen`, `orm:catalog`,
`orm:audit`, `orm:schema:dump`).
