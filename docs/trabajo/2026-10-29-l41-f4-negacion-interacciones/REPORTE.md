# TAREA-41 F4 — Negación en las interacciones de CIMA (sección 4.5)

El reporte de `2026-10-29-l41-f4-secciones-45-46` encontró que el extractor armaba un par fármaco-fármaco aunque la oración **negara** la interacción («no se dan interacciones clínicamente significativas»). Este cambio lo trata. **No carga nada**: las interacciones siguen sin entrar a `clinical_ext.drug_interactions`.

## Qué cambió
- `lib/glossary-es/interaction-assertion.mjs` (nuevo): clasifica cada oración de 4.5 en `warning` · `possible` · `negated` · `no-data` · `unspecified`. **Sólo degrada, nunca promueve**: lo que no se puede leer con certeza sigue siendo un par.
- `cima-safety.mjs`: la oración `negated` o `no-data` ya no genera par; va a `cima-unmatched.csv` con razón `negated-interaction` / `no-interaction-data`.
- Se conservan a propósito: las que tienen severidad de la tabla fija («no se recomienda», «contraindicado»); la doble negación («no se puede excluir que… aumente»); las concesivas («Aunque no se han descrito interacciones, se recomienda controlar la glucosa»); las mixtas («AAS no modificó…, pero clopidogrel potenció…»); y «no estudiada» seguida de una sospecha («…las concentraciones pueden aumentar»).
- Pruebas: `test/interaction-assertion.test.mjs`, 12 pruebas con oraciones literales de las fichas. Importador completo: **177 pruebas, 176 pasan, 0 fallan, 1 omitida** (la omitida es previa).

## Efecto medido (extracción real sobre las 2 380 fichas; no toca la base)
| | Antes | Después |
|---|---:|---:|
| Pares de interacciones | 25 835 | **23 215** |
| `UNSPECIFIED` | 24 138 | 21 518 |
| `NOT_RECOMMENDED` | 752 | 752 (sin cambio) |
| `CONTRAINDICATED` | 945 | 945 (sin cambio) |
| Oraciones a la cola por negar la interacción | — | 2 010 |
| Oraciones a la cola por «no se estudió» | — | 1 145 |

Relaciones cargables de 4.3/4.6/4.8: **76 078 antes y después** (el cambio sólo toca 4.5).

El primer cálculo del reporte anterior (1 093 pares) subestimaba: usaba un patrón mínimo. Con el clasificador salen **2 620 pares** menos.

## Revisión a mano (`evidencia/muestras-revisadas.txt`, semilla fija)
- **Descartadas, 60 oraciones leídas (30 + 30): los 60 descartes son correctos.** Una («No se realizaron estudios de interacción…») estaba bajo la razón equivocada por el pretérito; se corrigió y se probó. Otra («No se han estudiado. Son de esperar…») perdía una sospecha; se corrigió y se probó.
- **Conservadas con palabra de negación, 45 leídas:** 4 eran negaciones que se escapaban («no provocó cambios», «no ejercieron ningún efecto», «falta de efecto en la farmacocinética»). Se agregaron esos verbos y se probaron. El resto son correctas (advertencias, cautelas y mezclas).
- **Límite honesto:** un patrón de lenguaje nunca llega a cero fallos. Quedan negaciones que no conozco, pocas (en la muestra, 4 de 45 con palabra de negación, antes del último ajuste; esa muestra no se volvió a leer después). Por eso el resultado es **conservador**: ante la duda, el par se queda y va a revisión.

## Lo que el estudio destapó (no es negación, pero decide si se desbloquea)
1. **`UNSPECIFIED` no significa «leve».** En la muestra de 45, unas 10 oraciones son **prohibiciones** que la tabla de severidad no reconoce: «no deben administrarse juntos», «no debe recibir simultáneamente», «debe evitarse el uso combinado». Quedan como `UNSPECIFIED` aunque la ficha diga que no se combinen. Cargarlas con ese rótulo subestima el riesgo. Hay que ampliar la tabla de severidad (con revisión clínica) **antes** de cargar.
2. **Hay fragmentos que no son una afirmación:** encabezados de lista («Agentes de la tiroides: levotiroxina.», «• Otros neurolépticos: perfenazina.») y descripciones de mecanismo («El metabolismo de dapagliflozina se produce vía UGT1A9»). En la muestra, unos 4 de 45. Generan un par sin decir nada sobre la interacción.
3. El bloqueo del modelo sigue: `severity_concept_id` NOT NULL sin value set con `UNSPECIFIED`.

## Recomendación
**No desbloquear todavía.** Antes de cargar interacciones: (a) decidir el value set de severidad (modelo), (b) ampliar la tabla para las prohibiciones con redacción distinta y (c) descartar encabezados y fragmentos sin afirmación. La negación ya no es el obstáculo.

## No verificado
Nada de esto está en el VPS ni en la base (no se cargó). `yarn lint` no cubre `tools/*.mjs`. Las cifras de «unas 10» y «unos 4» de 45 son conteos a ojo de una muestra, no una medición del universo.
