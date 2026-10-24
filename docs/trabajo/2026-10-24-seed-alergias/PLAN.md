# Plan — Seeder exhaustivo de alergias

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: glosario ES y catálogo de medicamentos (`tools/terminology-import/`)
- Resultado observable: quien registra una alergia puede elegir sustancia, tipo, categoría, criticidad, estados y severidad desde catálogos reales y trazables. Las sustancias y manifestaciones se buscan con `GET /terminology/concepts?valueSetId=…` sobre los value sets `allergy-*`.
- Kill-test: correr el cargador dos veces sobre un Postgres con el DDL vendorizado. Si la segunda corrida inserta filas, o si algún concepto no trae `allergy_provenance`, no está hecho.

> **Desvío declarado:** este plan se escribió **después** del código. `AGENTS.md`
> (presente en `dev`) exige escribirlo antes, y en esta sesión no se leyó a
> tiempo. El contenido refleja el alcance que se pidió y los estados reales al
> cierre. Ver `REPORTE.md` § Desvíos.

## Alcance
- IN: `src/common/seed/data/allergies/`, `tools/terminology-import/allergies/`, `docs/seed-research/allergies.md`, `docs/trabajo/2026-10-24-seed-alergias/`; una línea aditiva en `module-concepts.ts`, `dynamic-enum-catalog.ts` y `terminology-designations.es.ts`; una sección en `tools/terminology-import/README.md`.
- OUT: entidades, DDL y migraciones (ADR-0021); `searchConcepts` (su `IN` gigante se anota, no se toca); `package.json` y `yarn.lock` (la sustitución local de `xlsx` no se versiona); las suites rojas preexistentes (`glossary-articles.catalog.spec`, `xlsx-parser.spec`).
- Ambigüedades registradas:
  - Rama: el pedido nombra `justin/seed-allergies`, la sesión asignó `claude/lucid-ptolemy-y1w570`. Supuesto: se usa la asignada. Confirmar con Justin.
  - Datos dentro o fuera de git: el brief decía fuera de git; luego llegó la orden del propietario de subir todo. Supuesto: el NDJSON normalizado va comprimido en `allergies/data/` y los crudos no se suben (se descargan con el script, con URL, versión y SHA-256).
  - Open Food Facts (ODbL): supuesto, uso interno con atribución. Confirmar con el propietario antes de redistribuir.
  - Condiciones repetidas entre fuentes («rinitis alérgica» en HPO, DOID y OAE): no se fusionan sin una equivalencia declarada. Confirmar con el propietario qué fuente se muestra por defecto.

## H1 — Enumeraciones FHIR AllergyIntolerance en la API
**CA:** Dado el seed de la API, cuando se publican las enumeraciones, entonces los seis campos de catálogo de alergia y reacción tienen su enumeración completa de HL7, con nombre y definición en castellano y un código HL7 trazable por opción.
**DoD:** `yarn typecheck` → exit 0; `yarn test src/common/seed/data/allergies …` → verde; `eslint` dirigido → exit 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Conceptos faltantes (`allergy.concepts.ts`) | 15 conceptos con prefijo propio, sin colisión de clave ni de código | `yarn test src/common/seed/concept-codes.spec.ts` → verde | HECHO |
| H1.S1.M2 | Enumeraciones (`allergy-dynamic-enums.ts`) esparcidas en el catálogo | 6 enumeraciones, una por campo, que reutilizan los 5 `CLIN.ALLERGY_*` | `yarn test src/common/seed/dynamic-enum-catalog.spec.ts` → verde | HECHO |
| H1.S1.M3 | Designaciones ES (`allergy-designations.es.ts`) | cada opción tiene `display` y `definition` en castellano | `yarn test src/common/seed/terminology-designations.es.spec.ts` → verde | HECHO |
| H1.S1.M4 | Correspondencia HL7 (`fhir-allergy-enum-codes.json`) y spec de consistencia | el orden y los ids coinciden con las enumeraciones | `yarn test src/common/seed/data/allergies` → 5 tests verdes | HECHO |

## H2 — Importador del corpus de alergias
**CA:** Dado un clon del repo con red a npm y GitHub, cuando se corre `fetch` → `build` → `load`, entonces quedan en `terminology.*` todas las sustancias, condiciones y manifestaciones de las fuentes alcanzables, con procedencia y licencia por concepto, y la segunda carga no inserta nada.
**DoD:** `node --test "tools/terminology-import/allergies/test/*.test.mjs"` → 12 pass; carga real en Postgres 16 desechable dos veces → 2.ª = 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Descarga reproducible (`fetch-allergy-sources.mjs`) | `manifest.json` con URL, commit o versión, SHA-256 y licencia por artefacto | `node …/fetch-allergy-sources.mjs` → «16 artefactos; 0 fallas» | HECHO |
| H2.S1.M2 | Lectores OBO, OWL, Babelon, OFF y FHIR (`lib/parse.mjs`) | leen extractos reales sin perder datos | `node --test …/allergies/test/` → 12 pass | HECHO |
| H2.S2.M1 | Pasadas y deduplicación (`lib/catalog.mjs`, `build-allergy-catalog.mjs`) | 20 pasadas registradas; las tres últimas en 0 | `node …/build-allergy-catalog.mjs` → tabla de pasadas | HECHO |
| H2.S3.M1 | Plan de carga y cargador idempotente | 2.ª corrida = 0 filas nuevas | ver `evidencia/carga-postgres-corrida-{1,2}.txt` | HECHO |
| H2.S3.M2 | Datos normalizados versionados (`allergies/data/*.gz`) y lectura `--from-repo` | el cargador carga desde el `.gz` sin `glossary-data-build/` | `load-allergy-catalog.mjs --from-repo` → «Leyendo …/data/allergy-catalog.ndjson.gz» | HECHO |

## H3 — Investigación, licencias y cierre
**CA:** Dado el PR, cuando lo lee alguien que no vio la sesión, entonces encuentra las fuentes, las licencias, cada pasada con sus números, los huecos con su motivo y la evidencia de las pruebas.
**DoD:** `node tools/docs/check-doc-links.mjs` → «Sin enlaces rotos»; `mkdocs build --strict` sin avisos nuevos; PR contra `dev` abierto y sin mergear.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `docs/seed-research/allergies.md` | pasadas, cobertura y huecos | `node tools/docs/check-doc-links.mjs` → sin rotos | HECHO |
| H3.S1.M2 | `allergies/SOURCES.md` y `allergies/README.md` | licencia y evidencia por fuente; hosts bloqueados verificados uno por uno | `curl https://<host>/` por host → 403 (ver `SOURCES.md`) | HECHO |
| H3.S1.M3 | PR contra `dev` | abierto, sin mergear | PR #682 | HECHO |
| H3.S1.M4 | `PLAN.md` y `REPORTE.md` (este directorio) | existen, con evidencia literal | archivos en disco | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| La red del contenedor bloquea las fuentes de referencia (IUIS, ICD-11, openFDA, RxNav, NCIt, EUR-Lex, Wikidata) | Cobertura parcial; saturación sólo sobre lo alcanzable | Usar los paquetes FHIR de npm y las ontologías de GitHub; documentar cada hueco con su host y su aporte esperado |
| `searchConcepts` con un `IN` de 36 029 ids | Lentitud con usuarios | Anotado; queda fuera de alcance |
| ODbL (Open Food Facts) | Compartir igual si se redistribuye | Decisión del propietario |
