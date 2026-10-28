# Procedimientos y tratamientos no farmacológicos — por enfermedad y por parte del cuerpo

Rama `justin/seed-procedures-treatments` · importador en `tools/terminology-import/procedures-treatments/`
· fuentes y licencias en `tools/terminology-import/procedures-treatments/SOURCES.md`.

Es una base de **relaciones publicadas**, no un recomendador. Cada fila conserva el predicado literal
de su fuente (`relationType.sourcePredicate`) y la clase de afirmación (`relationType.assertion`):
`curated-literature`, `ontology-axiom`, `terminology-role`, `by-definition` o `investigational`
(los ensayos son siempre «en estudio»). Nada se deduce por sentido común clínico ni se genera con un modelo.

## Cómo se corre

```sh
node tools/terminology-import/procedures-treatments/fetch.mjs             # descarga (GitHub) + sondeo de red
node tools/terminology-import/procedures-treatments/build.mjs             # normaliza, sin red (~11 s)
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
| `ncit` | `C15256` (sin prefijo) | 331 procedimientos NCIt referenciados por roles de sitio |
| `ohd` | `OHD:0000004` (CURIE completo) | 81 procedimientos odontológicos |
| `procedure-relationship-types` | `maxo-poet:TREATS`, `ncit:R163`, `maxo:RO:0002233`… | 16 tipos de relación (predicado literal por fuente) |

Y **espera** de las hermanas (no los crea): `mondo` (`MONDO:0005015`), `uberon` (`UBERON:0000945`),
`ncit` anatomía (`C12391`). `validate-siblings.mjs` prueba ambas grafías (con y sin prefijo) y admite
`--alias` si otra sesión eligió otro `internal_code`. ICHI / ICD-10-PCS / CUPS los carga
`justin/seed-specialty-services`: esta sesión no los recarga.

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
    "assertion_kind" varchar NOT NULL,         -- curated-literature | ontology-axiom | terminology-role | by-definition | investigational
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
      ('curated-literature','ontology-axiom','terminology-role','by-definition','investigational'))
);
CREATE UNIQUE INDEX "uq_cra_relationship_source_record"
  ON "terminology"."concept_relationship_assertions" ("concept_relationship_id", "source_id", "source_record_id");
-- y, para que una relación no se duplique entre importadores:
CREATE UNIQUE INDEX "uq_concept_relationships_triple"
  ON "terminology"."concept_relationships" ("source_concept_id", "target_concept_id", "relationship_type_concept_id");
```

Variante equivalente si el modelo prefiere conceptos a texto: `assertion_kind_concept_id uuid` en lugar
de `assertion_kind varchar` (el cargador cambiaría una línea). Lo mismo le sirve a
`justin/seed-drug-treatments`, que tiene el mismo problema con fármaco → enfermedad.

**Probado en una base desechable** (PostgreSQL 16.15 local, DDL canónico del módulo 03 + esta tabla,
con MONDO/UBERON simulados solo con los códigos referenciados): 689 relaciones y 732 filas de
procedencia; segunda corrida, 0 filas nuevas. Sin la tabla (DDL canónico tal cual): 1 921 conceptos y
13 391 propiedades, 0 relaciones, segunda corrida 0 (medido en la pasada 1; con OHD el plan sube a 2 004
conceptos y 13 964 propiedades).

## Hosts bloqueados

La red de esta sesión solo alcanza GitHub (git, `raw.githubusercontent.com`, assets de releases), npm y
PyPI. Todo lo demás responde 403 al CONNECT (sondeado 2026-10-24 con `fetch.mjs --probe`; detalle por
host en `cache/_network.json`): `clinicaltrials.gov`, `www.cms.gov`, `icd.who.int`, `icdcdn.who.int`,
`id.who.int`, `icdaccessmanagement.who.int`, `www.minsalud.gov.co`, `web.sispro.gov.co`,
`nlmpubs.nlm.nih.gov`, `id.nlm.nih.gov`, `evs.nci.nih.gov`, `eutils.ncbi.nlm.nih.gov`, `www.ebi.ac.uk`,
`query.wikidata.org`, `www.nice.org.uk`, `www.cochranelibrary.com`, `www.minsalud.gob.bo`,
`www.sanidad.gob.es`. No se usaron espejos de terceros ni se eludió ningún bloqueo.

## Pasadas (protocolo de saturación)

Aportes nuevos contados **por código** tras deduplicar (procedimiento = `system|code`; relación =
tipo + sujeto + objeto). Una pasada aporta 0 cuando ninguna fuente nueva agrega un código o una relación.

