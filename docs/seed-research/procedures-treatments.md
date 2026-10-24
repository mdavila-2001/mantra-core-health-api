# Procedimientos y tratamientos no farmacológicos — por enfermedad y por parte del cuerpo

Rama `justin/seed-procedures-treatments` · importador en `tools/terminology-import/procedures-treatments/`
· fuentes y licencias en `tools/terminology-import/procedures-treatments/SOURCES.md`.

Es una base de **relaciones publicadas**, no un recomendador. Cada fila conserva el predicado literal
de su fuente (`relationType.sourcePredicate`) y la clase de afirmación (`relationType.assertion`):
`curated-literature`, `ontology-axiom`, `terminology-role`, `by-definition`, `investigational`
(los ensayos son siempre «en estudio»), `literature-indexing` (revisiones Cochrane según la indexación MeSH de NLM; no implica eficacia) o `collaborative-referenced` (Wikidata con referencia, no oficial). Nada se deduce por sentido común clínico ni se genera con un modelo.

## Cómo se corre

```sh
node tools/terminology-import/procedures-treatments/fetch.mjs             # descarga (GitHub, CMS, NLM, EVS, Wikidata) + sondeo de red
node tools/terminology-import/procedures-treatments/fetch-ctgov.mjs       # ClinicalTrials.gov API v2 (~25 min, 465 páginas)
node tools/terminology-import/procedures-treatments/fetch-pubmed.mjs --subset cochrane   # MEDLINE (E-utilities); también guidelines y rct
node tools/terminology-import/procedures-treatments/build.mjs             # normaliza, sin red (~25 s)
node tools/terminology-import/procedures-treatments/load.mjs              # dry-run: plan sin base
node tools/terminology-import/procedures-treatments/load.mjs --apply      # carga (.env DB_*)
node tools/terminology-import/procedures-treatments/validate-siblings.mjs --db   # cruce con las ramas hermanas
node --test tools/terminology-import/procedures-treatments/test/*.test.mjs
node tools/terminology-import/procedures-treatments/snapshot.mjs          # respalda el corpus en data/ (git)
```

El corpus de cada pasada queda versionado en `tools/terminology-import/procedures-treatments/data/`
(NDJSON comprimido, `MANIFEST.json` con sha256). Para usarlo sin re-descargar: `zcat data/out/assertions.ndjson.gz`.

## Claves que deja esta sesión (para las sesiones hermanas)

Se resuelve todo por `code_systems.internal_code` (índice único) + `catalog_concepts.code`. Esta sesión
**crea** solo estos code systems, y solo si no existen:

| `internal_code` | Forma del código | Qué contiene |
|---|---|---|
| `maxo` | `MAXO:0000011` (CURIE completo, como lo publica MAxO) | 1 576 procedimientos no farmacológicos |
| `ncit` | `C15256` (sin prefijo) | 346 procedimientos NCIt referenciados por roles de sitio |
| `ohd` | `OHD:0000004` (CURIE completo) | 81 procedimientos odontológicos |
| `icd10pcs` | `0016070` (7 caracteres) | 79 169 procedimientos ICD-10-PCS FY2027 con su título largo oficial |
| `icd10pcs-body-part` | `006` (sección + sistema + valor del eje 4) | 1 692 valores del eje anatómico de PCS |
| `mesh` | `D007044` (sin prefijo) | 1 526 descriptores MeSH 2026 de intervención no farmacológica; si `mesh` ya existe (lo crea `seed-diseases` con su versión `xref-keys`), se agrega una versión `MeSH 2026` al mismo code system |
| `procedure-relationship-types` | `maxo-poet:TREATS`, `ncit:R163`, `icd10pcs:Body Part`, `ctgov:investigational`… | 24 tipos de relación (predicado literal por fuente) |

Y **espera** de las hermanas (no los crea): `mondo` (`MONDO:0005015`) y `mesh` de condición (`D001289`)
de `seed-diseases`; `uberon` (`UBERON:0000945`) de `seed-medical-dictionaries`. La anatomía NCIt no la
carga nadie: esos sitios resuelven por el xref publicado de Uberon cuando es uno a uno.
`validate-siblings.mjs` prueba ambas grafías (con y sin prefijo) y admite `--alias`. ICD-10-PCS no lo
cargó `seed-specialty-services` (cargó el arancel boliviano, FONASA y 186 CUPS), así que esta sesión crea
los procedimientos PCS que referencia, resolviendo por `internal_code`.

