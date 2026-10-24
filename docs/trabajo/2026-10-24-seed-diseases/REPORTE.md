# Reporte — Catálogo exhaustivo de enfermedades (seed-diseases)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/eager-pasteur-hxks7i` (la tarea pedía `justin/seed-diseases`) · PR: [#688](https://github.com/mdavila-2001/mantra-core-health-api/pull/688) contra `dev`, sin mergear
- Peldaño de evidencia alcanzado: **VERIFIED — carga real en Postgres 16 desechable**: filas, tiempo, idempotencia y consultas del contrato ejercitadas. **No** `REGRESSION_VERIFIED`: no se corrieron `yarn build`, `yarn test`, `yarn docs:validate` ni `yarn docs:build`, y la carga no se hizo contra una base sembrada por la API real (los 12 conceptos internos se insertaron a mano en la base desechable).
- Avance: **32 / 33 microtareas HECHO (97,0 %)**, calculado. 1 BLOQUEADO (H3.S2.M2, cobertura contra UMLS). El hito H3 queda **A MEDIAS** sólo por eso.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Equivalentes existentes localizados (REL_IS_A, EQUIV_*, LANG_*, TERM_*; `$lookup`, `$translate`, búsqueda) | `grep -n "terminology:relationship:is-a\|terminology:equivalence" src/common/constants/concepts.ts` | `REL_IS_A`, `EQUIV_EQUIVALENT/WIDER/NARROWER/INEXACT/UNMATCHED` existen |
| H1.S1.M2 | Diagnóstico de red | `curl -w '%{http_code}'` por host | 403/000 en orphadata, icd.who.int, nlm, ebi, wikidata, ncbi… (lista en SOURCES.md) |
| H1.S2.M1 | Registro de fuentes | `node -e "import('./tools/terminology-import/diseases/lib/sources.mjs')…"` | `47 5` |
| H1.S2.M2 | Descarga + hash verificado | `node tools/terminology-import/diseases/fetch-sources.mjs` | `[ok] icd11-mms 4214980 B sha256=f1356588f409…` · `Manifiesto: … (52 archivos)` |
| H1.S3.M1 | `SOURCES.md` | lectura | 13 fuentes cargadas, 5 medidas, 16 descartadas con motivo |
| H2.S1.M1–H2.S3.M1 | Lectores, reglas, resolución y plan | `node --test "tools/terminology-import/diseases/test/*.test.mjs"` | `# pass 18` `# fail 0` |
| H2.S3.M2 | Mapeos condicionales | carga con 2 conceptos de prueba (`icd10cm-Q87.4`, `cie10es-Q87.4`) | `[load] mondo {…"externalMaps":2}`; 2.ª corrida `"externalMaps":0` |
| H3.S1.M1 | Regla de deduplicación | test «saturación: …» | ok |
| H3.S1.M2 | 19 pasadas | `coverage-report.mjs` | tabla de 19 filas (`evidencia/coverage.md`) |
| H3.S1.M3 | Dos pasadas seguidas en 0 | `coverage-report.mjs` | pasadas 16 (ClinGen 118), 17 (ClinVar 5 052), 18 (Alliance 2 160) y 19 (CURE ID 25): `newConcepts 0` |
| H3.S1.M5 | Pasadas del Monarch KG 2026-10-07 | `fetch-sources.mjs --only monarch-` + `coverage-report.mjs` | 4 archivos con SHA-256 esperado; 0 nuevos tras seguir el `replaced_by` de 8 MONDO obsoletos |
| H3.S1.M6 | Bug del filtro de MONDO corregido (encontrado por la pasada 16: 64 MONDO humanos vigentes citados por ClinGen/ClinVar faltaban) | build + test | `[mondo] 27695 (excluidos 8360)` (antes 27 185 / 8 870); 0 faltantes; carga desde la instantánea ×2 → `184908\|311525\|495193\|147815\|191467`, 2.ª en 0, 88 s / 42 s |
| H3.S2.M1 | Cobertura contra MONDO | ídem | DOID 97,1 % · Orphanet 84,1 % · EFO 39,1 % · NCIt 35,0 % · CIE-11 20,7 % |
| H4.S1.M1 | 1.ª carga | `load-catalog.mjs` | `"segundos": 72` (`evidencia/load-1ra-corrida.txt`) |
| H4.S1.M2 | 2.ª carga = 0 nuevas | `load-catalog.mjs` | 12/12 `[load]` en 0, `"segundos": 43` (`evidencia/load-2da-corrida-idempotencia.txt`) |
| H4.S1.M3 | Consultas del contrato | `psql` (§3 de `docs/seed-research/diseases.md`) | OMIM 219700 → `DOID:1485` (sin equiv.), `MONDO:0009061` (equivalent), `586` (equivalent); 1A00 → BlockL2-1A0 → BlockL1-1A0 → chapter-01; «fibrosis quística» → ORPHA 586 |
| H5.S1.M1 | Documento de investigación | `node tools/docs/check-doc-links.mjs` | «Sin enlaces rotos.» |
| H5.S1.M2 | typecheck | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck` | `exit 0` |
| H5.S1.M3 | lint | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn lint` | `exit 0` |
| H5.S1.M4 | PR | GitHub | #688 |
| H6.S1.M1 | Instantánea versionada `diseases/data/` | `ls -la tools/terminology-import/diseases/data` | 12 `*.part-01.ndjson.gz`, mayor `mondo` 4 162 925 B; total 14 MB |
| H6.S1.M2 | Gzip determinista | `sha256sum -c sha-before.txt` tras rebuild | `mondo.part-01.ndjson.gz: OK` |
| H6.S1.M3 | Carga desde la instantánea | `load-catalog.mjs --from-snapshot` ×2 en base limpia | 1.ª `"segundos": 85`; 2.ª 0 nuevas, `"segundos": 44`; conteos `183325\|309745\|491228\|147251\|190313` = los del build (`evidencia/load-snapshot-*.txt`) |
| H6.S1.M4 | Carga parcial `--systems` (bug encontrado y corregido: FK de `concept_maps` hacia sistemas no cargados) | `fresh-db.sh` + `--from-snapshot --systems orphanet,omim`, luego `--systems mondo`, luego completo ×2 | parcial sin error (`orphanet maps 8745`); completo converge a `183325\|190313`; corrida siguiente 0 nuevas |
| H3.S1.M4 | Pasada 15: anotaciones HPO de enfermedades comunes (Groza 2015), fuente aportada por `seed-symptoms` | `fetch-sources.mjs --only hpo-common-diseases` (SHA-256 esperado) + build + `coverage-report.mjs` | `cited 3647, existing 2600, keys 1046, unresolved 1`; `mesh` 8 863 → 9 264; pasada 15 = 670 nuevos; carga desde la instantánea ×2 → `183726\|…\|492030\|…` y 0 nuevas |
| H5.S1.M5 | PLAN + REPORTE | `ls docs/trabajo/2026-10-24-seed-diseases/` | `PLAN.md REPORTE.md evidencia` |

