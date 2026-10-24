# Plan — Seguimiento de la revisión backend

> **Para agentes ejecutores:** aplicar `superpowers:executing-plans` o `superpowers:subagent-driven-development` y verificar cada microtarea antes de marcarla `HECHO`.

- Fecha: 2026-10-05 · Repo afectado: `mantra-core-health-api` · Predecesor: revisión backend del 2026-10-04 y PR #569.
- Resultado observable: el seguimiento documental queda sincronizado con `origin/dev`, conserva evidencia inmutable del SHA auditado y describe sin falsos positivos los contratos y bloqueos conocidos.
- Kill-test: `docs:modules:sync` deja diferencias, quedan enlaces de evidencia en `blob/dev`, aparece un enlace roto o se ocultan los rojos heredados.
- Reporte: [REPORTE.md](./REPORTE.md).

## Alcance

- IN: integración de `origin/dev`; Markdown de módulos y de `docs/revision-backend-2026-10-04`; tooling documental `tools/docs/sync-module-docs.mjs` y su test; este plan y su reporte.
- OUT: runtime de la API, archivos JSON/SQL, contratos productivos, corrección del test heredado de roles de insurance y cambios de umbral de cobertura.
- Ambigüedades registradas: ninguna. El SHA auditado se fija en `02af1e09`; `dev` queda para enlaces navegables a documentación vigente.

## H1 — Documentación sincronizada con la rama de integración

**CA:** Dada la versión actual de `origin/dev`, cuando se genera el catálogo, entonces los 70 módulos reflejan el árbol integrado y una segunda generación no produce diferencias.

**DoD:** merge de `origin/dev`; `node --test tools/docs/sync-module-docs.test.mjs`; dos ejecuciones de `corepack yarn docs:modules:sync`; segunda ejecución sin diferencias nuevas.

**Estado:** HECHO

### H1.S1 — Integrar y regenerar

**CA:** Dado el catálogo anterior, cuando se incorpora `origin/dev`, entonces se preservan los cambios del seguimiento y se actualizan las métricas de módulos.

**DoD:** inspección del merge y de `git diff --check`; generador y test dirigidos en verde.

**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Integrar `origin/dev` | El historial contiene ambos padres y no quedan conflictos | `git show --no-patch --pretty=raw HEAD` → merge observado; `git diff --check` → salida 0 | HECHO |
| H1.S1.M2 | Corregir el enlace generado y probar la terminación del archivo | El README generado apunta a `blob/dev` y termina en un salto de línea | `node --test tools/docs/sync-module-docs.test.mjs` → 1 test en verde | HECHO |
| H1.S1.M3 | Regenerar los 70 módulos | Dos ejecuciones producen el mismo árbol | `corepack yarn docs:modules:sync` dos veces → 70 módulos y segunda ejecución idempotente | HECHO |

## H2 — Evidencia y contratos documentales corregidos

**CA:** Dada la revisión del 2026-10-04, cuando se consultan sus informes, entonces la evidencia apunta al SHA auditado y el contrato público coincide con las excepciones reales.

**DoD:** búsquedas dirigidas sin `blob/dev` en los cuatro subárboles de evidencia; revisión de `modulos/public.md`; validadores documentales en verde.

**Estado:** HECHO

### H2.S1 — Inmovilizar evidencia y corregir hallazgos

**CA:** Los enlaces probatorios no dependen de una rama móvil y el informe público no inventa códigos ni razones.

**DoD:** comandos `rg` dirigidos y diff inspeccionado.

**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Fijar enlaces de evidencia | No queda `blob/dev` bajo `modulos`, `nucleo`, `transversal` ni `workers`; los enlaces usan `blob/02af1e09` | `rg 'blob/dev/' docs/revision-backend-2026-10-04/{modulos,nucleo,transversal,workers}` → sin coincidencias | HECHO |
| H2.S1.M2 | Corregir el informe de `public` | Cursor y perfil ausente reflejan los códigos reales y la ausencia de razón estable | Inspección dirigida de `docs/revision-backend-2026-10-04/modulos/public.md` contra las excepciones fuente | HECHO |
| H2.S1.M3 | Corregir el alcance declarado | El README maestro reconoce Markdown y tooling documental | `rg 'tooling de sincronización' docs/revision-backend-2026-10-04/README.md` → coincidencia | HECHO |

## H3 — Gates y cierre honesto

**CA:** Dado el diff final, cuando se ejecutan los gates documentales y técnicos aplicables, entonces sus resultados quedan registrados literalmente, incluidos los fallos heredados.

**DoD:** ejecutar los comandos listados y completar `REPORTE.md` con salidas reales.

**Estado:** BLOQUEADO

El alcance documental quedó verificado; el cierre de regresión permanece bloqueado por los rojos heredados detallados en el reporte.

### H3.S1 — Verificar y reportar

**CA:** Los documentos no tienen enlaces rotos ni errores estrictos de MkDocs, y los rojos heredados no se debilitan ni ocultan.

**DoD:** `docs:coverage`, `docs:links`, MkDocs estricto, `git diff --check`, typecheck y CI/test disponible; resultados literales en el reporte.

**Estado:** BLOQUEADO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Ejecutar gates documentales | Cobertura y enlaces documentales terminan en 0 | `corepack yarn docs:coverage && corepack yarn docs:links` → salida 0 | HECHO |
| H3.S1.M2 | Construir documentación estricta | MkDocs termina sin errores y devuelve 0 | `python -m mkdocs build --strict` → salida 0 | HECHO |
| H3.S1.M3 | Ejecutar gates técnicos aplicables | Typecheck y checks del diff terminan; cualquier rojo heredado queda identificado | `corepack yarn typecheck`; `git diff --check`; CI/test completo disponible | HECHO |
| H3.S1.M4 | Cerrar el reporte | Cada microtarea tiene estado y evidencia literal coherentes | inspección de `REPORTE.md` contra este plan | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El test de `insurance-controllers.spec.ts` espera menos roles que el controlador integrado | La suite completa queda roja | Registrar el rojo heredado; no borrar aserciones, no usar `skip` y no cambiar runtime fuera de alcance |
| Cobertura de ramas observada en 68,73 % frente al umbral de 69 % | El gate de cobertura queda rojo | Registrar el valor real; no bajar el umbral ni excluir código |
| Los enlaces de evidencia usan una rama móvil | Las líneas auditadas pueden cambiar | Fijarlos al SHA `02af1e09` y mantener `dev` sólo para documentación navegable vigente |
| `origin/dev` contiene cuatro errores de formato en `terminology/services/concepts.service.ts` | El gate de lint queda rojo antes de la suite completa | Registrar el rojo integrado; mantener el follow-up sin cambios de runtime |
