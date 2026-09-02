# Reporte de generación SQL — SALUD v4.0.1

Generado fielmente desde los `.puml`. Solo se emiten tablas PostgreSQL; las vistas, stubs de cruce y stores no-SQL (Redis/Mongo/OpenSearch/vector/timeseries) se listan como *saltados*. Graph (61) y Lakehouse (63) SÍ se materializan como tablas PG (catálogo del plano de control). Las FK marcadas *inferidas* se resolvieron por convención cuando el vault no tenía destino.

| Mód | Schema | Tablas PG | FK | (inferidas) | Índices | Saltadas |
|-----|--------|-----------|----|-------------|---------|----------|
| 05 | profiles | 19 | 100 | 100 | 130 | 0 |
| **Σ** | **64** | **19** | | **100** | | **0** |

## Detalle de entidades saltadas y avisos

### 05 · profiles
- ⚠ índice 'uq_person_account_links_active_user': predicado referencia función(es) placeholder del modelo → emitido COMENTADO (definir función o reemplazar por IDs).
