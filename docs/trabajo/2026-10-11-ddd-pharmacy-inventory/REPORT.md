# DDD pharmacy_inventory — reporte de ejecución

Fecha: 2026-10-11
Base de esta rama: `origin/dev` (`594e64e5`)
Rama: `justin/ddd-pharmacy-inventory-dev`

## Resultado

Se migraron los cuatro límites del módulo 25: controllers y DTO a `presentation/`, persistencia/adaptadores a `infrastructure/`, operaciones a `application/` y reglas puras a `domain/`. Las fachadas preservan nombres y contratos consumidos por controllers y otros módulos. Se añadieron puertos locales para directory, insurance, pharmacy, messaging y profiles. `pharmacy_inventory` quedó incluido en `MIGRATED_MODULES`.

No se tocaron entidades, DDL, seeds ni el modelo externo. Los cambios a consumers fuera del módulo son actualizaciones de imports por la reubicación de conceptos, precios y DTO.

## Verificación

- Baseline dirigido antes del refactor: 7 suites / 117 tests del módulo; guard: 1 suite / 5 tests.
- Resultado actual del módulo: 21 suites / 151 tests.
- Guard de arquitectura actual: 1 suite / 7 tests; incluye `pharmacy_inventory`.
- Suite completa en `dev`: 837 suites pasaron; 1 suite quedó omitida; 10.214 tests pasaron y 1 quedó omitido. Duración: 144.443 s. No hubo fallos.
- Typecheck, ESLint dirigido y `git diff --check` pasaron.
- En base `test` (`13848053`), el mismo commit funcional pasó 21 suites / 151 tests, guard 7/7, typecheck y ESLint dirigido. Evidencia: `evidencia/test-targeted.txt`.
- No se ejecutaron pruebas con simulador ni Docker.
- `corepack yarn pw playwright/carril-19-route-health.spec.ts --workers=1` no aplica a este checkout API: el `package.json` de esta rama no define un script `pw`. El intento y su salida están en `evidencia/dev-route-health.txt`.

Las salidas literales se guardan en `evidencia/`.

## Riesgos y límites

- El baseline completo previo no quedó capturado; la comparación previa disponible corresponde al módulo y guard, arriba.
- La suite completa reportó una suite/test omitido. No se modificaron ni desactivaron tests para ocultarlo.
- Los gates dirigidos de `test` pasaron y se abrieron los dos PR separados. PR #641 (`dev`) y PR #642 (`test`) están `OPEN` y `MERGEABLE`; ninguno está mergeado. Al capturar `evidencia/pr-status.txt`, el check `docs` de #641 seguía `IN_PROGRESS` y #642 aún no reportaba checks. Ese estado externo puede cambiar después de este reporte.


## Pull requests

- [#641 contra `dev`](https://github.com/mdavila-2001/mantra-core-health-api/pull/641)
- [#642 contra `test`](https://github.com/mdavila-2001/mantra-core-health-api/pull/642)

Estado observado y checks: `evidencia/pr-status.txt`.
