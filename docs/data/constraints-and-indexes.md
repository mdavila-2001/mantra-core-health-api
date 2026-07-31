# Restricciones e índices

> Fase 11. Fuente: `src/orm/catalog/indexes/` (generado desde la bóveda SALUD por `yarn orm:catalog`).
> **No están declarados en las entidades MikroORM** — decisión explícita para mantener las
> entidades como espejo fiel de columnas, con índices/constraints gestionados aparte
> ([ADR-0002](../adr/ADR-0002-orm-mikroorm.md)).

## Volumen real

| Métrica | Valor |
|---|---:|
| Total de entradas de índice declaradas | **8581** |
| De las cuales, restricciones `UNIQUE` | **1498** |
| Entidades cubiertas | 1184 (todas) |

## Tipos de índice usados

Según el formato declarado en la bóveda (`PK`, `IX`, `UK`, `FT`, `GIN`, `GIST`):

| Tipo | Significado | Cuándo se usa en este modelo |
|---|---|---|
| `PK` | Clave primaria | Toda tabla — `id : uuid <<PK>>` es el patrón universal observado en el catálogo. |
| `IX` | Índice B-tree estándar | Filtros y ordenamientos comunes (por `tenant_id`, `created_at`, FKs de alto uso). |
| `UK` | Restricción de unicidad de negocio | P. ej. un código de concepto único por catálogo, un email único por tenant. |
| `GIN` | Índice invertido genérico | Columnas `jsonb` (p. ej. `condition_json` en `authz.access_policies`) y búsqueda de texto. |
| `GIST`/`hnsw`/`ivfflat` | Índices especializados | Rangos, similitud vectorial (pgvector) en `vector_rag`. |

## Por qué UNIQUE es una restricción de negocio, no solo de acceso

Documentado explícitamente en `src/orm/catalog/catalog.types.ts`: una entrada `unique: true` en
el catálogo de índices "emite `UNIQUE INDEX` (restricción de negocio, no solo acceso)" — es decir,
las 1498 restricciones de unicidad codifican invariantes de negocio reales (p. ej. "no puede haber
dos citas confirmadas para el mismo slot"), no solo una optimización de consulta.

## Índices descendentes preservados

El catálogo conserva explícitamente el orden de columna en índices compuestos, incluida la
dirección (`DESC`) cuando aplica — relevante para patrones `ORDER BY ... DESC LIMIT` frecuentes en
listados paginados (ver [convenciones de API](../api/conventions.md) §"Paginación").

## Ver también

- [Catálogo de entidades](entity-catalog.md) — columna "Bloqueo optimista" por tabla.
- [Relaciones entre entidades](relationships.md) — las FK que estos índices soportan.
- `src/orm/catalog/README.md` para el detalle exacto del formato de tupla `IndexTuple`.
