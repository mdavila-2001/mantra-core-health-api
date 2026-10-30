# TAREA-41 F4 — Carga local de la seguridad del fármaco (CIMA y LactMed)

El código de F4 ya estaba mergeado (`import-cima.mjs --safety --load`, cima-safety.mjs, 4.2 fuera de la lista blanca). Este PR **no cambia código**: registra la carga en la base LOCAL y los hallazgos al cargar. Apilado sobre el cierre de F3 (mantra-core-health-api#1114/#1115).

## Resultado (rung 5 — base LOCAL, 2026-10-29; no VPS)
| Fuente | Evidencias | Relaciones nuevas | Con cita literal | Con enlace |
|---|---:|---:|---:|---:|
| AEMPS CIMA (4.3 contraindicaciones, 4.8 reacciones adversas) | 71 010 | 52 451 | 71 010 | 71 010 |
| NLM LactMed (embarazo y lactancia) | 588 | 579 | 588 | 588 |

- CIMA: 6 951 `CONTRAINDICATED_IN` + 64 059 `ADVERSE_EFFECT`; frecuencia sólo si la ficha la da en texto (4 720 frecuentes, 3 770 ocasionales, 2 372 muy frecuentes, 2 278 muy raras; 50 919 sin frecuencia, sin estimar).
- `--dry-run` PASS, carga real, **segunda pasada 0/0**; 0 FK sin validar; relaciones 394 757 → 447 787, evidencias 274 494 → 346 092 (`evidencia/load.txt`).
- **Amoxicilina** (27658006): 43 relaciones; sus efectos adversos llevan la oración literal de la ficha CIMA y el enlace (p. ej. «Reacciones alérgicas graves incluyendo edema angioneurótico, anafilaxia, …») (`evidencia/verificacion-db.txt`). **Sin captura de pantalla: no se levantó el front.**
- **0 citas con patrón de dosis** entre las 71 598 (consulta en `verificacion-db.txt`); el guard descartó 16 231 oraciones por dosis. El spec de que la 4.2 no se procesa es `test/cima-safety.test.mjs` (importador: 159 pruebas, 158 pasan, 0 fallan, 1 omitida).
- No casaron exacto y **no se cargaron**: 108 639 filas (55 343 sin término exacto · 23 411 ambiguas · 16 231 dosis · 12 975 no son oración), por diseño (F4.2).

## Hallazgos (importan más que las cifras)
1. **El `cima.ndjson` bajado el 30/09 contiene la posología (4.2) en 1 852 de 2 380 fichas.** Se bajó antes de existir la lista blanca. El importador lo rechazó con `ForbiddenSectionError`, que es el comportamiento correcto. Para cargar **no se tocó el original**: se generó una copia sin 4.2 en el scratchpad (la copia parseó el JSON completo para descartar esas secciones; su contenido no se inspeccionó ni se usó). **El original y su caché (`glossary-data-build-catalogos/…/cache/cima/sections/*/4.2.json`) siguen en disco, fuera de git; decide el propietario si se borran.**
2. **El archivo no tiene 4.5 ni 4.6** (sólo 4.1, 4.3, 4.4, 4.8, 5.1; ver `cima.meta.json`). Por eso: **0 interacciones** y **0 `PREGNANCY_LACTATION_CAUTION` desde CIMA**; el embarazo/lactancia cargado viene sólo de LactMed. Traerlas es ~4 700 peticiones a la API de CIMA (≥ 1 s cada una, ~80 min) — **no se hicieron: no estaban autorizadas.**
3. **Las interacciones siguen BLOQUEADAS aunque se bajara 4.5**: `clinical_ext.drug_interactions.severity_concept_id` es NOT NULL y el modelo no declara un value set de severidad con `UNSPECIFIED`. `cima-interactions.csv` sale vacío. Mismo bloqueo que P769 de Wikidata (F3.6).
4. **LINAME (F4.4): no se tocó** en esta pasada.

## Criterios de F4
| Criterio | Estado |
|---|---|
| Amoxicilina con contraindicaciones y efectos adversos, oración literal y enlace, captura | **Parcial**: datos y enlace verificados en la base; contraindicaciones y efectos adversos ya cargados; **falta la captura** |
| `drug_interactions` con conteo por fuente y severidad | **NO CUMPLIDO** — 0 filas (hallazgos 2 y 3) |
| Spec de que la 4.2 no se procesa | **Cumplido** (`cima-safety.test.mjs`) |

## No verificado
Nada de esto está en el VPS. `yarn lint` no corrido (no cubre `tools/*.mjs`).
