# Plan — Hito 1: reconciliación de origin/test en dev (2026-09-30)

- Fecha: 2026-09-30 · Repos afectados: `mantra-core-health-api` (sólo este) · Predecesor: ninguno
- Resultado observable: existe un PR abierto hacia `dev` que trae los 149 commits de `origin/test` sin perder ni uno de los 14 propios de `dev`, con el esquema, el arranque de Nest y las suites dirigidas verificados y lo no cubierto declarado.
- Kill-test: `git rev-parse HEAD^{tree}` del merge commit ≠ `fb0bd9097bfa0a798d6154c1ca276738e6157563` (el árbol que `git merge-tree` calculó sin conflictos), o algún archivo tocado por un solo lado no es byte-idéntico a ese lado.

Rama `marcelo/fix-sincronizacion-backend-dev-test` desde `origin/dev` (`bb35e529`), en un worktree dedicado sin upstream. Plan completo aprobado en la sesión de planificación (ver `REPORTE.md` para los desvíos).

## Alcance
- IN: merge de `origin/test` (`0676225d`) en la rama; baselines de typecheck/lint/suites dirigidas en ambas ramas; verificación sobre la fusión; PLAN/REPORTE y evidencia; push de la rama; PR a `dev` con los reviewers `Jsaldias39` y `PabloArauzCaballero`; consulta del estado mergeable.
- OUT: cambios de código de producto; `database/` y el repo del modelo; `yarn db:vendor`, `orm:catalog`, `gen_entities.py`; regenerar `openapi/`, `docs/modules`, `docs/data`, `docs/postman`, `asyncapi/`; int-specs y `yarn smoke` (truncan datos); cualquier conexión a bases en la nube; arreglar lint o tests previos; mergear el PR; nivelar `test` sin autorización explícita; los 2 stashes ajenos.
- Ambigüedades registradas:
  - «lint 0 errores» no es alcanzable (35 previos en test, 36 en dev). Supuesto: la fusión no añade errores respecto de la unión de ambos baselines. Confirmar con Pablo.
  - CA-2 («v4.2.37 canónica») no es satisfacible: v4.2.32/36/37 sólo existen en `database/` de la API; el modelo está en v4.2.31 y su manifiesto dice 4.0.10. CA-2 se reformula y la promoción al modelo es seguimiento. Confirmar con Pablo.
  - Método de merge del PR: «Create a merge commit». Confirmar con Pablo.
  - Docker Desktop no está corriendo: CA-3 en runtime (arranque de Nest) queda BLOCKED si no se puede levantar.

## H1 — Reconciliar `origin/test` en `dev` sin pérdida de código
**CA:** Dado que `dev` aporta CORS por entorno, claims-read y glosario en castellano, y `test` aporta laboratorio, farmacia y los parches v4.2.32/36/37, cuando se fusionan, entonces el árbol resultante contiene ambos lados íntegros, compila, y sus suites dirigidas no tienen fallos nuevos.
**DoD:** typecheck exit 0; lint sin errores nuevos; suites dirigidas sin FAIL nuevo; `git status` limpio; PR abierto con reviewers y estado mergeable pegado.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Pre-vuelo y worktree sin upstream | `origin/dev == bb35e529`, merge-tree exit 0 | `git merge-tree --write-tree origin/dev origin/test` → `fb0bd909…` | HECHO |
| H1.S1.M2 | Baselines en test y en dev | rojos previos identificados | `corepack yarn typecheck`, `lint`, `test --testPathPatterns=…` en cada rama | TODO |
| H1.S2.M1 | Merge `--no-ff` de `origin/test` | 0 conflictos, árbol == `fb0bd909…` | `git rev-parse HEAD^{tree}` → `fb0bd9097bfa0a798d6154c1ca276738e6157563` | TODO |
| H1.S2.M2 | Kill-tests de contenido | 0 `D\|R`; archivos de un lado byte-idénticos; 15/150 commits | `git diff --quiet origin/<lado> HEAD -- <archivos>` exit 0 | TODO |
| H1.S3.M1 | Typecheck sobre la fusión | exit 0 | `corepack yarn typecheck` → exit 0 | TODO |
| H1.S3.M2 | Lint por diferencia de conjuntos | conjunto nuevo vacío | `comm -13 <unión baselines> <fusión>` → vacío | TODO |
| H1.S3.M3 | Suites dirigidas + importadores | sin FAIL nuevo; 13/13 | `corepack yarn test --testPathPatterns=…`; `corepack yarn test:terminology-import` | TODO |
| H1.S3.M4 | Unitaria completa | sin regresión atribuible a la fusión | `corepack yarn test` | TODO |
| H1.S4.M1 | CA-2 estático (colisiones de número, v4221 idéntico al modelo) | sin colisiones nuevas ≥ v4232 | `ls database/SQL/patches` + `diff` contra el modelo | TODO |
| H1.S4.M2 | CA-2/CA-3 dinámico (Postgres + arranque) | 6 columnas / 1 política / 5 FKs; `/health` 200 | `psql` y `node dist/src/main.js` con `.env.verify` local | BLOQUEADA (Docker apagado) salvo que arranque |
| H1.S5.M1 | Push de la rama y PR a dev | PR abierto con 2 reviewers | `gh pr create …`; `gh pr view --json …` | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| El arranque de Nest relee `<cwd>/.env` (Neon/Atlas) | Escritura en una base en la nube | Arrancar sólo desde un cwd aislado con `.env.verify` local y kill-test de host; si no hay Docker, BLOCKED |
| `dev` se mueve durante el hito | Merge obsoleto | Verificar `origin/dev` antes y después de cada push; `git merge origin/dev` (nunca rebase) |
| Proceso ajeno que commitea o empuja a `dev` en esta máquina | Pérdida o publicación indebida | Rama sin upstream, `push -u origin <rama>` explícito, prefijo de verificación de rama/HEAD en cada bloque |
| CI `docs.yml` en rojo por `openapi/` no regenerado, lint previo y facturación | PR `UNSTABLE` | Declararlo en el PR y en el reporte como A MEDIAS con la causa; no se deshabilita nada |
| Mergear a `dev` puede desplegar (Coolify) y aplicar v4.2.32/36/37 | DDL no reversible con un revert | Declarar en el PR; preguntar por auto-deploy y backup antes de mergear |
