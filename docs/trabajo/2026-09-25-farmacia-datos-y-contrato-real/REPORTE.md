# Reporte — Cliente y mocks de farmacia, y el contrato real en la API (Carril Marcelo, mitad API)

> **AVANCE: 1 / 14 — 7,1 %.** (H1: 1/1 en esta rama — el resto de H1 vive en el reporte del front · H4: 0/5 · H5: 0/3 · H6: 0/3 · H7: 0/1 acá)

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `marcelo/pharmacy-sites-y-filtro-por-farmacia-2026-09-25` (worktree `wt-marcelo-farmacia-api`, sin cambios de código todavía)
- Peldaño de evidencia alcanzado: **RUNS** (baseline: typecheck y tests corren limpios contra el corte fijado; sin código nuevo escrito en esta mitad todavía).
- La mitad front de este mismo carril (H1-H3) está en `mantra-core-health/docs/trabajo/2026-09-25-farmacia-datos-y-contrato-real/REPORTE.md`, con avance 13/30 y hallazgos que esta mitad necesita (Q-M4: `requiresPrescription` no existe en `PharmacySitePriceDto` real — hay que agregarlo acá en H4).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Corte fijado: `origin/dev` = `343795cc2d08745692f491c50e81427215043315`, igual al target de la ficha, sin drift | `git rev-parse origin/dev` | confirmado |
| H1.S1.M3-M4 | Baseline: `yarn typecheck` y `yarn test src/modules/pharmacy` sin rojos | comandos pegados | `evidencia/antes/api/{typecheck,test}.txt` — typecheck exit 0, 16 suites/181 tests PASS |

## A medias
Ninguna — lo que se hizo (baseline) quedó completo con su DoD.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H4.S1.M1-M5 (`GET /pharmacy/sites` real) | TODO | Nada externo. Ya se leyó el código real: `pharmacy-read.service.ts` (patrón de `listPharmacies`/`getPharmacy`), `pharmacy-inventory-read.service.ts` (Haversine `haversineKm`, exportada, y validación `lat`/`lng` en `parseOrigin`, no exportada — se replica localmente, declarado en el `PLAN.md`) |
| H5.S1.M1-M3 (`pharmacyId` en `/products`) | TODO | Depende de H4 sólo en orden, no en bloqueo real |
| H6.S1.M1-M3 (OpenAPI, Postman, PR a `dev`) | TODO | Depende de H4-H5 cerrados |
| H7.S1.M2 (regresión API) | TODO | Depende de H4-H6 |

## Evidencia
```text
$ corepack yarn typecheck
exit 0

$ corepack yarn test src/modules/pharmacy
Test Suites: 16 passed, 16 total
Tests:       181 passed, 181 total
```
Completo en `evidencia/antes/api/`.

## No cubierto
- Ningún endpoint nuevo implementado todavía en este repo: `GET /pharmacy/sites` real, `pharmacyId` en `GET /pharmacy/products`, y el agregado de `requiresPrescription` a `PharmacySitePriceDto` (que Q-M4 del lado front dejó pendiente para acá) no existen en el código todavía.
- Sin PR abierto a `dev`.

## Desvíos del plan
Ninguno. Se ejecutó H1 según lo planificado; H4-H7 quedaron para la continuación de este carril por límite de turno, priorizando primero H2 del lado front (Ola 0, bloqueante para Justin/Itzan) sobre el trabajo de backend, tal como indica la propia ficha del carril (§2).

## Riesgos residuales
Ninguno nuevo respecto de lo ya declarado en el `PLAN.md` (Q-M5: CI self-hosted de la API puede estar apagado — se verificará al llegar a H6).

## Decisiones y ambigüedades
Ver `PLAN.md` de este repo y el `REPORTE.md` del front (Q-M1 a Q-M5): ninguna se resolvió todavía del lado API porque no se llegó a escribir el código de H4-H6 en este turno.
