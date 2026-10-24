# Reporte — Catálogo exhaustivo de enfermedades (seed-diseases)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/eager-pasteur-hxks7i` (la tarea pedía `justin/seed-diseases`) · PR: [#688](https://github.com/mdavila-2001/mantra-core-health-api/pull/688) contra `dev`, sin mergear
- Peldaño de evidencia alcanzado: **VERIFIED — carga real en Postgres 16 desechable**: filas, tiempo, idempotencia y consultas del contrato ejercitadas. **No** `REGRESSION_VERIFIED`: no se corrieron `yarn build`, `yarn test`, `yarn docs:validate` ni `yarn docs:build`, y la carga no se hizo contra una base sembrada por la API real (los 12 conceptos internos se insertaron a mano en la base desechable).
- Avance: **24 / 26 microtareas HECHO (92,3 %)**, calculado. 2 BLOQUEADO (H3.S1.M3, H3.S2.M2). El hito H3 queda **A MEDIAS**.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Equivalentes existentes localizados (REL_IS_A, EQUIV_*, LANG_*, TERM_*; `$lookup`, `$translate`, búsqueda) | `grep -n "terminology:relationship:is-a\|terminology:equivalence" src/common/constants/concepts.ts` | `REL_IS_A`, `EQUIV_EQUIVALENT/WIDER/NARROWER/INEXACT/UNMATCHED` existen |
| H1.S1.M2 | Diagnóstico de red | `curl -w '%{http_code}'` por host | 403/000 en orphadata, icd.who.int, nlm, ebi, wikidata, ncbi… (lista en SOURCES.md) |
| H1.S2.M1 | Registro de fuentes | `node -e "import('./tools/terminology-import/diseases/lib/sources.mjs')…"` | `47 5` |
| H1.S2.M2 | Descarga + hash verificado | `node tools/terminology-import/diseases/fetch-sources.mjs` | `[ok] icd11-mms 4214980 B sha256=f1356588f409…` · `Manifiesto: … (52 archivos)` |
| H1.S3.M1 | `SOURCES.md` | lectura | 13 fuentes cargadas, 5 medidas, 16 descartadas con motivo |
| H2.S1.M1–H2.S3.M1 | Lectores, reglas, resolución y plan | `node --test "tools/terminology-import/diseases/test/*.test.mjs"` | `# pass 14` `# fail 0` |
| H2.S3.M2 | Mapeos condicionales | carga con 2 conceptos de prueba (`icd10cm-Q87.4`, `cie10es-Q87.4`) | `[load] mondo {…"externalMaps":2}`; 2.ª corrida `"externalMaps":0` |
| H3.S1.M1 | Regla de deduplicación | test «saturación: …» | ok |
| H3.S1.M2 | 14 pasadas | `coverage-report.mjs` | tabla de 14 filas (`evidencia/coverage.md`) |
| H3.S2.M1 | Cobertura contra MONDO | ídem | DOID 97,1 % · Orphanet 84,1 % · EFO 39,1 % · NCIt 35,0 % · CIE-11 20,7 % |
| H4.S1.M1 | 1.ª carga | `load-catalog.mjs` | `"segundos": 72` (`evidencia/load-1ra-corrida.txt`) |
| H4.S1.M2 | 2.ª carga = 0 nuevas | `load-catalog.mjs` | 12/12 `[load]` en 0, `"segundos": 43` (`evidencia/load-2da-corrida-idempotencia.txt`) |
| H4.S1.M3 | Consultas del contrato | `psql` (§3 de `docs/seed-research/diseases.md`) | OMIM 219700 → `DOID:1485` (sin equiv.), `MONDO:0009061` (equivalent), `586` (equivalent); 1A00 → BlockL2-1A0 → BlockL1-1A0 → chapter-01; «fibrosis quística» → ORPHA 586 |
| H5.S1.M1 | Documento de investigación | `node tools/docs/check-doc-links.mjs` | «Sin enlaces rotos.» |
| H5.S1.M2 | typecheck | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck` | `exit 0` |
| H5.S1.M3 | lint | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn lint` | `exit 0` |
| H5.S1.M4 | PR | GitHub | #688 |
| H5.S1.M5 | PLAN + REPORTE | `ls docs/trabajo/2026-10-24-seed-diseases/` | `PLAN.md REPORTE.md evidencia` |

