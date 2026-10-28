# Fuentes del corpus de síntomas, signos y fenotipos

Los archivos **crudos no** están en git (~510 MB): `fetch-symptom-sources.mjs` los baja a
`<GLOSSARY_BUILD_DIR>/symptoms-sources/` (por defecto `../glossary-data-build/`,
hermana del repo) y escribe ahí `manifest.json` con URL, SHA-256, bytes, fecha y
versión declarada. La tabla es la corrida del **2026-10-24**; las filas de Orphadata, MeSH, Wikidata y MedGen se agregaron el **2026-10-27** (cierre de huecos, ver `docs/seed-research/symptoms.md` § Huecos). El 2026-10-27 se volvieron a bajar las 9 fuentes originales: los SHA-256 son idénticos a los de esta tabla (ninguna publicó nada nuevo).

El corpus **normalizado** sí está en git, comprimido: `data/*.ndjson.gz` (20,9 MB,
cada archivo < 10 MB; si alguno pasara de 45 MB se parte por líneas) con
`data/MANIFEST.json` (filas y SHA-256 de cada parte y del original). Los archivos nuevos del 2026-10-27 (`relations-orphadata`, `terms-mesh-c23`, `crosswalk-wikidata-hpo`, `crosswalk-medgen-cui`, `gap-coverage`, `saturation-gaps`) se agregaron con `pack-data.mjs --only …` sin reescribir los anteriores.
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
| `orphadata-en-product4` | [en_product4.xml](https://www.orphadata.com/data/xml/en_product4.xml) | 2026-06-23 (`JDBOR date`) | 47 893 357 | `4f44e8a61201` | CC BY 4.0 (la declara el XML) ⁴ |
| `orphadata-es-product4` | [es_product4.xml](https://www.orphadata.com/data/xml/es_product4.xml) | 2026-06-23 | 47 971 442 | `d30f029b3662` | CC BY 4.0 (la declara el XML) ⁴ |
| `mesh-desc` | [desc2026.zip](https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.zip) | MeSH 2026 | 16 812 755 | `bb73dfdfe78cbfcd` ⁵ | libre con atribución a NLM e indicación de versión ⁶ |
| `wikidata-p3841` | consulta SPARQL de `WIKIDATA_P3841_QUERY` (`lib/sources.mjs`) | consulta en vivo del 2026-10-28 (resultado normalizado, ver abajo) | 2 094 507 | `640281f13497` | CC0 1.0 |
| `medgen-mgconso` | [MGCONSO.RRF.gz](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MGCONSO.RRF.gz) | sin versión declarada (fecha de descarga en el manifiesto) | 15 819 991 | `769baf61c3bd` | dato público de NCBI; sólo se leen CUI y códigos de HPO, MeSH y NCIt ⁷ |

¹ **HPO license** — el archivo declara `dcterms:license https://hpo.jax.org/app/license`.
**Verificada el 2026-10-27** (texto completo en
`docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C2/licencia-hpo-2026-10-27.txt`;
la ruta del SPA responde HTTP 404 con el shell de la app y el texto sale del bundle
público `chunk-BTDEGCNK.js` del sitio, componente `app-license`). Dice, textual:
*«The HPO vocabularies, annotation files, tools and documentation are freely
available. […] anyone can download the HPO and use the ontologies or other HPO
files under three conditions: (1) That the Human Phenotype Ontology Consortium is
acknowledged and cited properly. (2) That any HPO Consortium file(s) displayed
publicly include the date(s) and/or version number(s) of the relevant HPO file(s).
(3) That neither the content of the HPO file(s) nor the logical relationships
embedded within the HPO file(s) be altered in any way.»* Y pide agregar a la
presencia en línea: *«This service/product uses the Human Phenotype Ontology
(version information). Find out more at http://www.human-phenotype-ontology.org»*
(y el logo). **Dos puntos para el propietario:** (a) la condición 3 obliga a no
alterar contenido ni relaciones: este importador conserva nombres, definiciones y
jerarquía verbatim, pero la leyenda de atribución y la versión tienen que aparecer
en el producto; (b) el *Warranty, Disclaimer, and Copyright Notice* del mismo sitio
autoriza «personal, noncommercial use» del *contenido del sitio* y dice que el
sitio es «for research and educational purposes»: se lee como referido a las
páginas, no a los archivos descargables que rige la licencia de arriba, pero un
abogado debería confirmarlo antes de publicar. Cada concepto guarda la licencia
declarada en `source_license`.

² **Orphanet** — las filas `ORPHA:` de `phenotype.hpoa` son la integración que el
HPO hace del producto 4 de Orphadata. Desde el 2026-10-27 el producto 4 se baja
directo (ver ⁴) y se comprobó que las dos fuentes coinciden: los 116 612 pares
enfermedad–fenotipo distintos de Orphadata son exactamente los de HPOA (0 en uno y
no en el otro), con las clases de frecuencia en correspondencia 1:1 con los términos
HP:0040280–0040285 salvo 15 pares cuya frecuencia cambió entre las dos publicaciones.

³ **NCIt** — release fijada del repo oficial `ncit-obo-org` (la misma que usa
`seed-diseases` para `ncit-disease`, así el corte contra C2991 coincide; el repo
anterior `NCI-Thesaurus/thesaurus-obo-edition` quedó en 24.04e). `ncit.obo` no
trae `license` en su cabecera. **Reconfirmada el 2026-10-27 y otra vez el 2026-10-28** (misma página, mismo SHA-256 `c42ebee4…36ef3`; MeSH y la cabecera de Orphadata también sin cambios: `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C2-correcciones/licencias-recaptura-2026-10-28.txt`) en los
[términos de uso de NCI EVS](https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm)
(HTTP 200), textual: *«The NCI Thesaurus™ is released under the Creative Commons
Attribution 4.0 International license (CC BY 4.0). […] The name "NCI Thesaurus"
is trademarked. Only the NCI Thesaurus™ published by the NCI can be released under
this name.»* Por eso el code system se llama «Subconjunto de signos, síntomas y
hallazgos clínicos de la NCIt OBO Edition» y se atribuye a NCI con la versión.

⁴ **Orphadata** — `en_product4.xml` y `es_product4.xml` responden HTTP 200 el
2026-10-27 (el 2026-10-24 daban 403 por el proxy). El XML declara en `<Licence>`:
*«Creative Commons Attribution 4.0 International» (CC-BY-4.0)*; hay que citar
*«Orphadata: Free access data from Orphanet. © INSERM 1999. Available on
http://www.orphadata.com»*. El archivo en castellano trae igual los términos HPO en
inglés; Orphanet sólo traduce el nombre de la enfermedad, su tipo y grupo, las clases
de frecuencia y la marca de criterio diagnóstico. Esos textos se guardan tal cual en
la cita de la evidencia (`Name_es`, `HPOFrequency_es`); no se tradujo nada.

⁵ **MeSH** — el SHA-256 de `desc2026.zip` bajado hoy (`bb73dfdf…`, 16 812 755 bytes)
**no coincide** con el del manifiesto de `mantra-core-health-model/seedsProd/sources/mesh-2026-source-manifest.json`
(`c541855f…`, 16 812 779 bytes): NLM re-publicó el archivo con el mismo nombre. El
XML interior es de 2026-08-12, 31 110 descriptores. Hay que avisar al dueño de ese
manifiesto.

⁶ **MeSH, términos de uso** (`terms_and_conditions_mesh.html`, revisados el
2026-10-27; la página dice «Last Reviewed: October 4, 2018»): *«NLM freely provides
MeSH data. Use of MeSH Translation (MTMS) files is not covered […]. Users of the
data agree to: acknowledge NLM as the source of the data in a clear and conspicuous
manner, not indicate or imply that NLM has endorsed its products/services/applications.
Users who republish or redistribute the data […] agree to: maintain the most current
version of all distributed data, or make known in a clear and conspicuous manner that
[…] [they] do not reflect the most current/accurate data available from NLM and/or
identify the version of MeSH being used.»* Cada concepto guarda la versión (`2026`)
y la licencia. DeCS (MeSH en castellano, BIREME) no se usa.

⁷ **MedGen** — `MGCONSO.RRF.gz` mezcla nombres de vocabularios con licencia (SNOMED CT,
MedDRA, CPT, MEDCIN, Multum…, ver `MedGen_Sources.txt`). Sólo se leen las filas de
SAB `HPO`, `MSH` y `NCI`, y de ellas **únicamente el CUI y el código**; ningún nombre.
El CUI como clave ya tiene precedente aceptado en el repo (los CUI que declara NCIt y
SYMP se cargan en `xrefs`; `seed-diseases` carga `umls` «sólo el CUI»). Si el
propietario decide que no, se omite `load-medgen-crosswalk.mjs` y no se pierde nada más.

## Procedencia por fila y reproducibilidad

- **Manifiesto versionado:** `data/sources-manifest.json.gz` (sin rutas locales) trae, de las 14 fuentes
  (las 9 originales y las 5 nuevas), URL, bytes, **SHA-256 completo**, fecha de descarga, versión declarada
  y licencia. Es el `manifest.json` de `fetch-symptom-sources.mjs`; `unpack-data.mjs` lo restaura y el build
  lo lee de ahí cuando no hay descarga local. Para las 9 originales la fecha es la de la re-descarga del
  2026-10-27/28 (SHA-256 idéntico al del 2026-10-24); sus filas ya versionadas conservan su
  `retrievedAt` original.
- **Filas nuevas** (`relations-orphadata`, `crosswalk-wikidata-hpo`, `crosswalk-medgen-cui`, `terms-mesh-c23`)
  llevan cada una `version`, `retrievedAt`, `license` y el SHA-256 del archivo de entrada
  (`inputSha256`; Orphadata: el de los XML EN y ES; MeSH: `sourceFileSha256`, y como propiedad
  `source_input_sha256` en la base). Las filas de HPO, SYMP, NCIt y las relaciones originales se versionaron
  sin hash de entrada: su SHA-256 está en este manifiesto, no por fila (reescribir 20 MB no aporta evidencia nueva).
- **Wikidata es una consulta en vivo.** El resultado se guarda **normalizado** (bindings ordenados, JSON
  estable) en `data/wikidata-p3841-snapshot.json.gz` con su SHA-256 y fecha; desde ahí el build es
  reproducible sin repetir la consulta (comprobado: borrar el snapshot local, `unpack-data.mjs`, rebuild →
  mismos SHA-256, `evidencia/C2/build-reproducible-sha256.txt`).

**Licencias leídas y capturadas:** NCIt (CC BY 4.0), MeSH (términos de NLM) y Orphadata (CC BY 4.0 en la
cabecera del XML), textualmente, en `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C2/licencias-capturas-2026-10-27.txt`;
HPO en `licencia-hpo-2026-10-27.txt`. Esas cadenas son las que se guardan en `source_license`.

**LOINC / Regenstrief:** este corpus **no contiene LOINC**: 0 apariciones de «LOINC» o «Regenstrief» en
ninguno de los `data/*.gz` (comprobado con `zcat … | grep -ci`), y ninguna de las fuentes cargadas lo redistribuye
(MedGen sí tiene nombres de LOINC en `MGCONSO`; no se leen). Por eso no se agrega el aviso de derechos de LOINC
a estos datos; si algún carril de laboratorio cruza con estos códigos, el aviso va en el suyo.

**HPO: aprobación explícita.** Los cargadores que escriben contenido de HPO o que cuelgan de él
(`load-symptoms.mjs` con el sistema `hpo`, `load-disease-phenotypes.mjs`, `load-wikidata-crosswalk.mjs`,
`load-medgen-crosswalk.mjs`) **se niegan a escribir (salida 3)** sin `--accept-hpo-terms` o
`MANTRA_HPO_TERMS_ACCEPTED=1`. No es un trámite: marca que alguien asumió la lectura de ¹ (cláusula de
«uso no comercial» del sitio). Lo que se vio: la licencia de los archivos (3 condiciones, uso libre) y el
aviso legal del sitio (uso personal/no comercial del contenido del sitio, «research and educational
purposes»). Qué rige para este producto **no está resuelto**; el dry-run sí corre sin la aprobación.

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
| CIE-11 capítulo 21 en castellano (OMS/OPS) | `icd.who.int/browse/2026-01/mms/es` responde 200 (es una app web); `id.who.int/icd/release/11/2026-01/mms` responde **401** sin token; `icdcdn.who.int` 400 | Las descargas y la API exigen cuenta/token de la OMS (no se crean cuentas). Además la licencia de la CIE-11 (CC BY-ND 3.0 IGO) **prohíbe derivados**. Hueco de acceso y de licencia. La MMS en inglés ya la carga `seed-diseases`. |
| MedGen `MGCONSO` — filas de SNOMED CT, MedDRA, CPT, MEDCIN, Multum | NCBI FTP, 200 | © de terceros: no se leen (ver ⁷). |
| MedGen `MedGen_HPO_Mapping.txt.gz`, `MGSTY`, `MGDEF`, `MGREL` | NCBI FTP, 200 | Se evaluaron: el cruce HPO↔CUI ya sale de `MGCONSO` (SAB `HPO`); `MGDEF` mezcla definiciones de fuentes con licencia. 0 términos nuevos. |
| Wikidata: ítems de la clase «síntoma» sin P3841 ni P780 | consulta SPARQL, 200 | Pertenecen al glosario (`import-wikidata-relations.mjs`, otro carril); no aportan códigos HPO/MeSH. |
| `hp-es.babelon.tsv`, traducciones con estado distinto de `OFFICIAL` | GitHub, 200 | Candidatas/sin revisar: no son nombre oficial (549 términos HPO siguen sin nombre ES). |
