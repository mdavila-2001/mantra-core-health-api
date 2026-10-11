# Reporte — DDD insurance

- Fecha: 2026-10-11 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/ddd-insurance-dev`
- Peldaño de evidencia alcanzado: `VERIFIED` para la ubicación, puertos, adaptadores y reglas de capas según ADR-0026.
- Avance: 9 / 12 microtareas (75 %). Completadas: S1.M1, S1.M2, S2.M1, S2.M2, S3.M1, S3.M2, S4.M1, S4.M2, S4.M3.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| S1.M1 | Inventario del módulo y sus dependencias | `rg --files`, inspección de imports | Inventario registrado en `PLAN.md`. |
| S1.M2 | Baseline antes de cambios | `corepack yarn test src/modules/insurance --runInBand --silent`; `corepack yarn test src/architecture/module-layering.spec.ts --runInBand --silent` | 43 suites / 681 tests; guard 1 suite / 5 tests. |
| S2.M1 | Controllers y DTOs en `presentation/` | `corepack yarn test src/modules/insurance --runInBand --silent`; `corepack yarn typecheck`; `corepack yarn eslint src/modules/insurance`; `git diff --check` | Evidencia original en `evidencia/presentation.txt`. |
| S2.M2 | Conceptos, moneda y cálculos puros en `domain/` | mismos gates dirigidos | Evidencia original en `evidencia/domain.txt`. |
| S3.M1 | Repositorios propios en `infrastructure/repositories/` | `corepack yarn typecheck`; `corepack yarn test src/modules/insurance --runInBand --silent` | Typecheck pasó; 44 suites / 691 tests. |
| S3.M2 | Puertos hacia contextos externos y adaptadores en `infrastructure/adapters/` | `corepack yarn test src/architecture/module-layering.spec.ts` | Puertos extraídos y adaptadores provistos en `InsuranceModule`. |
| S4.M1–M3 | Servicios en `application/services/`, cableado de módulos y guard verde | `corepack yarn test src/architecture/module-layering.spec.ts` | Guard de capas 7/7 aprobado (`insurance` migrado y validado). |

## Evidencia

```text
$ corepack yarn typecheck
# salida vacía; exit 0

$ corepack yarn test src/modules/insurance --runInBand --silent
Test Suites: 44 passed, 44 total
Tests:       691 passed, 691 total

$ corepack yarn test src/architecture/module-layering.spec.ts
PASS src/architecture/module-layering.spec.ts
  capas de los módulos migrados
    ✓ hay al menos un módulo migrado y existe en disco
    ✓ scheduling: ninguna capa viola las reglas de dependencia
    ✓ profiles: ninguna capa viola las reglas de dependencia
    ✓ insurance: ninguna capa viola las reglas de dependencia
    ✓ scheduling: lee de verdad las cuatro capas
    ✓ profiles: lee de verdad las cuatro capas
    ✓ insurance: lee de verdad las cuatro capas

$ corepack yarn eslint src/modules/insurance && git diff --check
# salida vacía; exit 0
```

## No cubierto

- No se ejecutó la suite completa de API ni pruebas de integración.
- No se creó worktree sobre `test`, no se abrió PR y no se verificaron checks remotos.
- No se alteraron entidades, DDL, seeds ni contratos HTTP de forma intencional.

## Desvíos del plan

- `origin/dev` avanzó 26 commits desde la base del worktree. Se guardó el estado previo en un commit local y se rebasó sobre `ce2910eb` (`#640`). El único conflicto fue una ruta de import en `insurance-portability-pdf.service.spec.ts`; se resolvió manteniendo las nuevas importaciones Jest/PDFKit y apuntando el DTO a `presentation/dto/`.
- El guard de capas también señala una importación nueva en `profiles`, fuera del alcance inicial; queda registrada porque bloquea el gate en la base actual.

## Riesgos residuales

- El guard rojo impide afirmar que insurance ya cumple ADR-0026.
- La rama tiene un commit de checkpoint local y cambios posteriores sin commit; no se publicó nada.

## Decisiones y ambigüedades

- Se preservan las firmas públicas de los servicios y las transacciones actuales.
- El alcance pendiente sigue siendo completar el molde DDD en insurance; no se autoriza cambiar contratos ni mover entidades.
