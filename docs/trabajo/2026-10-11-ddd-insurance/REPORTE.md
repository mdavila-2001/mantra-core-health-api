# Reporte — DDD insurance

- Fecha: 2026-10-11 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/ddd-insurance-dev`
- Peldaño de evidencia alcanzado: `TESTED` para la ubicación y los imports actuales; la arquitectura DDD sigue en `WRITTEN` por dependencias cruzadas pendientes.
- Avance: 5 / 12 microtareas (41,7 %). Contadas como HECHO: S1.M1, S1.M2, S2.M1, S2.M2 y S3.M1.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| S1.M1 | Inventario del módulo y sus dependencias | `rg --files`, inspección de imports | Inventario registrado en `PLAN.md`. |
| S1.M2 | Baseline antes de cambios | `corepack yarn test src/modules/insurance --runInBand --silent`; `corepack yarn test src/architecture/module-layering.spec.ts --runInBand --silent` | 43 suites / 681 tests; guard 1 suite / 5 tests. |
| S2.M1 | Controllers y DTOs en `presentation/` | `corepack yarn test src/modules/insurance --runInBand --silent`; `corepack yarn typecheck`; `corepack yarn eslint src/modules/insurance`; `git diff --check` | Evidencia original en `evidencia/presentation.txt`. |
| S2.M2 | Conceptos, moneda y cálculos puros en `domain/` | mismos gates dirigidos | Evidencia original en `evidencia/domain.txt`. |
| S3.M1 | Repositorios propios en `infrastructure/repositories/` | `corepack yarn typecheck`; `corepack yarn test src/modules/insurance --runInBand --silent` | Typecheck pasó; tras la rebase pasaron 44 suites / 691 tests. |

## A medias

### S3.M2 — Puertos hacia contextos externos

- Qué anda: existe `DirectoryTenantAdministrationPort` y su adaptador; `insurance-read.service.ts` consume ese puerto.
- Qué no anda: siguen imports directos desde `application/services/` hacia `audit`, `clinical`, `community`, `common`, `diagnostic_units`, `health_data`, `messaging`, `pharmacy`, `pharmacy_inventory`, `practice`, `profiles`, `scheduling` y `terminology`.
- Qué falta exactamente: extraer ports/adapters con tipos propios para todas las dependencias restantes y eliminar esos imports de la capa de aplicación.
- Dónde quedó: `src/modules/insurance/application/ports/`, `src/modules/insurance/infrastructure/adapters/` y los servicios en `src/modules/insurance/application/services/`.

### S4.M1 — Migración de servicios

- Qué anda: las 59 fuentes TypeScript de `services/` están en `application/services/`; los imports internos, externos y de consumidores se actualizaron. Typecheck, pruebas dirigidas y lint dirigido pasan.
- Qué no anda: varias clases siguen combinando orquestación con acceso a entidades de otros módulos; el guard de capas enumera esas dependencias.
- Qué falta exactamente: adaptar las dependencias externas y extraer al dominio las reglas puras restantes sin cambiar contratos ni transacciones.
- Dónde quedó: `src/modules/insurance/application/services/`.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| S3.M2 | A MEDIAS | Completar ports/adapters y pasar el guard. |
| S4.M1–M3 | EN CURSO | Completar fachadas/casos de uso; sumar `insurance` a `MIGRATED_MODULES` sólo cuando no haya violaciones. |
| S5.M1 | TODO | Suite completa y gates en base `dev` actual. |
| S5.M2 | TODO | Portar commit funcional a worktree fresco de `test` y repetir gates. |
| S5.M3 | TODO | Reporte final y PRs dirigidos a `dev` y `test`; revisar checks, sin merge. |

## Evidencia

```text
$ corepack yarn typecheck
# salida vacía; exit 0

$ corepack yarn test src/modules/insurance --runInBand --silent
Test Suites: 44 passed, 44 total
Tests:       691 passed, 691 total

$ corepack yarn eslint src/modules/insurance && git diff --check
# salida vacía; exit 0
```

El guard se ejecutó con `insurance` agregado a `MIGRATED_MODULES` y falló: encontró cruces desde `insurance/application/services/` hacia otros módulos. También detectó una importación nueva de `clinical/services` en `profiles/presentation/controllers/profiles-patients.controller.ts`, presente en el `origin/dev` actualizado. La salida literal quedó guardada en [architecture-current.txt](./evidencia/architecture-current.txt).

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
