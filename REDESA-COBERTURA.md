# Informe de cobertura REDESA (estático)

- Entidades (tablas mapeadas): **1184**
- Endpoints declarados: **852** en 191 controllers
- Módulos: **57**

## ORPHAN_TABLE — entidades sin consumidor fuera de `entities/` (0)
> Heurística estática: la entidad puede consumirse por catálogo ORM/migración; revisar antes de eliminar.

## ORPHAN_ENDPOINT — mutantes sin @Roles ni @Public (0)

## DIRECT_CROSS_DOMAIN_ACCESS — repos que importan entidades de otro dominio (1)
- src/modules/billing/repositories/practices-lookup.repository.ts → `practice`
