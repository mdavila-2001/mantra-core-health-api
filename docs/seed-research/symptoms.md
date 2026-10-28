# Síntomas, signos y fenotipos, relacionados con enfermedades

Investigación y corpus de la sesión `seed-symptoms` (2026-10-24), ampliados el
**2026-10-27** por el carril C2 del cierre de huecos de terminología (plan:
`docs/trabajo/2026-10-27-terminologia-cierre-huecos/PLAN.md`, evidencia en
`…/evidencia/C2/`). Importadores en `tools/terminology-import/symptoms/`, fuentes y
licencias en `tools/terminology-import/symptoms/SOURCES.md`.

## Resumen

| | Cantidad |
|---|---:|
| Términos (síntomas, signos, hallazgos y fenotipos), 4 sistemas de códigos | **25 743** (24 777 el 2026-10-24 + 966 de MeSH C23) |
| — HPO (todas las subontologías) | 19 894 |
| — con nombre **oficial** en castellano (HPO Translation Project) | 19 345 |
| — Symptom Ontology (SYMP) | 895 |
| — NCI Thesaurus: signos/síntomas + hallazgos clínicos por sistema | 3 988 |
| — MeSH 2026, árbol C23 (signos y síntomas, condiciones y procesos patológicos) **(nuevo 2026-10-27)** | 966 |
| Aristas jerárquicas is-a (sistema/órgano → tipo → término) | 30 465 (29 428 + 1 037 de MeSH C23) |
| Filas de relación enfermedad → síntoma leídas (5 fuentes publicadas; +116 661 de Orphadata el 2026-10-27) | 539 154 |
| — que son síntoma/fenotipo (aspecto P) de enfermedad humana, positivas y negadas | 404 086 |
| Enfermedades humanas de Mondo con al menos un síntoma enlazado | **12 631 de 23 263 (54,3 %)** |
| Términos HPO de anomalía fenotípica con al menos una enfermedad | 11 867 de 19 178 |

Estado de la carga (actualizado el 2026-10-27; todo contra un **Postgres 16 desechable**,
no contra la base del stack):

- **Términos: cargados y medidos.** `load-symptoms.mjs` contra el DDL del módulo 03:
  25 743 conceptos (HPO 19 894 · SYMP 895 · NCIt 3 988 · MeSH C23 966), 1 037 is-a
  nuevos de MeSH; segunda corrida = 0 filas nuevas
  (`evidencia/C2/carga-terminos-{1,2}.txt`).
- **Relaciones: desbloqueadas.** El modelo ya tiene `concept_relationship_evidence`
  (patch v4250 del repo del modelo, commit e8bd453). `load-disease-phenotypes.mjs` se
  reescribió contra las columnas REALES de esa tabla (la propuesta anterior tenía otras)
  y se probó con el patch aplicado sobre el DDL de este repo: **402 633 aristas y
  520 430 filas de evidencia**; segunda corrida = 0/0
  (`evidencia/C2/carga-relaciones-{1,2}.txt`). Contra una base sin el patch aborta con
  salida 2 sin escribir (`carga-relaciones-sin-parche.txt`).