## A medias

### H3 — Saturación
- Qué anda: 14 pasadas registradas, con dedup por código y cruce publicado. 7 fuentes cargadas, 3 que sólo citan códigos y 5 medidas que no se cargan. También hay cobertura contra MONDO.
- Qué no anda: no hay **dos pasadas seguidas con 0**. La 11 (Hetionet) dio 0, pero la 12 (CIE-10 OMS) aportó 887. Las 13 (MeSH árbol C, +1 585) y 14 (GARD, +2 598) siguen aportando desde fuentes que no se pueden cargar. Tampoco se midió contra UMLS.
- Qué falta exactamente: abrir en el entorno `nlmpubs.nlm.nih.gov` (MeSH oficial con números de árbol), `rarediseases.info.nih.gov` (GARD), `www.orphadata.com`, `icd.who.int`/`icdcdn.who.int` (CIE-11 ES), `eutils.ncbi.nlm.nih.gov`/`www.ebi.ac.uk` (literatura). También confirmar las licencias de NANDO y OncoTree y conseguir la cuenta UTS para UMLS. Después hay que sumar cada fuente a `lib/sources.mjs` + `PASSES` y volver a correr `coverage-report.mjs`.
- Dónde quedó: rama `claude/eager-pasteur-hxks7i`, `tools/terminology-import/diseases/coverage-report.mjs`; tabla en `docs/seed-research/diseases.md` §5.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S1.M3 — dos pasadas seguidas en 0 | BLOQUEADO | Hosts bloqueados y licencias (ver A medias) |
| H3.S2.M2 — cobertura contra UMLS | BLOQUEADO | Cuenta UTS del propietario (no se creó) |
| Licencias: CIE-10 OMS (títulos), CIE-10 OPS ES, OMIM, DeCS, ICD-O-3, CIAP-2, NANDO, OncoTree | BLOQUEADO | Decisión y gestión del propietario |
| Orphanet ES en `/glossary` | TODO | Decisión de curación del propietario y resolver el `IN` de `ConceptsService.searchConcepts` |
| Índices de texto para búsqueda ES (`pg_trgm`) | TODO | Cambio en el repo del modelo (`docs/seed-research/diseases.md` §9) |
| `concept_relationship_evidence` (procedencia por arista) | TODO | Propuesta de `seed-symptoms` para el repo del modelo; no bloquea este catálogo |
| Aprobación y merge de #688 | BLOQUEADO | Revisión humana; el merge lo hace Justin |

## Evidencia

Salidas completas en `evidencia/`. Extractos literales:

```
$ node --test "tools/terminology-import/diseases/test/*.test.mjs"
# tests 14
# pass 14
# fail 0
exit 0

$ node --test "tools/terminology-import/test/*.test.mjs"
# pass 34
# fail 0

$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck
exit 0
$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn lint
exit 0

$ node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs   # 2.ª corrida
[load] mondo {"concepts":0,"designations":0,"properties":0,"relationships":0,"maps":0,"externalMaps":0}
… (12 sistemas, todos en 0)
  "segundos": 43

$ psql … -c "select count(*) …"
 concepts | desig  | props  |  rels  |  maps  |   db
   183325 | 309745 | 491228 | 147251 | 190313 | 419 MB
(183 325 = 183 313 del catálogo + 12 conceptos internos de prueba)
```

Fuentes y hashes: `evidencia/manifest-fuentes.tsv`. Conteos del build: `evidencia/build-stats.json`. Pasadas y cobertura: `evidencia/coverage.md`.

## No cubierto

