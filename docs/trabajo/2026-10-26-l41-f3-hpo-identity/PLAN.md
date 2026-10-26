# Plan — TAREA-41 F3.0–F3.2: medición, identidad MONDO y HPO (puro, sin carga)

- Fecha: 2026-10-26 · Repos afectados: mantra-core-health-api · Predecesor: F2.2 NNAC (#988/#989) y el
  commit interrumpido `54e85127` (dev) / `b96f3024` (test) de las ramas `justin/l41-f3-hpo-identity-*`
- Resultado observable: quien revisa el PR ve en `docs/progress/evidence/lane-41/F3/volumes.md` cuántas
  relaciones aportan HPO, Orphanet y MONDO después de los filtros, y tiene módulos puros probados
  (`identity.mjs`, `hpo.mjs`) que producen filas válidas para `bulkLoadRelationships`.
- Kill-test: `node --test "tools/terminology-import/test/**/*.test.mjs"` en rojo, o una fila de
  `hpoaToRelationshipRows` con `ordinal`, o dos evidencias distintas con la misma clave natural.

## Alcance
- IN: `tools/terminology-import/measure-sources.mjs`, `lib/glossary-es/identity.mjs`,
  `lib/glossary-es/hpo.mjs`, `test/f3-identity-hpo.test.mjs`, `test/fixtures/f3/*`,
  `docs/progress/evidence/lane-41/F3/*`, este directorio de trabajo.
- OUT: carga en Postgres, Orphanet como cargador (F3.3), jerarquía DOID/MeSH/CIE-10 (F3.4), MRCOC
  (F3.5), Wikidata ampliado (F3.6), `src/`, migraciones.
- Ambigüedades registradas:
  - «Etiqueta aprobada» en babelon → se toma `translation_status = OFFICIAL` (único estado presente en
    el archivo real). Confirmar con el propietario del glosario.
  - HPO sin PMID (referencia = registro OMIM/DECIPHER) → T3, no T2. La ficha sólo fija T2 «con PMID».
    Confirmar con el propietario de TAREA-41.
  - `node --test tools/terminology-import/test/` (directorio) falla en Node 22 con MODULE_NOT_FOUND;
    se corre con el glob del script `test:terminology-import` sobre el mismo directorio.

## H1 — F3.0 medición
**CA:** Dado los archivos reales de HPO, Orphanet y MONDO, cuando se corre la medición, entonces
`volumes.md` lista por fuente términos, con/sin etiqueta ES y relaciones después de filtros, con URL,
versión, SHA-256 y licencia, y dice si el total proyectado queda bajo 800 000.
**DoD:** corrida de `measure-sources.mjs` (salida en `volumes.json`) + recuento independiente de las
cifras de HPO y MONDO. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Descarga con URL/versión/SHA/licencia | volumes.md trae las 9 fuentes con SHA | `sha256sum` de los archivos re-bajados = SHA de volumes.md | HECHO |
| H1.S1.M2 | Conteos HPO/MONDO después de filtros | cifras reproducibles | recuento en `evidencia/fuentes-recontadas.txt` = volumes.md | HECHO |
| H1.S1.M3 | Veredicto contra 800 000 | lo dice sin rellenar | `grep 'por debajo' volumes.md` | HECHO |

## H2 — F3.1 identidad
**CA:** Dado equivalencias declaradas por MONDO, cuando se agrupan, entonces los códigos de un mismo
grupo resuelven al mismo concepto, se reusa la ficha CIE-10-ES por código y los conflictos quedan sin
concepto y listados.
**DoD:** tests 1–7 de `f3-identity-hpo.test.mjs` en verde. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | SSSOM: sólo exactMatch con sujeto MONDO | broadMatch excluido | test «SSSOM: sólo exactMatch…» ok | HECHO |
| H2.S1.M2 | Grupo → concepto pivote MONDO | OMIM y ORPHA del grupo → mismo id | test «grupo MONDO…» ok | HECHO |
| H2.S1.M3 | Reuso por código CIE-10 | id = `conceptId('cie10es-dx-<slug>')` | test «reuso del glosario…» ok | HECHO |
| H2.S1.M4 | Conflictos a revisión | grupo sin concepto | tests «conflicto real…» y «conflicto de código…» ok | HECHO |
| H2.S1.M5 | Tasa de duplicados por etiqueta | total y entre categorías | test «tasa de duplicados…» ok | HECHO |

## H3 — F3.2 HPO
**CA:** Dado `phenotype.hpoa`, cuando se transforma, entonces cada fila es SYMPTOM enfermedad → fenotipo,
sin `ordinal`, T2 sólo con PMID, frecuencia/edad/sexo sólo de la fuente, y evidencias de distinta
población no colapsan.
**DoD:** tests 8–17 de `f3-identity-hpo.test.mjs` en verde. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Frecuencia HP / n/m / % | numerador sólo con n/m | test «frecuencia…» ok | HECHO |
| H3.S1.M2 | Inicio → rango sólo de términos HPO | sin término conocido, null | test «inicio…» ok | HECHO |
| H3.S1.M3 | Nivel T2/T3 por PMID | sin PMID → T3 | test «nivel…» ok | HECHO |
| H3.S1.M4 | Sexo sin inventar | sin mapa → null contado | test «sexo e inicio…» ok | HECHO |
| H3.S1.M5 | `source_reference` con calificadores | clave natural única | tests «mismo PMID…» ok | HECHO |
| H3.S1.M6 | Forma de bulk-copy sin ordinal | columnas ⊆ STAGE_COLUMNS | test «filas: forma de bulk-copy…» ok | HECHO |
| H3.S1.M7 | Babelon sólo OFFICIAL | CANDIDATE excluido | test «babelon…» ok | HECHO |
| H3.S1.M8 | Recorte babelon cita fuente y líneas | cabecera `fixture-source`/`fixture-lines` | comparación línea a línea ok=12 bad=0 | HECHO |

## H4 — Gates y entrega
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Install inmutable | sin cambios en lockfile | `corepack yarn install --immutable` → salida 0 | HECHO |
| H4.S1.M2 | Tests del importador | 0 fallos | `node --test "tools/terminology-import/test/**/*.test.mjs"` → fail 0 | HECHO |
| H4.S1.M3 | Typecheck | salida 0 | `corepack yarn typecheck` | HECHO |
| H4.S1.M4 | Lint | salida 0 | `corepack yarn lint` | HECHO |
| H4.S2.M1 | Push de las dos ramas y PR a dev y test | dos PR abiertos, sin merge | URL de los PR | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Total proyectado 279 012 < 800 000 | La meta de la ficha no se cumple con F3.0–F3.3 | Se informa al propietario; no se rellena |
| Carga real no probada | `bulkLoadRelationships` puede rechazar filas | Prueba con base viva antes de F3.3 |
| Conceptos de sexo no resueltos | 615 filas con sexo quedan sin `sex_concept_id` | Resolver ids MALE/FEMALE desde la base al cargar |
