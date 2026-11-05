# Fuentes del corpus de síntomas, signos y fenotipos

Los archivos **crudos no** están en git (~510 MB): `fetch-symptom-sources.mjs` los baja a
`<GLOSSARY_BUILD_DIR>/symptoms-sources/` (por defecto `../glossary-data-build/`,
hermana del repo) y escribe ahí `manifest.json` con URL, SHA-256, bytes, fecha y
versión declarada. La tabla es la corrida del **2026-10-24**.

El corpus **normalizado** sí está en git, comprimido: `data/*.ndjson.gz` (20,9 MB,
cada archivo < 10 MB; si alguno pasara de 45 MB se parte por líneas) con
`data/MANIFEST.json` (filas y SHA-256 de cada parte y del original).
`unpack-data.mjs` lo restaura verificando los SHA-256; `pack-data.mjs` lo
regenera tras un build. Es contenido derivado de las fuentes de la tabla, con su
misma licencia y atribución (HPO, Orphanet vía HPOA, Mondo, DO, SYMP, NCIt).

| Clave | Archivo | Versión declarada | Bytes | SHA-256 (16) | Licencia |
|---|---|---|---:|---|---|
| `hpo-json` | [hp.json](https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.json) | 2026-09-01 | 21 915 519 | `a7b3a012e7b4007a` | HPO license ¹ |
| `hpo-es` | [hp-es.babelon.tsv](https://raw.githubusercontent.com/obophenotype/hpo-translations/main/babelon/hp-es.babelon.tsv) | repo al 2026-10-23 (`f35b9e9`) | 2 116 349 | `00972e33775a0340` | HPO license ¹ |
| `hpoa` | [phenotype.hpoa](https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa) | 2026-09-02 | 35 816 037 | `e89aa39c8f97bf5a` | HPO license ¹ (incluye anotaciones de Orphanet ²) |
| `symp` | [symp.obo](https://raw.githubusercontent.com/DiseaseOntology/SymptomOntology/main/src/ontology/symp.obo) | 2026-07-30 | 231 641 | `09ac08ff1595e671` | CC0 1.0 (encabezado del archivo) |
| `doid-owl` | [doid.owl](https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/main/src/ontology/doid.owl) | 2026-09-30 | 28 804 846 | `7b80ccc70f5d84e7` | CC0 1.0 (encabezado del archivo) |
| `mondo` | [mondo.obo](https://github.com/monarch-initiative/mondo/releases/latest/download/mondo.obo) | 2026-10-06 | 53 320 617 | `2631e8e165d41def` | CC BY 4.0 (encabezado: `terms:license`) |
| `ncit` | [ncit.obo](https://github.com/ncit-obo-org/ncit-obo-edition/releases/download/v2026-03-19/ncit.obo) | 26.02d (2026-03-19) | 248 162 694 | `8fdc2d29c9ebd91a` | CC BY 4.0 según términos de uso de NCI EVS (el `.obo` no la declara) ³ |
| `hpo-common-disease` | [common_disease_annot.tar.gz](https://storage.googleapis.com/data-public-monarchinitiative/hpo/common_disease_annot.tar.gz) | 2015 (Groza et al., AJHG 97:111) | 6 724 219 | `4c871573d57199cd` | HPO license ¹ (README del bucket) |
| `monarch-hpoa-edges` | [hpoa_disease_to_phenotype_edges.tsv](https://storage.googleapis.com/data-public-monarchinitiative/monarch-kg/latest/transform_output/hpoa_disease_to_phenotype_edges.tsv) | KG 2026-10-07 | 73 917 456 | `ea89c38c162ab7d3` | sólo para medir saturación; no se carga |
| `wikidata-p3841` | consulta SPARQL `?x wdt:P3841 ?hpo` a [query.wikidata.org](https://query.wikidata.org/sparql) | 2026-10-24 | — | ver `crosswalk/MANIFEST.json` | CC0 1.0. Cruce HPO ↔ ítem de Wikidata, versionado en `crosswalk/` (`fetch-hpo-wikidata-crosswalk.mjs`); lo usa `load-symptoms.mjs` para no duplicar en el glosario las fichas `wikidata-sintoma-*` |

¹ **HPO license** — el archivo declara `dcterms:license https://hpo.jax.org/app/license`
y `rdfs:comment "Please see license of HPO at http://www.human-phenotype-ontology.org"`.
Texto vigente leído el 2026-10-24 (la página es una aplicación JavaScript: se leyó el
componente «License» del bundle que sirve `hpo.jax.org`, que es el texto que muestra):
los vocabularios, anotaciones, herramientas y documentación del HPO son de libre
disponibilidad, bajo tres condiciones: (1) reconocer y citar al Human Phenotype Ontology
Consortium; (2) todo archivo del HPO que se muestre en público incluye su fecha o versión;
(3) no alterar el contenido de los archivos ni las relaciones lógicas que traen (las
modificaciones se proponen en el issue tracker del HPO). Pide agregar a la presencia en
línea *«This service/product uses the Human Phenotype Ontology (version information). Find
out more at http://www.human-phenotype-ontology.org»* e incluir el logo. Cada concepto
guarda la licencia declarada en `source_license` y su versión en `source_version`; el
cruce con Wikidata y la omisión de duplicados del glosario no modifican ningún término ni
relación del HPO (los términos siguen completos en el code system `hpo`).

² **Orphanet** — las filas `ORPHA:` de `phenotype.hpoa` son la integración que el
HPO hace del producto 4 de Orphadata (fenotipos por enfermedad rara, con su
frecuencia como término HPO). Según Orphadata —**sin verificar en esta corrida**,
`orphadata.com` devolvió 403— sus datos se publican con CC BY 4.0 y piden citar
*«Orphadata: Free access data from Orphanet. © INSERM 1999. Available on
http://www.orphadata.com»*. El archivo directo `en_product4.xml` no se pudo bajar
(403 del proxy de red) y queda como hueco documentado en
`docs/seed-research/symptoms.md`.

³ **NCIt** — release fijada del repo oficial `ncit-obo-org` (la misma que usa
`seed-diseases` para `ncit-disease`, así el corte contra C2991 coincide; el repo
anterior `NCI-Thesaurus/thesaurus-obo-edition` quedó en 24.04e). `ncit.obo` no
trae `license` en su cabecera. Los
[términos de uso de NCI EVS](https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm),
leídos en vivo el 2026-10-24, dicen: *«The NCI Thesaurus™ is released under the Creative
Commons Attribution 4.0 International license (CC BY 4.0)»* y que el nombre «NCI Thesaurus»
es marca registrada: sólo el publicado por NCI puede llamarse así. Por eso el code system
se llama «Subconjunto de signos, síntomas y hallazgos clínicos de la NCIt OBO Edition» y
atribuye a NCI con la versión (26.02d). La edición vigente en el FTP de EVS el 2026-10-24
es 26.09d.

## Fuentes evaluadas y no cargadas

| Fuente | Acceso | Motivo |
|---|---|---|
| Monarch KG `phenopacket_ingest_edges.tsv` (54,6 MB) | GCS público | Observaciones de **pacientes individuales** (CaseToPhenotypicFeatureAssociation). Pasarlas a enfermedad → síntoma sería deducir. 0 términos nuevos (los 7 ids que faltaban son `alt_id` de términos vigentes). |
| Monarch KG `cureid_edges.tsv` (88 KB) | GCS público | Casos de tratamiento de CURE ID (fármaco → enfermedad, eventos adversos). No es enfermedad → síntoma. 0 términos nuevos. |
| Hetionet v1.0 (CC0) | GitHub `hetio/hetionet` | 438 síntomas MeSH (instantánea de 2016) y aristas *presents* por **co-ocurrencia estadística** en PubMed: no es una anotación. MeSH vigente es alcance de `seed-diseases`. |
| Ontology of Adverse Events (OAE) | GitHub | Eventos adversos posteriores a una intervención, no síntomas de enfermedad. |
| `hp-es.synonyms.tsv` | GitHub | Sólo encabezado (0 sinónimos en castellano publicados). |
| `hp-international.obo` | release HPO | Sinónimos sin etiqueta de idioma: no se puede afirmar cuáles son castellano. |
| HPO `src/mappings/` (LDDB, MedDRA) | GitHub | © de terceros (LDDB, MedDRA/ICH): requieren licencia. |
