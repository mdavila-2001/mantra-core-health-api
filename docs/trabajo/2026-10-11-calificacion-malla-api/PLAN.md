# Plan — Calificación en malla (API, PR #629)

- Fecha: 2026-10-11 · Repos afectados: `mantra-core-health-api` · Predecesor: PR del modelo #47
- Resultado observable: la API expone calificaciones médico ↔ paciente ↔ organización usando `community.party_ratings`, con contrato generado y pruebas disponibles; el PR queda listo para revisión cuando exista el esquema requerido.
- Kill-test: `corepack yarn test --runInBand src/modules/community/services/party-ratings` debe cubrir ambos servicios, y la regeneración OpenAPI debe incluir las tres rutas de calificaciones.

## Alcance
- IN: resolver el conflicto del PR contra `dev`; validar TypeScript, lint y pruebas unitarias del cambio; actualizar contrato/docs si la generación lo requiere; verificar la dependencia del modelo y hacer integración si queda disponible.
- OUT: modificar `mantra-core-health-model`, aplicar cambios a bases compartidas, mergear PRs, desplegar.
- Ambigüedades registradas: ninguna. El modelo #47 sigue abierto; no se supondrá el esquema ni se declarará integración hasta que se mergee y el DDL exista en una base local.

## H1 — Código y rama compatibles con `dev`
**CA:** Dado el PR #629 y el `dev` actual, cuando se integra la base actual en la rama, entonces el diff de calificaciones queda sin conflictos y conserva el alcance del PR.
**DoD:** `git merge origin/dev` sin conflictos de contenido funcional; `git diff --check`; `gh pr view 629` informa `mergeable`.
**Estado:** TODO

### H1.S1 — Sincronizar la rama
**CA:** Dado el PR marcado conflictivo, cuando se resuelven los conflictos, entonces no quedan marcadores ni cambios ajenos sin revisar. **DoD:** `git diff --check` y `git status --short` revisados.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Integrar el `origin/dev` vigente en la rama del PR | Merge sin conflictos pendientes | `git status --short` vacío de archivos en conflicto; `git diff --check` → 0 | TODO |

## H2 — Validación local de la API
**CA:** Dado el código actualizado, cuando se corre typecheck, lint y los specs dirigidos, entonces todos terminan con código 0.
**DoD:** salidas literales archivadas en `evidencia/`; ningún test omitido o debilitado.
**Estado:** TODO

### H2.S1 — Gates dirigidos
**CA:** Las rutas, DTOs y reglas de autorización compilan y sus pruebas pasan. **DoD:** comandos de la tabla.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Typecheck de API | Sin errores TS | `corepack yarn typecheck` → código 0 | TODO |
| H2.S1.M2 | Lint de API | Sin errores de lint nuevos | `corepack yarn lint --max-warnings=0` → código 0 | TODO |
| H2.S1.M3 | Specs dirigidos a ratings | Todas las pruebas del módulo pasan | `corepack yarn test --runInBand src/modules/community/services/party-ratings` → código 0 | TODO |

## H3 — Contrato documentado
**CA:** Dado el controlador activo, cuando se genera OpenAPI y la documentación, entonces el contrato incluye POST/GET de ratings y no quedan cambios de generación pendientes.
**DoD:** build, lint OpenAPI y cobertura de docs con salidas archivadas.
**Estado:** TODO

### H3.S1 — OpenAPI y docs
**CA:** Las tres rutas de `community/ratings` aparecen en OpenAPI con sus DTOs. **DoD:** generación y validadores.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Regenerar OpenAPI y Markdown | Rutas y esquemas presentes | `corepack yarn docs:openapi:generate && corepack yarn docs:endpoints:generate && corepack yarn docs:modules:sync` → código 0 | TODO |
| H3.S1.M2 | Validar contrato/documentación | Sin errores de contrato o cobertura | `corepack yarn docs:openapi:lint && corepack yarn docs:coverage` → código 0 | TODO |

## H4 — Integración respaldada por el modelo
**CA:** Dado que el modelo #47 esté mergeado y la base local tenga `community.party_ratings`, cuando se ejecuta la integración, entonces alta/lecturas persisten y respetan las referencias.
**DoD:** `corepack yarn test:integration --runInBand` con la spec real del módulo y la base limpia.
**Estado:** BLOQUEADO

### H4.S1 — Esperar esquema canónico
**CA:** El DDL generado desde el modelo y aplicado localmente contiene la tabla y sus ocho FK. **DoD:** PR #47 mergeado, chequeo del DDL y spec de integración verde.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Confirmar merge de modelo y disponibilidad del DDL | Tabla y referencias canónicas presentes en base local | `gh pr view 47 --repo mantra-core-technologies/mantra-core-health-model` + spec de integración → verde | BLOQUEADO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| El modelo #47 sigue abierto y la migración aún no puede aplicarse con evidencia canónica | No se puede verificar persistencia real ni cerrar el borrador | Mantener H4 bloqueado hasta merge y aplicación local del DDL generado |
| `dev` avanzó desde la base del PR | Conflictos y regresiones al sincronizar | Resolver y correr gates de API antes de actualizar PR |
