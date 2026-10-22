# Reporte — Cliente y mocks de farmacia, y el contrato real en la API (Carril Marcelo, mitad API)

> **AVANCE: 9 / 14 — 64,3 %.** (H1: 1/1 en esta rama · H4: 4/5 · H5: 2/3 · H6: 1/3 · H7: 1/1)

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `marcelo/pharmacy-sites-y-filtro-por-farmacia-2026-09-25` (worktree `wt-marcelo-farmacia-api`, commit local sin push)
- Peldaño de evidencia alcanzado: **TESTED** — código real, typecheck y lint limpios, 196/196 tests dirigidos en verde. No sube a `VERIFIED`: falta el ejercicio HTTP real (bloqueado por el bug preexistente de bootstrap) y el PR mergeable (bloqueado por el `push`).
- La mitad front de este carril está en `mantra-core-health/docs/trabajo/2026-09-25-farmacia-datos-y-contrato-real/REPORTE.md`.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1 | Corte fijado (`343795cc`, igual al target), baseline sin rojos | `yarn typecheck` · `yarn test src/modules/pharmacy` | 16/16 suites, 181/181 tests, exit 0 |
| H4.S1.M1-M4 | `GET /pharmacy/sites`: `PharmacySiteListItemDto`/`ResponseDto`, `PharmacyReadService.listSites()` (reusa `haversineKm` de `pharmacy_inventory`, sedes publicadas del tenant, orden distancia→nombre, `productCount` del catálogo de la farmacia), `@Get('sites')` declarado antes de `sites/:siteId/prices`, `lat`/`lng` validados igual que `availability` | `yarn test src/modules/pharmacy/services/pharmacy-read.service.spec.ts` · `.../controllers/pharmacy-read.controller.spec.ts` | 19/19 y 7/7 PASS |
| H4 (Q-M4) | `requiresPrescription` agregado a `PharmacySitePriceDto` y a `getSitePrices()` — no existía en el DTO real, lo declaró el front en H2 | test dedicado | PASS |
| H5.S1.M1-M2 | `pharmacyId` en `GET /pharmacy/products`: filtro por **intersección** (nunca reemplazo) con las farmacias visibles del tenant — un `pharmacyId` ajeno devuelve vacío, no filtra de más | `pharmacy-read.repository.spec.ts` (nuevo) | 3/3 PASS |
| H6.S1.M2 | Nota en `docs/PENDIENTES-BACKEND.md` (archivo nuevo: no existía, verificado con `find` antes de crearlo) | lectura | escrita |
| H7.S1.M2 | Regresión completa del módulo: `typecheck`, `lint --max-warnings=0` (tras `--fix` de formato), `test` | comandos pegados abajo | 18 suites / 196 tests PASS, 0 rojos nuevos |

## A medias
### H4.S1.M5 / H5.S1.M3 — OpenAPI regenerado
- Qué anda: el endpoint y el filtro funcionan (specs en verde); `yarn build` (parte de `docs:openapi:generate`) compila limpio.
- Qué no anda: `yarn docs:openapi:generate` no puede bootstrapear la aplicación completa para extraer el spec — no es un problema de `pharmacy`.
- Qué falta exactamente: que alguien resuelva la `UnknownDependenciesException` de `PractitionerSettlementBatchesService` en `InsuranceModule` (ajeno a este carril); recién ahí se puede correr `docs:openapi:generate` + `docs:endpoints:generate` + `docs:coverage`.
- Dónde quedó: sin cambios en `openapi/`; el bug y su salida literal están en `evidencia/h4/openapi-bloqueado.txt`. No se tocó `InsuranceModule` (fuera de alcance, regla 00 §3).

### H6.S1.M1 — `postman:generate`
- Qué anda: nada — no se pudo correr.
- Qué no anda: mismo bootstrap roto que H4.S1.M5.
- Qué falta exactamente: lo mismo que arriba.
- Dónde quedó: sin cambios en `postman/` (si existiera output previo, no se tocó).

