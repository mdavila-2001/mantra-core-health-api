# Estrategia de pruebas

> Fase 15. Basado en las capas reales ejecutadas durante esta auditoría (Fase 0 y Fase 15), no en
> una estrategia aspiracional.

## Capas reales

| Capa | Config | Qué prueba | Infraestructura requerida |
|---|---|---|---|
| Unitarias | `package.json` (`yarn test`) | Lógica de servicios/controllers con dependencias simuladas | Ninguna |
| Integración | `test/jest-integration.json` (`yarn test:integration`) | Comportamiento real contra PostgreSQL (Testcontainers/contenedor local), incluida concurrencia, RLS, constraints reales | Postgres real |
| Smoke | `test/jest-smoke.json` (`yarn smoke`) | Registro de humo sobre módulos reales — `test/smoke/registry.ts` es un nodo de alta centralidad del grafo (51 aristas, ver [graphify-audit.md](../reports/graphify-audit.md)) | Postgres real (mismo patrón que integración) |
| E2E | `test/jest-e2e.json` (`yarn test:e2e`) | `test/app.e2e-spec.ts` — un solo archivo, arranque completo de la app | Completa |

## Resultados de esta auditoría (2026-07-29, commit `15c132d3`)

| Capa | Resultado |
|---|---|
| Unitarias | 370 suites, 3732 tests, **100% verde** (ver [línea base](../reports/baseline.md) §5) |
| Integración | **13/14 suites, 90/95 tests pasan; 1 suite y 5 tests `skip` deliberado** — `rls.int-spec.ts`, opt-in vía `RLS_TEST=1` porque muta esquema de forma irreversible (ver [aislamiento de tenant](../security/tenant-isolation.md)) |
| Smoke | No ejecutada en esta fase |
| E2E | No ejecutada en esta fase |

## Por qué la prueba de RLS es opt-in y no corrió por defecto

`test/integration/rls.int-spec.ts` aplica `database/SQL/99_rls/01_tenant_rls.sql` (crea un rol de
base de datos, fuerza RLS en ~284 tablas reales) — una mutación de esquema **irreversible** contra
la base de integración. Ejecutarla es una decisión operativa deliberada (`RLS_TEST=1 yarn
test:integration`), no algo que deba correr por accidente en cada CI run sin que el equipo decida
conscientemente aplicar RLS en ese entorno. Ver [aislamiento de tenant](../security/tenant-isolation.md)
para el detalle completo de lo que esta prueba demuestra cuando corre.

## Pruebas de contrato

**No se identificó una capa de pruebas de contrato dedicada** (p. ej. verificación automática de
que la respuesta real de cada endpoint cumple el schema de `openapi/openapi.yaml`). Ver
[pruebas de contrato](contract-tests.md).

## Pruebas de rendimiento

**No identificadas** en el repositorio. Ver [pruebas de rendimiento](performance-tests.md).

## Ver también

- [Pruebas unitarias](unit-tests.md), [Pruebas de integración](integration-tests.md),
  [Pruebas E2E](e2e-tests.md), [Datos de prueba](test-data.md).