## A medias

### H3 — Saturación y cobertura
- Qué anda: 19 pasadas registradas, con dedup por código y cruce publicado. Las cuatro últimas (ClinGen, ClinVar, Alliance, CURE ID) aportan 0, así que el criterio de dos pasadas seguidas en 0 **se cumple**. La cobertura contra MONDO está medida.
- Qué no anda: la cobertura contra UMLS no se midió (cuenta UTS). Además, las pasadas 16–19 llegan con ids ya normalizados a MONDO por Monarch: prueban que ninguna enfermedad que usan quedó afuera, pero no traen nomenclatura propia. Las fuentes que **sí** aportarían siguen sin poder cargarse: MeSH oficial (+1 562 medidos con la conversión de terceros), GARD (+2 598), NANDO (+685), OncoTree (+189).
- Qué falta exactamente: la cuenta UTS para UMLS. Abrir en el entorno `nlmpubs.nlm.nih.gov` (MeSH), `rarediseases.info.nih.gov` (GARD), `icd.who.int`/`icdcdn.who.int` (CIE-11 ES) y `eutils.ncbi.nlm.nih.gov`/`www.ebi.ac.uk` (literatura). Confirmar las licencias de NANDO y OncoTree. Cada fuente nueva se suma a `lib/sources.mjs` + `PASSES` y se vuelve a correr `coverage-report.mjs`.
- Dónde quedó: rama `claude/eager-pasteur-hxks7i`, `tools/terminology-import/diseases/coverage-report.mjs`; tabla en `docs/seed-research/diseases.md` §5.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
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
# tests 18
# pass 18
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
   184908 | 311525 | 495193 | 147815 | 191467 | 423 MB   (tras la corrección de MONDO, desde la instantánea)
