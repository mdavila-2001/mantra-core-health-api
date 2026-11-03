# Catálogo de alergias — fuentes

Las fuentes se descargan **fuera de git**, en `glossary-data-build/allergy-sources/`
(hermana de los repositorios; se redefine con `ALLERGY_SOURCES_DIR` o
`GLOSSARY_BUILD_DIR`), con `fetch-allergy-sources.mjs`. Esa carpeta tiene un
`manifest.json` con, por artefacto, la URL exacta, la versión o el commit, el
SHA-256, los bytes, la fecha de descarga y la licencia. Esta tabla es la copia
legible de esa descarga (2026-10-24).

Los paquetes npm son los paquetes FHIR oficiales, que también se publican en el
registro npm. Los archivos de GitHub se bajaron **fijados al commit** que tenía
la rama en el momento de la descarga (`raw.githubusercontent.com/<repo>/<commit>/<ruta>`),
así que la URL apunta siempre al mismo contenido.

| Clave | Artefacto | Versión / commit | SHA-256 (16) | Licencia | Evidencia de la licencia |
|---|---|---|---|---|---|
| `fhir-r5-core` | npm `hl7.fhir.r5.core@5.0.0` | 5.0.0 | `09f22107bef64313` | CC0-1.0 | `package.json` → `"license": "CC0-1.0"` |
| `hl7-terminology` | npm `hl7.terminology.r4@7.0.1` | 7.0.1 | `170c546f761fb51b` | CC0-1.0 | `package.json` y el `copyright` de cada CodeSystem («made available under the CC0 designation») |
| `vsac` | npm `us.nlm.vsac@0.24.0` | 0.24.0 (expansión 2025-05-23) | `979a22871245fc91` | US Govt | `package.json` → `"license": "US Govt"`. RxNorm (NLM): las cadenas propias de RxNorm (SAB=RXNORM) no tienen restricciones adicionales. NDF-RT (VA) y CVX (CDC): dominio público |
| `phinvads` | npm `us.cdc.phinvads@0.12.0` | 0.12.0 | `383410ef81533302` | HHS/Open | `package.json` → `"license": "HHS/Open"` |
| `hpo` | `obophenotype/human-phenotype-ontology` `hp.obo` | `920d4eb3` (data-version `hp/releases/2026-09-01`) | `93dace952fcb3ec4` | Licencia HPO | cabecera → `terms:license https://hpo.jax.org/app/license`: uso libre, con cita y versión, sin modificar el contenido |
| `hpo-es` | `obophenotype/hpo-translations` `babelon/hp-es.babelon.tsv` | `f35b9e90` | `00972e33775a0340` | Licencia HPO | Traducción del proyecto oficial de la HPO; cada fila trae `translation_status` (las 19 932 son `OFFICIAL`) |
| `doid` | `DiseaseOntology/HumanDiseaseOntology` `src/ontology/doid.obo` | `776da8da` (`releases/2026-09-30`) | `51e717b6b9f5d391` | CC0-1.0 | cabecera → `terms:license …/publicdomain/zero/1.0/` |
| `mondo` | `monarch-initiative/mondo` `src/ontology/mondo-edit.obo` | `a645ab57` | `83983900026e5533` | CC-BY-4.0 | cabecera → `dcterms:license …/by/4.0/`; `LICENSE` del repositorio |
| `off-allergens` | `openfoodfacts/openfoodfacts-server` `taxonomies/allergens.txt` | `c8bb42e0` | `0d3992c301b8cbda` | ODbL-1.0 | Open Food Facts publica sus datos bajo ODbL 1.0; el `LICENSE` del repositorio (AGPL-3.0) cubre el código |
| `off-additives` | ídem `taxonomies/additives.txt` | `c8bb42e0` | `3c8b3c6d62e50bd3` | ODbL-1.0 | ídem |
| `ecto` | `EnvironmentOntology/environmental-exposure-ontology` `ecto.owl` | `dfb9e555` (`releases/2026-07-28`) | `c637876e3c15494e` | CC0-1.0 (ECTO) · CC-BY-4.0 (ChEBI) | `ecto.owl` → `terms:license …/publicdomain/zero/1.0/`. Las clases `CHEBI:*` son de ChEBI (EMBL-EBI, CC BY 4.0) y se citan como ChEBI |
| `oae` | `OAE-ontology/OAE` `oae.owl` | `5bd97947` (`releases/2026-04-15`) | `3ff0f811db391c5c` | CC-BY-4.0 | `oae.owl` → `terms:license …/by/4.0/` |
| `foodon` | `FoodOntology/foodon` `foodon.owl` | `cd735402` (`releases/2026-09-20`) | `b897bf64c1b265c4` | CC-BY-4.0 | `foodon.owl` → `dcterms:license …/by/4.0/` |
| `symp` | `DiseaseOntology/SymptomOntology` `src/ontology/symp.obo` | `6e16da69` (`releases/2026-07-30`) | `09ac08ff1595e671` | CC0-1.0 | cabecera del `.obo` |
| `fhir-cl-core` | npm `hl7.fhir.cl.clcore@1.9.4` | 1.9.4 | `78fddf93d2dd76f8` | CC0-1.0 | `package.json` |
| `fhir-eu-base` | npm `hl7.fhir.eu.base@2.0.0-ballot` | 2.0.0-ballot | `27e7b9f11c0c2375` | CC0-1.0 | `package.json` |

## Obligaciones que la carga respeta

