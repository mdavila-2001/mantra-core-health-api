# Reporte — Hito 1: reconciliación de origin/test en dev

> **AVANCE: 9 / 11 — 81,8 %.** Falta CA-3 en runtime (BLOQUEADA) y el gate mergeable del PR (A MEDIAS hasta consultarlo tras el último push).

- Fecha: 2026-09-30 · Plan: [PLAN.md](./PLAN.md) · Rama: `marcelo/fix-sincronizacion-backend-dev-test` desde `origin/dev` @ `bb35e529` · merge de `origin/test` @ `0676225d`
- Peldaño de evidencia alcanzado: **`TESTED`** (typecheck, lint, suites dirigidas y unitaria completa sobre la fusión). **No es `VERIFIED`**: el arranque de Nest no se observó en runtime. `REGRESSION_VERIFIED` no aplica: no se corrió integración ni smoke.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Pre-vuelo y worktree sin upstream | `git merge-tree --write-tree origin/dev origin/test` | exit 0, árbol `fb0bd909…`; `origin/dev == bb35e529` |
| H1.S1.M2 | Baselines en ambas ramas | typecheck, lint, suites dirigidas | test: tsc 0, lint 39 (26 únicos), 70 suites/761 pruebas · dev: tsc 0, lint 36 (29 únicos), 65 suites/714 pruebas, importadores 13/13, build 0 (`evidencia/01…07b`) |
| H1.S2.M1 | Merge `--no-ff` de `origin/test` | `git merge --no-ff origin/test -F …` | 4 × Auto-merging, sin conflictos; árbol del merge == `fb0bd9097bfa0a798d6154c1ca276738e6157563` (`08-merge.txt`) |
| H1.S2.M2 | Cero pérdida de código | kill-tests de contenido | 0 `D\|R` contra dev y contra test; 60 archivos sólo-dev y 552 sólo-test byte-idénticos a su lado; `insurance/` == test; 15 commits sobre test y 150 sobre dev (`08c`, `08b`) |
| H1.S3.M1 | Typecheck de la fusión | `corepack yarn typecheck` | exit 0 (`10`) |
| H1.S3.M2 | Lint por diferencia de conjuntos | `comm -13 <unión baselines> <fusión>` | 0 errores nuevos; la fusión queda igual al lint de test (26 únicos) y desaparecen 16 de dev (xlsx-parser, modificado también por test). Un primer intento murió con segfault (exit 139, entorno); el reintento completó (`11`, `11b`) |
| H1.S3.M3 | Suites dirigidas e importadores | `corepack yarn test --testPathPatterns=…`; `test:terminology-import` | 73 suites / 801 pruebas en verde; importadores 13/13 (`12`, `13`) |
| H1.S3.M4 | Unitaria completa | `corepack yarn test` | 770 suites y 9 371 pruebas en verde, 1 suite en rojo **previa a la fusión** (ver «A medias» H1.S3.M4) (`14`) |
| H1.S4.M1 | CA-2 estático | `ls database/SQL/patches` y `diff` contra el modelo | sin colisiones de número ≥ v4232; v4221 idéntico al del modelo (`09c`) |