(184 908 = 184 896 del catálogo + 12 conceptos internos de prueba)
```

Fuentes y hashes: `evidencia/manifest-fuentes.tsv`. Conteos del build: `evidencia/build-stats.json`. Pasadas y cobertura: `evidencia/coverage.md`.

## No cubierto

- Scripts de la base desechable: ahora versionados en `tools/terminology-import/diseases/test/disposable-db/` (`fresh-db.sh`, `seed-internal.mjs`); sólo para bases de prueba.

- La carga contra una base sembrada por la API real (`seed:boot`): se probó con el esquema del repo y los 12 conceptos internos insertados a mano con los mismos ids deterministas.
- Las rutas HTTP (`GET /terminology/concepts`, `CodeSystem/$lookup`, `ConceptMap/$translate`) contra estos datos: se verificó por SQL, no levantando la API.
- `yarn build`, `yarn test` (jest), `yarn docs:validate`, `yarn docs:build`: no corridos. El cambio no toca TypeScript.
- Rendimiento de la búsqueda `ILIKE` sobre ~310 000 designaciones en una base con datos reales del resto del sistema.
- `fetch-sources.mjs --force` (descarga completa desde cero): los archivos ya estaban descargados durante el desarrollo; el script sólo recalculó hashes.

## Desvíos del plan

- **`AGENTS.md` no se leyó al empezar** (el discovery buscó `CLAUDE.md` y `.claude/rules/`, que no existen). El `PLAN.md` se escribió **después** de implementar, y no antes como exige §2.1. Refleja lo ejecutado y no se usó para cambiar el alcance.
- La rama: se pushea a `claude/eager-pasteur-hxks7i` (única permitida para esta sesión), no a `justin/seed-diseases`.
- Fuentes de la tarea que cambiaron de vía por la red: Orphanet sale del espejo oficial en GitHub; la CIE-11 y las tablas OMS salen de copias de terceros con hash verificado. NCIt pasó de la edición 2024-05 a la 26.02d al encontrarse la publicación oficial más nueva.
- **Datos en git**: el brief decía «fuentes fuera de git». Una orden posterior del propietario, recibida por la sesión coordinadora, pidió subir todo lo normalizado. Se versiona `diseases/data/` (14 MB gzip, partes < 45 MB). Las fuentes crudas (1,3 GB) siguen fuera y se reproducen con `fetch-sources.mjs` (URL, versión, SHA-256).
- **Error del catálogo encontrado y corregido**: el filtro de MONDO exigía llegar a «disease» (MONDO:0000001) y dejaba afuera las raíces «disease susceptibility» (MONDO:0042489, susceptibilidades de OMIM) e «injury» (MONDO:0021178). Lo destapó la pasada 16: ClinGen y ClinVar citaban 64 MONDO humanos vigentes que no estaban. Las pasadas 1–15 se recalcularon con el catálogo corregido.
- No se usó `/loop`: las 19 pasadas se iteraron en la propia sesión hasta agotar las fuentes accesibles.

## Riesgos residuales

- Las copias de terceros (CIE-11, tablas OMS) tienen el hash verificado contra el **manifiesto del propio tercero**, no contra la OMS (bloqueada). Con `icdcdn.who.int` abierto conviene re-bajar desde la URL oficial y comparar.
- CC BY-ND 3.0 IGO: los títulos de la CIE-11 se cargan sin modificar. Cualquier traducción o edición posterior violaría la licencia.
- Claves `umls` (32 150 conceptos, ~96 000 filas): hoy ninguna consulta de producto las lee; si no se van a usar, conviene omitirlas con `--systems`.
- `ncit-disease` (esta sesión) y `ncit` (`seed-symptoms`) son code systems distintos: si `seed-symptoms` carga el subárbol C2991, habrá duplicados (avisado a esa sesión).
- `concept_properties` es la tabla más pesada (158 MB).
- La instantánea `diseases/data/` incluye los títulos de la CIE-11 sin modificar (CC BY-ND 3.0 IGO). Sólo cambia el formato, a NDJSON. Si el repo deja de ser privado, conviene revisar la redistribución con la licencia de la OMS.
- Licencia de NCIt: el `.obo` no la declara. CC BY 4.0 sale de los términos de uso de NCI EVS citados en `docs/terminology-expansion/SOURCE-REGISTER.md`, y esa página no fue accesible desde esta red. Hay que reconfirmarla. El code system se nombra como subconjunto de la NCIt OBO Edition, no como la edición oficial.

## Decisiones y ambigüedades

- **Equivalencias**: se usa la que declara la fuente. Orphanet E→equivalent, NTBT→wider, BTNT→narrower, ND→inexact; MONDO `skos:*` y `MONDO:equivalentTo`. Un xref sin semántica (DOID, EFO, NCIt P207, tablas OMS) entra con equivalencia nula. Supuesto a confirmar con el propietario: los xref de DOID se tratan como «mismo concepto» para deduplicar la saturación, pero no se marcan como equivalentes en `concept_maps`.
- **CIE-10-ES = ICD-10-CM**: los mapeos hacia el glosario CIE-10-ES se derivan del xref ICD-10-CM de MONDO/DOID/EFO por igualdad de código, porque la CIE-10-ES es la traducción oficial de la ICD-10-CM. El `context` lo declara. Confirmar con el propietario.
- **Claves sin título** (OMIM, CIE-10, MeSH, UMLS, DECIPHER, CIE-11 Fundación): `display` = código. No se pone un título tomado de otra fuente.
- **Exclusiones**: SNOMED CT entero; animales no humanos y «disease characteristic» de MONDO; NCIt fuera de C2991; clases importadas por EFO. El cap. X de la CIE-11 (17 556 códigos de extensión) **sí** se carga, porque es parte de la MMS y sirve para la poscoordinación.
- **Glosario**: no se agregaron membresías a `glossary-*`. Queda como decisión del propietario.
