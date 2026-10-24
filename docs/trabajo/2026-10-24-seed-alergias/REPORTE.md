# Reporte — Seeder exhaustivo de alergias

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/lucid-ptolemy-y1w570` (PR #682 contra `dev`, sin mergear)
- Peldaño de evidencia alcanzado:
  - Importador: **`VERIFIED`**. Se corrió la carga real en Postgres 16 con el DDL vendorizado; la persistencia se comprobó por SQL y la segunda corrida insertó 0.
  - Enumeraciones de la API: **`TESTED`**. Pasan los specs dirigidos; **no** se arrancó la API para verlas sembradas y publicadas por `system-context`.
  - Peldaño global: **`TESTED`**.
- Avance: 13 / 13 microtareas `HECHO` = 100 % (13 ÷ 13). El peldaño global no llega a `REGRESSION_VERIFIED`: ver «No cubierto».

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | 15 conceptos FHIR nuevos, sin colisión de clave ni de código | `yarn test src/common/seed/concept-codes.spec.ts` (dentro de `jest-seed-dirigido.txt`) | 5 suites, 37 tests verdes |
| H1.S1.M2 | 6 enumeraciones publicadas en `DYNAMIC_ENUM_CATALOG` | `yarn test src/common/seed/dynamic-enum-catalog.spec.ts` | verde (ídem) |
| H1.S1.M3 | Nombre y definición ES de las 20 opciones | `yarn test src/common/seed/terminology-designations.es.spec.ts` | verde (ídem) |
| H1.S1.M4 | JSON de códigos HL7 consistente con las enumeraciones | `yarn test src/common/seed/data/allergies` | 5 tests verdes |
| H2.S1.M1 | 16 artefactos descargados con URL, commit/versión, SHA-256 y licencia | `node tools/terminology-import/allergies/fetch-allergy-sources.mjs` | «16 artefactos; 0 fallas» (`data/allergy-sources.manifest.json`) |
| H2.S1.M2 | Lectores OBO/OWL/Babelon/OFF/FHIR sobre extractos reales | `node --test "tools/terminology-import/allergies/test/*.test.mjs"` | `# pass 12` `# fail 0` |
| H2.S2.M1 | 20 pasadas; 55 503 conceptos; las pasadas 18, 19 y 20 en 0 | `node tools/terminology-import/allergies/build-allergy-catalog.mjs` | tabla en `evidencia/build-allergy-catalog.txt` |
| H2.S3.M1 | Carga idempotente | `load-allergy-catalog.mjs --from-repo` ×2 en una base limpia | 1.ª: 55 503 conceptos; 2.ª: 0 en todas las tablas |
| H2.S3.M2 | NDJSON versionado (4,3 MB) que se carga sin el build local | `load-allergy-catalog.mjs --from-repo` | «Leyendo …/allergies/data/allergy-catalog.ndjson.gz» |
| H3.S1.M1 | Investigación, pasadas, cobertura y huecos | `node tools/docs/check-doc-links.mjs` | «Sin enlaces rotos» |
| H3.S1.M2 | Fuentes y licencias; 30 hosts bloqueados, verificados uno por uno | `curl https://<host>/` | 403 en el CONNECT del proxy en todos (tabla en `SOURCES.md`) |
| H3.S1.M3 | PR contra `dev` | `mcp github create_pull_request` | PR #682 abierto, sin mergear |
| H3.S1.M4 | Plan, reporte y evidencia en disco | — | este directorio |

## A medias
Ninguna.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Fuentes IUIS, ICD-11, openFDA/UNII, RxNav, NCIt, ChEBI completo, UniProt, EUR-Lex, Codex, CDC, Wikidata y DeCS | BLOQUEADO | Habilitar esos hosts en la política de red del entorno; cada uno es una pasada más (aporte esperado en `docs/seed-research/allergies.md` § Huecos) |
| SNOMED CT (incluido el Global Patient Set) | BLOQUEADO | Licencia: Bolivia no es país miembro |
| Redistribución de los datos de Open Food Facts (ODbL) | BLOQUEADO | Decisión del propietario |
| Las 2 suites de Jest rojas, ajenas a este trabajo (`glossary-articles.catalog.spec`, `xlsx-parser.spec`) | BLOQUEADO (fuera de alcance) | Ver «Decisiones y ambigüedades» |

## Evidencia
Salidas literales en `evidencia/` (los sockets locales se reemplazaron por `<socket-local>`; no hay datos clínicos ni PHI: todo es terminología).

