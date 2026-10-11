# Plan — Rojos preexistentes de API en `test`

- Fecha: 2026-10-11 · Repos afectados: `mantra-core-health-api` · Predecesor: handoff `CODEX-HANDOFF-2026-10-10.md`, tarea 2.6
- Resultado observable: cada rojo queda comparado con la política vigente y con sus datos de prueba; sólo se corrige el lado desactualizado, sin debilitar aserciones.
- Kill-test: una prueba dirigida sobre la base `origin/test` limpia que no reproduzca los fallos invalida la clasificación inicial y obliga a revisar la evidencia.

## Alcance
- IN: `src/modules/insurance/controllers/insurance-controllers.spec.ts`; `src/modules/insurance/controllers/claims-read.controller.ts`; `docs/modules/insurance.md`; `src/common/seed/data/clinical-forms/catalog.spec.ts`; los JSON de los tamizajes SRQ-20 y AUDIT; `src/common/seed/data/clinical-forms/README.md`.
- OUT: cambiar permisos de runtime sin respaldo de política; eliminar, saltar o rebajar pruebas; cambiar módulos ajenos.
- Ambigüedades registradas: decidir si las expectativas de roles y catálogo corresponden a documentación/política vigente o si el código/datos de producción incumplen ese contrato.

## H1 — Clasificar y resolver los rojos preexistentes de API
**CA:** Dado el código y los contratos de API en `origin/test`, cuando corran los specs dirigidos, entonces no queda ningún rojo de estos casos o queda una causa no corregible respaldada por evidencia.
**DoD:** specs dirigidos de ambos archivos, diff revisado y `git diff --check`; typecheck si cambia TypeScript; nunca debilitar aserciones.
**Estado:** HECHO

### H1.S1 — Alinear prueba y documentación con lectura por tenant
**CA:** La prueba y el README reflejan los roles vigentes para lectura de reclamos en tenant de prestador o aseguradora.
**DoD:** spec dirigido en base `test`; cotejo con H4 («solicitudes recibidas») y con el alcance por tenant de `ClaimsReadService`.
**Estado:** HECHO

### H1.S2 — Resolver los dos rojos del catálogo de fichas clínicas
**CA:** Los criterios de las pruebas se ajustan a las fichas fuente verificadas, o los datos corregidos satisfacen el contrato sin ocultar errores.
**DoD:** spec dirigido en base `test`; cotejo de los archivos fuente y de los invariantes de catálogo.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Actualizar expectativa exacta y fila de documentación de roles | Aserción íntegra coincide con los seis roles del controlador y el README los enumera | `corepack yarn test src/modules/insurance/controllers/insurance-controllers.spec.ts` + `git diff --check` | HECHO |
| H1.S2.M1 | Ejecutar el spec de catálogo y obtener las dos aserciones exactas | Ambos fallos quedan identificados, sin atenuarlos | spec dirigido | HECHO |
| H1.S2.M2 | Verificar los dos formularios OMS contra el contrato de clases de ficha | Los tamizajes no se clasifican como consulta base | inspección de JSON y `catalog.ts` → `kind` con significado coherente | HECHO |
| H1.S2.M3 | Declarar ambos tamizajes como fichas específicas | Se conserva exactamente una ficha base por especialidad | `corepack yarn test src/common/seed/data/clinical-forms/catalog.spec.ts` | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| La política de permisos depende de una decisión externa no versionada | No se puede elegir entre ajustar test o runtime | Buscar ADR/documento de autorización antes de modificar el contrato |
| La clase de ficha determina si cuenta como consulta inicial | Los tamizajes pueden aparecer como formularios base y quebrar el flujo de consulta | Declarar el tipo de ficha y conservar la prueba de una base por especialidad |
