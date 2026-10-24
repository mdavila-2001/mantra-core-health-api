# Fuentes del corpus de síntomas, signos y fenotipos

Los archivos **no** están en git: `fetch-symptom-sources.mjs` los baja a
`<GLOSSARY_BUILD_DIR>/symptoms-sources/` (por defecto `../glossary-data-build/`,
hermana del repo) y escribe ahí `manifest.json` con URL, SHA-256, bytes, fecha y
versión declarada. La tabla es la corrida del **2026-10-24**.

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

¹ **HPO license** — el archivo declara `dcterms:license https://hpo.jax.org/app/license`
y `rdfs:comment "Please see license of HPO at http://www.human-phenotype-ontology.org"`.
La página no se pudo abrir desde el entorno de la corrida (host fuera de la lista
permitida), así que su texto vigente **queda por verificar antes de publicar**.
Lo que se sabe de releases anteriores, **sin verificar en esta corrida**: uso
libre (académico y comercial) con atribución, mostrar la versión usada y la
leyenda *«This service/product uses the Human Phenotype Ontology (version …).
Find out more at http://www.human-phenotype-ontology.org»*, y no redistribuir
contenido modificado como si fuera HPO. Cada concepto guarda la licencia
declarada en `source_license`.

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
trae `license` en su cabecera. La licencia sale de los
[términos de uso de NCI EVS](https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm),
revisados en un corte anterior y registrados en
`docs/terminology-expansion/SOURCE-REGISTER.md` (fila «NCI Thesaurus»): **CC BY 4.0**,
atribuir a NCI con la versión, no implicar aval y no llamar «NCI Thesaurus» a un
derivado. Por eso el code system se llama «Subconjunto de signos, síntomas y
hallazgos clínicos de la NCIt OBO Edition». `evs.nci.nih.gov` está bloqueado
desde este entorno: **reconfirmar** antes de publicar.

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
