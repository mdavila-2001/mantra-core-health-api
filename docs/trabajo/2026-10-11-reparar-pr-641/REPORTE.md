# Reporte — Reparar PR #641 de capas DDD en pharmacy_inventory

> **AVANCE: 6 / 7 — 85,7 %.**

- Fecha: 2026-10-11 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/ddd-pharmacy-inventory-dev`
- Peldaño de evidencia alcanzado: TESTED localmente; falta confirmar CI y mergeabilidad remotos.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Se eliminó el import duplicado sin uso y se conservó la reexportación pública de `normalizeSearchText`. | `./node_modules/.bin/eslint src/modules/terminology/repositories/glossary-search.sql.ts` | PASS · salida 0 · [verificaciones locales](./evidencia/verificaciones-locales.md) |
| H1.S2.M1 | La rama local integra `origin/dev` (`ce2910eb`), sin entradas en conflicto. | `git merge-base --is-ancestor origin/dev HEAD` y `git ls-files -u` | PASS · salida 0 |
| H1.S2.M2 | La autorización clínica de perfiles pasa por un puerto de aplicación y su adaptador de infraestructura; controller, guard y módulo de farmacia pasan sus specs dirigidos. | `corepack yarn test src/architecture/module-layering.spec.ts --runInBand --silent`; `corepack yarn test src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts --runInBand --silent`; `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent` | PASS · 7 + 23 + 151 pruebas |
| H1.S3.M1 | Typecheck y gates locales del área pasan. | `corepack yarn typecheck` | PASS · salida 0 |
| H1.S3.M3 | El lint global quedó sin errores tras corregir los cuatro hallazgos mecánicos expuestos por la base nueva. | `corepack yarn lint --max-warnings=0` | PASS · salida 0 |

## A medias

### H1.S3.M4 — Confirmar CI remoto y mergeabilidad

- Qué anda: la corrección original de lint está en `67f119c0`; el merge de `origin/dev` y el puerto local están en commits locales verificados.
- Qué no anda: el remoto todavía refleja el estado previo a publicar la integración y GitHub informó `DIRTY`/`CONFLICTING`; el nuevo push aún no tiene checks observados.
- Qué falta exactamente: publicar los commits locales y consultar `gh pr checks 641` más `gh pr view 641 --json mergeable,mergeStateStatus` después de ese push.
- Dónde quedó: rama `justin/ddd-pharmacy-inventory-dev`, repositorio `mantra-core-health-api`; typecheck y pruebas dirigidas locales pasaron.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S3.M4 | TODO | Publicar la integración y esperar el workflow `Documentación` de GitHub. |

## Evidencia

- [Resultados locales y log inicial de CI](./evidencia/verificaciones-locales.md).
- El log del job `docs` de la ejecución `38156883778` mostró `normalizeSearchText` no usado en `src/modules/terminology/repositories/glossary-search.sql.ts`.
- Las pruebas dirigidas reportaron 7/7 del guard de capas, 23/23 de perfiles y 151/151 de `pharmacy_inventory`.
- `corepack yarn lint --max-warnings=0` y `corepack yarn typecheck` terminaron con código 0.

## No cubierto

- No se ejecutó la suite completa de API ni pruebas con simulador o Docker; no son necesarias para este arreglo estático y los gates locales dirigidos.
- No se declaró el PR integrable: falta la respuesta de CI y el estado de mergeabilidad después del último push.

## Desvíos del plan

- La integración de `dev` expuso cuatro errores adicionales en el lint global. Se agregaron al alcance y se corrigieron solo en formato/imports, sin cambios de comportamiento.
- La rama tenía el merge local iniciado; se completó usando la punta `ce2910eb` y se preservaron los cambios de integración ya preparados.

## Riesgos residuales

- Hasta que GitHub procese el último push, la rama remota puede seguir apareciendo como conflictiva.

## Decisiones y ambigüedades

- Se mantuvo el destino `dev` y el nombre de rama existente del PR #641. No se alteró el PR paralelo #642 contra `test`.