```
$ yarn typecheck                       # NODE_OPTIONS=--max-old-space-size=8192
exit 0                                 (evidencia/typecheck.txt)

$ npx eslint src/common/seed/data/allergies/**/*.ts + los 3 archivos compartidos
exit 0                                 (evidencia/eslint-dirigido.txt)

$ node --test "tools/terminology-import/allergies/test/*.test.mjs"
# pass 12
# fail 0                               (evidencia/node-test-allergies.txt)

$ node --test "tools/terminology-import/test/*.test.mjs"
# pass 34
# fail 0                               (evidencia/node-test-terminology-import.txt)

$ yarn test src/common/seed/data/allergies … (seed dirigido)
Test Suites: 5 passed, 5 total
Tests:       37 passed, 37 total       (evidencia/jest-seed-dirigido.txt)

$ yarn test src/common/seed src/modules/terminology src/modules/system_context src/modules/clinical
Test Suites: 2 failed, 111 passed, 113 total
Tests:       2 failed, 1261 passed, 1263 total   (evidencia/jest-seed-terminology-clinical.txt)

$ (worktree en origin/dev 00a07330, sin estos cambios) jest glossary-articles.catalog + xlsx-parser
FAIL src/common/seed/glossary-articles.catalog.spec.ts
FAIL src/modules/terminology/import/xlsx-parser.spec.ts
Tests:       2 failed, 23 passed, 25 total       (evidencia/jest-rojos-preexistentes-en-dev.txt)

$ load-allergy-catalog.mjs --from-repo   (corrida 1, Postgres 16 desechable)
{'concepts': 55503, 'designations': 99639, 'properties': 354869, 'relationships': 24187,
 'valueSets': 16, 'valueSetVersions': 16, 'members': 92631, 'conceptMapsSkipped': 0, 'conceptMaps': 20}
$ load-allergy-catalog.mjs --from-repo   (corrida 2)
{'concepts': 0, 'designations': 0, 'properties': 0, 'relationships': 0,
 'valueSets': 0, 'valueSetVersions': 0, 'members': 0, 'conceptMapsSkipped': 0, 'conceptMaps': 0}
                                       (evidencia/carga-postgres-corrida-{1,2}.txt, conteo-por-code-system.txt)

$ sha256 del NDJSON reconstruido vs. el versionado (descomprimido)
d0124219a82f326d803ba4549262e4afbf8127c6c79ff7ad3609ca3c2c0da8ee  (iguales: la construcción es reproducible)

$ mkdocs build --strict
Aborted with 2 warnings in strict mode!   — los dos ya existían: mermaid sin internet y
                                            architecture/module-layout.md; ninguno de esta página
```

## No cubierto
- **Arranque real de la API:** no se ejercitó el seed de la API contra una base, ni se leyeron las enumeraciones por `system-context`. Los conceptos internos de la base de prueba se insertaron con un arnés (`evidencia/arnes-conceptos-internos.ts.txt`) que replica los ids de `TerminologySeedService`; no es el servicio en sí.
- **Búsqueda por la API:** no se ejercitó `GET /terminology/concepts?valueSetId=…` sobre los value sets cargados.
- **`yarn build` y `yarn test` completos:** no se corrieron (solo los dirigidos de arriba).
- **FK diferidas:** no se aplicaron las FK diferidas de `terminology` (dependen de `iam`), así que su validación no está cubierta.
- **`xlsx` versionado:** las pruebas corrieron con `xlsx@0.18.5` instalado a mano, porque `cdn.sheetjs.com` está bloqueado. No se probó con el `xlsx@0.20.3` del lockfile.

## Desvíos del plan
- **El plan se escribió después del código.** `AGENTS.md` exige lo contrario y no se leyó a tiempo en esta sesión; se registra como incumplimiento del procedimiento.
- **Datos dentro de git:** el brief original decía fuentes fuera de git. Después llegó la orden del propietario («que lo lleven todo a la nube»), así que el NDJSON normalizado se versionó comprimido. Los crudos siguen fuera de git, pero se pueden reproducir.
- **Rama:** `claude/lucid-ptolemy-y1w570` en lugar de `justin/seed-allergies`, por asignación de la sesión.
- **`/loop`:** la orden de iterar con `/loop` llegó desde otra sesión. Las pasadas se hicieron dentro de esta sesión hasta lograr dos seguidas en 0. Un `/loop` temporizado no cambia el resultado, porque el límite es la red y no el tiempo.

## Riesgos residuales
- `ConceptsService.searchConcepts` materializa todos los miembros del value set en un `IN`: 36 029 en `allergy-substances` y 19 178 en `allergy-manifestations`. Conviene resolverlo con `JOIN`/`EXISTS` antes de abrirlo a usuarios.
- **Desactualización de fuentes:** RxNorm 05052025 y NDF-RT 20180301, tal como vienen en VSAC 0.24.0. NDF-RT fue reemplazado por MED-RT.
- **Condiciones repetidas entre fuentes** (p. ej. «rinitis alérgica» en HPO, DOID y OAE): pueden confundir a quien elige.
- **Idioma:** 38 000 conceptos se muestran en inglés porque no hay fuente oficial en castellano alcanzable.

## Decisiones y ambigüedades
- **Traducción de las 20 opciones:** es del proyecto, no oficial, y así se declara en el código. Confirmar con el propietario.
- **Open Food Facts (ODbL):** se usa internamente con atribución. Antes de redistribuir, confirmar con el propietario.
- **Deduplicación:** solo por identidad o por equivalencia declarada por la fuente (Mondo `equivalentTo` → DOID), nunca por parecido de nombre.
- **Marcas RxNorm (BN):** se descartaron 5 096 porque la alergia se registra al ingrediente.
- **Suites rojas preexistentes:**
  - `glossary-articles.catalog.spec` falla igual en `origin/dev` (evidencia en `jest-rojos-preexistentes-en-dev.txt`).
  - `xlsx-parser.spec` también falla en `dev`, pero con el mismo `node_modules`, que tiene `xlsx@0.18.5`. Puede deberse a esa versión: no queda demostrado que falle con `0.20.3`. No se tocaron porque están fuera de alcance.
