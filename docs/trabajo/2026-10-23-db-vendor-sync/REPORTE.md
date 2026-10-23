# Reporte — Resincronizar `database/` con el modelo (sin quitar DDL propio de la API)

- Fecha: 2026-10-23 · Plan: [PLAN.md](./PLAN.md) · Rama: `marcelo/db-vendor-sync-2026-10-23` · PR: [#675](https://github.com/mdavila-2001/mantra-core-health-api/pull/675) · Base: `origin/dev` (`6ea11561`)
- Peldaño de evidencia alcanzado: **WRITTEN con comprobaciones estáticas**. No se ejercitó la creación de una base limpia (sin Docker), que es la única prueba que demuestra que esta copia despliega. Lo máximo que se puede decir: «la copia es coherente en sí misma y no quita nada».
- Avance de microtareas: **10 / 10 HECHO (100 %)**, calculado. **Pero el objetivo original NO se cumplió:** `yarn ddl:sources` sigue en exit 1. El hito H1 queda **A MEDIAS**, y por eso el porcentaje de microtareas no debe leerse como «pendiente cerrado».

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.M1 | Dry-run del script oficial y análisis de lo que borraría | `bash scripts/db/vendor-ddl.sh --check` (WSL) | 16 borrados, 33 nuevos, 450 «modificados» (casi todo fin de línea); 9 de los parches a borrar crean objetos que no están en el modelo (tabla del plan) |
| H1.M2 | Copia de `SQL/` y `NoSQL/` sin `--delete` | `rsync -a --exclude … SRC/ DST/` | `>>> SQL copiado`, `>>> NoSQL copiado` |
| H1.M3 | Cero líneas quitadas, cero archivos borrados | `git diff --cached --numstat` | `añadidas 8646 \| quitadas 0` · `borrados en el commit: 0`; se revirtieron 14 archivos |
| H1.M4 | Coherencia interna de la copia | `check-apply-refs.py` + lectura de las `05_constraints` | 262 + 62 referencias, 0 faltantes; las 5 columnas que usan las constraints nuevas existen |
| H1.M5 | Lo nuevo quedó copiado; lo distinto es solo DDL propio de la API | `check_ddl_sources.py` | «faltan **0**»; «difieren **14**» = exactamente los 14 revertidos |
| H1.M6 | Antes/después de `ddl:sources` | ídem | faltan 29→**0** · sobran 16→16 · difieren 31→**14** |
| H2.M1 | Commit y push con refspec explícito | `git ls-remote` | `209d36a4` local = remoto; `dev` remoto sigue en `6ea11561` |
| H2.M2 | PR contra `dev` | `gh pr create` | #675 |
| H2.M3 | Este reporte | — | — |
| H2.M4 | Retiro de los dos worktrees auxiliares (`wt-vendor-sync-api`, `wt-vendor-src-model`), justo después del push de este reporte. Las ramas se conservan | `git worktree remove` · `git worktree list` | se verifica en el mensaje de cierre de la sesión (no puede estar dentro de este archivo) |

## A medias

### H1 — La copia vendorizada recoge todo lo que el modelo declara
- Qué anda: `database/` ya contiene los módulos 67–69, las `05_constraints` de 11 y 41, los 13 parches nuevos y las adiciones de 17 archivos. No se perdió ninguna línea.
- Qué no anda: `yarn ddl:sources` sigue en **exit 1** (quedan 14 archivos que difieren y 16 parches «sobrantes»). Tampoco se pudo demostrar que una base limpia se cree bien con esta copia.
- Qué falta exactamente: **subir al modelo el DDL que solo existe en la API** —175 líneas en 14 archivos más 16 parches— y recién entonces correr `yarn db:vendor` completo con `--delete`. Lista exacta en `evidencia/h1-ddl-solo-en-la-api.txt`. Incluye las tablas `billing.siat_simulated_invoices` y `billing.siat_simulated_outbox`, los parches `2026-10-11_v4238`…`v4246` y `2026-09-26_v4236/v4237`, y el arreglo propio del parche `v428_billing_quotations`.
- Dónde quedó: rama `marcelo/db-vendor-sync-2026-10-23`, PR #675.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| Subir el DDL propio de la API al modelo | TODO | Trabajo mayor y previo: declarar en los `.puml` lo que hoy solo viven en parches de la API (contra ADR-0021), regenerar, y recién ahí borrar. Necesita decisión del propietario sobre cuáles de esos objetos se mantienen |
| `yarn db:verify-clean-init` sobre esta copia | BLOQUEADO | Requiere Docker; no estaba disponible. Sin esa corrida, #675 no debería mergearse |
| Aprobación humana de #675 | BLOQUEADO | `dev` exige 1 revisión |

## Evidencia

Salidas completas en `evidencia/`. Extractos:

```text
# h0-vendor-check-dry-run.txt  (script oficial, solo lectura)
database/SQL y database/NoSQL desincronizados  ·  BORRA 16 · NUEVO 33 · MODIFICA 450

# h1-ddl-sources.txt
ANTES : faltan 29 · sobran 16 · difieren 31   (76 archivos)
DESPUÉS: faltan 0  · sobran 16 · difieren 14   (30 archivos)
exit=1 en ambos

# diff del commit
51 files changed, 8646 insertions(+)        (0 deletions)

# h1-ddl-solo-en-la-api.txt
TOTAL líneas solo en la API (14 archivos): 175
17_billing/02_tables.sql: 44 líneas solo en la API | tablas: billing.siat_simulated_invoices, billing.siat_simulated_outbox
```

## No cubierto

- **Base limpia:** no se creó una base desde cero con esta copia. Los módulos 67–69 y las `05_constraints` nuevas (CHECK sobre `restore_test_runs` y `practitioner_service_offerings`) no se ejercitaron.
- **Orden de aplicación entre parches duplicados:** los 8 parches de la API del 09-18/19 (v4219/v4220) y sus homólogos renombrados del modelo (v4224–v4227) conviven; se asume que son idempotentes por el encabezado de `init-postgres.sh`, no se comparó su contenido uno a uno.
- **Consistencia parcial de módulos:** en `41_scheduling`, `19_community` y `65_surveys` se actualizó una parte de los archivos (la que solo suma) y no otra (la que también quita). Por ejemplo `19_community/04_indexes.sql` no recibió los índices de `party_ratings`; los crea el parche `2026-10-09_v4242_party_ratings.sql`, que sí se agregó. No se comprobó módulo por módulo que todo quede cubierto por algún parche.
- `yarn build`, `yarn test`, `yarn docs:validate`: no corridos (no se tocó código TypeScript).

## Desvíos del plan

1. **El criterio de aceptación se corrigió durante la ejecución.** Original: «`rsync -ni` sin `--delete` vacío». Se vio que sin `--delete` tampoco es aditivo: sobrescribir 14 archivos quita DDL propio de la API. Pasó a «no quitar ni una línea». Queda anotado en `PLAN.md`.
2. **No se ejecutó `yarn db:vendor` tal cual** (la tarea decía «actualizalo»): su `--delete` borra 16 parches de los que 9 crean objetos ausentes del modelo. Se usó `rsync` sin `--delete` con las mismas exclusiones.
3. **Tres errores propios, corregidos antes de entregar:** el regex del chequeo de referencias, la codificación del archivo de evidencia (`-I` ignora `PYTHONIOENCODING`), y una frase del cuerpo del PR que decía que `17_billing` coincidía con #672 cuando este PR no lo toca.

## Riesgos residuales

- **Desfase que queda:** la copia que se despliega sigue sin coincidir con el modelo en 30 archivos; es deriva real entre API y modelo, no ruido.
- **Cambia lo que crea una base nueva:** los módulos 67–69 pasan a crearse por `apply_all.sql` y no solo por parche. Si algún parche asumía que la tabla no existía, podría comportarse distinto. No verificado.
- **Fuente = rama de #50:** si #50 no se mergea, el parche del carril 16 sobra de este PR.

## Decisiones y ambigüedades

| # | Ambigüedad / decisión | Supuesto tomado | A quién confirmar |
|---|---|---|---|
| 1 | «Actualizalo con db:vendor» vs. lo que ese comando destruye | Se priorizó no perder DDL; se entregó la parte segura y se dejó el resto declarado | Propietario |
| 2 | Qué hacer con el DDL propio de la API (tablas SIAT simulado, columnas de los parches 10-11) | Se deja intacto; no se decide si va al modelo o se retira | Propietario |
| 3 | Parches duplicados renombrados (v4219/20 vs v4224–27) | Coexisten; son idempotentes | Equipo de plataforma |
