# Pruebas de integración

> Fase 15. `yarn test:integration` — ejecutada realmente durante esta auditoría contra PostgreSQL
> local (contenedores de `docker-compose.yml` arriba).

## Resultado real (2026-07-29)

```
Test Suites: 1 skipped, 13 passed, 13 of 14 total
Tests:       5 skipped, 90 passed, 95 total
Time:        42.747 s
```

La única suite/tests omitidos son los 5 de `rls.int-spec.ts` (opt-in, ver
[estrategia](strategy.md) §"Por qué la prueba de RLS es opt-in").

## Qué cubren las 13 suites reales

| Archivo | Área |
|---|---|
| `audit-worm.int-spec.ts` | Protección WORM del log de auditoría |
| `common.int-spec.ts` | Módulo `common` |
| `hcpcs.int-spec.ts`, `icd10cm.int-spec.ts`, `loinc.int-spec.ts`, `ndc.int-spec.ts`, `nucc.int-spec.ts`, `rxnorm-full.int-spec.ts`, `rxterms.int-spec.ts`, `vademecum.int-spec.ts` | Importadores de terminología clínica real (8 de 13 archivos — la mayoría de la suite de integración es verificar catálogos de terminología reales) |
| `iam.int-spec.ts` | Identidad y acceso |
| `seed.int-spec.ts` | El seed idempotente (ver [ADR-0017](../adr/ADR-0017-seeds-idempotentes-arranque.md)) |
| `terminology.int-spec.ts` | Módulo `terminology` en general |
| `rls.int-spec.ts` | **Omitida por defecto** — RLS por tenant, ver [aislamiento de tenant](../security/tenant-isolation.md) |

## Por qué requiere base real

`ORM_SCHEMA_SYNC=off RATE_LIMIT_DISABLED=true` (`package.json`) — corre contra un Postgres real
(Testcontainers o el contenedor de `docker-compose.yml`), sin sincronizar esquema (asume que ya
existe), y sin limitación de tasa que interfiera con el volumen de requests de una prueba.

## `harness.ts` — arranque compartido

`test/integration/harness.ts` (`bootstrapTestApp()`, `seedAdmin()`) es el punto de entrada común
de las 14 suites — aparece en "Surprising Connections" del grafo de dependencias
([graphify-audit.md](../reports/graphify-audit.md) §7) por su alta conectividad hacia
`AppModule`/`TokenService`/entidades de `iam`.

## Ver también

- [Estrategia de pruebas](strategy.md), [Aislamiento de tenant](../security/tenant-isolation.md).
