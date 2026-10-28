# Fuentes y licencias — nutrición y alimentos (C13)

Descarga: 2026-10-28 (UTC). Los SHA-256, tamaños y fechas exactas están en
[`data/nutrition-foods.manifest.json`](data/nutrition-foods.manifest.json) (los escribe `fetch-sources.mjs`). Las capturas
textuales de las licencias están en `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C13/licencias-2026-10-28.txt`.
Cada concepto cargado lleva en `concept_properties.nutrition_provenance` el artefacto, su URL, versión, SHA-256, fecha de
descarga y el texto de licencia, y en `source_license` la licencia sola.

## Cargadas

| Fuente | Artefacto (URL) | Versión | SHA-256 | Licencia (leída hoy) |
|---|---|---|---|---|
| USDA FoodData Central — Foundation | `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-04-30.zip` | 2026-04-30 | `70457ee9…dc655` | Dominio público / **CC0 1.0** |
| USDA FDC — SR Legacy | `…/FoodData_Central_sr_legacy_food_csv_2018-04.zip` | 2018-04 | `b8081729…fd0` | CC0 1.0 |
| USDA FDC — Survey (FNDDS) | `…/FoodData_Central_survey_food_csv_2024-10-31.zip` | 2024-10-31 | `5ccc25ec…f29c` | CC0 1.0 |
| USDA FDC — Branded | `…/FoodData_Central_branded_food_csv_2026-04-30.zip` (449 MB) | 2026-04-30 | `26050a5d…fc49` | CC0 1.0 |
| FoodOn | `https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl` (= `purl.obolibrary.org/obo/foodon.owl`) | `owl:versionIRI` …/releases/2026-09-20/, commit `cd73540243a84bcd511a500d9a497d12d7dc02f6` | `b897bf64…47edf` | **CC BY 4.0** |
| CDNO — Compositional Dietary Nutrition Ontology | `https://purl.obolibrary.org/obo/cdno.owl` (→ `raw.githubusercontent.com/CompositionalDietaryNutritionOntology/cdno/master/cdno.owl`) | `owl:versionIRI` …/releases/2026-06-10/, commit `a0dec27552ad…` | `16d40da5…c8bb` | **CC BY 3.0** (en el `cdno.owl`; el LICENSE del repo dice CC0 1.0: se registra la más restrictiva) |
| FOBI — Food-Biomarker Ontology | `https://purl.obolibrary.org/obo/fobi.owl` (→ `raw.githubusercontent.com/pcastellanoescuder/FoodBiomarkerOntology/master/fobi.owl`) | sin fecha: commit `04f97ef9b556…` | `d9a4eef5…3505` | **CC BY 4.0** (en el `fobi.owl` y en el LICENSE del repo; OBO Foundry lista CC BY 3.0) |
| ONS — Ontology for Nutritional Studies | `https://raw.githubusercontent.com/enpadasi/Ontology-for-Nutritional-Studies/master/ons.owl` | `owl:versionInfo` 2026-02-06, commit `cc2b3bfa9a76…` | `b63755c7…a859d` | **CC BY 4.0** (LICENSE del repo; el `.owl` no la declara) |
| Ciqual 2025 (ANSES) | `https://zenodo.org/api/records/17550133/files/{alim,alim_grp,const,sources,compo}_2025_11_03.xml/content` | 2025-11-03 (Zenodo 10.5281/zenodo.17550133) | ver manifiesto (MD5 verificado contra Zenodo) | **CC BY 4.0** (metadato `license.id` del registro) |
| Canadian Nutrient File 2026 (Health Canada) | `https://open.canada.ca/data/dataset/1b6139bd-…/resource/019f2a90-…/download/cnf_fcen_all-files-data_2026.zip` | 2026 (publicación mayo de 2026) | `f5faad89…dcdd` | **Open Government Licence – Canada** (`license_id` = `ca-ogl-lgo`) |

Texto de las licencias:

- **FDC** — `https://fdc.nal.usda.gov/api-guide/`, sección *Licensing*: «USDA FoodData Central data are in the public domain
  and they are not copyrighted. They are published under CC0 1.0 Universal (CC0 1.0)». No exige permiso; pide citar:
  *U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov.*
- **FoodOn** — `dcterms:license` = `https://creativecommons.org/licenses/by/4.0/` en el propio `foodon.owl`, y «License CC BY 4.0»
  en OBO Foundry. Se cargan **solo** las clases `FOODON_`. Las clases de NCBITaxon, CHEBI, UBERON, etc. que trae el archivo son
  de otras ontologías con su propia licencia y **no** se cargan (quedan como texto en `external_parents`).
- **CDNO / FOBI / ONS** — solo se cargan las clases con su propio prefijo (`CDNO_`, `FOBI_`, `ONS_`). Las clases de CHEBI,
  FOODON, NCBITaxon, OBI, PATO, GO… que cada archivo repite son de otras ontologías (FoodOn ya está cargada aparte) y no se cargan.
- **Ciqual** — el registro de Zenodo declara `cc-by-4.0`. Exige atribución a ANSES-Ciqual. (`ciqual.anses.fr` respondió 503
  hoy; los datos salen de Zenodo.)
- **CNF** — la OGL-Canada permite copiar, modificar, publicar, traducir, adaptar y distribuir, también con fines comerciales,
  reconociendo la fuente. Los CSV traen el copyright de Health Canada en la guía; la licencia de los datos es la de
  `open.canada.ca`.

## Qué se toma de cada archivo

