# Runbook: Migración fallida

> Fase 14. Ver [migraciones](../../data/migrations.md) y
> [ADR-0016](../../adr/ADR-0016-migraciones-sql-plano.md) — sin migraciones versionadas por
> herramienta, este runbook es manual por naturaleza.

## Síntoma

DDL aplicado a los `.puml` del modelo canónico → `SQL/` (ver [ADR-0021](../../adr/ADR-0021-fuente-unica-de-ddl.md)) falla, o la aplicación falla al arrancar tras un
cambio de esquema (`SchemaBootstrapService` con `ORM_SCHEMA_SYNC=safe`/`dry-run` reporta error).

## Diagnóstico

1. Revisar el log de `SchemaBootstrapService` en el arranque — indica si el DDL aditivo falló.
2. Si `ORM_SCHEMA_SYNC=off`: el fallo no viene del arranque de la app, sino de aplicar el SQL
   manualmente — revisar el error del cliente `psql`/herramienta usada directamente.
3. Verificar si el fallo es por: sintaxis SQL inválida, conflicto con datos existentes (p. ej.
   `NOT NULL` sobre columna con filas nulas), o violación de una FK/constraint nueva contra datos
   ya presentes.

## Mitigación

- **No hay rollback automático** (sin migraciones versionadas, ver
  [rollback](../rollback.md) §"Rollback de esquema de base de datos — el problema real"). Escribir
  el DDL inverso manualmente si el cambio ya se aplicó parcialmente.
- Si falló antes de aplicarse (validación previa): corregir el DDL y reintentar.
- Regenerar el catálogo y las entidades después de cualquier corrección:
  `yarn orm:catalog && yarn orm:gen && yarn orm:audit`.

## Prevención

Probar todo cambio de DDL contra una copia de la base con datos reales (o un subconjunto
representativo) antes de aplicarlo contra staging/producción — no verificado como práctica
estándar en esta fase.

## Escalación

`DATA_PLATFORM_ADMIN`/`DBA` externo si aplica (ver `src/orm/README.md`: *"modo esperado cuando
manda un DBA"*).
