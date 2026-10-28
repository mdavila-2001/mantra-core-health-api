# Tratamientos farmacológicos por enfermedad — investigación, saturación y cobertura

- Rama: `justin/seed-drug-treatments` · importador: `tools/terminology-import/drug-treatments/` · fuentes y licencias: `tools/terminology-import/drug-treatments/SOURCES.md`
- Depende de: `justin/seed-diseases` (enfermedades) y del catálogo de medicamentos ya existente (`vademecum`, ATC nivel 5).
- Sesión hermana: `justin/seed-procedures-treatments` (procedimientos y terapias no farmacológicas).
- Última actualización: 2026-10-28 (carril C6 del cierre de huecos: ver «0. Estado 2026-10-28»; el resto del documento conserva el registro histórico del 2026-10-24, cuyos «403» de §2 y §5 están **superados** por el re-sondeo de hoy; iteración de `/loop` 1: hosts oficiales siguen en 403; `justin/seed-diseases` aún no existe; ramas hermanas visibles: `seed-clinical-pharmacology`, `seed-procedures-treatments`, `seed-nursing-care`, ninguna trae un cruce a ATC).

> **Esto es una base de relaciones publicadas, no un recomendador.** Cada relación conserva el
> tipo exacto de su fuente (indicación rotulada, modificador de la enfermedad, sintomático, no
> indicación, camino mecanístico, `treats`/`prevents`/`contraindicated` de MAxO…). Ninguna se
> colapsa en un genérico «trata». No hay dosis, posologías ni interacciones. Los tipos con
> `polarity = negative` («no es una indicación», «contraindicado», «sin respuesta observada»)
> **nunca** deben mostrarse como tratamiento.

## 0. Estado 2026-10-28 (carril C6 del cierre de huecos)

**Hueco → estado hoy → qué se cargó.** El 2026-10-24 la red devolvía 403 y solo había 5 fuentes de GitHub (18 032 afirmaciones, 0 con ATC). El 2026-10-27 hubo salida por HTTP y se sumaron 9 fuentes. Re-sondeo de hoy en `evidencia/C6/resondeo-hosts-2026-10-28.txt`.

| Fuente | Antes (2026-10-24) | Hoy | Afirmaciones cargadas |
|---|---|---|---|
| LabeledIn, PharmacotherapyDB, DrugCentral 2016, DrugMechDB, MAxO | cargadas | sin cambios | 2 850 · 1 388 · 9 094 · 4 662 · 38 |
| MED-RT (VA) | hueco, 403 | 200, cargada | 30 002 |
| ChEMBL `drug_indication` | hueco, 403 | 200, cargada | 60 055 |
| DrugCentral 2027 | hueco, 403 | 200, cargada | 38 517 |
| Wikidata P2176/P2175 | hueco, 403 | 200, cargada | 13 506 |
| WHO eEML | hueco, 403 | 200, cargada | 1 068 |
| EMA (EPAR) | hueco, 403 | 200, cargada | 2 514 |
| Open Targets 26.09 (solo EMA/APPROVAL) | hueco | cargada | 2 331 |
| ClinicalTrials.gov v2 (polaridad `investigational`) | hueco, 403 | 200, cargada | 171 847 |
| CIViC (predictiva aceptada, `conditional`) | hueco, 403 | cargada por consulta | 3 147 |
| **Total** | **18 032** | | **341 019** (+ 46 tipos de relación) |

Polaridad del total: positiva 75 851 · negativa 38 643 · diagnóstica 159 · en investigación 223 219 · condicionada 3 147. Pares fármaco–enfermedad positivos distintos: 42 607 (el 2026-10-24: 13 972). Solo las afirmaciones de polaridad positiva son «tratamiento».

**H-ATC cerrado por código exacto.** Afirmaciones con ATC nivel 5: 0 → 228 242; fármacos de un solo ingrediente con ATC: 0 → 5 466 de 21 668; códigos ATC distintos: 5 315. Cruces publicados: RxClass, `molecule.atc_classifications` de ChEMBL, P267 de Wikidata y DrugCentral; cada código lleva `via`/`predicate`/`from`. Solo el **código**: sin nombres de clase ni DDD (WHO ATC no se carga).

