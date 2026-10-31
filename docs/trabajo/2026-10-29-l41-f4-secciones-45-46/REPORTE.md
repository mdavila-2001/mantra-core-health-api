# TAREA-41 F4 — Secciones 4.5 y 4.6 de CIMA: descarga, extracción y carga local

Sigue a `2026-10-29-l41-f4-carga-local`, que dejó dos huecos: el `cima.ndjson` de septiembre no tenía 4.5 (interacciones) ni 4.6 (embarazo y lactancia). Este PR trae el extractor que las completa **sin repetir la descarga** y registra la carga en la base LOCAL. La 4.2 (posología) no se pidió ni se leyó.

## Resultado (rung 5 — base LOCAL, 2026-10-29; no VPS)
| Paso | Resultado |
|---|---|
| Descarga a la API de CIMA (≥ 1 s entre peticiones) | 2 380 fichas · 4 554 peticiones · **0 fallos · 0 reintentos** · 39 MB (`evidencia/descarga.meta.json`) |
| Secciones obtenidas | 4.5 en 2 274 fichas (6 vacías) · 4.6 en 1 761 (519 vacías) · 100 fichas sin producto de referencia |
| `--safety --load --dry-run` | 2 561 relaciones y 5 068 evidencias nuevas, ROLLBACK |
| Carga real | **2 561 relaciones nuevas · 5 068 evidencias nuevas** |
| Segunda pasada | **0 / 0** (mismo checksum `a100f03a…`) |

- `REL_PREGNANCY_LACTATION_CAUTION`: 579 (LactMed) → **3 140**; evidencias 588 → **5 656** (5 068 de CIMA 4.6 + 588 de LactMed), todas con cita literal.
- Relaciones totales 447 787 → **450 348**; evidencias 346 092 → **351 160**.
- **0 citas con patrón de dosis** entre contraindicaciones, efectos adversos y embarazo/lactancia; **0 relaciones con un extremo inexistente** (`evidencia/verificacion-db.txt`).
- No casaron exacto y **no se cargaron**: 10 046 oraciones de 4.6 sin término de embarazo/lactancia, 16 327 en total de 4.6; el guard de dosis descartó 10 500 oraciones más que antes. Por diseño (F4.2).

## Interacciones (4.5): extraídas, NO cargadas
`cima-interactions.csv` pasó de 0 a **25 835 pares**: 24 138 `UNSPECIFIED`, 945 `CONTRAINDICATED`, 752 `NOT_RECOMMENDED`. Siguen **BLOQUEADAS** y no entran a `clinical_ext.drug_interactions`:
1. `severity_concept_id` es NOT NULL y el modelo no declara un value set de severidad con `UNSPECIFIED`. Es decisión de modelo, no de este carril.
2. **Hallazgo nuevo:** el extractor arma un par aunque la oración **niegue** la interacción. Ejemplo literal: abacavir–zidovudina, «no se dan interacciones clínicamente significativas». Un patrón sencillo de negación marca al menos **1 093 pares** (1 083 `UNSPECIFIED`, 10 `CONTRAINDICATED`). Cargarlos tal cual escribiría en la base lo contrario de lo que dice la ficha. Antes de desbloquear hace falta tratar la negación en `cima-safety.mjs` y revisar a mano una muestra.

## Criterios de F4
| Criterio | Estado |
|---|---|
| Amoxicilina con contraindicaciones y efectos adversos, oración literal y enlace, captura | **Parcial**: datos y enlace en la base; **falta la captura** (no se levantó el front) |
| `drug_interactions` con conteo por fuente y severidad | **NO CUMPLIDO**: 0 filas cargadas; 25 835 pares listos y bloqueados por el punto 1 |
| Spec de que la 4.2 no se procesa | Cumplido (`cima-safety.test.mjs`; el extractor nuevo tiene `assertAllowedSection`) |
| Embarazo y lactancia desde CIMA | **Cumplido en base local** (5 068 evidencias con oración literal) |

## Para reproducir
`GLOSSARY_BUILD_DIR=<carpeta con ndjson/cima.ndjson sin 4.2> node import-cima-sections.mjs --from … --sections 4.5,4.6`, luego `node import-cima.mjs --safety --load` con `DB_PASSWORD` del contenedor. Pruebas: `test/cima-sections.test.mjs` (6).

## No verificado
Nada de esto está en el VPS. `yarn lint` no corrido (no cubre `tools/*.mjs`). El `cima.ndjson` original con 4.2 sigue en `glossary-data-build-catalogos/` (fuera de git); decide el propietario si se borra.