## Propuesta para el repo del modelo

**Hallazgo (paso 0).** `terminology.concept_relationships` solo tiene `source_concept_id`,
`target_concept_id`, `relationship_type_concept_id` y `ordinal` (más auditoría). Verificado en
`database/SQL/03_terminology/02_tables.sql` de la API y en el modelo canónico
`mantra-core-technologies/mantra-core-health-model@eceb98f` (SALUD v4.0.10). Puede guardar el **tipo**
(como concepto), pero **no la fuente ni la evidencia**, y una misma relación puede estar respaldada por
varias fuentes. Las alternativas existentes no sirven: `health_data.health_provenance_*` es procedencia
de datos de pacientes con `custodian_tenant_id` obligatorio, y `graph_intelligence.graph_edge_evidence`
es una proyección por tenant con etiquetas redactadas.

**Decisión de esta sesión.** No se escribe ninguna fila en `concept_relationships` mientras no exista
dónde guardar su procedencia: `load.mjs --apply` carga conceptos y propiedades, consulta
`information_schema` y, si falta la tabla de abajo, informa el bloqueo y no escribe relaciones.

**Propuesta.** Una tabla hija, una fila por afirmación publicada (N fuentes → N filas de una relación):

```sql
CREATE TABLE IF NOT EXISTS "terminology"."concept_relationship_assertions" (
    "id" uuid NOT NULL,
    "concept_relationship_id" uuid NOT NULL,   -- FK concept_relationships(id)
    "source_id" uuid NOT NULL,                 -- FK terminology_sources(id)
    "source_record_id" varchar NOT NULL,       -- id del registro en la fuente (fila, PMID|MAXO|MONDO, rol NCIt, NCT…)
    "source_version" varchar NOT NULL,         -- versión publicada usada
    "source_uri" text NOT NULL,                -- URI del registro (fijada por commit/tag cuando existe)
    "source_predicate" varchar NOT NULL,       -- predicado literal de la fuente (TREATS, R163 Procedure_Has_Target_Anatomy…)
    "assertion_kind" varchar NOT NULL,         -- curated-literature | ontology-axiom | terminology-role | by-definition | investigational | collaborative-referenced | literature-indexing
    "evidence_json" jsonb,                     -- código de evidencia, referencias, fenotipo, curador, mapeo usado
    "retrieved_at" timestamptz NOT NULL,
    "import_batch_id" uuid,                    -- FK catalog_import_batches(id)
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL DEFAULT 1,
    CONSTRAINT "pk_concept_relationship_assertions" PRIMARY KEY ("id"),
    CONSTRAINT "ck_cra_assertion_kind" CHECK ("assertion_kind" IN
      ('curated-literature','ontology-axiom','terminology-role','by-definition','investigational','collaborative-referenced','literature-indexing'))
);
CREATE UNIQUE INDEX "uq_cra_relationship_source_record"
  ON "terminology"."concept_relationship_assertions" ("concept_relationship_id", "source_id", "source_record_id");
-- y, para que una relación no se duplique entre importadores:
CREATE UNIQUE INDEX "uq_concept_relationships_triple"
  ON "terminology"."concept_relationships" ("source_concept_id", "target_concept_id", "relationship_type_concept_id");
```

**Convergencia con `seed-drug-treatments`.** Esa sesión propuso lo mismo con otro nombre
(`concept_relationship_provenance`, §6 de `docs/seed-research/drug-treatments.md`): mismas columnas
de procedencia (`source_id`, `source_record_id`, `source_version`, `source_uri`, `retrieved_at`,
`evidence_json`), un `polarity_concept_id` donde acá hay `assertion_kind`, y la misma unicidad por
relación + fuente + registro. Son una sola necesidad: conviene que el repo del modelo elija **un**
nombre y una forma para la clase de afirmación, y los dos cargadores se adaptan (cambia el nombre de
la tabla y una columna).

Variante equivalente si el modelo prefiere conceptos a texto: `assertion_kind_concept_id uuid` en lugar
de `assertion_kind varchar` (el cargador cambiaría una línea). Lo mismo le sirve a
`justin/seed-drug-treatments`, que tiene el mismo problema con fármaco → enfermedad.

