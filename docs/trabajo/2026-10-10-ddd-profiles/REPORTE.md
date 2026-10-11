# Reporte — Migración DDD de profiles

- Fecha: 2026-10-10 · Repo: `mantra-core-health-api` · Rama: `justin/ddd-profiles-api-dev`
- Plan: [PLAN.md](./PLAN.md) · Peldaño: TESTED en la base `dev`.
- Avance del módulo: 4/4 microtareas en `dev`; réplica de `test` y sus PRs pendientes.

## Completado en `dev`

| ID | Qué se logró | Evidencia | Resultado |
|---|---|---|---|
| H1.S1.M1 | Inventario de capas, operaciones, contratos e imports; comprobadas las bases `dev`/`test` para evitar duplicar otro trabajo DDD | lectura de árboles y `gh pr list` | `profiles` tenía 11 servicios y 8.167 líneas de servicio; no había PR DDD de profiles abierto |
| H1.S1.M2 | Movidos controladores/DTO, servicios, repositorios, adaptadores y reglas puras a sus capas; se agregaron puertos reales para terminología, afiliaciones, archivos, identidad, contactos/direcciones/identificadores, coberturas, agenda, actividad, authz y bloqueos | `corepack yarn test src/architecture/module-layering.spec.ts --runInBand` | `5 passed, 5 total`; `profiles` ya forma parte de `MIGRATED_MODULES` |
| H1.S1.M3 | Se conservaron las suites existentes y sus aserciones; se ajustaron dobles a los puertos sin suprimir escenarios | `corepack yarn test src/modules/profiles --runInBand` | `29 passed, 29 total`; `568 passed, 568 total` |
| H1.S1.M4 | Gates del módulo y regresión completa en `dev` | comandos abajo | typecheck, ESLint, `git diff --check` y suite completa pasaron |

## Gates ejecutados en `dev`

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
Test Suites: 29 passed, 29 total
Tests:       568 passed, 568 total

corepack yarn test
Test Suites: 1 skipped, 823 passed, 823 of 824 total
Tests:       1 skipped, 10175 passed, 10176 total
Time:        139.733 s
exit code 0
```

Jest mostró avisos preexistentes de importación de JSON sin `with { type: 'json' }`; no afectaron los resultados.

## Pendiente

| Estado | Qué falta |
|---|---|
| Pendiente | Revisar/actualizar la rama contra `origin/dev` reciente y abrir PR a `dev` |
| Pendiente | Replicar el commit en un worktree basado en `origin/test`, ejecutar los gates dirigidos y abrir PR a `test` |
| No corrido | Integración y pruebas E2E, porque exigen stack/servicios; no se autorizó iniciarlos |

## Revisión de código propia

- Los imports de capas y los límites entre módulos pasan el guard; los adaptadores preservan las consultas/servicios que ya ejecutaba profiles.
- Los cambios de prueba mantienen las aserciones de comportamiento y sustituyen dependencias concretas por dobles del puerto. No se agregaron `skip`, `xit` ni `todo`, ni se borraron aserciones.
- No se modificaron `entities/`, SQL, DDL, rutas ni DTO HTTP. Se mantuvieron los contratos existentes y los nuevos archivos usan nombres en inglés.
- La revisión visual no aplica a esta migración de API.

## Limitaciones

- El resultado completo de la tarea 2.4 del handoff sigue abierto: después de `profiles` quedan `pharmacy_inventory`, `insurance`, `iam` y los otros módulos pendientes.
- No se creó aún ningún PR ni se mergeó nada.