**Todavía hueco (re-sondeo de hoy).** CTD (`ctdbase.org` redirige 302; licencia sin leer), NCATS Inxight Drugs (200; licencia sin verificar), PharmGKB (sin respuesta), LINAME/`minsalud.gob.bo` (sin respuesta), `whocc.no` (301; no se carga por licencia), CIViC `/downloads` (301; la evidencia se tomó por consulta). Ninguna se cargó: falta leer licencia o no hay acceso.

**Decisiones del propietario** (no tomadas por el carril): (1) ChEMBL (CC BY-SA 3.0) y DrugCentral 2027 (CC BY-SA 4.0) están cargados en code systems propios para poder retirarlos con un `DELETE` por code system; confirmar si la condición «compartir igual» es aceptable en el producto. (2) MED-RT: el paquete no trae aviso de licencia; se trata como obra del gobierno federal. (3) Códigos ATC (de las fuentes eEML/EMA/Wikidata y `crosswalk.drug`): si la OMS exige permiso incluso para el código, se filtran las filas con `system = 'ATC'`. (4) CC BY 3.0 IGO de eEML exige la atribución indicada en `SOURCES.md`.

**Verificación de hoy (base desechable, no la del stack).** `node --test`: 27/27. `gzip -t` y `sha256sum -c`: 19 partes + metadatos OK (63 MB versionados). Carga `--apply`: 1.ª corrida 15 code systems (341 019 afirmaciones + 46 tipos = 341 065 conceptos, 6 073 333 propiedades); 2.ª corrida **0 conceptos, 0 propiedades, 0 relaciones** en los 15. Huérfanos, duplicados y nulos: 0 filas. Detalle y límites en `evidencia/C6/REPORTE-C6.md`. **No cubierto:** el enlace fármaco/enfermedad contra catálogos reales; la base desechable no tiene `rxnorm_full`, `mesh`, `mondo` ni `vademecum`, así que `validate-links.mjs` midió 0 enlaces (esperado, no es cobertura).

## 1. Paso 0 — discovery

| Qué | Hallazgo |
|---|---|
| `terminology.concept_relationships` | Sólo `source_concept_id`, `target_concept_id`, `relationship_type_concept_id`, `ordinal` (+ auditoría). **No puede guardar fuente, id de origen, versión, URI, fecha ni evidencia por relación** (`database/SQL/03_terminology/02_tables.sql`). Sin índice único por (origen, destino, tipo). |
| `concept_properties` | Clave-valor `jsonb` **por concepto**, no por relación. |
| `concept_maps` | Equivalencias entre conceptos (`equivalence_concept_id`, `context`, `version`): no es para indicaciones. |
| Tipos de relación existentes | `terminology:relationship:{treatment,disease,anatomy,…}` (genéricos, del glosario). No se reutilizan: colapsarían tipos distintos. |
| Catálogo de medicamentos | code system `vademecum` (483 conceptos, `code` = ATC nivel 5, con presentaciones LINAME) + `cima-/invima-/anvisa-medicamentos` (ATC en `medicine_atc`). |
| Importadores previos | `rxnorm_full` y `rxterms` (RxCUI), `icd10cm`, `cie10es-*`, glosario ES. `import-wikidata-relations.mjs` ya baja P2176 «drug or therapy used for treatment» para el glosario, sin procedencia por arista. |

**Decisión (pedido: «si no puede, pará y reportá la propuesta»).** No se escribe ninguna arista
directa fármaco → enfermedad, porque no tendría dónde llevar su procedencia. La propuesta para el
repo del modelo está en §6. Mientras tanto, el cargador guarda **cada relación como un concepto-afirmación**
(code system propio por fuente; procedencia y evidencia en `concept_properties`) enlazado por dos
relaciones estructurales (`assertion:drug`, `assertion:condition`). Es lossless y no requiere DDL;
**la carga real contra una base compartida (`--apply`) queda a decisión del propietario.**

## 2. Restricción del entorno: la red

