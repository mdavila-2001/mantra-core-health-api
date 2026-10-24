# Procedimientos y tratamientos no farmacológicos — por enfermedad y por parte del cuerpo

Rama `justin/seed-procedures-treatments` · importador en `tools/terminology-import/procedures-treatments/`
· fuentes y licencias en `tools/terminology-import/procedures-treatments/SOURCES.md`
· plan en [`docs/trabajo/2026-10-24-seed-procedures-treatments/PLAN.md`](../trabajo/2026-10-24-seed-procedures-treatments/PLAN.md).

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
node tools/terminology-import/procedures-treatments/validate-siblings.mjs --db   # fase 2
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

## Cobertura (acumulada a la pasada 2)

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
  los 15 directos y los 171 vía xref, que se solapan). La medición contra lo que efectivamente cargan `seed-diseases` y
  `seed-medical-dictionaries` queda para la fase 2.
- **Excluido por farmacológico:** 354 términos MAxO y 145 filas POET (para `seed-drug-treatments`).

## Fase 2 — validación con las ramas hermanas

| Rama | Estado (2026-10-24 00:3x UTC) |
|---|---|
| `justin/seed-diseases` | no existe en `origin` |
| `justin/seed-medical-dictionaries` | no existe en `origin` |
| `justin/seed-specialty-services` | no existe en `origin` |

Pendiente. Cuando existan: merge en una rama local de validación (sin push), correr sus importadores en
una base desechable y `validate-siblings.mjs --db`; o exportar sus claves a TSV y usar `--keys`.

## Huecos abiertos

1. Procedimiento → enfermedad para enfermedades comunes: depende de ClinicalTrials.gov (en estudio),
   MeSH y guías; todos bloqueados por la red.
2. Procedimiento → sitio para ICHI / ICD-10-PCS (ejes del propio código): bloqueados por la red.
3. Nombres en castellano: MAxO y NCIt no publican etiquetas oficiales en castellano; se dejan en inglés
   (sin traducción propia). CIE-10-ES daría los de ICD-10-PCS (bloqueado).
4. Relaciones en la base: bloqueadas hasta que el modelo agregue la procedencia (propuesta arriba).
5. NCIt: la edición OBO trae solo 438 roles de procedimiento y ninguno R180 (`Procedure_Has_Target_Disease`);
   la edición oficial (bloqueada) puede traer más.
