# Plan — Reparar PR #641 de capas DDD en pharmacy_inventory

- Fecha: 2026-10-11 · Repos afectados: `mantra-core-health-api` · Predecesor: migración DDD de `pharmacy_inventory` en PR #641
- Resultado observable: PR #641 contra `dev` vuelve a ser integrable y el workflow de documentación/lint termina correctamente.
- Kill-test: `corepack yarn lint --max-warnings=0` reproduce el fallo en `src/modules/terminology/repositories/glossary-search.sql.ts`.

## Alcance
- IN: resolver el import sin uso que hace fallar el check; incorporar los commits nuevos de `dev` en la rama del PR; revalidar gates afectados y actualizar este reporte.
- OUT: cambios de comportamiento, cambios de esquema/modelo, reparación general de errores ajenos a los checks de este PR.
- Ambigüedades registradas: ninguna. El CI identifica un import directo no usado; la corrección conserva la exportación pública.

## H1 — PR #641 integrable y con lint verde
**CA:** Dado el PR con `dev` actualizado, cuando corren los gates de lint y arquitectura, entonces terminan en código 0 y el PR aparece integrable.
**DoD:** `corepack yarn lint --max-warnings=0`, typecheck, tests dirigidos de `pharmacy_inventory` y guard de capas; `gh pr view 641` muestra mergeable y checks aplicables verdes.
**Estado:** EN CURSO

### H1.S1 — Resolver bloqueo de lint
**CA:** Dado el archivo SQL de búsqueda, cuando ESLint lo analiza, entonces no reporta imports no usados y sigue exportando `normalizeSearchText`. **DoD:** `corepack yarn lint --max-warnings=0` → salida 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Quitar el import local duplicado y conservar la reexportación | `normalizeSearchText` sigue exportado y ESLint no reporta unused vars | `corepack yarn lint --max-warnings=0` → código 0 | HECHO |

### H1.S2 — Sincronizar con la base actual
**CA:** Dado que `dev` avanzó, cuando se integra en la rama del PR, entonces la rama contiene la base actual sin conflictos pendientes ni pérdida de cambios del PR.
**DoD:** `git merge-tree` sin conflictos; `git status` limpio; `gh pr view 641` sin estado `DIRTY`.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Integrar la punta actual de `origin/dev` en la rama del PR y resolver conflictos, si aparecen | El ancestro/base de integración es la punta vigente de `dev` | `git merge-base --is-ancestor origin/dev HEAD` → código 0 | TODO |

### H1.S3 — Revalidar los gates del PR
**CA:** Dado el código reparado y la base vigente, cuando se ejecutan los gates del módulo, entonces todos terminan en código 0.
**DoD:** lint, typecheck, tests dirigidos del módulo y guard de capas → salidas 0; CI del PR verde.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S3.M1 | Ejecutar gates locales dirigidos y lint global | Los cuatro gates concluyen sin fallos | comandos en H1 → salidas literales en `evidencia/` | TODO |
| H1.S3.M2 | Actualizar y revisar el reporte de reparación | Reporte lista resultados literales y límites restantes | revisión del `REPORTE.md` → todas las secciones obligatorias presentes | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| `dev` modificó muchos archivos desde el origen del PR | La integración puede revelar conflictos ajenos a farmacia | Revisar el árbol combinado antes de integrar; registrar y limitar resoluciones al mínimo |
| El lint global puede revelar más errores preexistentes | El check de CI puede seguir rojo por defectos fuera del alcance | Corregir solo los bloqueos concretos del PR y registrar cualquier fallo adicional en el reporte |