| # | Fecha | Fuentes | Procedimientos nuevos | Relaciones nuevas (proc → enf / proc → sitio) | Descartadas en la pasada (motivo) |
|---|---|---|---|---|---|
| 1 | 2026-10-24 | MAxO 2026-01-15, MAxO/POET git `42edd966`, NCIt OBO 24.04e, MONDO 2026-10-06 y Uberon 2026-10-01 (estas dos solo para equivalencias) | 1 907 (MAxO 1 576 · NCIt 331) | 703 (250 / 453), de 746 afirmaciones | AutoMAxO (generado por modelo); anotaciones diagnósticas HPO (no es enfermedad); R172 (fármacos); SNOMED (licencia); las 13 fuentes de la tabla de hosts (red) |
| 2 | 2026-10-24 | OHD 2026-10-01 (git `9cbaa1a1`); evaluadas sin aporte: CIDO, EFO 3.95.0, WHO SMART Guidelines (ANC, HIV, inmunizaciones, FP, STI, RA, BDS, SMBP) | 81 (OHD, odontológicos) | 0 (0 / 0) | SCDO (licencia GPL-3.0: decide el propietario); CDT dentro de OHD (copyright ADA); CIDO/EFO (sin relaciones de procedimiento); WHO SMART (lógica de decisión, no relación publicada); ramas hermanas aún ausentes; red sin cambios |
| 3 | 2026-10-24 | Barrido completo del registro OBO Foundry (267 ontologías, `OBOFoundry.github.io`): candidatas médicas no evaluadas antes — OGMS (git HEAD), ONS (git HEAD), ONE (git HEAD) | 0 | 0 (0 / 0) | OGMS: sin términos de procedimiento; ONS: 121 clases de dieta de diseño de estudios (evaluación dietaria, dieta del estudio) y 2 procesos de fermentación de alimentos con entrada «leche»: no son procedimientos clínicos; ONE: solo «study intervention»/«intervention design»; ECTO, CDNO, FoodOn, OMRSE, DRON, RBO y las de plantas no son procedimientos clínicos (o son fármacos); ramas hermanas aún ausentes; red sin cambios |
| 4 | 2026-10-24 | Disease Ontology `releases/2026-09-30` (CC0), relaciones propias de MONDO 2026-10-06, HPO `releases/2026-09-01` | 0 | 0 (0 / 0) | DOID: solo `is_a` y `has material basis in`; HPO: 0 relaciones hacia MAxO; MONDO: usa `MAXO:0000864 therapeutic uses` 7 veces (fármaco → CHEBI, de `seed-drug-treatments`) y `NCIT:R163` 3 veces (C15290, C15330, C52005: ya estaban en el corpus por NCIt) |

**Saturación (2026-10-24):** las pasadas 3 y 4 aportaron 0 cada una, así que el protocolo da por saturadas
las fuentes **alcanzables desde este entorno** (GitHub, npm y PyPI). No es una saturación de «internet»: las
fuentes grandes de la tabla de hosts siguen bloqueadas por la red y son los huecos que más rinden si se
habilitan (ClinicalTrials.gov sobre todo). Con un host habilitado, el protocolo se reabre: `fetch.mjs --probe`
lo detecta y hace falta un normalizador para esa fuente.

## Cobertura (acumulada a la pasada 4)

- **Procedimientos:** 1 988. MAxO 1 576 (diagnósticos 841, terapéuticos u otros 430, quirúrgicos 292,
  evitación 13); NCIt 331; OHD 81 (odontológicos, sin relaciones: se cargan como catálogo, 81 conceptos y
  ~570 propiedades que hoy no responden ninguna consulta de relación). ICHI / ICD-10-PCS / CUPS: 0 relaciones (fuentes bloqueadas por la red).
- **Procedimiento → enfermedad:** 293 afirmaciones, 250 relaciones únicas, 103 procedimientos, 167
  enfermedades (todas MONDO, mayormente enfermedades raras: es el foco de POET). Tipos: `TREATS` 266,
  `PREVENTS` 25, `NO_OBSERVED_BENEFIT` 2. Equivalencias publicadas: 111 con Orphanet, 89 con MeSH,
  18 con ICD-10-CM, 2 sin ninguna.
- **Procedimiento → sitio anatómico:** 453 afirmaciones = 453 relaciones, 346 procedimientos, 191 sitios
  (176 NCIt, 15 UBERON). De los 176 NCIt, 171 tienen un único Uberon publicado (xref de Uberon), que
  cubre 424 afirmaciones; 0 ambiguos. 12 de los 15 UBERON tienen xref a FMA. TA2: Uberon no publica
  xrefs a TA2 en `uberon.obo` (hueco).
- **Enfermedades sin enlace:** de 32 134 términos MONDO vigentes, 167 tienen al menos un procedimiento
  (0,5 %). **Sitios sin enlace:** de 15 047 términos Uberon vigentes, 178 aparecen como sitio (unión de
  los 15 directos y los 171 vía xref, que se solapan). No está medido contra lo que efectivamente
  cargan `seed-diseases` y `seed-medical-dictionaries`.
- **Excluido por farmacológico:** 354 términos MAxO y 145 filas POET (para `seed-drug-treatments`).

## Validación con las ramas hermanas