**Probado en una base desechable** (PostgreSQL 16.15 local, DDL canónico del módulo 03 + esta tabla,
con MONDO/UBERON simulados solo con los códigos referenciados): 689 relaciones y 732 filas de
procedencia; segunda corrida, 0 filas nuevas. Sin la tabla (DDL canónico tal cual): 1 921 conceptos y
13 391 propiedades, 0 relaciones, segunda corrida 0 (medido en la pasada 1; con OHD el plan sube a 2 004
conceptos y 13 964 propiedades).

## Red del entorno

Pasadas 1–4: la política de red solo alcanzaba GitHub, npm y PyPI (403 al CONNECT para todo lo demás).
Desde el 2026-10-24 16:29 UTC el entorno tiene red completa. El sondeo (`fetch.mjs --probe`, copiado en
`tools/terminology-import/procedures-treatments/data/sources/_network.json`) responde para
ClinicalTrials.gov, CMS, OMS, MinSalud CO, NLM, NCI EVS, EBI, Wikidata, NICE y Sanidad ES; no responden
`www.cochranelibrary.com` (403), `www.minsalud.gob.bo` (respuesta vacía) ni `web.sispro.gov.co`
(conexión cortada). No se usaron espejos de terceros ni se eludió ningún bloqueo.

## Pasadas (protocolo de saturación)

Aportes nuevos contados **por código** tras deduplicar (procedimiento = `system|code`; relación =
tipo + sujeto + objeto). Una pasada aporta 0 cuando ninguna fuente nueva agrega un código o una relación.

| # | Fecha | Fuentes | Procedimientos nuevos | Relaciones nuevas (proc → enf / proc → sitio) | Descartadas en la pasada (motivo) |
|---|---|---|---|---|---|
| 1 | 2026-10-24 | MAxO 2026-01-15, MAxO/POET git `42edd966`, NCIt OBO 24.04e, MONDO 2026-10-06 y Uberon 2026-10-01 (estas dos solo para equivalencias) | 1 907 (MAxO 1 576 · NCIt 331) | 703 (250 / 453), de 746 afirmaciones | AutoMAxO (generado por modelo); anotaciones diagnósticas HPO (no es enfermedad); R172 (fármacos); SNOMED (licencia); las 13 fuentes de la tabla de hosts (red) |
| 2 | 2026-10-24 | OHD 2026-10-01 (git `9cbaa1a1`); evaluadas sin aporte: CIDO, EFO 3.95.0, WHO SMART Guidelines (ANC, HIV, inmunizaciones, FP, STI, RA, BDS, SMBP) | 81 (OHD, odontológicos) | 0 (0 / 0) | SCDO (licencia GPL-3.0: decide el propietario); CDT dentro de OHD (copyright ADA); CIDO/EFO (sin relaciones de procedimiento); WHO SMART (lógica de decisión, no relación publicada); ramas hermanas aún ausentes; red sin cambios |
| 3 | 2026-10-24 | Barrido completo del registro OBO Foundry (267 ontologías, `OBOFoundry.github.io`): candidatas médicas no evaluadas antes — OGMS (git HEAD), ONS (git HEAD), ONE (git HEAD) | 0 | 0 (0 / 0) | OGMS: sin términos de procedimiento; ONS: 121 clases de dieta de diseño de estudios (evaluación dietaria, dieta del estudio) y 2 procesos de fermentación de alimentos con entrada «leche»: no son procedimientos clínicos; ONE: solo «study intervention»/«intervention design»; ECTO, CDNO, FoodOn, OMRSE, DRON, RBO y las de plantas no son procedimientos clínicos (o son fármacos); ramas hermanas aún ausentes; red sin cambios |
| 4 | 2026-10-24 | Disease Ontology `releases/2026-09-30` (CC0), relaciones propias de MONDO 2026-10-06, HPO `releases/2026-09-01` | 0 | 0 (0 / 0) | DOID: solo `is_a` y `has material basis in`; HPO: 0 relaciones hacia MAxO; MONDO: usa `MAXO:0000864 therapeutic uses` 7 veces (fármaco → CHEBI, de `seed-drug-treatments`) y `NCIT:R163` 3 veces (C15290, C15330, C52005: ya estaban en el corpus por NCIt) |
| 5 | 2026-10-24 (red abierta) | NCIt oficial 26.09d (EVS); ICD-10-PCS FY2027 (CMS: tablas + archivo de orden); MeSH 2026 (NLM); ClinicalTrials.gov API 2.0.5, datos 2026-10-23 (464 253 estudios intervencionales); Wikidata P924 (consulta del 2026-10-24) | 80 539 (PCS 79 169 · MeSH 1 355 · NCIt 15) | 113 313 (34 128 / 79 185): ClinicalTrials.gov 34 083 «en estudio», Wikidata 45, PCS 79 169, NCIt oficial 16. **Cifras corregidas en la pasada 6**: la primera versión contaba como procedimientos descriptores MeSH de métodos de investigación (E05: «Control Groups», «Surveys and Questionnaires»…) y conceptos de tiempo/estrategia, y daba 41 094 relaciones de ClinicalTrials.gov | ICHI e ICD-11 (exigen cuenta); Cochrane (sitio 403); NNAC Bolivia (no responde); CUPS completo (sin relaciones, de `seed-specialty-services`); NICE (sin códigos reutilizables); CIE-10-ES (solo nombres); Wikidata sin referencia real (48) o farmacológica (77) |
| 6 | 2026-10-24 | Revisiones Cochrane en MEDLINE (PubMed E-utilities, 17 554 registros, indexación MeSH de NLM) | 171 (MeSH) | 8 075 (8 075 / 0); 5 610 de ellas unen un par procedimiento–condición que ninguna otra fuente tenía | MRCOC (NLM lo retiró: archivado en Archive-It); 13 revisiones retractadas; revisiones sin intervención no farmacológica o sin condición con calificador terapéutico (11 668) |
| 7 | 2026-10-24 | Guías de práctica clínica en MEDLINE (PubMed E-utilities, tipos de publicación `Guideline`/`Practice Guideline`: 44 031 en la búsqueda, 42 934 artículos de revista descargados, 47 particiones por fecha de alta) | 240 (MeSH) | 25 469 (25 469 / 0); 19 404 de ellas unen un par procedimiento–condición que ninguna otra fuente tenía | 1 097 registros de Bookshelf (`PubmedBookArticle`: libros, sin indexación MeSH de artículo); 30 guías retractadas; guías sin intervención no farmacológica o sin condición con calificador terapéutico (29 737, retractadas incluidas) |

