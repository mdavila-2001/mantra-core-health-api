# Plan — Terminología médica completa: diccionarios médicos generales

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: glosario ES (`tools/terminology-import/load-glossary-es.mjs`, 19 313 términos, 54 865 relaciones de Wikidata)
- Resultado observable: un operador corre `fetch → build → load` y `terminology.*` queda con anatomía, embriología, histología, genética, microbiología, farmacología general, salud pública, estadística, profesiones, exposiciones y abreviaturas, con procedencia por concepto y relaciones publicadas por la fuente; la segunda corrida inserta 0 filas.
- Kill-test: correr `load-dictionaries.mjs --apply` dos veces contra un Postgres con el DDL del módulo 03; si la segunda inserta filas, o si un concepto no trae `dictionary-provenance`, no está hecho.

> Desvío registrado: este plan se escribió **después** de implementar. El `AGENTS.md` del repo (que exige
> el plan primero) recién se vio cuando el proceso de la sesión se reinició; el pedido de la sesión no lo
> mencionaba y `CLAUDE.md`/`.claude/rules/` no existen. Se escribe igual, con el estado real.

## Alcance
- IN: `tools/terminology-import/dictionaries/` (nuevo), `docs/seed-research/medical-dictionaries.md` (nuevo), `docs/trabajo/2026-10-24-diccionarios-medicos/` (nuevo); aditivo y mínimo en archivos compartidos: `src/common/constants/concepts.ts` (`LANG_LA` + 4 tipos de relación) y una sección en `tools/terminology-import/README.md`.
- OUT: enfermedades, síntomas, alergias, análisis, servicios, medicamentos, fichas y enfermería (sesiones hermanas: sólo se enlazan por código); el glosario (`/glossary`) y su API; cualquier DDL o migración; el repo del modelo.
- Ambigüedades registradas:
  1. ¿Entran al glosario términos sólo en inglés? Supuesto: **no** (el glosario es castellano); quedan en la API de terminología. Confirmar con el propietario.
  2. Licencia de FMA: abierta (UW 2006 / CC BY 3.0 según Bioregistry); página oficial inalcanzable. **Confirmada por el propietario el 2026-10-24.**
  3. Rama: el pedido dice `justin/seed-medical-dictionaries`; la sesión está fijada a `claude/vigilant-ramanujan-ms3xcw`. Supuesto: se trabaja y se abre el PR desde la rama fijada. Confirmar con Justin si quiere renombrarla.

## H1 — Corpus normalizado con procedencia
**CA:** Dado los archivos fuente descargados, cuando se corre el build, entonces cada concepto del NDJSON trae fuente, id de origen, versión, URI, archivo, SHA-256, fecha y licencia, y sólo relaciones que la fuente declara.
**DoD:** `node --test "tools/terminology-import/dictionaries/test/*.test.mjs"` → 18/18; `build-dictionaries.mjs` → `coverage.json` sin `missingSources`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Registro de fuentes con versión fija y licencia | ninguna URL apunta a una rama | test «registro» | HECHO |
| H1.S1.M2 | Descarga con manifiesto | 45 archivos con SHA-256 | `fetch-dictionaries.mjs` → `failures: []` | HECHO |
| H1.S2.M1 | Parser OBO + verificación de predicados contra `[Typedef]` | nombre inesperado aborta | test «typedef con nombre inesperado» | HECHO |
| H1.S2.M2 | Lectores OWL funcional y RDF/XML | OGMS e IDO dan términos | tests OWL | HECHO |
| H1.S2.M3 | FMA (latín, castellano declarado, TA98, epónimos) | corazón trae «Cor», «Corazon», TA98 A12.1.00.001 | build → `fma.ndjson` | HECHO |
| H1.S3.M1 | Organismos y aristas enfermedad → organismo (Mondo, DOID) | sólo taxones declarados + linaje | tests Mondo/DOID/selección | HECHO |
| H1.S3.M2 | HGNC y Metainventario de abreviaturas | un concepto por gen / por sentido | tests HGNC/Metainventario | HECHO |
| H1.S4.M1 | Filtro humano de Uberon/CL por restricciones de taxón publicadas | branquia queda afuera | test Uberon | HECHO |

## H2 — Carga idempotente al módulo 03
**CA:** Dado un Postgres con el DDL del módulo 03 y los conceptos internos sembrados, cuando se carga dos veces, entonces la primera inserta y la segunda 0 filas, sin DDL.
**DoD:** `load-dictionaries.mjs --apply` ×2 → corrida 2 con 0 en conceptos, designaciones, propiedades, relaciones y concept_maps.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Tipos de relación y `LANG_LA` en `concepts.ts` | códigos únicos | `jest concept-codes.spec.ts` verde | HECHO |
| H2.S1.M2 | Cargador con reuso de code system/concepto de otras sesiones | reuso por URL canónica y (versión, código) | lectura de código + corrida | HECHO |
| H2.S1.M3 | Enlace por código a lo existente (CIE-10-ES, ICD-10-CM, MeSH, TA98, Mondo/DOID) | J13 → *S. pneumoniae* | prueba con concepto de prueba en base desechable (borrado) | HECHO |
| H2.S2.M1 | Medición en Postgres 16 desechable | filas, tiempo, idempotencia | `evidencia/load-corrida-*.json` | HECHO |
| H2.S2.M2 | Carga contra el stack real con glosario | enlaces reales a fichas | no corrido (sin stack) | BLOQUEADO |

## H3 — Saturación y reporte
**CA:** Dado el protocolo, cuando dos pasadas seguidas aportan 0 en cada dominio, entonces el reporte lista pasadas, fuentes, conteos, descartes con motivo, huecos y licencias.
**DoD:** `docs/seed-research/medical-dictionaries.md` con pasadas 1-8 (7 y 8 en 0) y `SOURCES.md`.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Pasadas 1-8 registradas | 7 y 8 = 0 | tabla en el doc | HECHO |
| H3.S1.M2 | Clasificación de las 191 ontologías activas de OBO Foundry | 191/191 | lista en el doc | HECHO |
| H3.S2.M1 | Etiquetas ES de Wikidata | designaciones ES cargadas | `import-wikidata-es-labels.mjs` | BLOQUEADO (query.wikidata.org 403) |
| H3.S3.M1 | PR contra `dev` sin merge | PR abierto | https://github.com/mdavila-2001/mantra-core-health-api/pull/687 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red de la sesión bloquea las fuentes en castellano | Corpus en inglés | Huecos documentados + importador ES listo |
| Volumen sin consulta (lección MeSH 1,44 M) | Filas muertas | `load: 'opt-in'` con motivo y tamaño |
| Choque con sesiones hermanas en `concepts.ts` | Conflicto de merge | Cambio aditivo en un bloque propio |
