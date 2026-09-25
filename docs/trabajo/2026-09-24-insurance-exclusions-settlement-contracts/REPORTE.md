# Reporte — Transparencia de exclusiones, desglose de liquidación y contrato de lotes aseguradora–profesional (Tarea 3 · H8 / MED-E13..E16)

> **AVANCE: 3 / 25 — 12,0 %.** (microtareas `HECHO` sobre el total del `PLAN.md`; H1.S1.M1, H1.S1.M2 y la aceleración funcional de H2 quedan documentados abajo).

- Fecha: 2026-09-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `mantra-core-health-api@marcelo/feat-insurance-exclusions-settlement-contracts-api` (worktree aislado, `origin/dev` en `6e672bcd` al crearla). Sin rama de trabajo en `mantra-core-health` (ver «No cubierto»).
- Peldaño de evidencia alcanzado: `TESTED` en H2 (salida de `yarn test`/`yarn typecheck`/`yarn lint` pegada abajo); `WRITTEN` en H1 (documento en disco, sin revisión de sus propietarios todavía).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Contrato canónico `docs/contracts/insurer-practitioner-settlement-batches.md`: 12 secciones (propósito/trazabilidad, actores, vocabulario de importes, exclusiones formales, ciclo y estados, inmutabilidad, elegibilidad del lote, calendario, idempotencia/unicidad, reversión/cancelación, contención financiera, endpoints/DTOs/resolución H8), con las ambigüedades A0–A7 registradas explícitamente | `grep -c '^## ' docs/contracts/insurer-practitioner-settlement-batches.md` | `12` |
| H1.S1.M2 | Sección «Liquidación al profesional (H8)» en `src/modules/insurance/README.md`, enlazando el contrato y describiendo `settlement`/`eob` de `GET /insurance-claims/:id` | `grep -c 'insurer-practitioner-settlement-batches' src/modules/insurance/README.md` | `1` |
| H2 (fuera de plan original, ver Desvíos) | `buildClaimSettlementBreakdown` (función pura) conciliando `totalBilled = totalApproved + totalPatient + totalDenied` con `sumarDecimales`/`mismosDecimales`; degrada a `UNDER_REVIEW` ante reversión, exclusión sin cláusula, línea huérfana o descuadre. `ClaimDetailDto.settlement`/`.eob` cableados en `GET /insurance-claims/:id` vía `ClaimsReadService.getClaim`, con `ClaimReadRepository.findEobsByVersionIds` nuevo | `corepack yarn test src/modules/insurance` | `Test Suites: 24 passed, 24 total` · `Tests: 347 passed, 347 total` |
| H2 (typecheck) | Sin errores de tipos tras el cableado | `corepack yarn typecheck` | exit `0` |
| H2 (lint) | Sin errores de lint/prettier en los 6 archivos tocados, tras `--fix` | `corepack yarn eslint <6 archivos>` | exit `0` |

## A medias

Ninguna microtarea del plan quedó a medias: lo que se ejecutó (H1.S1.M1, y el núcleo de H2) se terminó con su DoD demostrado. Lo que no se empezó está en Pendiente, no acá.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M3 — spec de inmutabilidad explícita (`claims-immutability.spec.ts`) y afirmación de ausencia de PUT/PATCH/DELETE | TODO | Nada la bloquea; no se llegó por presupuesto de la sesión |
| H2.S1.M4 — int-spec del 409 contra Postgres real | BLOQUEADO | Requiere el Postgres aislado `mantra-copays-pg` (127.0.0.1:55434) que `test/support/copays-isolated-env.cjs` exige; no se levantó en esta sesión. El 409 de `publishEob` está afirmado sólo por el código existente (`claims.service.ts:506-509`), no por un test nuevo de este carril |
| H3 completo — lote periódico de liquidación al profesional (conceptos, dominio puro `practitioner-settlement-batch.ts`, servicio, repositorio, controlador, DTOs, regeneración de OpenAPI/Postman) | TODO | Es el subsistema más grande del carril (CA-3.2); no se empezó por presupuesto de la sesión. El contrato (H1) ya especifica su diseño completo |
| H4 completo — front: tipos, `insurance-claim-detail`, molécula `patient-insurance-settlement`, maqueta, `core/money/decimal-strings` | TODO | Sin código de front tocado en esta sesión. El worktree `C:/wt/front-exclusions` está creado, con dependencias instaladas (`yarn install --immutable` verde) y el `PLAN.md` copiado, listo para continuar |
| H5 — E2E Playwright y doble revisión | TODO | Depende de H4 |
| H6 — gates finales, PRs mergeables (ambos repos) y reporte | A MEDIAS | Este PR (API) se abre con lo hecho hasta acá, marcado explícitamente `A MEDIAS`. No se abre PR en `mantra-core-health` porque no hay ningún cambio de código ahí que ofrecer: sólo se copió el `PLAN.md` al worktree, sin diff funcional |

