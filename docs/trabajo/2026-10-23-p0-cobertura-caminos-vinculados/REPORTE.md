# Reporte — Cobertura en los reclamos vinculados y bitácora de cada decisión (P0, slice 2)

- Fecha: 2026-10-23 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/great-gates-p368ua` → PR #677
  (base `justin/p0-claim-coverage-validation`, apilado sobre #671)
- Peldaño de evidencia alcanzado: **TESTED**. Los tests dirigidos al cambio pasan; no se ejercitó
  el camino real contra Postgres ni HTTP.
- Avance: 12 HECHO / 15 microtareas = **80 %** (2 BLOQUEADO: H3.M2, H3.M4 · 1 DESCARTADO: H2.S1.M5)

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M3, H1.S2.M1 | Política en los caminos de farmacia y diagnóstico; parte del paciente calculada por el servidor; 9 razones de rechazo por origen | `corepack yarn test --testPathPatterns=insurance` | 50 suites / 786 tests, todo verde |
| H1.S1.M4 | Replay idempotente compara la parte declarada con la guardada | idem (`claims-linked.service.spec.ts`) | verde |
| H2.S1.M1–M4, H2.S2.M1 | Bitácora del aceptado (en la transacción del alta) y del rechazado (en una transacción propia); una falla de la bitácora no oculta el 422; desglose al log estructurado | idem (`claims-linked-coverage.spec.ts`, `claims-coverage-wiring.spec.ts`) | verde |
| H3.M1 | Typecheck | `corepack yarn typecheck` | salida 0 |
| H3.M3 | Lint de los 8 archivos tocados | `npx eslint --max-warnings=0 <archivos>` | salida 0 |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M5 | DESCARTADO | Justin decidió el 2026-10-23 dejar el desglose fuera de `audit_log` (sin DDL). Si algún día se quiere sellar, hace falta una columna de detalle en `audit_log` o columnas de reparto en `insurance_claim_lines` |
| H3.M2 | BLOQUEADO | La base ya falla el lint completo (17 errores de prettier en `src/common/seed/glossary-*.spec.ts`, `pharmacy_inventory/.../pharmacy-orders.*`, `profiles/.../clinical-patient-history.adapter.ts`); fuera de alcance |
| H3.M4 | BLOQUEADO | Un entorno con Postgres para los int-specs |
| (fuera de plan) | TODO | Limitar el `patientAmount` de la adjudicación vinculada a la parte informada (decisión del 2026-10-23: la diferencia la absorbe la práctica) |

## Evidencia
```
$ corepack yarn typecheck            → exit 0
$ corepack yarn test --testPathPatterns=insurance   → exit 0
Test Suites: 50 passed, 50 total
Tests:       786 passed, 786 total
# Misma corrida sobre la base sin este cambio (git stash): 49 suites / 756 tests
$ corepack yarn lint --max-warnings=0 → exit 1, 17 errores en 5 archivos ajenos (ver evidencia/lint-completo.txt)
# Misma corrida sobre la base sin este cambio: exit 1, los mismos 17 errores
$ npx eslint --max-warnings=0 <8 archivos tocados> → exit 0
```
Archivos: [evidencia/test-insurance.txt](./evidencia/test-insurance.txt),
[evidencia/lint-completo.txt](./evidencia/lint-completo.txt).

## No cubierto
- Los int-specs **no se corrieron**: no hay Postgres en la nube. Sin probar contra la base: el `FOR UPDATE`
  de la aprobación previa en los caminos vinculados y la escritura real en `audit_log`, tanto en la
  transacción del alta como en la propia del rechazo.
- No se llamó a la API por HTTP.

## Desvíos del plan
- El plan y este reporte se escribieron después del código y del PR. AGENTS.md §2.1 pide el plan
  primero.
- Rama `claude/great-gates-p368ua` en lugar de `justin/p0-claim-coverage-linked-paths`: es la rama
  asignada a la sesión. Parte de la misma base.
- `claim-coverage-policy.spec.ts` se tocó solo para mover su EM en memoria a
  `claim-coverage.testing.ts`, compartido con el spec nuevo. La lógica de sus tests no cambió.
- Entorno: el proxy bloquea `cdn.sheetjs.com`. Para poder instalar, `xlsx` se resolvió a la
  versión de npm solo en local. `package.json` y `yarn.lock` se restauraron sin cambios.

## Riesgos residuales
- Un producto de farmacia sin `medicationConceptId`, o un servicio sin beneficio vigente, ya no se
  puede cobrar a la aseguradora (422). Es intencional según la regla P0.
- Un cliente que hoy manda `patientResponsibilityAmount: 0` en un reclamo vinculado pasa a recibir
  422 `PATIENT_SHARE_MISMATCH`.

## Decisiones y ambigüedades
- Motivo del rechazo en `action` (`INSURANCE_CLAIM_COVERAGE_REJECTED:<reason>`), porque
  `audit_log` no tiene columna de detalle; el desglose va al log estructurado. **Confirmado por Justin
  el 2026-10-23: queda así.**
- El rechazo se sella en una transacción aparte. Si no, el rollback del alta lo borraría.
- La parte del paciente declarada se juzga igual que en el cobro directo (debe coincidir con el
  plan), también un `0`. **Confirmado por Justin el 2026-10-23.**
- Sin PHI en la bitácora ni en los logs: solo ids opacos, montos y conceptos del plan.
