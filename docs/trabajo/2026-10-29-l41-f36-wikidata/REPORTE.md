# TAREA-41 F3.6 — Wikidata ampliado (P828, P5642, P1542, P279)

Apilado sobre F3.5 (mantra-core-health-api#1105/#1106) → F3.4 (#1103/#1104) → F3.3 (#1098/#1099).

## Qué hay
- `lib/glossary-es/wikidata-evidence.mjs` (puro) + `import-f3-wikidata.mjs` (`--load [--dry-run]`, `--only`):
  - P828 «tiene causa» → `CAUSED_BY` enfermedad → causa · P5642 «factor de riesgo» → `RISK_FACTOR` **factor → enfermedad** (se invierte la arista de Wikidata) · P1542 «tiene efecto» → `COMPLICATION` · todo T3 `COLLABORATIVE_KNOWLEDGE`, referencia `wikidata:Q… P… Q…`, sin ordinal ni frecuencia.
  - P279 «subclase de» → `REL_IS_A` por la misma ruta que la jerarquía de F3.4 (`hierarchy.mjs`), sólo entre ítems con código (la ficha dice «entre conceptos médicos ya presentes»).
  - Ambos extremos se identifican con la identidad MONDO de F3.1 por un código que Wikidata declara (CIE-10 P494, CIE-10-CM P4229, MeSH P486). Sin código o sin grupo no se carga; si los códigos de un ítem caen en grupos distintos se salta (`ambiguous-codes`). No se crean fichas.
  - Se verifica la etiqueta inglesa de cada id de propiedad antes de consultar (un id equivocado aborta).
- `lib/glossary-es/hierarchy-load.mjs`: la inserción de `REL_IS_A` que usaba F3.4, ahora compartida.
- `test/f3-wikidata-evidence.test.mjs` (9 pruebas) con respuestas reales de Wikidata sin tocar.

## Desvíos de la ficha (y por qué)
- **No se agregaron a `RELATION_PROPERTIES` de `import-wikidata-relations.mjs`.** Ese mapa alimenta el pipeline de fichas del glosario, cuyo esquema de tipos (`RELATION_TYPE`) no tiene `CAUSED_BY`/`RISK_FACTOR`/`COMPLICATION` y que **crea fichas** para los destinos. Estas aristas llevan evidencia y se cargan por `bulkLoadRelationships`; tabla propia.
- **P2175 no se hizo.** Es la inversa de P2176 y la ficha pide fusionarla por clave natural: hace falta resolver los fármacos (ATC → concepto) y las aristas de P2176 ya viven sin evidencia en el pipeline del glosario. Medido: 13 954 aristas fármaco → enfermedad (1 116 enfermedades, 1 474 fármacos).
- **P769 (interacciones) no se hizo.** Debe ir a `clinical_ext.drug_interactions`, que exige un concepto de severidad que no existe (el mismo bloqueo que las interacciones 4.5 de CIMA en F4). Medido: 9 558 pares.
- **P4044 no se hizo.** La ficha lo lista sin tipo de relación (¿qué es «área terapéutica»: especialidad, clase de fármaco?). No se adivina. Medido: 1 249 aristas.

## Evidencia (rung 5 — base LOCAL; no VPS)
Volumen con código en ambos extremos → resuelto por identidad → en la base:
| Propiedad | pares con código | filas armadas | cargadas |
|---|---:|---:|---:|
| P828 causa | 1 545 | 112 | |
| P5642 factor de riesgo | 207 | 20 | |
| P1542 efecto | 832 | 78 | |
| **Evidencia T3** | 2 584 | **210** | **194** (188 relaciones nuevas) |
| P279 → IS_A | 33 877 | 5 740 | 5 135 con extremos en la base → **1 766 nuevas** (el resto ya existía) |

- `--dry-run` PASS, carga real, **segunda pasada 0/0**, 0 FK sin validar, 0 evidencias sin relación (`evidencia/load.txt`).
- Importador: `evidencia/gates.txt`.

## Lo que explica el volumen bajo
La mayoría de los ítems de Wikidata con códigos **no tienen grupo MONDO** (1 464 sujetos de 2 584 aristas de evidencia; 26 027 de 33 877 pares P279), así que la identidad de F3.1 no los reconoce. Es el volumen real; no se rellenó por nombre. Con esto F3 sigue muy por debajo de las 800 000 relaciones de la meta: ver el informe de F3.0.

## Consultas
`OPTIONAL` por cada código obligaba a Wikidata a recorrer todas las aristas de P279 (millones) y cortaba la respuesta (504 / JSON truncado, que el cliente cacheaba). Se reescribió: pares de Q con código en ambos extremos (9,5 s, 33 877 pares) + una tabla de códigos por propiedad (39 569 · 5 503 · 10 671), unidas en local.