**Saturación:** las pasadas 3 y 4 aportaron 0 cada una con la red restringida (saturación de lo alcanzable
entonces). Al abrirse la red, el protocolo se reabrió: la pasada 5 sumó las fuentes grandes, y desde
entonces no hubo dos pasadas seguidas con 0. Las pasadas 8 a 10 (subconjuntos de MEDLINE) no se corrieron:
ver #825.

## Cobertura (acumulada a la pasada 7)

- **Procedimientos:** 82 938. ICD-10-PCS 79 169 (Medical and Surgical 68 493, Imaging 2 982, Radiation
  Therapy 2 057, Physical Rehabilitation 1 411, Administration 1 277, Placement 861, otras 2 088);
  MAxO 1 576; MeSH 1 766 (quirúrgicos 503, diagnósticos 466, terapéuticos u otros 381, dispositivos 255,
  odontológicos 95, conductuales 66); NCIt 346; OHD 81.
- **Procedimiento → enfermedad:** 67 922 relaciones únicas (67 965 afirmaciones), 1 869 procedimientos,
  3 436 enfermedades (3 262 MeSH de condición, 174 MONDO). Por tipo: `ctgov:investigational` 34 083
  (siempre «en estudio»), `pubmed-cochrane:co-indexed` 8 075 («evaluados en revisiones Cochrane», no
  implica eficacia), `pubmed-guideline:co-indexed` 25 469 («tratados en guías de práctica clínica», no
  implica recomendación), `maxo-poet:TREATS` 266, `maxo-poet:PREVENTS` 25, `maxo-poet:NO_OBSERVED_BENEFIT` 2,
  `wikidata:P924` 45. De los 464 253 estudios intervencionales, 50 726 tienen algún MeSH de intervención
  no farmacológica y 40 539 forman al menos un par con una condición; de 17 554 revisiones Cochrane,
  5 886 aportan un par; de 42 934 guías, 13 197.