No se ejecutó: `justin/seed-diseases`, `justin/seed-medical-dictionaries` y
`justin/seed-specialty-services` no existían en `origin` (2026-10-24 00:3x UTC). El cruce lo hace
`validate-siblings.mjs --db` sobre una base desechable con sus importadores corridos, o `--keys`
con sus claves exportadas a TSV.

## Huecos

1. Procedimiento → enfermedad para enfermedades comunes: depende de ClinicalTrials.gov (en estudio),
   MeSH y guías; todos bloqueados por la red.
2. Procedimiento → sitio para ICHI / ICD-10-PCS (ejes del propio código): bloqueados por la red.
3. Nombres en castellano: MAxO y NCIt no publican etiquetas oficiales en castellano; se dejan en inglés
   (sin traducción propia). CIE-10-ES daría los de ICD-10-PCS (bloqueado).
4. Relaciones en la base: el modelo no tiene dónde guardar su procedencia (propuesta arriba).
5. NCIt: la edición OBO trae solo 438 roles de procedimiento y ninguno R180 (`Procedure_Has_Target_Disease`);
   la edición oficial (bloqueada) puede traer más.

## Cierre de huecos — 2026-10-28 (carril C3)

Las secciones «Hosts bloqueados», «Cobertura» y «Huecos» de arriba son las de 2026-10-24. Hoy `www.cms.gov`,
`clinicaltrials.gov`, `nlmpubs.nlm.nih.gov`, `evs.nci.nih.gov`, `www.sanidad.gob.es` y `www.minsalud.gov.co` responden 200
(re-sondeo en `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C3/sondeo-2026-10-28.tsv`).

| Hueco | Qué se cargó | Licencia |
|---|---|---|
| Procedimiento → sitio por ICD-10-PCS | ICD-10-PCS **FY2027** oficial: **79 256** códigos, 1 745 sitios, 79 169 afirmaciones por el eje del propio código | dominio público (CMS) |
| Nombres en castellano de ICD-10-PCS | **78 869** designaciones oficiales de CIE-10-ES Procedimientos 2026 (verbatim; 387 códigos sin equivalente publicado) | aviso legal de Sanidad: reutilización citando fuente |
| MeSH (procedimientos) | **2 001** descriptores del árbol E con nota de alcance verbatim | términos de NLM |
| Procedimiento → enfermedad común (en estudio) | ClinicalTrials.gov: **29 697** pares procedimiento × condición de 50 290 estudios, clase `investigational`, con estado y fase | dominio público (NLM) |
| ICHI, ICD-11 | Sin cargar: CC BY-ND y sin descarga abierta ni cuenta | decisión del propietario |
| CUPS | No es de este dominio: la carga `specialty-services` (CUPS 2025, Res. 2706); la capa CC BY-SA de datos.gov.co queda en `lab-tests` sin cargar | — |
| NCIt oficial (todos los roles) | Sin normalizar (hay acceso a EVS); hoy sólo los 438 roles de la edición OBO | CC BY 4.0 |

**Antes / después.** Procedimientos 1 988 → **84 990** (MAxO 1 576, NCIt 331, OHD 81, ICD-10-PCS 79 256,
sitios 1 745, MeSH 2 001); afirmaciones 746 → **109 612** (109 569 relaciones únicas en el plan); designaciones 0 → 78 869.

**Carga medida** (Postgres 16 desechable, mismo procedimiento que en `lab-tests.md`): 85 012 conceptos (84 990 + 22 tipos
de relación), 1 237 894 propiedades, 78 869 designaciones; **2.ª corrida: 0 filas nuevas**. Integridad: 0 huérfanos,
0 duplicados por (versión, código), 0 nulos. **Relaciones: no cargadas.** El cargador las bloquea porque faltan en la
base las tablas `concept_relationship_evidence` / `concept_relationship_assertions`; el parche
`2026-10-25_v4250_terminology_relationship_evidence.sql` del repo del modelo no existe en esta máquina
(`/home/user/mantra-core-health-model` ausente) y el brief prohíbe DDL en este repo. Las 109 569 relaciones quedan listas
en `data/out/assertions.part*.ndjson.gz`; la carga con relaciones se probó el 2026-10-27 con extremos simulados (commit
`d371977`), no en esta pasada.

**Cargador desde `data/`.** `load.mjs` ahora lee, si no hay build local, las partes versionadas y verifica su SHA-256
contra `data/MANIFEST.json` (antes exigía un build fuera del repo).

**Reproducibilidad.** Con las fuentes re-descargadas hoy (los `meta.json` y el `studies.ndjson` de ClinicalTrials
fijados a los versionados porque la API cambia a diario), `build.mjs` da el mismo SHA-256 que lo versionado:
`procedures` f1aeaebd…, `assertions` 64bb14c0…, `maps` 0e2eb33a….

**Superposición con `lab-tests`.** El code system `icd10pcs-cms` queda con dos versiones (FY2026 de `lab-tests`, 4 397
códigos, y FY2027 de aquí): ver `lab-tests.md`. Propuesta para el modelo: relacionar versión y concepto de forma que
un código existente no se recargue como concepto nuevo al cambiar de versión.
