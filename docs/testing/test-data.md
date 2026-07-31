# Datos de prueba

> Fase 15. Derivado de los harnesses reales de prueba.

## Seed compartido de pruebas de integración

`test/integration/harness.ts` — `bootstrapTestApp()` arranca la aplicación real contra la base de
integración; `seedAdmin()` materializa un usuario administrador determinista para autenticar el
resto de las pruebas (ver [Surprising Connections](../reports/graphify-audit.md) §7 — es de los
nodos con más conexiones inferidas del grafo).

## Seed de producción reusado en pruebas

El seed de terminología (`TerminologySeedService`, ver
[ADR-0017](../adr/ADR-0017-seeds-idempotentes-arranque.md)) corre igual en pruebas de integración
que en producción — no hay un seed "de prueba" separado y divergente del real, lo cual reduce el
riesgo de que una prueba pase contra datos que no reflejan el arranque real.

## Registro de smoke — `test/smoke/registry.ts`

Nodo de alta centralidad en el grafo (51 aristas) — sugiere un registro compartido usado por
múltiples specs de humo por módulo (`test/smoke/modules/`). No se detalla su estructura interna en
esta fase.

## Datos sintéticos vs. reales

Las pruebas de integración de terminología (`hcpcs`, `icd10cm`, `loinc`, `ndc`, `nucc`,
`rxnorm-full`, `rxterms`, `vademecum`) importan catálogos clínicos reales o representativos, no
datos sintéticos triviales — coherente con la importancia de la terminología gobernada en este
modelo (ver [reglas de negocio](../business/business-rules.md) §4).

## Aislamiento entre corridas

`RLS_TEST=1` (ver [aislamiento de tenant](../security/tenant-isolation.md)) usa dos tenants
sintéticos fijos (`TENANT_A`/`TENANT_B`, UUIDs deterministas) sobre una tabla-sonda dedicada
(`public.rls_probe`), no sobre tablas de negocio reales — evita contaminar datos de producción o
de otras pruebas con las mutaciones de esa prueba específica.

## Ver también

- [Estrategia de pruebas](strategy.md), [Seeds](../data/seeds.md).
