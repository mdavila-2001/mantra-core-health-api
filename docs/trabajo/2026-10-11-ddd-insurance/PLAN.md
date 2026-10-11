# DDD insurance — plan de ejecución

Base: `origin/dev` (`594e64e5`). Rama: `justin/ddd-insurance-dev`.

## Objetivo

Reubicar el módulo `insurance` bajo el molde ADR-0026 (`presentation/`, `application/`, `domain/`, `infrastructure/`) preservando contratos HTTP/OpenAPI, consultas, transacciones, aislamiento por tenant y las 33 entidades ORM existentes. No modificar DDL, seeds ni modelo externo.

## Ambigüedades y supuestos

- El inventario no define una lista de operaciones ni puertos por servicio. Supuesto: preservar cada método/fachada pública y extraer reglas puras; crear puertos locales sólo para dependencias de otros contextos que siga usando el módulo.
- Las entidades/profile y pharmacy inventory participan en liquidación cruzada. No cambiar su semántica ni contratos; usar snapshots y adaptadores locales en `infrastructure/`.
- Cualquier cambio de respuesta, política de tenant, evento o límite transaccional queda fuera y requiere criterio del propietario.

## Inventario y baseline

- 20 controllers, 21 archivos de DTO, 13 repositorios, 32 entidades y 33 servicios de producción; 43 suites / 681 tests dirigidos.
- Referencias cruzadas detectadas: `profiles`, `directory`, `practice`, `pharmacy`, `pharmacy_inventory`, `messaging`, `community` y `terminology`.
- Baseline: módulo 43 suites / 681 tests; guard 1 suite / 5 tests. Ver `evidencia/baseline.txt`.

## H1 — `insurance` migrado al molde DDD

**CA:** El transporte queda en `presentation/`, persistencia/adaptadores en `infrastructure/`, orquestación en `application/`, y reglas puras en `domain/`; contratos y resultados observables se conservan.  
**DoD:** specs del módulo, guard de capas, typecheck, lint dirigido, regresión completa en `dev`, gates dirigidos sobre `test`, reporte y un PR por base, sin merge.

### H1.S1 — Discovery y baseline — HECHO

| ID | Microtarea | Verificación | Estado |
|---|---|---|---|
| S1.M1 | Inventariar archivos y dependencias cruzadas | `rg --files`, imports y nota de discovery | HECHO |
| S1.M2 | Medir módulo y guard antes del refactor | Salida literal en `evidencia/baseline.txt` | HECHO |

### H1.S2 — Presentación y dominio — EN CURSO

| ID | Microtarea | Verificación | Estado |
|---|---|---|---|
| S2.M1 | Mover controllers y specs a `presentation/controllers/`; DTOs a `presentation/dto/` | Módulo, typecheck, lint y diff sin errores (`evidencia/presentation.txt`) | HECHO |
| S2.M2 | Extraer conceptos, moneda, aritmética exacta y desglose puro de liquidación a `domain/` | Domain sin Nest, ORM, entidades ni servicios (`evidencia/domain.txt`) | HECHO |

### H1.S3 — Persistencia y puertos — TODO

| ID | Microtarea | Verificación | Estado |
|---|---|---|---|
| S3.M1 | Mover repositorios propios a `infrastructure/repositories/` | Consultas y firmas sin cambios; suite dirigida | HECHO |
| S3.M2 | Aislar dependencias de contexts externos con ports/adapters | Aplicación/dominio sin imports de otros módulos | A MEDIAS |

### H1.S4 — Aplicación y composición — TODO

| ID | Microtarea | Verificación | Estado |
|---|---|---|---|
| S4.M1 | Migrar servicios/fachadas de seguros por grupos funcionales, en orden de sus dependencias | Specs actuales preservadas, tests nuevos para reglas extraídas | EN CURSO |
| S4.M2 | Actualizar `InsuranceModule` y `InsurancePatientSettlementModule` | Providers resueltos y puertos cableados | TODO |
| S4.M3 | Agregar `insurance` a `MIGRATED_MODULES` y resolver violaciones | Guard del módulo y suite de arquitectura | TODO |

### H1.S5 — Regresión y entrega `dev`/`test` — TODO

| ID | Microtarea | Verificación | Estado |
|---|---|---|---|
| S5.M1 | Gates dirigidos y suite completa en `dev` | Salidas guardadas en `evidencia/dev.txt` | TODO |
| S5.M2 | Portar el commit a base fresca `test` y repetir gates dirigidos | Mismo diff funcional, resultados verdes | TODO |
| S5.M3 | Reporte y PR por base | PRs abiertos, `MERGEABLE`, checks revisados, sin merge | TODO |