### H6.S1.M3 — PR a `dev` mergeable
- Qué anda: dos commits locales listos (`docs(pharmacy): plan y baseline...` y el commit de esta segunda parte con H4/H5), compilan y pasan sus tests.
- Qué no anda: no hay push ni PR.
- Qué falta exactamente: `git push -u origin marcelo/pharmacy-sites-y-filtro-por-farmacia-2026-09-25` y `gh pr create` contra `dev`. El `push` lo bloqueó el clasificador de auto-modo de esta sesión ("Out-of-Place Publication") — no es una decisión tomada acá, es un permiso a resolver por fuera de la sesión.
- Dónde quedó: worktree `wt-marcelo-farmacia-api`, rama `marcelo/pharmacy-sites-y-filtro-por-farmacia-2026-09-25`, `git status` limpio salvo lo commiteado.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H4.S1.M5, H5.S1.M3, H6.S1.M1 | BLOQUEADO | Que alguien resuelva la DI rota de `InsuranceModule` (`PractitionerSettlementBatchesService`) — no es de este carril |
| H6.S1.M3 (push/PR) | BLOQUEADO | Permiso de `push` a un remoto, fuera del alcance de esta sesión de auto-modo |

## Evidencia
```text
$ corepack yarn typecheck
(sin salida = exit 0)

$ corepack yarn lint --max-warnings=0 src/modules/pharmacy
(0 problemas tras --fix)

$ corepack yarn test src/modules/pharmacy
Test Suites: 18 passed, 18 total
Tests:       196 passed, 196 total
```
Detalle en `evidencia/antes/api/` (baseline), `evidencia/h4/campos.md` (diff de campos) y
`evidencia/h4/openapi-bloqueado.txt` (el bug de `InsuranceModule`, íntegro).

## No cubierto
- Ningún endpoint ejercitado por HTTP real (`supertest`/E2E): sólo unitarios con `EntityManager` y
  servicio mockeados. No se levantó el stack Docker (instrucción explícita de la raíz).
- OpenAPI/Postman: no regenerados, ver "A medias".
- PR a `dev`: no existe, ver "A medias".

## Desvíos del plan
- H4.S1.M1 no se limitó a "leer y anotar": al no poder importar el `parseOrigin` privado de
  `pharmacy_inventory` (no exportado), se replicó localmente en el controlador nuevo — mismo
  comportamiento, mismo mensaje de error, declarado como decisión en el propio código y en el `PLAN.md`.
- El orden H4→H5→H6 se mantuvo, pero H6.S1.M1 y las porciones de OpenAPI de H4/H5 se toparon con
  el mismo bloqueante externo: se agrupó la evidencia en un solo archivo (`openapi-bloqueado.txt`)
  en vez de triplicarla.

## Riesgos residuales
- El bug de `InsuranceModule` bloquea la generación de documentación de **cualquier** carril de
  esta noche que necesite `docs:openapi:generate` o `postman:generate`, no sólo el de Farmacia —
  vale la pena que alguien lo levante como bloqueante del reparto completo, no sólo de este carril.
- Sin PR abierto, Justin e Itzan no pueden ver este código todavía aunque esté listo.

## Decisiones y ambigüedades
- **Q-M2 (decimal de `distanceKm`)** — confirmada: se reusa `haversineKm` de `pharmacy_inventory`,
  que ya redondea a un decimal.
- **Q-M4 (`requiresPrescription` en el DTO real)** — **no existía**; se agregó a
  `PharmacySitePriceDto` y a `getSitePrices()` en este mismo commit.
- **Q-M5 (CI self-hosted apagado)** — no llegó a ser relevante: el bloqueante fue local (bootstrap
  de la app), no el runner de CI.
- **`parseOrigin` duplicado en vez de importado** — `pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts` no exporta esa función; duplicar ~20 líneas de validación fue más barato y menos acoplado que exportarla desde un módulo ajeno sólo para este carril. A confirmar con quien sea dueño de `pharmacy_inventory` si conviene extraerla a un lugar compartido.