- **Procedimiento → sitio anatómico:** 79 638 relaciones, 79 530 procedimientos. ICD-10-PCS 79 169 por el
  eje 4 del propio código (`Body Part` 72 749, `Body System / Region` 2 688, `Treatment Site` 2 057,
  `Body Region` 1 141, `Body System` 534); NCIt (OBO + oficial) 454 relaciones a 180 sitios NCIt, de los
  cuales 175 tienen un único Uberon publicado; MAxO 15 a UBERON. CMS no publica un mapeo de los valores
  PCS a Uberon/FMA/TA2: los 1 692 valores quedan en su propio code system (hueco de mapeo, no se inventa).
- **Excluido por farmacológico:** 354 términos MAxO, 145 filas POET, los descriptores MeSH de D, E02.319,
  E02.095.465, E02.183.750, E05.478.550 y E05.478.610, el calificador «drug therapy» en Cochrane y en las guías, y 77
  declaraciones de Wikidata.

## Validación con las ramas hermanas (fase 2)

Las tres ramas se mergearon a `dev` directamente (sus `docs/seed-research/{diseases,medical-dictionaries,
specialty-services}.md` y sus `data/` están en `dev`); esta rama sale de `dev`, así que no hizo falta un
merge local de validación. Claves usadas: las de sus `data/` en git (`diseases/data/*.ndjson.gz`,
`dictionaries/data/ndjson/{uberon,fma}.ndjson.gz`) más los conceptos propios de esta sesión.

| Corpus | Relaciones | Resuelven | Por mapeo publicado | No resuelven | Objetos sin concepto |
|---|---|---|---|---|---|
| Fase 1 (pasadas 1–4), proc → enfermedad | 250 | 250 | — | 0 | 0 |
| Fase 1, proc → sitio | 453 | 439 | 424 | 14 | 5 sitios NCIt sin Uberon |
| Pasada 6, proc → enfermedad | 42 453 | 33 428 (78,7 %) | — | 9 025 | 700 MeSH de condición que `seed-diseases` no cargó (p. ej. «Postoperative Pain», «Shoulder Pain», «Inflammation»: hallazgos del árbol C23) |
| Pasada 6, proc → sitio | 79 638 | 79 624 | 440 | 14 | 5 sitios NCIt sin Uberon |
| Pasada 7, proc → enfermedad | 67 922 | 52 913 (77,9 %) | — | 15 009 | 754 MeSH de condición que `seed-diseases` no cargó (p. ej. «Surgical Wound Infection», «Nausea», «Cough») |
| Pasada 7, proc → sitio | 79 638 | 79 624 | 440 | 14 | 5 sitios NCIt sin Uberon |

Carga verificada en PostgreSQL 16 desechable (DDL canónico del módulo 03 + la tabla propuesta, con las
claves reales de `mondo`, `mesh` y `uberon` de las hermanas), corpus de la pasada 6: 84 414 conceptos,
590 802 propiedades, 113 052 relaciones y 113 095 filas de procedencia (9 039 relaciones sin extremo);
segunda corrida, 0 filas nuevas. Con el DDL canónico sin la tabla: los mismos conceptos y propiedades, 0 relaciones.

## Huecos

1. **Relaciones en la base:** el modelo no tiene dónde guardar su procedencia (propuesta arriba; misma
   necesidad que `seed-drug-treatments`).
2. **754 MeSH de condición sin concepto** (15 009 relaciones de ClinicalTrials.gov, Cochrane y guías): son descriptores del
   árbol C que `seed-diseases` no cargó (muchos son hallazgos/síntomas del C23). Se cargan si esa sesión
   (o la de síntomas) los incorpora; esta sesión no crea enfermedades.
3. **ICHI e ICD-11:** exigen cuenta (no se crean). **NNAC Bolivia:** el sitio no responde. (El sitio de
   Cochrane responde 403, pero sus revisiones entran por MEDLINE.)
4. **PCS → Uberon/FMA/TA2:** no hay mapeo publicado por CMS.
5. **Nombres en castellano:** MAxO, NCIt y MeSH (inglés) se dejan con su etiqueta oficial; los nombres
   oficiales en castellano de ICD-10-PCS (CIE-10-ES) ya los tiene la capa `cie10es-procedimientos` del
   glosario. DeCS (MeSH en castellano, BIREME) exige solicitar licencia.
6. **NCIt:** ni la edición OBO ni la oficial traen roles R180 (`Procedure_Has_Target_Disease`).