La política de red de esta sesión **bloquea (403 del proxy) casi todas las fuentes oficiales**.
Alcanzables: GitHub (`git clone`, `raw.githubusercontent.com`), npm, PyPI y algunos buckets S3 públicos.
Por eso todas las fuentes cargadas son repositorios GitHub **publicados por sus propios autores**,
con commit fijado. Hosts bloqueados comprobados el 2026-10-24 (ver §5): `evs.nci.nih.gov`, `rxnav.nlm.nih.gov`,
`www.ebi.ac.uk`, `ftp.ebi.ac.uk`, `clinicaltrials.gov`, `www.ema.europa.eu`, `list.essentialmeds.org`,
`www.who.int`, `cdn.who.int`, `icd.who.int`, `atcddd.fhi.no`, `www.whocc.no`, `cima.aemps.es`, `api.fda.gov`,
`download.open.fda.gov`, `dailymed.nlm.nih.gov`, `eutils.ncbi.nlm.nih.gov`, `www.ncbi.nlm.nih.gov`,
`ftp.ncbi.nlm.nih.gov`, `id.nlm.nih.gov`, `ctdbase.org`, `query.wikidata.org`, `dumps.wikimedia.org`,
`drugcentral.org`, `unmtid-shinyapps.net`, `drugs.ncats.io`, `civicdb.org`, `www.orphadata.com`,
`www.orpha.net`, `platform.opentargets.org`, `pubchem.ncbi.nlm.nih.gov`, `go.drugbank.com`,
`mychem.info`, `www.guidetopharmacology.org`, `api.pharmgkb.org`, `dataverse.harvard.edu`, `zenodo.org`,
`figshare.com`, `huggingface.co`, `purl.obolibrary.org`, `www.minsalud.gob.bo`. El bucket GCS de
Open Targets es *requester-pays* y exige credenciales que la sesión no tiene.