| Fuente | Se carga | No se carga |
|---|---|---|
| FDC Foundation / SR Legacy / Survey | alimentos (`food.csv` filtrado por `data_type`), `foundation_food`/`sr_legacy_food`/`survey_fndds_food`, valores de nutrientes (`food_nutrient`), porciones (`food_portion`), atributos (`food_attribute`), vocabularios (`nutrient`, `food_category`, `wweia_food_category`, `measure_unit`, `food_attribute_type`, `fndds_derivation`, `food_nutrient_source`, `food_nutrient_derivation`) | muestras de laboratorio (`sample_food`, `sub_sample_food`, `market_acquisition`, `agricultural_acquisition`) y sus tablas (`lab_method*`, `acquisition_samples`, `food_component`…), `input_food`, `food_update_log_entry`, factores de conversión, `retention_factor` |
| FDC Branded | `fdc_id`, descripción, marca (`brand_owner`, `brand_name`, `subbrand_name`), `gtin_upc`, categoría, `data_source`, `market_country`, fechas | `ingredients` (texto libre de etiqueta), `serving_size`, `household_serving_fulltext`, `food_nutrient` (1,5 GB), `food_attribute`, `microbe`: no son terminología y llevarían el corpus a >1 GB |
| FoodOn, CDNO, FOBI, ONS | clases con el prefijo propio (`FOODON_`, `CDNO_`, `FOBI_`, `ONS_`) con etiqueta, definición, sinónimos (exact/narrow/broad/related), xrefs, superclases `FOODON_`, restricciones simples (`someValuesFrom`), estado obsoleta, `replaced_by`, comentarios | axiomas `equivalentClass` (solo se marca `has_equivalent_class_axiom`), clases de otras ontologías, propiedades de objeto y de anotación |
| Ciqual | alimentos (nombre EN/FR, nombre científico, grupos, factor de Jones), grupos de 3 niveles, constituyentes (código INFOODS), fuentes bibliográficas, composición por alimento (`teneur`, `min`, `max`, `code_confiance`, `source_code` como texto de la fuente) | — |
| CNF | alimentos (nombre EN/FR, alternativos, comentarios, nombre científico, código USDA NDB), grupos, fuentes, nutrientes, valores por alimento, medidas caseras y conversiones | — |

## Cruces (solo por código exacto)

- Alimento FDC → categoría (`food_category_id` → `food_category.id`; en Survey `food_category_id` = número WWEIA): relación is-a.
- Alimento Branded → categoría (`branded_food_category`): relación is-a; el código de la categoría ES el texto, porque la
  fuente no publica un código aparte.
- Alimento Ciqual → grupo más profundo que informa la fila; subgrupo → grupo (relaciones is-a que publica la tabla).
- Alimento CNF → grupo CNF (`CNF_Food_Group_Code`).
- Clase FoodOn → superclases `FOODON_` (`rdfs:subClassOf` directo).
- CNF `USDA_NDB_Code` ↔ FDC `NDB_number` (Foundation y SR Legacy): se guarda como propiedad `fdc_ndb_exact_matches` del alimento CNF
  **solo** si las dos cadenas son idénticas; no es un `concept_map` porque CNF dice que su alimento está *basado* en el de USDA,
  no que sea el mismo.
- Nada se cruza por parecido de nombre.

## Condiciones y decisiones del propietario

- **Atribución exigida** (CC BY 4.0: FoodOn, Ciqual; OGL-Canada: Health Canada): cualquier pantalla o API que muestre estos
  términos al usuario debe nombrar la fuente. FDC pide cita (CC0 no la exige).
- **Open Food Facts (ODbL)**: sigue siendo decisión del propietario. Por el precedente de la tanda 1 ya hay filas OFF en
  `allergies/`; **esta carga no agrega más** (ni siquiera `OFF` como code system nuevo).
- **LanguaL**: `langual.org` responde 455 al sondeo de hoy y no se leyó su licencia. No se cargó. FoodOn trae 52 xrefs a LanguaL en 51 clases
  (se guardan como texto en `xrefs`, sin cargar contenido de LanguaL).

## No cargadas (sondeo 2026-10-28; detalle en `evidencia/C13/m1-sondeo-2026-10-28.txt`)

| Fuente | Estado hoy | Motivo |
|---|---|---|
| LanguaL (`langual.org`) | HTTP 455 | no se pudo leer ni descargar; licencia sin verificar |
| Open Food Facts | 200 | ODbL: decisión del propietario (ver arriba) |
| UK CoFID / McCance & Widdowson (OGL v3) | 200 (xlsx en `assets.publishing.service.gov.uk`) | alcanzable; **no cargada en esta pasada** (falta lector de su xlsx y leer la OGL del titular) |
| Australian Food Composition Database (FSANZ) | 200 | alcanzable; licencia sin leer; no cargada |
| FAO/INFOODS (tablas, tagnames) | 200 | licencia sin verificar; no cargada |
| EFSA FoodEx2 | 200 | catálogo oficial no localizado como descarga abierta con licencia leída; el mapeo FoodOn↔FoodEx2 de Zenodo es GPL-3.0-or-later (no se mezcla); no cargada |
| ONE — Ontology for Nutritional Epidemiology (88 clases) | 200 | el `.owl` no declara licencia y el repo no tiene LICENSE (solo el registro OBO Foundry dice CC BY 4.0): no cargada |
| FIDEO — Food Interactions with Drugs Evidence Ontology (CC0 en el registro OBO) | sin respuesta (`gitub.u-bordeaux.fr`, el proxy cortó el túnel) | no alcanzable hoy |
| Fineli (Finlandia) | 403 | bloqueada |
| Frida (DTU, Dinamarca) | sin respuesta | no alcanzable |
| `ciqual.anses.fr` | 503 | los datos se bajaron de Zenodo (CC BY 4.0) |
| API de FDC (`api.nal.usda.gov`) | 429 con `DEMO_KEY` | innecesaria: los CSV completos son públicos |
