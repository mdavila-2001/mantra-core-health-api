# TAREA-41 F3 — Cierre y criterios de aceptación

Apilado sobre F3.7 (mantra-core-health-api#1112/#1113) → F3.6 (#1107/#1108) → F3.5 (#1105/#1106) → F3.4 (#1103/#1104) → F3.3 (#1098/#1099); F3.0–F3.2 ya están en `dev`/`test` (#990/#991).

## Qué cierra este PR
- **Orphanet product9** (el pendiente de F3.3): edad de inicio, herencia y prevalencia → `concept_properties` de la enfermedad (`orphanet-age-of-onset`, `orphanet-inheritance`, `orphanet-prevalence`), etiquetas en inglés tal cual, prevalencia **con su estado de validación**, licencia CC BY 4.0 dentro del valor. `lib/glossary-es/orphanet-properties.mjs` + `import-f3-orphanet-properties.mjs` (`--load [--dry-run]`) + 6 pruebas con recortes reales.
  - Datos reales: 7 888 trastornos → 19 505 propiedades armadas (inicio 6 703 · herencia 6 411 · prevalencia 6 391); **19 007 cargadas** en la base local (498 sin concepto en la base). Dry-run PASS, **segunda pasada 0**, 0 FK sin validar (`evidencia/load-product9.txt`).
- **Clasificaciones → SPECIALTY: NO se hizo, a propósito.** La ficha exige una tabla curada a mano y revisada; se dejó la plantilla vacía `data/orphanet-classification-specialty.csv` (+ README con los dos insumos que faltan). No hay filas inventadas.

## Criterios de aceptación de F3 (medidos en la base LOCAL, 2026-10-29)
| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | `volumes.md` con los conteos antes y después de cargar | **CUMPLIDO** | antes: `volumes.md` de F3.0 (proyección 279 012 relaciones); después: `evidencia/criterios-f3.txt` |
| 2 | ≥ 150 000 conceptos únicos y ≥ 800 000 relaciones, **o** el informe al propietario de F3.0 | **NO CUMPLIDO — va el informe** | base local: **81 326 conceptos · 394 757 relaciones** (274 494 evidencias; 634 228 propiedades). La proyección de F3.0 ya estaba bajo la meta (279 012) y Wikidata (F3.6) aportó solo 210 filas de evidencia + 1 766 IS_A: el cuello de botella es la identidad (la mayoría de los ítems de las fuentes no tiene grupo MONDO). La ficha manda informar al propietario y **no rellenar con fuentes de menor calidad**. |
| 3 | Duplicados < 1 % (consulta y resultado pegados) | **NO CUMPLIDO con la medida de la base** | misma etiqueta (minúsculas) en más de un sistema de códigos: **4 661 de 81 326 = 5,73 %** (`criterios-f3.txt`). Medida de F3.1 sobre archivos, por etiqueta igual entre **categorías** del glosario: 0,36 % (< 1 %). Las dos miden cosas distintas; ver abajo. |
| 4 | «Fiebre» muestra sus enfermedades por fuerza y las 5 primeras tienen evidencia T1 o T2 | **CUMPLIDO en la letra** | 5 de 5 `CURATED_REFERENCE` (T2), fuerza 1,00. **Reserva:** son enfermedades raras (granulomatosis de Wegener, síndromes autoinflamatorios), no las comunes. Captura de pantalla: **no tomada** (no se levantó el front). |
| 5 | Carga idempotente y medición de tiempos de F1.3 sobre el volumen real | **CUMPLIDO** | cada cargador: segunda pasada 0/0 (HPO 149 252, Orphanet 109 861, MRCOC 10 427, Wikidata 194 + 1 766 IS_A, jerarquía 22 544, product9 19 007). Tiempos de `bulkLoadRelationships` en los logs de F3.3/F3.5 (p. ej. HPO 149 252 filas: copy 0,2 s · relaciones 2,6 s · evidencia 3,3 s · derivadas 4,2 s). |

Alcanzabilidad (F3.7): 9,82 % de huérfanos (meta < 15 %) — dentro. `evidencia/reachability.md`.

### Sobre el criterio 3 (duplicados)
La medida de la base cuenta nombres repetidos entre sistemas. De los 8 pares con más coincidencias:
- **Conceptos distintos con el mismo nombre** (no son duplicado): HPO×CIE-10-ES 420, HPO×MONDO 154, HPO×MedlinePlus 148, HPO×NNAC 100 (un síntoma «absceso» y un diagnóstico «Absceso»).
- **Duplicados reales a resolver**: `cima-vtm`×`vademecum` 221 (dos catálogos de fármacos), `SALUD_CORE`×`mantra-core-internal` 358 (dos catálogos internos), CIE-10-ES×MedlinePlus 103 (la misma enfermedad desde dos fuentes: el problema D9 de la ficha, que F3.1 solo resuelve por equivalencia declarada MONDO).
Resolverlos no se hace por coincidencia de etiqueta (principio 4 de la ficha). Decide el propietario cuál de las dos medidas es la del criterio.

## Estado de las subtareas de F3
| | Estado |
|---|---|
| F3.0 medición | hecho (en `dev`, #990) |
| F3.1 identidad | hecho; **21 conflictos sin decidir** |
| F3.2 HPO | hecho y cargado local |
| F3.3 Orphanet | product4 + product9 hechos y cargados local; **clasificaciones → SPECIALTY pendiente (curación humana)** |
| F3.4 jerarquía | hecho y cargado local; MeSH no aporta (sin padres); 91 420 aristas CIE-10-ES esperan las fichas |
| F3.5 MRCOC | hecho y cargado local (lift ≥ 3) |
| F3.6 Wikidata | P828/P5642/P1542/P279 hechos; **P2175, P769, P4044 pendientes** |
| F3.7 alcanzabilidad | hecho |

## Lo que NO se verificó
- Nada de F3.2–F3.7 está cargado en el **VPS** (`dev`/`test`): solo la base local. El camino al VPS es `.local-tools/vps-nnac.sh` (lo corre el propietario).
- Sin capturas de pantalla ni front: F3 es solo datos.
- `yarn lint` no corrido (no cubre `tools/*.mjs`).
