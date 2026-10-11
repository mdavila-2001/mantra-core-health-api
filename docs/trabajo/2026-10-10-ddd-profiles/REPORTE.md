# Reporte — Migración DDD de profiles

- Fecha: 2026-10-10 · Repo: `mantra-core-health-api` · Rama: `justin/ddd-profiles-api-test` · PR: [#635](https://github.com/mdavila-2001/mantra-core-health-api/pull/635)
- Plan: [PLAN.md](./PLAN.md) · Peldaño: TESTED en la base `test`.
- Avance del módulo: 4/4 microtareas verificadas en `dev` y `test`; PRs #634 (`dev`) y #635 (`test`) abiertos, no mergeados.

## Completado en `test`

| ID       | Qué se logró                                                                                                                                                                                                                                               | Evidencia                                                                 | Resultado                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| H1.S1.M1 | Inventario de capas, operaciones, contratos e imports; comprobadas las bases para evitar duplicar otro trabajo DDD                                                                                                                                         | lectura de árboles y `gh pr list`                                         | No había PR DDD de profiles abierto; `test` ya incluía variaciones de contrato y la eliminación de firmas de profesional, que se preservaron |
| H1.S1.M2 | Movidos controladores/DTO, servicios, repositorios, adaptadores y reglas puras a sus capas; se agregaron puertos reales para terminología, afiliaciones, identidad, contactos/direcciones/identificadores, coberturas, agenda, actividad, authz y bloqueos | `corepack yarn test src/architecture/module-layering.spec.ts --runInBand` | `5 passed, 5 total`; `profiles` forma parte de `MIGRATED_MODULES`                                                                            |
| H1.S1.M3 | Se conservaron las suites presentes en `test` y sus aserciones; se ajustaron dobles a los puertos                                                                                                                                                          | `corepack yarn test src/modules/profiles --runInBand`                     | `26 passed, 26 total`; `528 passed, 528 total`                                                                                               |
| H1.S1.M4 | Gates del módulo y regresión completa en `test`                                                                                                                                                                                                            | comandos abajo                                                            | typecheck, ESLint, `git diff --check` y specs dirigidos pasaron; la regresión completa conserva los 3 rojos preexistentes                    |

## Gates ejecutados en `test`

```text
corepack yarn typecheck
exit code 0

corepack yarn eslint src/modules/profiles
exit code 0

git diff --check
exit code 0

corepack yarn test src/architecture/module-layering.spec.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total

corepack yarn test src/modules/profiles --runInBand
Test Suites: 26 passed, 26 total
Tests:       528 passed, 528 total

corepack yarn test
Test Suites: 2 failed, 1 skipped, 814 passed, 816 of 817 total
Tests:       3 failed, 1 skipped, 10002 passed, 10006 total
Time:        135.457 s
exit code 1
Fallos conocidos del baseline `test`: `insurance-controllers.spec.ts` (1) y `common/seed/data/clinical-forms/catalog.spec.ts` (2), documentados para la tarea 2.6.
```

Jest mostró avisos preexistentes de importación de JSON sin `with { type: 'json' }`; no afectaron los resultados.

## Pendiente

| Estado     | Qué falta                                                                           |
| ---------- | ----------------------------------------------------------------------------------- |
| Abierto    | PR #635 contra `test`; revisión y merge corresponden al propietario                |
| No corrido | Integración y pruebas E2E, porque exigen stack/servicios; no se autorizó iniciarlos |

## Revisión de código propia

- Los imports de capas y los límites entre módulos pasan el guard; los adaptadores preservan las consultas/servicios que ya ejecutaba profiles.
- Los cambios de prueba mantienen las aserciones de comportamiento y sustituyen dependencias concretas por dobles del puerto. No se agregaron `skip`, `xit` ni `todo`, ni se borraron aserciones.
- No se modificaron `entities/`, SQL, DDL, rutas ni DTO HTTP. Se mantuvieron los contratos existentes y los nuevos archivos usan nombres en inglés.
- La revisión visual no aplica a esta migración de API.

## Limitaciones

- El resultado completo de la tarea 2.4 del handoff sigue abierto: después de `profiles` quedan `pharmacy_inventory`, `insurance`, `iam` y los otros módulos pendientes.
- Los PR #634 y #635 están abiertos; no se mergeó nada.