**Para destrabarlo:** agregar esos dominios en *Network access → Allowed domains* del entorno
(https://code.claude.com/docs/en/cloud-environments#network-access). Con MED-RT, ChEMBL,
ClinicalTrials.gov, Wikidata y la OMS habilitados, el corpus crecería en órdenes de magnitud
(ver §5, «qué aportaría»).

## 3. Protocolo de saturación — registro de pasadas

Regla: una pasada usa fuentes **nuevas e independientes**; las relaciones nuevas se cuentan **por
código** (par canónico fármaco–enfermedad: DrugCentral DRUG_ID / MONDO cuando el cruce publicado da
uno solo; si no, el código de origen), sólo para relaciones de polaridad positiva. Se para cuando
dos pasadas seguidas aportan 0.

| Pasada | Fuentes | Afirmaciones | Pares positivos nuevos (por código) | Descartadas en la pasada (motivo) |
|---|---|---|---|---|
| 1 | LabeledIn (experto + crowd), PharmacotherapyDB, DrugCentral 2016, DrugMechDB | 17 994 | **13 939** | MED-RT, RxClass, ChEMBL, Open Targets, OMS EML, EMA, CIMA, openFDA, DailyMed, ClinicalTrials.gov, CTD, Wikidata, Europe PMC/PubMed: red bloqueada. SIDER, MEDI, PREDICT (en el mismo repo): licencia NC. EHRLink: sin licencia. DrugBank: licencia comercial. |
| 2 | MAxO annotations (Monarch) | 38 | **33** | Orphadata (red), CIViC (red), PharmGKB/ClinPGx (red), Inxight Drugs (red). |
| 3 | Hetionet v1.0 (`hetio/hetionet`) y `dhimmel/drugcentral` (`rephetio/indications.tsv`) | 671 filas medidas, no cargadas | **0 relaciones publicadas nuevas** | Derivados: `CtD/CpD` de Hetionet = PharmacotherapyDB `DM/SYM` (además las aristas están en Git LFS, no descargable). `rephetio/indications.tsv` toma `drug_indication.tsv` de `olegursu/drugtarget` (ya cargado) y lo **recodifica a DOID con un mapeo de terceros**: sus 82 «pares nuevos» aparentes son todos de categoría vacía (DrugCentral sin curación) y difieren sólo en el código de enfermedad. No se cargan: sería presentar un remapeo ajeno como relación publicada. |
| 4 | Drug Repurposing Hub (Broad, `s3.amazonaws.com/data.clue.io`, 2020-03-24) | 0 | **0** | `!Restrictions: The Drug Repurposing Hub data is provided for non-commercial use only.` y la indicación es texto libre sin código (codificarla sería inferencia). |
| 5 | GitHub de autores: `unmtransinfo/drugcentral-tools`, `unmtransinfo/TCRD` (UNM, DrugCentral/Pharos), `griffithlab/civic-v2` (CIViC), `opentargets/platform-input-support`, `Knowledge-Graph-Hub/kg-idg` | 0 | **0** | Sólo código y esquemas SQL, sin datos de indicaciones (las descargas están en hosts bloqueados). `kg-idg` trae mapas (UMLS → MONDO), no relaciones fármaco → enfermedad. Repos supuestos inexistentes comprobados con `git ls-remote`: `unmtransinfo/drugcentral`, `chembl/chembl_drug_indications`, `WorldHealthOrganization/eml`, `nlm/medrt`. |

**Estado:** tres pasadas seguidas (3, 4 y 5) aportan 0 → **saturado dentro de lo alcanzable desde este
entorno. NO está saturado respecto de internet**: las fuentes oficiales más grandes están bloqueadas
por la red (§2) y quedan como huecos (§5). El `/loop` de la sesión re-sondea esos hosts en cada
iteración; si se habilitan, cada fuente nueva abre una pasada nueva.

Medición de la pasada 3 (literal):

```
{"file":".../dhimmel_drugcentral/rephetio/indications.tsv","rows":671,"categories":{"DM":359,"SYM":77,"":209,"new:":82,"NOT":25,"undefined":1},"newPositivePairs":82}
```

## 4. Cobertura (corrida del 2026-10-24)

Salida de `build-drug-treatments.mjs` (`drug-treatments-coverage.json`):

| Tipo (exacto de la fuente) | Polaridad | Afirmaciones |
|---|---|---|
| `labeledin:expert-label-indication` | positiva | 1 334 |
| `labeledin:crowd-label-indication` | positiva | 1 516 |
| `pharmacotherapydb:DM` | positiva | 755 |
| `pharmacotherapydb:SYM` | positiva | 390 |
| `pharmacotherapydb:NOT` | **negativa** | 243 |
| `drugcentral-2016:indication` | positiva | 9 094 |
| `drugmechdb:indication-mechanism-path` | positiva | 4 662 |
| `maxo:treats` | positiva | 35 |
| `maxo:prevents` | positiva | 2 |
| `maxo:contraindicated` | **negativa** | 1 |
| **Total** | | **18 032** |

| Medida | Valor |
|---|---|
| Pares fármaco–enfermedad positivos distintos (por código) | 13 972 |
| … respaldados por 1 / 2 / 3 / 4 fuentes | 10 833 / 2 600 / 428 / 111 |
| Enfermedades distintas (clave canónica) | 2 117 (2 112 con al menos una relación positiva; 5 sólo con relaciones negativas) |
| Fármacos distintos (clave canónica) | 2 414 (39 son combinaciones) |
| Afirmaciones con enfermedad en MONDO (cruce exactMatch) | 12 452 / 18 032 |
| Afirmaciones con fármaco en DrugCentral | 16 890 / 18 032 |
| Afirmaciones con ATC | **0** — ninguna fuente alcanzable trae ATC (hueco H-ATC, §5) |
| Códigos de enfermedad disponibles (fuente + cruce, por afirmación) | UMLS 17 184 · MONDO 12 706 · MeSH 11 428 · DOID 10 826 · NCIt 9 921 · EFO 7 907 · ICD-10-CM 6 394 · ICD-11 6 148 · ICD-10 OMS 2 268 · ORPHA 2 086 · OMIM 1 785 |

Exclusiones por fuente (nada se descarta en silencio): LabeledIn experto 1 CUI con formato inválido;
LabeledIn crowd 212 `no-not-disease`, 211 `no-char_risk`, 131 `no-contra`, 58 `no-unrelated`, 15
`uncertain`; DrugCentral 2 788 filas sin UMLS CUI ni DOID y 9 387 valores SNOMED descartados;
DrugMechDB 2 caminos sin código; MAxO 938 anotaciones sin sustancia CHEBI.

### Enlace con enfermedades y catálogo

- **Enlace contra las enfermedades cargadas: no medido.** El script es
  `validate-links.mjs --targets targets.json`, con los `internal_code` que declara `docs/seed-research/diseases.md`.
- **Catálogo de medicamentos (`vademecum`, ATC 5): 0 enlaces posibles hoy**, porque ninguna afirmación
  tiene ATC (hueco H-ATC). Los 2 414 fármacos quedan «sin match en el catálogo» hasta tener un cruce publicado RxCUI/ChEMBL/DrugCentral → ATC.
- Enlace por RxCUI (`rxnorm_full`/`rxterms`) e ICD-10-CM (`icd10cm`) funciona: probado en la base
  desechable (§7) contra 300 RxCUI y 300 ICD-10-CM reales sacados del propio NDJSON. Esa prueba
  demuestra el mecanismo, **no** es una medida de cobertura.

### Partes del cuerpo

No se crean relaciones fármaco → parte del cuerpo: ninguna fuente las publica y deducirlas sería
inferencia. El vínculo con anatomía es transitivo y lo arma el consumidor: afirmación →
enfermedad (código) → anatomía (relaciones que cargan `justin/seed-diseases` /
`justin/seed-medical-dictionaries`).

## 5. Fuentes descartadas y huecos

> Tabla histórica del 2026-10-24. Las filas «hueco» por 403 de MED-RT, RxClass, ChEMBL, Open Targets, eEML, EMA, ClinicalTrials, Wikidata, DrugCentral y CIViC están **superadas** (ver §0); quedan vigentes las descartadas por licencia.

| Fuente | Estado | Motivo exacto | Qué aportaría |
|---|---|---|---|
| MED-RT (VA, dominio público) | **hueco** | `evs.nci.nih.gov` 403 del proxy | `may_treat`/`may_prevent`/`may_diagnose` RxNorm/MeSH → MeSH (~decenas de miles) |
| RxNorm / RxClass (NLM) | **hueco** | `rxnav.nlm.nih.gov` 403 | MED-RT vía API y **RxCUI → ATC** (cierra H-ATC) |
| ChEMBL `drug_indication` (CC BY-SA 3.0) | **hueco** | `www.ebi.ac.uk`, `ftp.ebi.ac.uk` 403 | ~50 000 indicaciones con MeSH/EFO, fase máxima y referencias (FDA, EMA, ATC, ClinicalTrials); ATC por molécula |
| Open Targets (CC0) | **hueco** | EBI FTP 403; GCS *requester-pays* sin credenciales | Derivado de ChEMBL, con MONDO/EFO |
| OMS Lista de Medicamentos Esenciales (eEML, CIE-11) | **hueco** | `list.essentialmeds.org`, `www.who.int` 403; licencia **no verificada** (los documentos de la OMS suelen ser CC BY-NC-SA 3.0 IGO: confirmar uso comercial) | medicamento esencial ↔ condición |
| LINAME Bolivia | **hueco** | `www.minsalud.gob.bo` 403; además es lista de medicamentos sin código de enfermedad | sólo presentaciones (ya en `vademecum`) |
| EMA (EPAR, área terapéutica MeSH) | **hueco** | `www.ema.europa.eu` 403 | medicamento UE (ATC) ↔ área terapéutica MeSH |
| CIMA (AEMPS) ficha 4.1 | **descartada** | texto libre sin código (codificar = inferencia); además `cima.aemps.es` 403 | — |
| openFDA / DailyMed (indicaciones) | **descartada** | texto libre sin código; hosts 403 | — (LabeledIn ya es su versión anotada por la NLM) |
| ATC/DDD (OMS) | **hueco** | `atcddd.fhi.no` 403; es clasificación, no indicación | sólo como ancla |
| ClinicalTrials.gov API v2 | **hueco** | `clinicaltrials.gov` 403 | intervención ↔ condición (MeSH), sólo como «en estudio» con fase y estado |
| CTD therapeutic | **hueco** | `ctdbase.org` 403; licencia **no verificada** (host bloqueado): hay que leer sus términos de uso comercial antes de usarla | — |
| Wikidata P2176 | **hueco** | `query.wikidata.org`, `dumps.wikimedia.org` 403 | relaciones CC0 con referencia + cruces ATC/RxNorm/ChEMBL/MeSH (cierra H-ATC) |
| DrugCentral actual (CC BY-SA 4.0) | **hueco** | `drugcentral.org`, `unmtid-shinyapps.net` 403 | indicaciones/off-label con UMLS, ATC por fármaco |
| NCATS Inxight Drugs | **hueco** | `drugs.ncats.io` 403 | condiciones por sustancia |
| CIViC (CC0) | **hueco** | `civicdb.org` 403 | evidencia predictiva cáncer–terapia (condicionada a variante) |
| Europe PMC / PubMed | **hueco** | `www.ebi.ac.uk`, `eutils.ncbi.nlm.nih.gov` 403 | sólo detección de huecos (no relaciones) |
| SIDER 4 (indicaciones) | **descartada** | CC BY-NC-SA 4.0: no comercial (verificado en el README de `dhimmel/SIDER4`) | — |
| MEDI, PREDICT | **descartadas** | CC BY-NC-SA 3.0: no comercial (verificado en el README de `dhimmel/indications`) | — |
| EHRLink | **descartada** | sin licencia declarada | — |
| DrugBank (indicaciones) | **descartada** | «DrugBank requires permission for commercial reuse» (README de `dhimmel/indications`); sólo se usan sus ids como identificadores | — |
| KEGG DRUG | **descartada** | uso comercial bajo licencia de pago (conocido; no re-verificado: `www.kegg.jp` no se probó) | — |
| Drug Repurposing Hub | **descartada** | «non-commercial use only»; texto libre | — |
| DRKG | **descartada** | integra DrugBank (permiso comercial requerido) | — |
| Hetionet `CtD`/`CpD` | **descartada** | derivado de PharmacotherapyDB (0 nuevas); Git LFS | — |

**H-ATC (el hueco más importante para el producto):** el catálogo se ancla por ATC nivel 5 y
ninguna fuente alcanzable publica un cruce a ATC. Cualquiera de RxNav (RxCUI → ATC), ChEMBL
(`molecule_atc_classification`), Wikidata (P267) o DrugCentral actual lo cierra; el resolvedor ya
acepta `ATC → vademecum` en `--targets`. No se cruza por nombre.

## 6. Propuesta para el repo del modelo (`mantra-core-health-model`)

Agregar procedencia por relación en `terminology.concept_relationships` (o una tabla 1:1
`terminology.concept_relationship_provenance`), nullable para no romper filas existentes:

| Columna | Tipo | Para qué |
|---|---|---|
| `source_id` | uuid FK → `terminology_sources` | fuente que publica la relación |
| `source_record_id` | varchar | id de origen (p. ej. `crowd:2019+6375|C0030567`) |
| `source_version` | varchar | versión / commit |
| `source_uri` | text | URI de la evidencia (ficha DailyMed, PMID, …) |
| `retrieved_at` | timestamptz | fecha de descarga |
| `polarity_concept_id` | uuid FK → `catalog_concepts` | positiva / negativa / en estudio |
| `evidence_json` | jsonb | evidencia literal (fase, estado, nº de fichas, curadores, código de evidencia) |
| índice único | (`source_concept_id`, `target_concept_id`, `relationship_type_concept_id`, `source_id`, `source_record_id`) | idempotencia por relación |

Con eso el cargador escribiría la arista directa fármaco → enfermedad con su tipo exacto y la
afirmación-concepto deja de hacer falta (migración: copiar las propiedades a las columnas).

## 7. Carga verificada en base desechable

Postgres 16 local (`/usr/lib/postgresql/16/bin`), DDL de `database/SQL` (copia vendorizada del modelo,
sin tocarla), semilla mínima de prueba fuera de git (concepto «estado activo», 300 RxCUI y 300 ICD-10-CM).

| Corrida | conceptos | propiedades | relaciones |
|---|---|---|---|
| 1ª `--apply` | 18 047 | 318 971 | 11 320 |
| 2ª `--apply` | **0** | **0** | **0** (idempotente; sólo se registra el lote) |

## 8. Riesgos residuales

- UMLS CUI: se guardan como identificadores tal como los publican LabeledIn (dominio público) y DrugCentral (CC BY 4.0). No se carga contenido de UMLS. Si el propietario considera que exige licencia UMLS, se pueden filtrar y quedarse con los cruces MONDO.
- DrugCentral 2016 toma sus indicaciones de OMOP v4 (contenido de origen FDB). Se usa bajo la licencia que declara DrugCentral (CC BY 4.0).
- Los tipos negativos están cargados (son literales de la fuente y evitan falsos «trata»), pero un consumidor que ignore `assertion_polarity` los mostraría mal.
- El corpus es pequeño frente a lo que hay publicado (§5): no es saturación de internet.