- La carga contra una base sembrada por la API real (`seed:boot`): se probó con el esquema del repo y los 12 conceptos internos insertados a mano con los mismos ids deterministas.
- Las rutas HTTP (`GET /terminology/concepts`, `CodeSystem/$lookup`, `ConceptMap/$translate`) contra estos datos: se verificó por SQL, no levantando la API.
- `yarn build`, `yarn test` (jest), `yarn docs:validate`, `yarn docs:build`: no corridos. El cambio no toca TypeScript.
- Rendimiento de la búsqueda `ILIKE` sobre ~310 000 designaciones en una base con datos reales del resto del sistema.
- `fetch-sources.mjs --force` (descarga completa desde cero): los archivos ya estaban descargados durante el desarrollo; el script sólo recalculó hashes.

## Desvíos del plan

- **`AGENTS.md` no se leyó al empezar** (el discovery buscó `CLAUDE.md` y `.claude/rules/`, que no existen). El `PLAN.md` se escribió **después** de implementar, y no antes como exige §2.1. Refleja lo ejecutado y no se usó para cambiar el alcance.
- La rama: se pushea a `claude/eager-pasteur-hxks7i` (única permitida para esta sesión), no a `justin/seed-diseases`.
- Fuentes de la tarea que cambiaron de vía por la red: Orphanet sale del espejo oficial en GitHub; la CIE-11 y las tablas OMS salen de copias de terceros con hash verificado. NCIt pasó de la edición 2024-05 a la 26.02d al encontrarse la publicación oficial más nueva.
- No se usó `/loop`: las 14 pasadas se iteraron en la propia sesión hasta agotar las fuentes accesibles.

## Riesgos residuales

- Las copias de terceros (CIE-11, tablas OMS) tienen el hash verificado contra el **manifiesto del propio tercero**, no contra la OMS (bloqueada). Con `icdcdn.who.int` abierto conviene re-bajar desde la URL oficial y comparar.
- CC BY-ND 3.0 IGO: los títulos de la CIE-11 se cargan sin modificar. Cualquier traducción o edición posterior violaría la licencia.
- Claves `umls` (32 150 conceptos, ~96 000 filas): hoy ninguna consulta de producto las lee; si no se van a usar, conviene omitirlas con `--systems`.
- `ncit-disease` (esta sesión) y `ncit` (`seed-symptoms`) son code systems distintos: si `seed-symptoms` carga el subárbol C2991, habrá duplicados (avisado a esa sesión).
- `concept_properties` es la tabla más pesada (158 MB).

## Decisiones y ambigüedades

- **Equivalencias**: se usa la que declara la fuente. Orphanet E→equivalent, NTBT→wider, BTNT→narrower, ND→inexact; MONDO `skos:*` y `MONDO:equivalentTo`. Un xref sin semántica (DOID, EFO, NCIt P207, tablas OMS) entra con equivalencia nula. Supuesto a confirmar con el propietario: los xref de DOID se tratan como «mismo concepto» para deduplicar la saturación, pero no se marcan como equivalentes en `concept_maps`.
- **CIE-10-ES = ICD-10-CM**: los mapeos hacia el glosario CIE-10-ES se derivan del xref ICD-10-CM de MONDO/DOID/EFO por igualdad de código, porque la CIE-10-ES es la traducción oficial de la ICD-10-CM. El `context` lo declara. Confirmar con el propietario.
- **Claves sin título** (OMIM, CIE-10, MeSH, UMLS, DECIPHER, CIE-11 Fundación): `display` = código. No se pone un título tomado de otra fuente.
- **Exclusiones**: SNOMED CT entero; animales no humanos y «disease characteristic» de MONDO; NCIt fuera de C2991; clases importadas por EFO. El cap. X de la CIE-11 (17 556 códigos de extensión) **sí** se carga, porque es parte de la MMS y sirve para la poscoordinación.
- **Glosario**: no se agregaron membresías a `glossary-*`. Queda como decisión del propietario.
