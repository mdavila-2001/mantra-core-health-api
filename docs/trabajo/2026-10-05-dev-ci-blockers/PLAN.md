# Plan — Restaurar los gates de CI de `dev`

- Fecha: 2026-10-05 · Repo afectado: `mantra-core-health-api` · Predecesor: revisión backend del 2026-10-04 y PR #574.
- Resultado observable: la rama de corrección elimina los rojos heredados reproducibles de lint, contrato de roles de insurance y cobertura sin relajar ninguna protección.
- Kill-test: lint continúa rojo, el spec de roles no refleja la política autorizada o la cobertura de ramas permanece por debajo de 69 %.
- Reporte: [REPORTE.md](./REPORTE.md).

## Alcance

- IN: formato puntual de `terminology`; contrato y pruebas de roles de lectura de reclamos en `insurance`; pruebas significativas para ramas reales sin cobertura; plan, reporte y evidencia.
- OUT: nuevas funcionalidades, cambios de esquema o migraciones, cambios de API no requeridos por la política existente, bajar umbrales, exclusiones de cobertura, `skip`, borrar pruebas o debilitar aserciones.
- Ambigüedades registradas: la intención de los cuatro roles adicionales de `ClaimsReadController` se resuelve mediante documentación, historial y código consumidor antes de editar; hasta contar con esa evidencia no se asume si el defecto está en el controlador o en el spec.

## H1 — Lint de TypeScript restaurado

**CA:** Dada la base actual de `dev`, cuando se ejecuta lint estricto, entonces no hay errores ni advertencias.

**DoD:** reproducir el fallo; aplicar sólo el formato exigido; `corepack yarn lint --max-warnings=0` termina con código 0.

**Estado:** COMPLETADO

### H1.S1 — Corregir el formato heredado de terminology

**CA:** Dado el método afectado, cuando Prettier lo valida, entonces conserva la misma semántica y no reporta diferencias.

**DoD:** diff sólo de espacios/saltos; lint completo verde.

**Estado:** COMPLETADO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Reproducir y localizar el rojo de lint | El error coincide con `concepts.service.ts:949-952` en la base | `corepack yarn lint --max-warnings=0` → cuatro errores Prettier esperados | COMPLETADO |
| H1.S1.M2 | Aplicar el formato canónico mínimo | El diff no altera tokens ni comportamiento | `corepack yarn prettier --check src/modules/terminology/services/concepts.service.ts` o gate equivalente → 0 | COMPLETADO |

## H2 — Política de roles de insurance verificada

**CA:** Dada la política publicada para lectura de reclamos, cuando se inspecciona metadata del controlador, entonces los roles exigidos coinciden con esa política y el test falla ante una ampliación accidental.

**DoD:** investigación documentada; prueba dirigida roja por la causa correcta; cambio mínimo; spec completo verde.

**Estado:** COMPLETADO

### H2.S1 — Resolver la divergencia entre controlador y spec

**CA:** La lista de roles se deriva de evidencia del repositorio y no de hacer pasar el test.

**DoD:** `git log`/docs/código respaldan la decisión y `insurance-controllers.spec.ts` pasa 21/21 sin quitar aserciones.

**Estado:** COMPLETADO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Determinar la política autorizada | Historial, documentación y consumidores apuntan a una única matriz | Registro de evidencia en `REPORTE.md` | COMPLETADO |
| H2.S1.M2 | Escribir la regresión antes del cambio productivo, si aplica | La prueba falla por la política incorrecta | Spec dirigido rojo observado | COMPLETADO |
| H2.S1.M3 | Implementar la corrección mínima | El contrato de roles coincide exactamente con la política respaldada | `corepack yarn test src/modules/insurance/controllers/insurance-controllers.spec.ts --runInBand` → 21/21 | COMPLETADO |

## H3 — Umbral de cobertura recuperado con comportamiento real

**CA:** Dado el umbral global vigente de 69 % para ramas, cuando corre la suite completa, entonces lo supera mediante casos significativos y sin exclusiones.

**DoD:** localizar ramas reales sin cubrir; observar pruebas nuevas rojas o cobertura faltante; agregar casos mínimos; suite completa y cobertura en verde.

**Estado:** COMPLETADO

### H3.S1 — Cubrir ramas recientes de mayor valor

**CA:** Los casos agregados ejercitan decisiones de negocio observables y fallarían si esas decisiones se rompieran.

**DoD:** pruebas dirigidas verdes y `corepack yarn test --coverage --runInBand` supera 69 % de branches.

**Estado:** COMPLETADO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Medir la cobertura actual y localizar ramas | Existe una lista ordenada de archivos y ramas sin cubrir | Suite con cobertura produce reporte verificable | COMPLETADO |
| H3.S1.M2 | Agregar pruebas significativas mínimas | Cada caso nuevo protege una decisión de negocio concreta | Specs dirigidos verdes y diff sin exclusiones | COMPLETADO |
| H3.S1.M3 | Ejecutar regresión completa | Lint, typecheck, suite y cobertura cumplen sus umbrales | Gates completos con código 0 | COMPLETADO |

## H4 — Entrega revisada

**CA:** Dado el diff final, cuando lo revisa un tercero y corre CI, entonces no quedan issues críticos ni rojos atribuibles al cambio.

**DoD:** revisión independiente; reporte obligatorio; commit, push y PR contra `dev`; CI observado.

**Estado:** EN CURSO

### H4.S1 — Documentar y publicar

**CA:** El cambio es auditable y no mezcla trabajo fuera del alcance.

**DoD:** `git diff --check`, revisión final, `REPORTE.md`, PR y checks.

**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Completar evidencia y revisión | Reporte y revisión coinciden con salidas reales | Inspección del reporte + reviewer sin issues críticos | COMPLETADO |
| H4.S1.M2 | Publicar el cambio | Rama remota y PR contienen sólo el alcance declarado | `gh pr checks` observado | EN CURSO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Actualizar el spec de roles para copiar el runtime puede legitimar una ampliación accidental | Pérdida de control de acceso | Resolver intención mediante historial y contratos antes de editar |
| Perseguir porcentaje con pruebas triviales | Cobertura nominal sin protección | Cubrir decisiones de negocio y demostrar qué mutación detectaría cada prueba |
| `dev` vuelve a avanzar durante el trabajo | Nuevos rojos o métricas distintas | Integrar la base actual antes del cierre y repetir todos los gates |
