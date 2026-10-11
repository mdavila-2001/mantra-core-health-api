# Reporte — Corregir CI posterior al merge de PR #641

> **AVANCE: 7 / 8 — 87,5 %.**

- Fecha: 2026-10-11 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/ddd-pharmacy-inventory-dev` · Base actual: `dev` (`afe559eb`)
- Peldaño de evidencia alcanzado: TESTED localmente; falta confirmar CI y mergeabilidad remotos.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Se eliminó el import duplicado sin uso y se conservó la reexportación pública de `normalizeSearchText`. | `./node_modules/.bin/eslint src/modules/terminology/repositories/glossary-search.sql.ts` | PASS · salida 0 · [verificaciones locales](./evidencia/verificaciones-locales.md) |
| H1.S2.M1 | La rama local integra `origin/dev` (`ce2910eb`), sin entradas en conflicto. | `git merge-base --is-ancestor origin/dev HEAD` y `git ls-files -u` | PASS · salida 0 |
| H1.S2.M2 | La autorización clínica de perfiles pasa por un puerto de aplicación y su adaptador de infraestructura; controller, guard y módulo de farmacia pasan sus specs dirigidos. | `corepack yarn test src/architecture/module-layering.spec.ts --runInBand --silent`; `corepack yarn test src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts --runInBand --silent`; `corepack yarn test src/modules/pharmacy_inventory --runInBand --silent` | PASS · 7 + 23 + 151 pruebas |
| H1.S3.M1 | Typecheck y gates locales del área pasan. | `corepack yarn typecheck` | PASS · salida 0 |
| H1.S3.M3 | El lint global quedó sin errores tras corregir los cuatro hallazgos mecánicos expuestos por la base nueva. | `corepack yarn lint --max-warnings=0` | PASS · salida 0 |
| H1.S3.M4 | El spec de unidades diagnósticas ahora provee y comprueba la dirección que lee el servicio actualizado. | `corepack yarn test src/modules/diagnostic_units/services/diagnostic-units-read.service.spec.ts --runInBand --silent` | PASS · 1 suite, 5 pruebas |

## A medias

### H1.S3.M5 — Abrir y verificar PR de seguimiento

- Qué anda: el spec corregido pasó 5/5 y el cambio está en la rama remota. `dev` ya contiene el merge commit `afe559eb` de #641; comparada con esa base, la rama tiene únicamente los dos commits posteriores `f836ffbb` y `2849d22f`.
- Qué no anda: #641 se mergeó a las 21:08:56 con su CI todavía en curso y luego fallido; el test corregido no formó parte de ese merge. La API del PR quedó en el SHA `805c6c0d`, aunque la referencia remota ya avanzó.
- Qué falta exactamente: abrir un PR nuevo de seguimiento desde esta rama y esperar su workflow completo de cobertura.
- Dónde quedó: rama `justin/ddd-pharmacy-inventory-dev`, repositorio `mantra-core-health-api`; typecheck y pruebas dirigidas locales pasaron.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S3.M5 | TODO | Abrir el PR de seguimiento y esperar el workflow `Documentación` de GitHub. |

## Evidencia

- [Resultados locales y log inicial de CI](./evidencia/verificaciones-locales.md).
- El log del job `docs` de la ejecución `38156883778` mostró `normalizeSearchText` no usado en `src/modules/terminology/repositories/glossary-search.sql.ts`.
- Las pruebas dirigidas reportaron 7/7 del guard de capas, 23/23 de perfiles y 151/151 de `pharmacy_inventory`.
- `corepack yarn lint --max-warnings=0` y `corepack yarn typecheck` terminaron con código 0.
- La suite CI anterior mostró 1 spec fallido, 1 omitido, 842 suites pasadas; 10.267 pruebas pasadas y cobertura de ramas 68,92% frente al 69% requerido. Ver [verificaciones locales](./evidencia/verificaciones-locales.md).

## No cubierto

- La suite completa se ejecutó en CI y falló antes de la corrección de `findAddresses`; falta una nueva ejecución completa con el fixture actualizado.
- No se ejecutaron pruebas con simulador o Docker.
- No se declaró CI verde para el fixture corregido: el último workflow corresponde al SHA anterior del PR #641.

## Desvíos del plan

- La integración de `dev` expuso cuatro errores adicionales en el lint global. Se agregaron al alcance y se corrigieron solo en formato/imports, sin cambios de comportamiento.
- La integración de `dev` también agregó lectura de direcciones sin actualizar el fixture del spec; se corrigió el mock y se añadió una aserción de coordenadas.
- La rama tenía el merge local iniciado; se completó usando la punta `ce2910eb` y se preservaron los cambios de integración ya preparados.

## Riesgos residuales

- La cobertura global debe alcanzar al menos 69% en el workflow del PR de seguimiento.

## Decisiones y ambigüedades

- #641 se mergeó durante la ejecución de CI sin incluir el test corregido. Se conserva la rama y sus dos commits posteriores para abrir un PR de seguimiento; el PR #642 contra `test` no se modificó.