## A medias
### H1.S3.M4 — Una suite en rojo previa a la fusión
- Qué anda: 770 de 771 suites; las dirigidas de ambas familias pasan.
- Qué no anda: `insurance-controllers.spec.ts`, prueba «la lectura de solicitudes exige BILLING_OPERATOR o SECURITY_ADMIN». El controlador declara seis roles y el spec espera dos.
- Causa raíz: el mismo commit de lectura de solicitudes (#513 en dev, #514 en test) amplió los roles del controlador y no actualizó el spec. Falla igual en `origin/test` (`15`) y con la versión del spec de `dev` sobre el controlador idéntico (`15b`): **no la introduce la fusión**.
- Qué falta exactamente: alinear la aserción del spec con los seis roles, o acotar el controlador si la intención era dos. Es una decisión del autor de #513; no se toca en este PR.
- Dónde quedó: sin cambios en el repo.

### H1.S5.M1 — PR y gate mergeable
- Qué anda: rama, merge, plan y evidencia commiteados.
- Qué falta exactamente: pegar `gh pr view … --json …` y `gh pr checks` tras el último push (en un comentario del PR, para no provocar otro push).

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S4.M2 | BLOQUEADA | CA-2 dinámico (columnas, política y FKs por SQL) y CA-3 en runtime (arranque de Nest, `/health`, rutas testigo) exigen un stack local aislado. Al arrancar Docker Desktop se reiniciaron solos los contenedores del stack de desarrollo habitual, que apunta a bases en la nube, y no se pudo detenerlos. Hace falta que el propietario decida qué hacer con ese stack antes de levantar otro |
| Nivelar `test` | PENDIENTE | PR mergeado con merge commit de dos padres y autorización explícita |

## No cubierto
- Arranque de Nest y orden de módulos (CA-3 dinámico): lo que sí hay es typecheck 0 y `app.module.wiring.spec` en verde, que son necesarios pero no suficientes.
- Aplicación real de v4.2.32/36/37 sobre Postgres (v4.2.36 nunca se ejecutó contra una base).
- `CorsIoAdapter` con orígenes permitido y denegado y la autenticación `afterInit` del gateway (requieren handshake socket.io).
- Integración y smoke: truncan datos y el harness toma la conexión del entorno.
- Regeneración de `openapi/`, `docs/modules`, `docs/data`, `docs/postman`.

## Evidencia
```text
git rev-parse HEAD^{tree}          -> fb0bd9097bfa0a798d6154c1ca276738e6157563 (== esperado)
git diff --name-status … | grep -cE '^(D|R)'   -> 0 (dev) · 0 (test)
corepack yarn test --testPathPatterns=…         -> Test Suites: 73 passed · Tests: 801 passed
corepack yarn test (completa)                   -> Test Suites: 1 failed, 1 skipped, 770 passed · Tests: 1 failed, 1 skipped, 9371 passed · 462 s
```
Salidas literales en `evidencia/`.

## Desvíos del plan
- El lint se midió con `--format json` normalizado con un script propio: el formateador `unix` ya no viene con ESLint.
- `lint` sobre la fusión dio segfault una vez (exit 139) y se reintentó; el resultado válido es el del segundo intento.
- La copia vendida `database/SQL/patches` está **desfasada respecto del modelo**: el modelo ya renumeró v4219/v4220 a v4224–v4227 y tiene v4228 (`pharma_lab`), v4229, v4230 y v4231-seed que la API no trae. Ya era así en `dev` (no toca `database/`). Ver `09c`.
- Se arrancó Docker Desktop para CA-3 y eso reinició el stack habitual (ver «Riesgos residuales»).

## Riesgos residuales
- **Efecto secundario no deseado:** el stack local de siempre (API con `SEED_ON_BOOT=true` y workers, política de reinicio permanente) se reinició al arrancar Docker Desktop y se conectó a las bases en la nube. El arranque de la API materializó 15 conceptos internos; los demás pasos de siembra insertaron 0. Los contenedores siguen corriendo: detenerlos fue denegado y se deja a decisión del propietario.
- Mergear a `dev` puede desplegar en Coolify y aplicar v4.2.32/36/37; revertir el merge devuelve código, no esquema.
- CI de `docs.yml` previsiblemente en rojo: `openapi/` y docs generados sin regenerar en `dev`, 39 problemas de lint previos y dependencia de facturación.

## Decisiones y ambigüedades
- «lint 0 errores» no es alcanzable; criterio aplicado: sin errores nuevos respecto de la unión de baselines. Confirmar con Pablo.
- CA-2 reformulado: no existe una «v4.2.37 canónica»; la promoción de los tres parches al modelo es seguimiento.
- Método de merge pedido: «Create a merge commit».