## Evidencia

```text
$ corepack yarn typecheck
(sin salida; exit 0)

$ corepack yarn test src/modules/insurance
Test Suites: 24 passed, 24 total
Tests:       347 passed, 347 total
Snapshots:   0 total
Time:        22.117 s

$ corepack yarn test src/modules/insurance/services/claim-settlement-breakdown.spec.ts
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total

$ corepack yarn eslint src/modules/insurance/services/claim-settlement-breakdown.ts \
    src/modules/insurance/services/claim-settlement-breakdown.spec.ts \
    src/modules/insurance/services/claims-read.service.ts \
    src/modules/insurance/services/claims-read.service.spec.ts \
    src/modules/insurance/repositories/claim-read.repository.ts \
    src/modules/insurance/dto/claims-read.dto.ts
(sin salida; exit 0, tras un --fix previo que corrigió 7 errores de formato prettier)

$ grep -c '^## ' docs/contracts/insurer-practitioner-settlement-batches.md
12
```

## No cubierto

- **CA-3.4 contra Postgres real**: el 409 de re-publicación y la ausencia de rutas mutables están garantizados por el código existente y por el spec de controladores heredado (que ya afirma sólo `POST` en `ClaimsController`), pero **no** se agregó el `int-spec` HTTP nuevo que H2.S1.M4 pedía. Comando pendiente: `yarn test:integration --testPathPatterns=patient-coverage-copays` contra `mantra-copays-pg`.
- **Toda la Tarea 3 en el frontend** (H4): nada del detalle del reclamo ni de la tarjeta de liquidación del paciente se tocó. El desglose que hoy expone la API (`settlement`/`eob`) no tiene todavía pantalla que lo consuma.
- **CA-3.2 (lote periódico)** completo: sin código de dominio, servicio, controlador, DTOs ni tests. El contrato (H1) especifica el diseño exacto para retomarlo sin arqueología.
- **CA en navegador (E2E)**: sin Playwright ejecutado en este carril.
- **Regresión visual y doble revisión** (regla 35): no aplica todavía porque no hay pantalla nueva.

## Desvíos del plan

- El `PLAN.md` original no desglosaba H2 en una única microtarea "todo o nada": describía tres (`H2.S1.M1` función pura, `H2.S1.M2` cableado en el detalle, `H2.S1.M3` spec de inmutabilidad, `H2.S1.M4` int-spec). Se ejecutaron `M1` y `M2` completos con evidencia; `M3` y `M4` quedan en Pendiente tal como estaban previstos, sin fusionarlos por conveniencia con lo ya hecho.
- El primer intento del test nuevo `getClaim` con `settlement.availability = 'AVAILABLE'` falló porque el fixture de reclamo (`reclamo()`) trae un `totalAmount` de otro caso (`'1615.125'`) que no coincidía con la suma de las líneas del caso nuevo (`'300.00'`). Se corrigió el fixture del test, no la función de dominio: la función exige correctamente que `claim.totalAmount` cuadre contra la suma de líneas, y ese fue justamente el comportamiento que atrapó el error en el test antes de llegar a producción.

## Riesgos residuales

- El desglose de liquidación (`settlement`) ya viaja en el contrato HTTP de `GET /insurance-claims/:id`, pero **ninguna pantalla lo consume todavía**: hasta que se haga H4, es un campo nuevo sin cliente visible, que no rompe nada (es aditivo) pero tampoco resuelve el requisito de negocio hasta que el front lo pinte.
- H3 (lote periódico) es lo que efectivamente desbloquea el handoff H8 de `MED-E15`; sin él, el corte semanal/quincenal/mensual sigue sin existir. Este PR no cierra H8, sólo avanza la mitad de lectura de CA-3.1/CA-3.3/CA-3.4.

## Decisiones y ambigüedades

Las ocho ambigüedades del carril (A0–A7) quedan registradas en el contrato (`docs/contracts/insurer-practitioner-settlement-batches.md`, cierre de la §12) y en el `PLAN.md`. Ninguna se resolvió por conveniencia; todas están marcadas para que Billing/Reporting y el propietario del contrato de aseguradora las confirmen antes de construir H3 sobre supuestos no validados.
