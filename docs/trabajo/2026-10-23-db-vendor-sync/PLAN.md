# Plan — Resincronizar la copia vendorizada `database/` con el modelo (sin borrar)

- Fecha: 2026-10-23 · Repos afectados: `mantra-core-health-api` · Predecesor: [PR #672](https://github.com/mdavila-2001/mantra-core-health-api/pull/672) (carril 16 corte 2), que dejó este pendiente anotado
- Resultado observable: `database/SQL` y `database/NoSQL` contienen todo lo que el modelo declara y la copia no tenía (módulos 67–69, `05_constraints`, parches nuevos) y las versiones desfasadas quedan al día. **No se borra ningún archivo.**
- Kill-test: `rsync -ni` sin `--delete` contra la fuente sigue listando archivos nuevos o modificados con contenido distinto → no está hecho.

## Por qué no es un `yarn db:vendor` literal

`scripts/db/vendor-ddl.sh` usa `rsync --delete`. El dry-run (`evidencia/h0-vendor-check-dry-run.txt`) muestra 16 archivos que se borrarían, todos en `database/SQL/patches/`. Se comprobó contra el DDL del modelo que **los objetos que crean no existen en el modelo**:

| Parche de la API | Objeto buscado | Archivos del modelo que lo contienen (fuera de `patches/`) |
|---|---|---|
| `2026-10-11_v4238_medication_requests_indication_text` | `indication_text` | 0 |
| `2026-10-11_v4243_branches_description_location_url` | `location_url` | 0 |
| `2026-10-11_v4244_billing_siat_simulated` | `siat` | 0 |
| `2026-10-11_v4246_designaciones_es_prioridades_orden` | `designaci` / `priorid` | 0 |
| `2026-10-11_v4241_unifica_medicina_general` | `unifica` / `medicina general` | 0 |
| `2026-10-11_v4240_farmacia_paracetamol_vademecum_y_stock` | `paracetamol` | 0 |
| `2026-10-11_v4242_diagnostic_sites_geolocalizadas` | `geolocaliz` | 0 |
| `2026-09-26_v4237_appointment_follow_up_of` | `follow_up_of` | 0 |
| `2026-09-26_v4236_service_requests_performer_read_rls` | `performer_read` | 0 |

Borrarlos quitaría de la copia que se despliega columnas y datos que el código ya usa. Es deriva real entre API y modelo (contra ADR-0021), no ruido. **Subirlo al modelo (`.puml` → generador) es otro trabajo, previo a poder borrar nada.**

## Alcance
- IN: copia **aditiva** (`rsync -a`, sin `--delete`) de `SQL/` y `NoSQL/` desde una copia limpia del modelo (`64a0214` = `dev` + PR #50) hacia `database/`; este plan y su reporte.
- OUT: borrar cualquier archivo de `database/`; modificar el modelo; reescribir `scripts/db/vendor-ddl.sh`; subir los parches propios de la API al modelo; tocar código TypeScript.
- Ambigüedades registradas:
  1. Fuente = punta de la rama del modelo del carril 16 (`dev` + #50) y no `dev` a secas, para que `17_billing` coincida byte a byte con lo que ya trae #672 y los dos PR no choquen. Si #50 no se mergea, esa parte sobra. Confirmar: propietario.
  2. Los 8 parches del 09-18/19 (`v4219`, `v4220`) del lado API y sus homólogos renombrados del modelo (`v4224`–`v4227`) quedan **ambos** en `patches/`. Son idempotentes (`init-postgres.sh` los aplica siempre), por lo que coexistir es inocuo; limpiarlos es del trabajo de «subir al modelo». Confirmar: equipo de plataforma.

## H1 — La copia vendorizada recoge todo lo que el modelo declara
**CA (corregido durante la ejecución):** Dado `database/` y la fuente, cuando termina la copia, entonces el diff **no quita ninguna línea ni borra ningún archivo**, `ddl:sources` ya no informa archivos «faltantes», y los archivos que siguen distintos son exactamente los que contienen DDL propio de la API. *Original: «rsync -ni vacío». No es alcanzable sin perder DDL: ver «Corrección» abajo.*
**DoD:** líneas quitadas en el diff = 0 · archivos borrados = 0 · `ddl:sources`: «faltan 0» · 324 referencias de `apply_all/apply_deferred` resueltas.
**Estado:** A MEDIAS (los 30 archivos restantes dependen de subir el DDL propio de la API al modelo)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.M1 | Dry-run del script oficial y lista de borrados | Se identifican los 16 borrados y se comprueba el DDL de cada uno contra el modelo | `bash scripts/db/vendor-ddl.sh --check` → `evidencia/h0-…` + tabla de este plan | HECHO |
| H1.M2 | Copia de `SQL/` y `NoSQL/` sin `--delete` | Exit 0 de rsync | `rsync -a --exclude … SRC/ DST/` → `>>> SQL copiado`, `>>> NoSQL copiado` | HECHO |
| H1.M3 | **Ninguna línea quitada** (más estricto que «ningún archivo borrado»): revertir todo archivo modificado que pierda líneas | `git diff --numstat` suma 0 en la columna de quitadas | 14 archivos revertidos → **0 líneas quitadas, 0 borrados** | HECHO |
| H1.M4 | Coherencia interna de la copia | Toda referencia de `apply_all.sql`/`apply_deferred.sql` existe; las columnas de las `05_constraints` nuevas existen | script de comprobación | HECHO |
| H1.M5 | No queda nada **nuevo** por copiar y lo distinto es solo DDL propio de la API | `ddl:sources`: «faltan 0», «difieren 14» = los 14 revertidos | `check_ddl_sources.py` | HECHO |
| H1.M6 | Estado de `ddl:sources` registrado (exit 1 esperado) | Antes/después pegados | faltan 29→**0** · sobran 16→16 · difieren 31→**14** | HECHO |

## H2 — Entrega
**CA:** Dado el commit, cuando abro el PR contra `dev`, entonces es `MERGEABLE`, no draft, y su cuerpo dice qué no se cerró y por qué.
**DoD:** `gh pr view` y `gh pr checks` pegados tras el último push; REPORTE.md.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.M1 | Commit y push con refspec explícito | `ls-remote` == HEAD | `git ls-remote` | TODO |
| H2.M2 | PR contra `dev` | Abierto, no draft | `gh pr view` | TODO |
| H2.M3 | REPORTE.md con avance calculado | Existe | archivo | TODO |
| H2.M4 | Retirar worktrees y limpieza | `git worktree list` solo clones principales | comando | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| No se puede verificar una base limpia (`yarn db:verify-clean-init` necesita Docker, que no está disponible) | Los módulos 67–69 y las `05_constraints` nuevas no se ejercitan al crear una base desde cero | Declararlo en el PR como **no verificado**; el PR no se mergea solo |
| `05_constraints.sql` nuevo (módulos 11 y 41) introduce restricciones en bases nuevas | Un despliegue nuevo se vuelve más estricto | Es lo que el modelo declara; se lista en el PR |
| `ddl:sources` seguirá en exit 1 | El pendiente no se cierra del todo | Es honesto: quedan los 16 «sobrantes» hasta que se suban al modelo |
| Copiar desde CRLF de Windows | Ruido de fin de línea | `.gitattributes` normaliza a LF; se mide con `git diff --numstat` |

## Corrección durante la ejecución

El plan decía «copia aditiva sin `--delete`». Al medir el diff real se vio que **sin `--delete` tampoco es aditivo**: 14 archivos existentes contienen DDL que la API tiene y el modelo no (175 líneas; p. ej. las tablas `billing.siat_simulated_invoices` y `billing.siat_simulated_outbox` dentro de `17_billing/02_tables.sql`, y un arreglo de 38 líneas en el parche `v428`). Sobrescribirlos borraría esas definiciones igual que `--delete`. El criterio pasó de «no borrar archivos» a **«no quitar ni una línea»**, y esos 14 archivos se dejaron como estaban. Lista y detalle: `evidencia/h1-ddl-solo-en-la-api.txt`.
