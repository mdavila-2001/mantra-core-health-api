# Reporte — Rojos preexistentes de API en `test`

- Fecha: 2026-10-11 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/fix-preexisting-api-test-reds`
- Peldaño de evidencia alcanzado: TESTED para los dos specs dirigidos; typecheck y lint del TypeScript tocado pasaron.
- Avance: 4 / 4 microtareas (100 %).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Se alinearon la aserción exacta y la tabla de acceso de `insurance.md` con los roles actuales de `ClaimsReadController` | `corepack yarn test --runInBand --silent src/modules/insurance/controllers/insurance-controllers.spec.ts src/common/seed/data/clinical-forms/catalog.spec.ts` | Los dos specs quedaron en verde; 40/40 pruebas. |
| H1.S2.M1 | Se reprodujeron los dos fallos de contenido del catálogo y sus valores observados | El mismo comando dirigido en `origin/test` limpio | `PSIQUIATRIA` tenía 3 formularios `BASE`; `PSIQ_SRQ20_TAMIZAJE` carecía de 4 opciones de diagnóstico presuntivo. |
| H1.S2.M2 | Se cotejaron los tamizajes con el README y el contrato `StandardFormKind` | Inspección de `catalog.ts`, `catalog.spec.ts`, los dos JSON OMS y `README.md` | `BASE` es consulta inicial; `SPECIFIC` es evaluación de condición. Los dos tamizajes OMS se habían agregado sin `kind`, y el validador los convertía por defecto en `BASE`. |
| H1.S2.M3 | Se declararon los dos tamizajes como `SPECIFIC` y se documentó el tipo y el conteo actualizado | Spec dirigido + `corepack yarn typecheck` + ESLint/Prettier de código + `git diff --check` | 40/40 pruebas; typecheck exit 0; ESLint exit 0; Prettier pasó para TS/JSON; `git diff --check` sin errores. |

## A medias
Ninguna.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Ninguno | — | Ninguno. |

## Evidencia

Corrida de referencia sobre `origin/test` antes del cambio:

```text
FAIL src/modules/insurance/controllers/insurance-controllers.spec.ts
Expected: ["BILLING_OPERATOR", "SECURITY_ADMIN"]
Received: ["BILLING_OPERATOR", "SECURITY_ADMIN", "BILLING", "FINANCE", "INSURANCE_OPERATOR", "USER"]
FAIL src/common/seed/data/clinical-forms/catalog.spec.ts
PSIQUIATRIA: expected bases=1, received bases=3
PSIQ_SRQ20_TAMIZAJE: expected opciones=true, received opciones=false
Test Suites: 2 failed, 2 total
Tests: 3 failed, 37 passed, 40 total
```

Corrida luego del cambio:

```text
Test Suites: 2 passed, 2 total
Tests: 40 passed, 40 total
Snapshots: 0 total
Time: 1.177 s
```

Gates:

```text
corepack yarn typecheck → exit 0
corepack yarn eslint --max-warnings=0 src/modules/insurance/controllers/insurance-controllers.spec.ts → exit 0
corepack yarn prettier --check <spec TypeScript y dos JSON> → All matched files use Prettier code style!
git diff --check → exit 0
```

La lectura de reclamos amplió deliberadamente la organización activa a prestadores y aseguradoras en `d08a628ae` (`feat(insurance): lectura de solicitudes recibidas acotada al tenant aseguradora`). El plan H4 define el acceso desde el tenant PAYER, y `ClaimsReadService` divide las consultas entre prácticas/unidades del proveedor y la aseguradora del tenant. La aserción y la tabla de acceso seguían con los dos roles previos a H4. Se conservaron como exacta una verificación de los seis roles; el servicio mantiene el límite por tenant.

## No cubierto
- No se ejecutó la suite unitaria completa; sólo los dos specs de esta tarea.
- Prettier de los dos Markdown existentes (`docs/modules/insurance.md` y `clinical-forms/README.md`) señala reformatos amplios también fuera de este diff. No se aplicó ese reformatado general; sí pasó `git diff --check` y se revisaron manualmente los cambios de contenido.

## Desvíos del plan
- El primer clon de dependencias era un enlace simbólico hacia una ruta ausente, por lo que Yarn no encontró `.yarn-state.yml` y la invocación directa de Jest no encontró `jest-cli`. Se sustituyó por un clon APFS del `node_modules` real de `wt-harness-worm-dev`; no se instaló ningún paquete.
- La clase `SPECIFIC` se asignó directamente en los dos JSON OMS importados. No se cambió el generador `tools/clinical-forms`, ya que estos instrumentos se mantienen en archivos fuente y se agregan al catálogo por imports explícitos.

## Riesgos residuales
- Los seis roles de transporte están limitados por el alcance del servicio al tenant activo. Un cambio futuro del contrato de lectura debe actualizar el test y el índice `docs/modules/insurance.md` juntos.
- La base local debe recibir el seed actualizado en su próximo arranque/carga de catálogos para persistir los nuevos `kind` de los dos formularios.

## Decisiones y ambigüedades
- `insurance-controllers.spec.ts`: expectativa obsoleta, no defecto de runtime. El cambio H4 agregó lectura para aseguradoras, mantuvo aislamiento por tenant y amplió deliberadamente la lista de roles; se actualizó la prueba y la tabla documental sin relajarla.
- `catalog.spec.ts`: datos del catálogo obsoletos. Los instrumentos OMS son evaluaciones de tamizaje focalizadas, no consultas iniciales; se marcó cada uno como `SPECIFIC` sin alterar las aserciones de una ficha base por especialidad ni la exigencia de diagnóstico en las fichas `BASE`.
