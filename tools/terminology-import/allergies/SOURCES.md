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

## Fuentes que no se pudieron usar el 2026-10-24 (tanda 1; histórico: ver la tanda 2 más abajo para lo que hoy responde)

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

---

# Tanda 2 (descarga 2026-10-28): las fuentes que el 2026-10-24 daban 403

Re-sondeo del 2026-10-28 (`docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C4/m1-sondeo-2026-10-28.txt`):
responden 200 (o 30x hacia 200) allergen.org, rest.uniprot.org, api.fda.gov, gsrs.ncats.nih.gov, rxnav.nlm.nih.gov,
ftp.ebi.ac.uk, api-evsrest.nci.nih.gov, www2a.cdc.gov (cvx.txt), dailymed, nlmpubs.nlm.nih.gov. Siguen sin servir:
`query.wikidata.org/sparql` en `GET /` (000; las consultas de la descarga sí respondieron: 168 lotes),
`rxnav…/rxclass/version.json` (404; RxClass sí responde por sus rutas de clases), `id.who.int` (404),
`codexalimentarius.org` (000).

Se bajan con `fetch-allergy-open-sources.mjs` y `fetch-allergy-wikidata.mjs`, **fuera de git**. El manifiesto
(`data/allergy-open-sources.manifest.json`) trae URL, versión, fecha, SHA-256, bytes y licencia con su evidencia
de cada archivo. Resumen:

| Clave | Fuente | Versión | Licencia | Evidencia / condición |
|---|---|---|---|---|
| `iuis` | WHO/IUIS Allergen Nomenclature (allergen.org, CSV oficiales) | descarga 2026-10-28 (sin número de versión; cada fila trae fechas) | descarga libre con cita | `downloads.php`: «free to download ... acknowledge ... citing the URL ... and one of the recent official publications». `robots.txt`: crawl-delay 3, respetado |
| `uniprot` | UniProtKB, palabra clave KW-0020 | 2026_03 | CC BY 4.0 | uniprot.org/help/license |
| `cdc-cvx` | CDC `cvx.txt` y `tradename.txt` | `Last Updated` por fila | dominio público (17 U.S.C. §105) | agencia federal |
| `chebi-lite` | ChEBI `chebi_lite.obo.gz` | 256 (2026-10-06) | CC BY 4.0 | `LICENSE` y cabecera del OBO. **Ambigüedad**: el README del mismo directorio dice CC BY-SA 4.0 → decisión del propietario |
| `ncit` | NCI Thesaurus (EVS REST), Allergen C62651 e Hypersensitivity C3114 | 26.09d (2026-09-28) | CC BY 4.0 según OBO Foundry | EVS no publica el texto de la licencia en lo alcanzable → **confirmar con el propietario** |
| `eurlex-1169`, `eurlex-1333` | Reglamentos (UE) 1169/2011 (anexo II) y (CE) 1333/2008 (anexo II B), texto consolidado de Cellar, es + en | 02011R1169-20250401, 02008R1333-20260818 | reutilización con cita (Decisión 2011/833/UE) | el consolidado es informativo; el auténtico es el del Diario Oficial |
| `usc-21-321` | 21 U.S.C. §321(qq), edición 2023 de GovInfo | 2023 (GovInfo no publica 2024/2025 aún) | dominio público | ley federal |
| `openfda`, `dailymed`, `dailymed-true-test`, `gsrs` | openFDA NDC (`*ALLERGENIC`), etiquetas SPL de DailyMed (sólo UNII y nombre del ingrediente), GSRS | openFDA 2026-10-27; GSRS 2026-10-28 | CC0 (openFDA); dominio público (DailyMed, GSRS) | `open.fda.gov/license`; el texto de la etiqueta es del titular y no se toma |
| `rxnav` | RxNorm IN/PIN/MIN y RxClass (MED-RT, EPC, VA) | RxNorm 05-Oct-2026 (RxNav 3.1.356) | RxNorm SAB=RXNORM sin restricción adicional; MED-RT dominio público | **No se toman** clases con fuente SNOMED CT (DISPOS, STRUCT) ni ATC |
| `europepmc-ebs` | Serie basal europea: PMC13238334 y PMC13441338 | texto completo | CC BY (Europe PMC `license=cc by`) | sólo los alérgenos de las tablas de la serie |
| `mesh` | MeSH 2026 `desc2026.xml`, subárboles D23.050.063 y C20.543 | 2026 | uso libre con cita «Courtesy of the U.S. National Library of Medicine» | sólo inglés; DeCS no se toca |
| `wikidata` | Wikidata Query Service, por identificador exacto (RxCUI P3345, UNII P652, ChEBI P683, DOID P699, Mondo P5270, UniProt P352, MeSH P486, NCIt P1748) | consulta 2026-10-28 | CC0 | etiqueta `es` de la entidad que declara el mismo identificador; nada por parecido de nombre. No se versiona la base viva: sólo lo consultado queda en el manifiesto (168 lotes) |

## Fuentes que responden pero NO se cargan

| Fuente | Motivo (sondeo 2026-10-28, `m1b-licencias-no-cargadas-2026-10-28.txt`) |
|---|---|
| AllergenOnline (FARRP, Univ. de Nebraska-Lincoln) | © UNL, sin licencia abierta declarada |
| Allergome | exige registro y permiso; no se crean cuentas |
| COMPARE (HESI) | «All Rights Reserved» |
| WHO ICD-11 | `icd.who.int` responde, pero la API exige cuenta/token y la licencia es CC BY-ND; no se crean cuentas |
| Codex Alimentarius (FAO) | `codexalimentarius.org` sin respuesta (000) |
| SNOMED CT, MedDRA, DeCS, ATC/DDD de la OMS, DrugBank, KEGG | licencia; no se leen |