- **Atribución** (HPO, Mondo, ChEBI, OAE, FoodOn, Open Food Facts): cada
  concepto lleva `allergy_provenance` (artefacto, versión, URL, SHA-256, fecha,
  licencia, titular, sistema y código de origen) y `source_license`. Una pantalla
  que muestre estos datos tiene que citar la fuente.
- **HPO sin modificar**: se cargan las etiquetas y las traducciones tal cual; una
  traducción cuyo `source_value` ya no coincide con la etiqueta vigente (2 131
  filas) **no se usa**, en vez de presentarse como traducción de otra cosa.
- **ODbL (Open Food Facts)**: es una licencia de base de datos con «compartir
  igual». Si el catálogo de aditivos y alérgenos alimentarios se redistribuye
  como base derivada, esa parte tiene que publicarse bajo ODbL. **Requiere visto
  bueno del propietario** antes de exponerla fuera de la plataforma; dentro de la
  aplicación es uso interno con atribución.
- **SNOMED CT**: los paquetes VSAC y PHIN VADS traen value sets con SNOMED CT
  (p. ej. 21 369 sustancias de «Substance Other Than Clinical Drug» y 6 085 de
  «Allergen» de PHIN VADS). **No se leen.** Bolivia no es miembro de SNOMED
  International. Tampoco se guardan los xrefs `SCTID`/`SNOMEDCT_US_*` ni MedDRA
  de las ontologías.

## Fuentes que no se pudieron usar (huecos documentados)

La política de red de esta sesión sólo deja salir al registro npm, PyPI, el
proxy de Go y GitHub (git y `raw.githubusercontent.com`). Cada host de esta
tabla devolvió **403 al CONNECT del proxy** (verificado host por host el
2026-10-24 con `curl https://<host>/`); el fetch web del lado del servidor
tampoco sirvió (falló la resolución DNS en todos los hosts probados, incluido
`en.wikipedia.org`):

| Fuente | Qué aportaría | Motivo |
|---|---|---|
| WHO/IUIS Allergen Nomenclature (allergen.org) | ~1 000 moléculas alergénicas (Ara h 1, Bet v 1…) por especie | `www.allergen.org`, `allergen.org`: 403 |
| WHO ICD-11 (MMS, en castellano) | categorías 4A8x de alergia e hipersensibilidad, códigos de extensión de sustancias | `icd.who.int`, `id.who.int`, `icdcdn.who.int`: 403. La API exige además registro (token); el archivo de tabulación descargable no se alcanzó |
| openFDA (NDC allergenics, UNII) / FDA GSRS | extractos alergénicos licenciados con UNII | `api.fda.gov`, `gsrs.ncats.nih.gov`, `download.open.fda.gov`: 403 |
| RxNav / RxClass (NLM) | RxNorm vigente, clases MED-RT/EPC/ATC | `rxnav.nlm.nih.gov`: 403. Se usó la expansión RxNorm 05052025 del paquete VSAC y NDF-RT 20180301 |
| NCI Thesaurus (EVS) | jerarquía «Allergen» y sustancias | `evs.nci.nih.gov`, `api-evsrest.nci.nih.gov`: 403; el repo OBO de NCIt no versiona el `.owl` |
| ChEBI completo (EMBL-EBI) | todos los químicos con rol «allergen» | `www.ebi.ac.uk`, `ftp.ebi.ac.uk`, `purl.obolibrary.org`: 403. Se usó el extracto de ChEBI que publica ECTO |
| UniProt (keyword KW-0020 Allergen) | proteínas alergénicas con nombre IUIS | `rest.uniprot.org`: 403 |
| AllergenOnline (FARRP), Allergome, COMPARE | bases de proteínas alergénicas | `www.allergenonline.org`, `www.allergome.org`, `comparedatabase.org`: 403 |
| CDC CVX (tabla oficial) | CVX completo con estado | `www2a.cdc.gov`, `www.cdc.gov`: 403. Se usó CVX vía VSAC y PHIN VADS |
| EUR-Lex (Reglamento UE 1169/2011, anexo II; Reglamento 1129/2011, lista de aditivos) | texto oficial en castellano de los 14 alérgenos y de los números E | `eur-lex.europa.eu`: 403 |
| Codex Alimentarius (CXS 1-1985) | lista Codex de alimentos que causan hipersensibilidad | `www.fao.org`: 403 |
| FDA (FALCPA + FASTER Act, 9 alérgenos mayores) | texto oficial | `www.fda.gov`: 403 |
| Serie basal europea (ESCD), NACDG, T.R.U.E. Test (DailyMed) | series de pruebas de parche | `dailymed.nlm.nih.gov` 403; las series publicadas en revistas no se alcanzan |
| WHO ATC/DDD | clases ATC por nombre | `atcddd.fhi.no`: 403; además, la redistribución comercial exige permiso |
| Wikidata | etiquetas en castellano por RxCUI, UNII, NCBI Taxon, Mondo, HPO | `www.wikidata.org`, `query.wikidata.org`: 403 |
| DeCS (BIREME/OPS) | descriptores en castellano | `decs.bvsalud.org`: 403; además exige solicitar licencia y token |
| SNOMED CT (incluida la edición en castellano y el Global Patient Set) | sustancias, hallazgos, alergias | licencia de país miembro; el GPS tiene licencia propia que habría que revisar |
| AGEMED (Bolivia) | registro sanitario nacional | portal con reCAPTCHA (no se elude; ver `glossary-data-build/medicines-sources/SOURCES.md`) |
| Paquetes FHIR fuera de npm (packages.fhir.org, tx.fhir.org) | IG nacionales de Argentina, España, México, Colombia, Brasil | `packages.fhir.org`, `tx.fhir.org`: 403; esos IG no están publicados en npm |
