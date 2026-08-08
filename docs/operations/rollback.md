# Rollback

> Fase 14. Sin procedimiento de rollback automatizado identificado en el repositorio — esta página
> documenta el procedimiento manual real posible con las herramientas existentes, y sus límites.

## Rollback de código (imagen de aplicación)

Dado que `api` y los 20 workers comparten una sola imagen (ver [despliegue](deployment.md)), un
rollback de código es, en principio, volver a desplegar la imagen anterior:

```bash
git checkout <commit-anterior>
docker compose build
docker compose up -d
```

No hay versionado de imágenes en un registro (no se identificó push a un container registry en el
repositorio) — el rollback depende de reconstruir desde una revisión anterior de git, no de
apuntar a un tag de imagen previamente publicado. Esto es más lento y más propenso a error que un
rollback basado en tags inmutables.

## Rollback de esquema de base de datos — el problema real

Ver [migraciones](../data/migrations.md) y [ADR-0016](../adr/ADR-0016-migraciones-sql-plano.md):
**sin migraciones versionadas por herramienta, no hay un "deshacer la última migración"
automático.** Revertir un cambio de esquema aplicado como SQL plano requiere escribir el DDL
inverso a mano y aplicarlo — no hay garantía de que sea trivial si el cambio incluyó
transformación de datos.

**Esto es el riesgo operativo más serio de este documento de rollback**: un rollback de código
que no revierte el esquema puede dejar la aplicación anterior corriendo contra una base con un
esquema más nuevo, incompatible.

## Qué falta para un rollback confiable

1. Publicar imágenes versionadas a un registro, no reconstruir desde git en cada rollback.
2. Adoptar migraciones versionadas con `down` explícito (ver
   [ADR-0016](../adr/ADR-0016-migraciones-sql-plano.md) §"Plan de revisión"), o al menos
   mantener el DDL inverso junto a cada cambio de esquema en los `.puml` del modelo canónico → `SQL/` (ver [ADR-0021](../adr/ADR-0021-fuente-unica-de-ddl.md)).
3. Practicar (no solo documentar) un rollback real antes de depender de este procedimiento en un
   incidente.

## Ver también

- [Despliegue](deployment.md), [Migraciones](../data/migrations.md).
