# Reporte (API) — H7: dependencia XLSX, fixtures y parseador

> **AVANCE: 22 / 22 — 100 %** (microtareas de H7 en este repo; el carril completo, con H1-H6 en
> el repo front, está en
> [`../../../../mantra-core-health/docs/trabajo/2026-09-25-marcelo-calidad/REPORTE.md`](../../../../mantra-core-health/docs/trabajo/2026-09-25-marcelo-calidad/REPORTE.md)
> — **82/98 — 83,7 %**).

- Fecha: 2026-09-25 · Rama: `marcelo/feat-carga-masiva-xlsx-2026-09-25` (rebasada sobre `origin/dev`
  actual) · PR: [#462](https://github.com/mdavila-2001/mantra-core-health-api/pull/462)
- Peldaño de evidencia alcanzado: **`TESTED`** — 59/59 pruebas dirigidas en verde, `yarn typecheck`
  en 0. No llegó a `VERIFIED` porque este módulo no se ejercitó contra la aplicación arrancando de
  verdad: la única rama disponible del motor (`itzan/carga-masiva-motor-2026-09-25` @ `d99ff9e7`)
  no arranca por una dependencia rota en `InsuranceModule`, ajena a este trabajo — ver detalle en
  el reporte del front, sección "A medias · H6.S1".

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H7.S1 | Dependencia XLSX (SheetJS 0.20.3, canal oficial) decidida con audit y spec de humo bajo Jest ESM | `yarn npm audit`, spec de humo | PASS — `decision-dependencia.md`, `evidencia/h7s1-*.txt` |
| H7.S2 | 30 fixtures sintéticos deterministas (13 CSV + 15 XLSX + 1 PDF + README), pusheados dentro de la hora 2 | `sha256sum *.csv` ×2 | PASS — sin diferencias en CSV **ni** en XLSX (mejor que lo previsto) |
| H7.S3 | `xlsx-parser.ts` idéntico al `CsvParser` real de Itzan sobre los 12 fixtures gemelos, con tope `MAX_FILAS_XLSX`, hoja preferida y celdas numéricas/fórmulas | `yarn test src/modules/terminology/import/xlsx-parser` | PASS — 18/18 |
| Cierre | Los 8 archivos traídos de Itzan (@ `d99ff9e7`, pineado y verificado sin diff contra el tip actual de su rama) + los propios, todos juntos | `yarn test src/modules/terminology/import` | PASS — 59/59, 5 suites |
| PR | Rebasado sobre `origin/dev` actualizado (avanzó con merges de farmacia mientras se trabajaba), sin conflictos | `git rebase origin/dev` | PASS — limpio |
| PR | `MERGEABLE`, checks `pending` sin runner tomando trabajos (ningún `fail`) | `gh pr view` / `gh pr checks` | `evidencia/pr/api-view.json`, `api-checks.txt` |

## A medias

Ninguna microtarea de H7 quedó a medias. Lo que quedó abierto pertenece al carril completo (H5.S2,
H6.S1) y está documentado en el reporte del repo front, no acá: este archivo cubre sólo lo que vive
en `mantra-core-health-api`.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| Cablear `XlsxParser` en `index.ts`/`PARSEADORES_DE_IMPORTACION` | Fuera de alcance de este carril (contrato: lo hace Pablo al integrar) | Que Pablo integre las ramas de Itzan y de este PR, en ese orden |
| Corrida contra la aplicación viva | `BLOQUEADO`, no de este trabajo | Que se resuelva `UnknownDependenciesException` en `InsuranceModule` (rama de Itzan) |

## Evidencia

```text
$ yarn npm audit (con xlsx instalado)
único hallazgo: deprecation de eslint@9.39.5, preexistente, ajeno a xlsx

$ yarn test src/modules/terminology/import/__xlsx_smoke.spec.ts (spec de humo, borrado tras confirmar)
Tests: 1 passed, 1 total

$ sha256sum *.csv (dos corridas de generar-fixtures.mjs)
diff: (vacío)

$ yarn test src/modules/terminology/import/xlsx-parser.spec.ts
Tests: 18 passed, 18 total
grande-10k: 155 ms, heapUsed +9 125 040 bytes

$ yarn test src/modules/terminology/import
Test Suites: 5 passed, 5 total · Tests: 59 passed, 59 total

$ yarn typecheck
exit=0
```

Índices completos en `evidencia/{antes,h7s1-*,h7s2,h7s3,pr}/`.

## No cubierto

- `xlsx-parser.ts` nunca se ejercitó dentro de una petición HTTP real (`POST .../import-file` con
  un `.xlsx` de verdad): sólo se probó de forma unitaria contra los fixtures. Esto es consistente
  con el contrato (Pablo cablea el `index.ts` al integrar), pero es honesto decir que el camino
  completo no se recorrió todavía.
- `yarn lint` no corrió limpio en ningún punto de la noche: crashea de forma reproducible en este
  entorno (`Illegal instruction` / `Segmentation fault`, dos corridas distintas), clasificado
  `ENVIRONMENT` con evidencia en `evidencia/antes/lint-api.txt`. No es de este cambio — se
  reprodujo también en la instalación limpia de H1, antes de tocar nada.

## Desvíos del plan

- El pin de los 8 archivos de Itzan se hizo contra `d99ff9e7` (el SHA vigente al momento de
  traerlos), no contra el SHA original `e57c0126` de la primera hora — se verificó sin diff entre
  ambos para los archivos relevantes antes de fijar la decisión.
- `package.json`+`yarn.lock` de la dependencia se commitearon en un commit propio, separados de
  los 8 archivos traídos de Itzan y de `xlsx-parser.ts`, para que el diff de cada commit sea
  legible por separado (más granular que "un solo commit de H7").

## Riesgos residuales y deuda

- `MAX_FILAS_XLSX = 100_000` no protege contra un `.xlsx` con `sharedStrings.xml` inflado
  artificialmente (zip bomb de XML): SheetJS descomprime esa tabla completa antes de que el tope
  de filas pueda actuar. Documentado también en `gate-seguridad-phi.md` del repo front §2.
- La dependencia `xlsx` se instaló desde un tarball fuera del registro de npm: herramientas de
  auditoría automática que sólo miran el registro (Dependabot, por ejemplo) no la van a ver.
  Documentado en `decision-dependencia.md`.

## Decisiones y ambigüedades

Ver `decision-dependencia.md` (Contexto/Decisión/Consecuencias/Reversa) y las ambigüedades Q-M6,
Q-M8 y Q-M17 del reporte del carril completo (repo front), que abarcan también este repo.