- **Enlace con `seed-diseases`: formatos confirmados** (#688) y probado con el catálogo
  real de su snapshot (`diseases/load-catalog.mjs --from-snapshot`): 402 633 aristas;
  sólo quedan sin enfermedad 96 filas (`DOID:5898`, sin clase ni `alt_id` en la release).

## Paso 0: discovery

- `tools/terminology-import/`: importadores del glosario ES (19 313 términos;
  CIE-10-ES con el capítulo R «Signos y síntomas», MedlinePlus, CIMA, Wikidata
  con P780 *symptoms and signs*). El glosario no trae HPO, SYMP ni NCIt, y la
  única relación enfermedad → síntoma es la de Wikidata, **sin frecuencia ni
  evidencia**.
- `src/common/seed/glossary-taxonomy.ts` ya tiene la categoría
  `signs-symptoms` (`glossary-category-signs-symptoms`); `concepts.ts` ya tiene
  `REL_SYMPTOM`, `REL_IS_A`, `LANG_EN`/`LANG_ES` y las equivalencias de mapeo.
- No hay en este repo un catálogo de motivos de consulta del triage: el AI
  Service vive en otro repositorio (no está en el alcance de la sesión).
- No hay `CLAUDE.md` ni `.claude/rules/` en el repo.
- **`concept_relationships` sólo tiene origen, destino, tipo y ordinal** (así era el
  2026-10-24; desde la v4.2.50 la evidencia vive en `concept_relationship_evidence`, ver
  § Modelo). Entonces se paró la carga de relaciones y se redactó la propuesta.

## Modelo: lo que el repo del modelo ya resolvió y lo que sigue pendiente

La propuesta del 2026-10-24 (`proposal/concept_relationship_evidence.sql`, hoy
histórica) pedía una tabla de evidencia por arista. El repo del modelo la entregó el
2026-10-25 (v4.2.50, `SQL/patches/2026-10-25_v4250_terminology_relationship_evidence.sql`,
commit e8bd453) con **otras columnas**. El cargador escribe así:

| Columna del modelo | Qué se carga |
|---|---|
| `concept_relationship_id` | arista (enfermedad, fenotipo, tipo); clave natural única |
| `terminology_source_id` | `HPO_CONSORTIUM` (HPOA y enfermedades comunes), `INSERM_ORPHANET` (Orphadata), `MONARCH_MONDO`, `DO_DOID` |
| `code_system_version_id` | versión del code system del **fenotipo** (HPO o SYMP) contra la que se afirma |
| `evidence_tier_concept_id` | `CURATED_REFERENCE` o `STATISTICAL_LITERATURE` (ver decisión 1) |
| `source_reference` | clave estable de la línea: `hpoa:<md5 de la línea>` · `orphadata:HPODisorderAssociation/<id de Orphanet>` · … |
| `citation_text` | campos publicados de la línea, `clave=valor`, con los nombres de columna de la fuente (incluye evidencia PCS/TAS/IEA/ITM, inicio, sexo, modificadores, biocuración, referencias, marca de criterio diagnóstico) |
| `citation_locator` | dónde está la línea (`phenotype.hpoa#OMIM:154700/HP:0001166`, `en_product4.xml#HPODisorderAssociation@id=…`) |
| `frequency_concept_id` | miembro de `vs_relationship_frequency` cuando la fuente da un término HP:0040280–0040285 (o la clase equivalente de Orphanet) |
| `frequency_numerator/denominator` | el `n/m` de HPOA |
| `statistic_value` | el `p%` de HPOA (la fuente lo publica como porcentaje) |
| `valid_from` | fecha de la release de la fuente; para las enfermedades comunes (2015, sin fecha de release) la de descarga |

Qué **no** se calcula: las columnas derivadas de la arista (`strength_score`,
`evidence_count`, `best_evidence_tier_concept_id`, `frequency_concept_id`). El modelo
dice que las recalcula el cargador masivo de TAREA-41 F1.3 y no define la fórmula del
puntaje ni el orden entre niveles; no se inventan acá.

**Propuestas al repo del modelo** (no se tocó nada allí, ADR-0021):

1. **Columnas que hoy no existen** y que la fuente sí publica: `evidence_code` (PCS/TAS/IEA/ITM),
   `onset_concept_id` (término HPO de inicio), `negated` (hoy se resuelve con el tipo de
   relación), `source_uri`. Mientras tanto viajan dentro de `citation_text`.
2. **`sex_concept_id`**: no hay value set de sexo sembrado en `03_terminology.seeds.json`;
   HPOA trae `MALE`/`FEMALE` (638 filas) y queda sólo en la cita.
3. **Concepto `REL_SYMPTOM_EXCLUDED`** (`terminology:relationship:symptom-excluded`) en
   `src/common/constants/concepts.ts`: **sigue sin existir** (comprobado el 2026-10-27).
   Sin él, el cargador omite y cuenta las negaciones (HPOA `NOT` 733 + Orphanet «Excluded
   (0%)» 733): nunca las carga como positivas. Con él (base desechable) cargó 726 aristas
   excluidas. Es dato que siembra la API, no DDL; queda fuera de los directorios de este carril.
4. **`valid_to`**: nunca se escribe; una fuente nueva es otra versión de code system.

## Protocolo de saturación

Deduplicación **por código y por cruce publicado**, nunca por nombre: un término
es repetido si la fuente declara un xref a uno ya incorporado (HPO → `NCIT:`) o
si las dos declaran el mismo UMLS CUI (SYMP `UMLS_CUI`, NCIt `P207`); una
relación es repetida si une la misma enfermedad (misma clave, o códigos que
Mondo declara `equivalentTo` el mismo MONDO id) con el mismo fenotipo. Sólo
cuentan relaciones de aspecto P no negadas. Cálculo reproducible en
`build-symptoms-corpus.mjs` → `symptoms/saturation.json`.

| Pasada | Fuentes | Términos nuevos | Relaciones nuevas | Notas |
|---:|---|---:|---:|---|
| 1 | HPO `hp.json` 2026-09-01 + `hp-es.babelon.tsv` + `phenotype.hpoa` 2026-09-02 | 19 894 | 248 404 | OMIM 8 478, Orphanet 4 355, DECIPHER 47 enfermedades |
| 2 | Symptom Ontology 2026-07-30 + Human Disease Ontology 2026-09-30 (`RO:0002452 has symptom`) | 895 | 2 262 | 871 enfermedades DOID humanas (2 de animales fuera) |
| 3 | NCIt 26.02d, signos y síntomas + Mondo 2026-10-06 (`disease_has_feature`/`has_characteristic` → HP) | 1 093 | 588 | 20 términos NCIt ya estaban (mismo CUI que SYMP) |
| 4 | Anotaciones HPO de enfermedades comunes (Groza 2015) | 0 | 124 301 | evidencia `ITM` (minería de texto de la fuente), ver abajo |
| 5 | Monarch KG `hpoa_disease_to_phenotype_edges.tsv` (2026-10-07) | 0 | **0** | misma fuente que la pasada 1, re-transformada: lo confirma |
| 6 | NCIt, hallazgos clínicos por sitio o sistema (C36278, tipo semántico *Finding*) | 2 868 | 0 | criterio de la fuente; quedan fuera resultados de laboratorio, enfermedades y neoplasias |
| 7 | Monarch `phenopacket_ingest_edges.tsv`, `cureid_edges.tsv` | **0** | **0** | casos individuales y tratamientos; los 7 HP «faltantes» son `alt_id` |
| 8 | Hetionet v1.0, OAE, `hp-es.synonyms.tsv`, `hp-international.obo`, HPO `src/mappings` | **0** | **0** | co-ocurrencia estadística, eventos adversos, archivo vacío, sinónimos sin idioma, licencias de terceros |

### Pasadas del 2026-10-27 (cierre de huecos)

| Pasada | Fuentes | Términos nuevos | Relaciones nuevas | Notas |
|---:|---|---:|---:|---|
| 9 | Orphadata producto 4 EN+ES (2026-06-23): 4 357 enfermedades, 116 664 asociaciones | 0 | **0** | Cero por causa real: sus 116 612 pares distintos son **exactamente** los de HPOA (HPOA es la integración de este producto). Aporta 116 471 filas de evidencia directa de Orphanet (fecha de validación, PMID, marca de criterio diagnóstico en 1 132 y de signo patognomónico en 19) |
| 10 | MeSH 2026 `desc2026.xml`, árbol C23: 31 110 descriptores leídos, 966 en C23 | 966 (481 sin equivalente publicado en otro sistema; 485 ya representados por xref o por el mismo CUI en MedGen, pero se cargan igual: es otro code system con su jerarquía) | 0 | C23.888 Signs and Symptoms 416 · C23.550 Pathologic Processes 425 · C23.300 Anatomical 118 · C23.149 Morphological 6 · cabeza 1 |
| 11 | Wikidata P3841 (consulta del 2026-10-28): 4 876 ítems–HPO | 0 | 0 | Sólo cruce; 4 843 términos HPO del corpus con ítem |
| 12 | NCBI MedGen `MGCONSO` (sólo CUI y códigos de HPO/MeSH/NCIt) | 0 | 0 | 1 790 pares con el mismo CUI (HPO↔MeSH 575, HPO↔NCIt 734, MeSH↔NCIt 324, HPO↔SYMP 58, NCIt↔SYMP 52, MeSH↔SYMP 47) |
| 13 | Re-descarga de las 9 fuentes originales | **0** | **0** | Cero por causa real: el SHA-256 de las 9 es idéntico al del 2026-10-24 (HPO 2026-09-01, HPOA 2026-09-02, SYMP 2026-07-30, DO 2026-09-30, Mondo 2026-10-06, NCIt 26.02d) |

Las pasadas 11, 12 y 13 aportan 0 por causas reales (no por errores de red), y la 9 también:
con las fuentes que hoy se pueden leer sin cuenta el corpus vuelve a estar saturado.
Fuentes buscadas además de las listadas y descartadas (ver `SOURCES.md`): MedGen
(`MGDEF`/`MGSTY`/`MGREL`: 0 términos nuevos, mezclan fuentes con licencia), traducciones
HPO no oficiales, ítems de Wikidata sin P3841 (son del glosario).

**Dos pasadas seguidas (7 y 8) aportan 0**: el corpus está saturado **dentro de
lo que se puede bajar desde este entorno**. Los motivos de cada descarte están
en `SOURCES.md` § Fuentes evaluadas y no cargadas. Lo que no se pudo bajar está
en § Huecos: cuando haya acceso, hay que volver a correr el protocolo con esas
fuentes antes de afirmar que no existen más términos.

### Sobre las anotaciones de enfermedades comunes (pasada 4)

HPO las publicó (Groza et al. 2015, PMC4572507) para 3 647 enfermedades comunes
(2 601 DOID, 1 046 MeSH). El 99,5 % tiene evidencia `ITM`: la **fuente** las
extrajo por minería de texto de resúmenes de PubMed (BioLark) y cita los PMID.
No las generó esta sesión. Se cargan con su código `ITM`, para que quien las use
pueda filtrarlas. Dos ajustes de formato, ambos comprobados contra la release:

- Escriben el DOID con ceros a la izquierda (`DOID:0013550`) donde DO publica
  `DOID:13550`. Se normaliza **sólo** si el id tal cual no existe en
  `doid.owl` y el id sin ceros sí, o si ese id es un `alt_id` que DO declara en
  una clase vigente (p. ej. `DOID:0000324` → `DOID:324` → `DOID:178`): 93 112
  filas, 580 de ellas por `alt_id`. Cada fila guarda el código publicado
  (`diseaseAsPublished`) y la normalización aplicada.
- Usan HP de 2015: 1 681 se traducen por `alt_id`/`replaced_by` que declara HPO;
  20 que HPO ya no resuelve se descartan y se cuentan.

## Cobertura

### Términos por sistema/órgano (HPO, anomalía fenotípica, 19 178 términos)

| Código | Sistema/órgano (nombre oficial ES) | Términos | Con nombre ES | Con definición (EN) |
|---|---|---:|---:|---:|
| HP:0033127 | Anormalidad del sistema musculoesquelético | 4 759 | 4 712 | 3 544 |
| HP:0040064 | Anormalidad de las extremidades | 3 024 | 3 007 | 2 063 |
| HP:0000707 | Anomalía del sistema nervioso | 2 832 | 2 795 | 2 578 |
| HP:0001939 | Anomalía del metabolismo / homeostasis | 2 481 | 2 454 | 2 386 |
| HP:0002715 | Alteración del sistema inmune | 1 785 | 1 373 | 1 768 |
| HP:0000119 | Anormalidad del sistema genitourinario | 1 713 | 1 691 | 1 629 |
| HP:0001626 | Anomalía del sistema cardiovascular | 1 507 | 1 480 | 1 418 |
| HP:0000152 | Anomalía de la cabeza y el cuello | 1 488 | 1 460 | 1 326 |
| HP:0000478 | Anomalía del ojo | 1 199 | 1 192 | 984 |
| HP:0001574 | Anormalidad del tegumento | 1 128 | 1 091 | 943 |
| HP:0001871 | Alteración de la sangre y de los tejidos que forman la sangre | 921 | 886 | 890 |
| HP:0025031 | Anomalía del sistema digestivo | 910 | 862 | 832 |
| HP:0002664 | Neoplasia | 714 | 709 | 631 |
| HP:0002086 | Alteración del sistema respiratorio | 668 | 653 | 609 |
| HP:0000818 | Alteración del sistema endocrino | 475 | 473 | 429 |
| HP:0000598 | Anomalía de la oreja | 314 | 308 | 275 |
| HP:0025354 | Fenotipo celular anormal | 307 | 303 | 280 |
| HP:0001197 | Anomalía del desarrollo prenatal o el parto | 267 | 261 | 233 |
| HP:0025142 | Síntoma constitucional | 160 | 159 | 157 |
| HP:0001507 | Anormalidad del crecimiento | 103 | 103 | 90 |
| HP:0000769 | Anomalía de la mama | 56 | 54 | 51 |
| HP:0001608 | Anomalía de la voz | 28 | 28 | 20 |
| HP:0045027 | Anormalidad de la cavidad torácica | 7 | 7 | 6 |

Un término con varios padres cuenta en cada sistema. El resto de HPO: modificador
clínico 356, antecedentes 208, fenotipo de muestra biológica 94, modo de herencia
41, grupo sanguíneo 9, frecuencia 7.

SYMP (895): sistema nervioso 148, cabeza y cuello 116, abdominal 79, piel 76,
general 67, neurológico-fisiológico 62, respiratorio 60, digestivo 59,
musculoesquelético 56, hemático-inmune 53, nutrición-metabolismo 40, urinario 36,
cardiovascular 34, reproductor 19. NCIt 26.02d (3 988): 1 113 por la regla de signos y
síntomas y 2 875 hallazgos clínicos por sistema (cardiovascular 905, reproductor
466, digestivo 282, cabeza y cuello 281, tejido conectivo 251, nervioso 243,
hematopoyético 199…). Se excluyen 19 conceptos que NCIt también clasifica bajo
C2991 «Disease or Disorder» (p. ej. «Erectile Dysfunction», «Menorrhagia»): los carga
`seed-diseases` como `ncit-disease` y no se duplican.

**Idioma.** Sólo HPO publica nombres oficiales en castellano (19 345 de 19 894).
SYMP y NCIt no tienen traducción oficial: sus 4 883 términos quedan con el nombre
en inglés de la fuente, declarado como tal en la designación. No se tradujo nada.
Las definiciones son las de la fuente, en inglés, en la propiedad
`source_definition` con su idioma (no en la columna `definition`, que la API
muestra como texto en castellano).

### Relaciones por fuente

| Fuente | Filas | Enfermedades | Fenotipos | Aspecto P | Negadas | Frecuencia | Evidencia |
|---|---:|---:|---:|---:|---:|---|---|
| HPOA (OMIM, Orphanet, DECIPHER) | 286 651 | 12 880 | 11 658 | 268 906 | 733 | término HPO 119 446 · n/m 103 704 · % 105 · sin dato 63 396 | TAS 137 011 · PCS 119 333 · IEA 30 307 |
| Mondo | 974 | 700 | 413 | 814 | 0 | — | calificador `source=` de Mondo |
| Disease Ontology (RO:0002452) | 2 268 | 873 | 305 (SYMP) | 2 262 | 0 | — | axioma curado |
| HPO enfermedades comunes | 132 600 | 3 647 | 4 524 | 132 104 | 0 | — | ITM 131 986 · IEA 527 · TAS 87 |

Los aspectos C (curso clínico), I (herencia), M (modificador) y H (antecedente)
de HPOA, y los destinos de Mondo/comunes fuera de HP:0000118 (inicio, herencia),
no son síntomas: quedan en el corpus pero no se cargan como `REL_SYMPTOM`.

**Enfermedades de animales.** Tampoco se cargan las anotaciones cuya enfermedad
—por su código o por el MONDO que Mondo declara `equivalentTo`— cuelga de
MONDO:0005583 «non-human animal disease»: 181 filas (Mondo 1, p. ej. `MONDO:0005829`
«louping ill», de ovejas; DO 6; enfermedades comunes 174, p. ej. «Toxoplasmosis,
Animal», «Mastitis, Bovine»). Caso dudoso, documentado: Mondo declara
`MESH:D005667` «Furunculosis» equivalente a `MONDO:0025419` «furunculosis, fish»,
así que 20 filas que probablemente son de furunculosis humana quedan fuera por esa
equivalencia publicada; se deja así (excluir es lo conservador) y se anota para
reportar a Mondo.

### Enfermedades con y sin síntomas enlazados

Medido contra las 23 263 enfermedades humanas de Mondo (descendientes de
`MONDO:0700096`), uniendo códigos por las equivalencias que declara Mondo:

- **Con síntomas: 12 631 (54,3 %)**; sin síntomas: 10 632.
- Por combinación de fuentes: sólo HPOA 9 288; sólo enfermedades comunes 1 526;
  HPOA + comunes 575; sólo DOID 207; DOID + comunes 209; DOID + HPOA 203; HPOA +
  Mondo 139; sólo Mondo 86; resto 398.
- Códigos anotados **sin** equivalencia en Mondo (no se pueden enlazar vía Mondo;
  sí directo si `seed-diseases` carga ese sistema): MeSH 540, DOID 350, OMIM 87,
  ORPHA 33, DECIPHER 1.

## Dependencia con `seed-diseases`

Las relaciones se enlazan **por código**, en este orden:

1. El código tal como lo publica la fuente, en el sistema que lo cita. Formatos
   confirmados por `seed-diseases` (#688, `docs/seed-research/diseases.md` §3):
   `omim` → `616331` (sin prefijo), `orphanet` → `558`, `decipher` → `16`,
   `mesh` → `D003920`, `mondo` → `MONDO:0007739` y `doid` → `DOID:9351` (con
   prefijo). Es también lo que recomendó esa sesión: colgar la arista del
   concepto del sistema que cita la anotación. Se reemplaza con
   `--disease-systems <json>` sin tocar código.
2. Si no está, el MONDO id que Mondo declara `equivalentTo` (74 548
   equivalencias en `disease-equivalences.ndjson`); la evidencia lo anota en
   `qualifiers.diseaseResolvedVia`.
3. Si tampoco, la fila no se carga y se cuenta por prefijo
   (`--check` lo muestra sin escribir).

Medición en la base desechable con dos andamios:

- **Con el catálogo real de `seed-diseases`** (snapshot de #688, commit 57f23f9c,
  `load-catalog.mjs --from-snapshot --systems omim,orphanet,decipher,mondo,doid,mesh`;
  su pasada 15 agregó como claves los 401 MeSH de las anotaciones comunes):
  HPOA 268 906/268 906, DOID 2 262/2 262, Mondo 814/814 y enfermedades comunes
  132 008/132 104, todo directo por código → **402 633 aristas y 403 959 filas
  de evidencia** (re-corrida 0, 33 s). Sin resolver sólo `DOID:5898` (96 filas:
  sin clase ni `alt_id` en la release vigente). Los otros 12 DOID retirados se
  resuelven por `alt_id`.
- **Con el formato de #688** (`omim`/`orphanet`/`decipher` con los 8 478 + 4 355
  + 47 códigos de HPOA, código sin prefijo): HPOA resuelve **268 906 de 268 906**
  filas P directo por código, 0 vía Mondo, 0 sin resolver → 268 306 aristas.
- **Sólo con Mondo** (sin otros sistemas): HPOA 267 254 de 268 906 (1 652 filas
  de 121 códigos sin equivalencia en Mondo), Mondo 814/814, DOID 2 242/2 262 y
  enfermedades comunes 102 649 de 132 104 (29 455 filas de 890 códigos DOID/MeSH
  sin equivalencia en Mondo: entran directo porque `seed-diseases` carga `doid` y
  `mesh`).

CIE-11 capítulo 21 y CIE-10 capítulo R: los carga `seed-diseases` (MMS 2026-01
completa; CIE-10 sólo como claves `icd10-who` sin título, porque no hay licencia
OMS). Esta sesión **no** los duplica ni crea un `icd10-who` propio.

## Glosario: extensión, no duplicado

- `load-symptoms.mjs --glossary` agrega al glosario los 18 646 fenotipos de HPO
  (HP:0000118) con nombre oficial en castellano: membresía en
  `glossary-all-terms` + `glossary-category-signs-symptoms` y propiedades
  `glossary-slug` (`hpo-hp-0001250`), `glossary-external-ids`,
  `glossary-provenance`. Es el **mismo concepto** del sistema `hpo`, no una copia.
- **Riesgo de duplicado, ahora medible.** Las fichas `wikidata-sintoma-*` del glosario
  no declaran su id HPO, pero Wikidata sí publica el cruce (P3841 *Human Phenotype
  Ontology ID*): el 2026-10-27/28 `query.wikidata.org` responde 200 y se bajaron 4 876
  declaraciones (4 799 ítems, 4 868 ids de HPO distintos; 4 843 términos HPO del corpus
  tienen ítem; 42 ids son `alt_id` de HPO y se remapean al vigente; **1 id está mal escrito
  en Wikidata** —`HP:000962`, ítem Q1640998— y se deja sin resolver, no se corrige).
  `load-wikidata-crosswalk.mjs` guarda, por cada término HPO, la propiedad
  `wikidata_items` y, si la ficha `wikidata-sintoma` de ese QID existe en la base, un
  `concept_map` sin equivalencia declarada. **El corpus del glosario no está en git**,
  así que el mapeo se probó contra un **doble** de 3 fichas (contrato: code system
  `wikidata-sintoma`, `code` = QID; regla 65): las propiedades (4 843) se cargaron de
  verdad; la cantidad real de mapas depende de cuántos QID haya cargado el glosario.
  `--glossary` de `load-symptoms.mjs` sigue sin ser el comportamiento por defecto: es
  decisión del propietario activarlo ahora que el cruce existe.

## Corrida en Postgres desechable

Postgres 16 local, DDL de `database/SQL/00_shared` + `03_terminology` (copia del
modelo). Andamio de la corrida: los 7 conceptos internos que en un entorno
real siembra la API (estado activo, idiomas, tipos de designación, is-a,
`REL_SYMPTOM`, `REL_SYMPTOM_EXCLUDED`), los dos value sets del glosario y Mondo
como sustituto de `seed-diseases`.

| Paso | Filas nuevas | Tiempo | Re-corrida |
|---|---|---:|---|
| `load-symptoms.mjs --apply --glossary` | 24 777 conceptos · 70 747 designaciones · 367 171 propiedades · 29 428 is-a · 37 292 membresías | 19 s | 0 filas, 13 s |
| `load-disease-phenotypes.mjs --apply` sin la tabla propuesta | 0 (aborta, salida 2) | 5 s | — |
| idem con la tabla propuesta aplicada en la base desechable | 345 258 aristas · 372 928 evidencias (andamio Mondo) | 52 s | 0 filas, 31 s |
| idem con el catálogo real de #688 (57f23f9c) | 402 633 aristas · 403 959 evidencias | 59 s | 0 filas, 33 s |
| **2026-10-27** `load-symptoms.mjs --apply` (4 sistemas, con MeSH C23) | 25 743 conceptos · 73 400 designaciones · 304 407 propiedades · 30 465 is-a | 12 s | 0 filas |
| **2026-10-27** `load-disease-phenotypes.mjs --apply` contra el modelo real (DDL + patch v4250) y el catálogo de `seed-diseases` | 402 633 aristas (401 907 `REL_SYMPTOM` + 726 excluidas) · **520 430 evidencias** (HPOA/comunes 400 883 · Orphadata 116 471 · DO 2 262 · Mondo 814) | 69 s | 0/0, 40 s |
| **2026-10-27** `load-wikidata-crosswalk.mjs --apply` | 4 843 propiedades `wikidata_items` · 3 mapas (doble del glosario) | 1 s | 0 |
| **2026-10-27** `load-medgen-crosswalk.mjs --apply` | 1 790 `concept_maps` por CUI | <1 s | 0 |

Tamaño de la base tras todo el 2026-10-27 (con el catálogo de `seed-diseases`): 932 MB (en 2026-10-24, con el andamio de Mondo: 639 MB). `catalog_import_batches` suma una fila por
corrida y sistema (es el registro de cada corrida, no dato).

## Huecos

Re-sondeados el **2026-10-27** (`evidencia/C2/sondeo-2026-10-27.txt`). «Antes» = 2026-10-24
(bloqueado por el proxy); «hoy» = código HTTP del 2026-10-27.

| Hueco | Hoy | Qué se cargó | Antes → después |
|---|---|---|---|
| Orphadata `en_product4.xml` / `es_product4.xml` | 200 (48 MB c/u) | 116 661 asociaciones como evidencia directa de Orphanet (CC BY 4.0), con fecha de validación, PMID, marca de criterio diagnóstico/patognomónico y rótulos ES de Orphanet. 3 asociaciones con HPO retirado sin reemplazo quedan fuera y se cuentan. **No suma pares nuevos:** son los mismos que HPOA | evidencias 403 959 → 520 430; aristas 402 633 → 402 633 |
| Nombres ES de Orphanet | 200 | Los nombres de enfermedad (4 357) y las clases de frecuencia ES quedan en la cita de la evidencia tal como los publica Orphanet. **No** se crean designaciones sobre `orphanet` (concepto de `seed-diseases`, otro carril; ellos cargan `es_product1`) | — |
| MeSH C23 (signos y síntomas) | 200 (`desc2026.zip` 16,8 MB) | 966 descriptores con sinónimos por alcance y definición de la fuente (inglés), jerarquía por número de árbol, `mesh_tree_numbers`. Code system propio `mesh-c23` | conceptos 24 777 → 25 743 |
| Wikidata P3841 | 200 | 4 876 declaraciones ítem–HPO → propiedad `wikidata_items` en 4 843 términos HPO y mapas a fichas `wikidata-sintoma` si existen | cruces HPO↔Wikidata 0 → 4 843 |
| CIE-11 capítulo 21 en castellano | `icd.who.int/browse/2026-01/mms/es` 200 (app web); `id.who.int/icd/release/11/…/mms` **401** sin token; `icdcdn.who.int` 400 | **Nada.** Hueco de **acceso** (la API y las descargas de la OMS exigen cuenta/token; no se crean) y de **licencia** (CC BY-ND 3.0 IGO, verificada en `icd11-license.pdf`: prohíbe derivados). La MMS en inglés ya la carga `seed-diseases` | 0 → 0 |
| Licencia vigente de HPO | `hpo.jax.org/app/license` 404 (SPA); texto leído del bundle público del sitio | Verificada y registrada en `SOURCES.md` ¹ (3 condiciones + leyenda) y en `evidencia/C2/licencia-hpo-2026-10-27.txt`. Hay una cláusula de «uso no comercial» del *sitio* que el propietario debe confirmar con un abogado | «sin verificar» → verificada |
| Licencia vigente del NCIt | 200 | CC BY 4.0 reconfirmada; `SOURCES.md` ³ corregido | idem |
| CIE-10 capítulo R | — | Ya está en el glosario (CIE-10-ES) e `icd10cm` | — |
| DeCS (BIREME) | `decs.bvsalud.org` responde (206 con rango), pero el uso exige solicitar licencia y token a BIREME/OPS | **Nada.** Hueco de **licencia/acceso** | 0 → 0 |
| SNOMED CT (incluido el GPS) | MedGen `MGCONSO` trae nombres de SNOMED CT: no se leen | **Nada.** Hueco de licencia: Bolivia no es miembro; el GPS va por MLDS (cuenta) | 0 → 0 |
| UMLS / MedDRA / OMIM API | requieren licencia o cuenta | **Nada** (sólo CUI como clave, ver `SOURCES.md` ⁷) | 0 → 0 |
| CIAP-2 / ICPC-2 (WONCA) | © WONCA | **Nada.** Hueco de licencia | 0 → 0 |
| PubMed / Europe PMC | `eutils.ncbi.nlm.nih.gov` y `ebi.ac.uk/europepmc` responden 200 | **Nada, por decisión:** son buscadores de literatura, no un vocabulario; sacar términos de resúmenes sería inferir (es justo lo que HPO ya hizo con evidencia `ITM`). Quedan disponibles para curaduría humana | — |
| `load-disease-phenotypes.mjs` | — | **Desbloqueado**: ver § Modelo y § Corrida | bloqueado (salida 2) → 520 430 evidencias, idempotente |
| HPO: 549 términos sin nombre oficial ES | — | Curaduría: los traductores del HPO Translation Project no los publicaron como `OFFICIAL` | — |

Persisten **sin cerrar** por motivo exacto: CIE-11 ES (acceso + licencia ND), DeCS (licencia),
SNOMED CT/UMLS/MedDRA/CIAP-2 (licencia), mapas reales HPO→glosario (falta el corpus del
glosario en esta base), y las columnas/valor-set que el modelo no tiene (§ Modelo).

## Decisiones que necesita el propietario

1. **Nivel de evidencia** (`vs_evidence_tier`): el modelo declara 4 niveles y no a qué
   fuente corresponde cada uno. Se asignó `CURATED_REFERENCE` a HPOA TAS/PCS, Mondo, DO
   y Orphadata, y `STATISTICAL_LITERATURE` a lo extraído automáticamente (HPOA IEA,
   enfermedades comunes ITM/IEA: 160 018 filas). Cambiar la regla es una línea
   (`evidenceTierCode`, `lib/relations-plan.mjs`). Confirmar con el dueño del modelo (autor del commit e8bd453).
2. **Licencia de HPO — NO resuelta, y la carga ahora la exige explícita.** La licencia de los
   archivos (texto verificado el 2026-10-27) es de uso libre con tres condiciones: reconocer y citar
   al HPO Consortium, indicar fecha/versión al mostrarlo públicamente y no alterar contenido ni
   relaciones. Pero el *Warranty, Disclaimer, and Copyright Notice* del mismo sitio autoriza «personal,
   noncommercial use» del contenido del sitio y lo declara «for research and educational purposes».
   Si eso alcanza a los archivos descargables en un producto comercial es una lectura jurídica que no
   me corresponde cerrar. Por eso `load-symptoms.mjs` (sistema `hpo`), `load-disease-phenotypes.mjs` y
   los dos cruces **se niegan a escribir sin `--accept-hpo-terms`** (o `MANTRA_HPO_TERMS_ACCEPTED=1`,
   salida 3): quien lo pase asume esa decisión. Las pruebas en la base desechable se corrieron con el
   flag; sin él se negaron los cuatro (`evidencia/C2/hpo-sin-aprobacion.txt`). Confirmar con el
   propietario / asesoría legal, y mostrar la leyenda de atribución en el producto.
3. **MedGen CUI** (`load-medgen-crosswalk.mjs`): cargar o no los 1 790 cruces por CUI.
   Hay precedente (CUI como clave en `seed-diseases` y en los `xrefs` de NCIt/SYMP), pero
   el CUI es un identificador de UMLS.
4. **MeSH C23 como code system propio** `mesh-c23` en vez de dentro de `mesh` (que carga
   `seed-diseases` como claves y árbol C): evita pisarse y duplica el descriptor en dos
   sistemas; si se prefiere uno solo, se cambia el `internal_code` y se coordina con C1.
5. **`--glossary`** de `load-symptoms.mjs` (18 646 fenotipos HPO al glosario): activarlo
   ahora que el cruce con Wikidata existe.
6. **Fuentes de relaciones**: `load-disease-phenotypes.mjs` pasó a reusar los `terminology_sources`
   `MONARCH_MONDO`, `DO_DOID` e `INSERM_ORPHANET` de `seed-diseases` (antes creaba `MONDO` y
   `DISEASE_ONTOLOGY`): una sola fuente por organización.
7. **Aviso a quien mantenga** `mantra-core-health-model/seedsProd/sources/mesh-2026-source-manifest.json`: NLM
   re-publicó `desc2026.zip` con el mismo nombre (SHA-256 distinto, ver `SOURCES.md` ⁵).

## Cómo correr

El corpus normalizado está versionado en `tools/terminology-import/symptoms/data/`
(20,9 MB comprimidos): para cargar sin re-bajar nada alcanza con
`unpack-data.mjs` y los cargadores.

```sh
node tools/terminology-import/symptoms/unpack-data.mjs                  # data/*.gz → glossary-data-build/symptoms (verifica SHA-256)
node tools/terminology-import/symptoms/fetch-symptom-sources.mjs        # o desde cero: ~1 min, 510 MB, reanudable
node tools/terminology-import/symptoms/build-symptoms-corpus.mjs        # ~25 s, sin red ni base
node tools/terminology-import/symptoms/build-gap-sources.mjs            # Orphadata, MeSH C23, Wikidata P3841, MedGen: ~15 s, sin red ni base
node tools/terminology-import/symptoms/pack-data.mjs                    # regenera data/ para commitear
node tools/terminology-import/symptoms/pack-data.mjs --only relations-orphadata,terms-mesh-c23,crosswalk-wikidata-hpo,crosswalk-medgen-cui,gap-coverage.json,saturation-gaps.json   # sólo lo nuevo
node tools/terminology-import/symptoms/load-symptoms.mjs                # dry-run: plan y conteos
node tools/terminology-import/symptoms/load-symptoms.mjs --apply --accept-hpo-terms   # términos (.env DB_*); sin el flag se niega (decisión 2); --glossary opcional
node tools/terminology-import/symptoms/load-disease-phenotypes.mjs      # dry-run del plan de relaciones
node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --check   # modelo + resolución, sin escribir
node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply   # exige concept_relationship_evidence (v4.2.50) y los value sets de evidencia/frecuencia
node tools/terminology-import/symptoms/load-wikidata-crosswalk.mjs --apply   # HPO ↔ Wikidata P3841
node tools/terminology-import/symptoms/load-medgen-crosswalk.mjs --apply     # cruces por CUI (decisión 3)
node --test "tools/terminology-import/symptoms/test/*.test.mjs"         # 31 pruebas con recortes reales
DISPOSABLE_DB=1 DB_NAME=…_test … sh tools/terminology-import/symptoms/test/disposable-db/fresh-db.sh   # Postgres desechable (se niega si no es local, no termina en _test o falta DISPOSABLE_DB=1): DDL + patch v4250 del modelo + scaffold (ver el script)
```
