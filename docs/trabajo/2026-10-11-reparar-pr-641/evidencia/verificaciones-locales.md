# Evidencia local — PR #641

## Lint inicial del CI

Fuente: workflow `Documentación`, ejecución `38156883778`, job `114521582827`.

```text
/home/runner/work/mantra-core-health-api/mantra-core-health-api/src/modules/terminology/repositories/glossary-search.sql.ts
1:10  error  'normalizeSearchText' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
✖ 1 problem (1 error, 0 warnings)
Process completed with exit code 1.
```

El archivo tenía un import local no usado junto a la reexportación pública. El commit `67f119c0` quitó solamente el import duplicado y conservó la exportación.

## Gates locales en el estado integrado con `origin/dev` (`ce2910eb`)

```text
$ corepack yarn test src/architecture/module-layering.spec.ts --runInBand --silent
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
exit code: 0
```

```text
$ corepack yarn test src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts --runInBand --silent
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
exit code: 0
```

```text
$ corepack yarn test src/modules/pharmacy_inventory --runInBand --silent
Test Suites: 21 passed, 21 total
Tests:       151 passed, 151 total
exit code: 0
```

```text
$ corepack yarn lint --max-warnings=0
exit code: 0
```

```text
$ corepack yarn typecheck
exit code: 0
```

```text
$ git diff --cached --check && git diff --check && test -z "$(git ls-files -u)" && git merge-base --is-ancestor origin/dev MERGE_HEAD
exit code: 0
```

La primera corrida de lint sobre la integración encontró cuatro errores adicionales en `billing-simulated.service.ts`, `pharmacy-read.service.ts` y el spec de `profiles`; se resolvieron con cambios de formato y quitando un import no usado. La corrida global final quedó limpia.

## Suite completa de CI antes de actualizar el fixture

Fuente: workflow `Documentación`, ejecución `38174316550`, paso de pruebas con cobertura.

```text
FAIL modules/diagnostic_units/services/diagnostic-units-read.service.spec.ts
TypeError: this.readRepo.findAddresses is not a function
Coverage summary
Branches    : 68.92% (22371/32457)
Jest: Coverage for branches (68.92%) does not meet "global" threshold (69%)
Test Suites: 1 failed, 1 skipped, 842 passed, 843 of 844 total
Tests:       1 failed, 1 skipped, 10267 passed, 10269 total
Process completed with exit code 1.
```

Se incorporó `findAddresses` al fixture del spec y se verifican las coordenadas convertidas. El spec dirigido actualizado pasó 5/5; la cobertura global todavía requiere una nueva corrida remota.

## Estado remoto antes de publicar la integración

PR #641 se mergeó a las `2026-10-11T21:08:56Z` con commit `afe559eb`; el check `docs` correspondiente al SHA `805c6c0d` terminó en FAIL a las `21:13:36Z`. La rama remota avanzó a `2849d22f`, cuya diferencia contra `dev` (`afe559eb`) contiene solo los commits `f836ffbb` (spec de direcciones) y `2849d22f` (reporte). El test dirigido actualizado pasó 5/5. Falta abrir el PR de seguimiento y ejecutar CI sobre esos commits.
