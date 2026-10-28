// =============================================================================
// Nutrición y alimentos · artefactos fuente y code systems que se derivan de ellos.
// Cada artefacto lleva su URL, versión y licencia; el SHA-256, el tamaño y la fecha de descarga los registra
// `fetch-sources.mjs` en `data/nutrition-foods.manifest.json` (no se escriben a mano).
// =============================================================================

import { LICENSES, LICENSE_IDS } from './model.mjs';

const FDC_BASE = 'https://fdc.nal.usda.gov/fdc-datasets/';
const ZENODO_CIQUAL = 'https://zenodo.org/api/records/17550133/files/';

/** key → artefacto. `dir` es la subcarpeta de SOURCES_DIR donde queda el archivo tal cual se bajó. */
export const ARTIFACTS = {
  'fdc-foundation': {
    url: `${FDC_BASE}FoodData_Central_foundation_food_csv_2026-04-30.zip`,
    file: 'FoodData_Central_foundation_food_csv_2026-04-30.zip',
    dir: 'fdc',
    version: '2026-04-30',
    license: LICENSES.FDC,
    licenseId: LICENSE_IDS.FDC,
    sourceCode: 'NUTRITION_USDA_FDC',
    title: 'FoodData Central — Foundation Foods (CSV)',
  },
  'fdc-sr-legacy': {
    url: `${FDC_BASE}FoodData_Central_sr_legacy_food_csv_2018-04.zip`,
    file: 'FoodData_Central_sr_legacy_food_csv_2018-04.zip',
    dir: 'fdc',
    version: '2018-04',
    license: LICENSES.FDC,
    licenseId: LICENSE_IDS.FDC,
    sourceCode: 'NUTRITION_USDA_FDC',
    title: 'FoodData Central — SR Legacy (CSV)',
  },
  'fdc-survey': {
    url: `${FDC_BASE}FoodData_Central_survey_food_csv_2024-10-31.zip`,
    file: 'FoodData_Central_survey_food_csv_2024-10-31.zip',
    dir: 'fdc',
    version: '2024-10-31',
    license: LICENSES.FDC,
    licenseId: LICENSE_IDS.FDC,
    sourceCode: 'NUTRITION_USDA_FDC',
    title: 'FoodData Central — Survey Foods (FNDDS, CSV)',
  },
  'fdc-branded': {
    url: `${FDC_BASE}FoodData_Central_branded_food_csv_2026-04-30.zip`,
    file: 'FoodData_Central_branded_food_csv_2026-04-30.zip',
    dir: 'fdc',
    version: '2026-04-30',
    license: LICENSES.FDC,
    licenseId: LICENSE_IDS.FDC,
    sourceCode: 'NUTRITION_USDA_FDC',
    title: 'FoodData Central — Branded Foods (CSV)',
    heavy: true,
  },
  foodon: {
    url: 'https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl',
    file: 'foodon.owl',
    dir: 'foodon',
    version: '2026-09-20',
    commit: 'cd73540243a84bcd511a500d9a497d12d7dc02f6',
    license: LICENSES.FOODON,
    licenseId: LICENSE_IDS.FOODON,
    sourceCode: 'NUTRITION_FOODON',
    title: 'FoodOn (foodon.owl, rama master; owl:versionIRI …/releases/2026-09-20/foodon.owl)',
  },
  cdno: {
    url: 'https://purl.obolibrary.org/obo/cdno.owl',
    file: 'cdno.owl',
    dir: 'obo',
    version: '2026-06-10',
    commit: 'a0dec27552ad3920b7b6c16ee82b1936dcf9b368',
    license: LICENSES.CDNO,
    licenseId: LICENSE_IDS.CDNO,
    sourceCode: 'NUTRITION_CDNO',
    title: 'CDNO (cdno.owl, rama master; owl:versionIRI …/releases/2026-06-10/cdno.owl)',
  },
  fobi: {
    url: 'https://purl.obolibrary.org/obo/fobi.owl',
    file: 'fobi.owl',
    dir: 'obo',
    version: 'master@04f97ef9b556',
    commit: '04f97ef9b556b2d6fc797a421ee10921d4f95481',
    license: LICENSES.FOBI,
    licenseId: LICENSE_IDS.FOBI,
    sourceCode: 'NUTRITION_FOBI',
    title: 'FOBI (fobi.owl, rama master; sin fecha de versión: se identifica por el commit)',
  },
  ons: {
    url: 'https://raw.githubusercontent.com/enpadasi/Ontology-for-Nutritional-Studies/master/ons.owl',
    file: 'ons.owl',
    dir: 'obo',
    version: '2026-02-06',
    commit: 'cc2b3bfa9a76d99d5fcd8f77aa46317ba90d62e0',
    license: LICENSES.ONS,
    licenseId: LICENSE_IDS.ONS,
    sourceCode: 'NUTRITION_ONS',
    title: 'ONS (ons.owl, rama master; owl:versionInfo 2026-02-06)',
  },
  'ciqual-alim': {
    url: `${ZENODO_CIQUAL}alim_2025_11_03.xml/content`,
    file: 'alim_2025_11_03.xml',
    md5: '8e1171d63cee4b6010cfce25dd29243d', // publicado por Zenodo en el registro 17550133
    dir: 'ciqual',
    version: '2025-11-03',
    license: LICENSES.CIQUAL,
    licenseId: LICENSE_IDS.CIQUAL,
    sourceCode: 'NUTRITION_CIQUAL',
    title: 'Ciqual 2025 — alim (alimentos)',
  },
  'ciqual-alim-grp': {
    url: `${ZENODO_CIQUAL}alim_grp_2025_11_03.xml/content`,
    file: 'alim_grp_2025_11_03.xml',
    md5: 'c31aeea90349c3aab86f98ef5f4f10da', // publicado por Zenodo en el registro 17550133
    dir: 'ciqual',
    version: '2025-11-03',
    license: LICENSES.CIQUAL,
    licenseId: LICENSE_IDS.CIQUAL,
    sourceCode: 'NUTRITION_CIQUAL',
    title: 'Ciqual 2025 — alim_grp (grupos de alimentos)',
  },
  'ciqual-const': {
    url: `${ZENODO_CIQUAL}const_2025_11_03.xml/content`,
    file: 'const_2025_11_03.xml',
    md5: 'd8f2f25fdacb887bc993a6eeaf80f203', // publicado por Zenodo en el registro 17550133
    dir: 'ciqual',
    version: '2025-11-03',
    license: LICENSES.CIQUAL,
    licenseId: LICENSE_IDS.CIQUAL,
    sourceCode: 'NUTRITION_CIQUAL',
    title: 'Ciqual 2025 — const (constituyentes)',
  },
  'ciqual-sources': {
    url: `${ZENODO_CIQUAL}sources_2025_11_03.xml/content`,
    file: 'sources_2025_11_03.xml',
    md5: '5469598d6b4811672b65e1644dfc6485', // publicado por Zenodo en el registro 17550133
    dir: 'ciqual',
    version: '2025-11-03',
    license: LICENSES.CIQUAL,
    licenseId: LICENSE_IDS.CIQUAL,
    sourceCode: 'NUTRITION_CIQUAL',
    title: 'Ciqual 2025 — sources (referencias bibliográficas)',
  },
  'ciqual-compo': {
    url: `${ZENODO_CIQUAL}compo_2025_11_03.xml/content`,
    file: 'compo_2025_11_03.xml',
    md5: '2da725585946434df320d8041631998b', // publicado por Zenodo en el registro 17550133
    dir: 'ciqual',
    version: '2025-11-03',
    license: LICENSES.CIQUAL,
    licenseId: LICENSE_IDS.CIQUAL,
    sourceCode: 'NUTRITION_CIQUAL',
    title: 'Ciqual 2025 — compo (composición por alimento y constituyente)',
  },
  cnf: {
    url: 'https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/019f2a90-e3a9-489d-b6e1-f74f4ba1d006/download/cnf_fcen_all-files-data_2026.zip',
    file: 'cnf_fcen_all-files-data_2026.zip',
    dir: 'cnf',
    version: '2026',
    license: LICENSES.CNF,
    licenseId: LICENSE_IDS.CNF,
    sourceCode: 'NUTRITION_CNF',
    title: 'Canadian Nutrient File 2026 (all files, CSV)',
  },
};

export const canonicalUrlOf = (internalCode) => `https://mantracore.health/fhir/CodeSystem/${internalCode}`;

/**
 * Code systems que produce el build. `artifacts` = de qué archivos salen (para la versión y la procedencia).
 * `hierarchy: 'is-a'` si los registros declaran `parents` (la jerarquía es la que publica la fuente).
 */
export const CODE_SYSTEMS = {
  'usda-fdc-foundation': { name: 'USDA FDC — Foundation Foods', sourceCode: 'NUTRITION_USDA_FDC', version: '2026-04-30', artifacts: ['fdc-foundation'], hierarchy: 'is-a' },
  'usda-fdc-sr-legacy': { name: 'USDA FDC — SR Legacy', sourceCode: 'NUTRITION_USDA_FDC', version: '2018-04', artifacts: ['fdc-sr-legacy'], hierarchy: 'is-a' },
  'usda-fdc-survey': { name: 'USDA FDC — Survey Foods (FNDDS)', sourceCode: 'NUTRITION_USDA_FDC', version: '2024-10-31', artifacts: ['fdc-survey'], hierarchy: 'is-a' },
  'usda-fdc-branded': { name: 'USDA FDC — Branded Foods', sourceCode: 'NUTRITION_USDA_FDC', version: '2026-04-30', artifacts: ['fdc-branded'], hierarchy: 'is-a', heavy: true },
  'usda-fdc-nutrient': { name: 'USDA FDC — Nutrientes', sourceCode: 'NUTRITION_USDA_FDC', version: '2026-04-30', artifacts: ['fdc-foundation', 'fdc-sr-legacy', 'fdc-survey', 'fdc-branded'], hierarchy: null },
  'usda-fdc-food-category': { name: 'USDA FDC — Categorías de alimento (Foundation / SR Legacy)', sourceCode: 'NUTRITION_USDA_FDC', version: '2026-04-30', artifacts: ['fdc-foundation', 'fdc-sr-legacy'], hierarchy: null },
  'usda-fdc-wweia-category': { name: 'USDA FDC — Categorías WWEIA (Survey)', sourceCode: 'NUTRITION_USDA_FDC', version: '2024-10-31', artifacts: ['fdc-survey'], hierarchy: null },
  'usda-fdc-branded-category': { name: 'USDA FDC — Categorías de alimento de marca (Branded)', sourceCode: 'NUTRITION_USDA_FDC', version: '2026-04-30', artifacts: ['fdc-branded'], hierarchy: null, heavy: true },
  'usda-fdc-measure-unit': { name: 'USDA FDC — Unidades de medida', sourceCode: 'NUTRITION_USDA_FDC', version: '2026-04-30', artifacts: ['fdc-foundation', 'fdc-sr-legacy', 'fdc-survey', 'fdc-branded'], hierarchy: null },
  'usda-fdc-attribute-type': { name: 'USDA FDC — Tipos de atributo de alimento', sourceCode: 'NUTRITION_USDA_FDC', version: '2026-04-30', artifacts: ['fdc-foundation', 'fdc-sr-legacy', 'fdc-survey', 'fdc-branded'], hierarchy: null },
  'usda-fdc-fndds-derivation': { name: 'USDA FDC — Derivación de valores FNDDS', sourceCode: 'NUTRITION_USDA_FDC', version: '2024-10-31', artifacts: ['fdc-survey'], hierarchy: null },
  'usda-fdc-nutrient-derivation': { name: 'USDA FDC — Derivación de nutrientes (SR Legacy)', sourceCode: 'NUTRITION_USDA_FDC', version: '2018-04', artifacts: ['fdc-sr-legacy'], hierarchy: null },
  'usda-fdc-nutrient-source': { name: 'USDA FDC — Fuente de los valores de nutrientes (SR Legacy)', sourceCode: 'NUTRITION_USDA_FDC', version: '2018-04', artifacts: ['fdc-sr-legacy'], hierarchy: null },
  foodon: { name: 'FoodOn — ontología de alimentos', sourceCode: 'NUTRITION_FOODON', version: '2026-09-20', artifacts: ['foodon'], hierarchy: 'is-a' },
  cdno: { name: 'CDNO — Compositional Dietary Nutrition Ontology', sourceCode: 'NUTRITION_CDNO', version: '2026-06-10', artifacts: ['cdno'], hierarchy: 'is-a' },
  fobi: { name: 'FOBI — Food-Biomarker Ontology', sourceCode: 'NUTRITION_FOBI', version: 'master@04f97ef9b556', artifacts: ['fobi'], hierarchy: 'is-a' },
  ons: { name: 'ONS — Ontology for Nutritional Studies', sourceCode: 'NUTRITION_ONS', version: '2026-02-06', artifacts: ['ons'], hierarchy: 'is-a' },
  'ciqual-food': { name: 'Ciqual 2025 — Alimentos', sourceCode: 'NUTRITION_CIQUAL', version: '2025-11-03', artifacts: ['ciqual-alim', 'ciqual-compo'], hierarchy: 'is-a' },
  'ciqual-food-group': { name: 'Ciqual 2025 — Grupos de alimentos', sourceCode: 'NUTRITION_CIQUAL', version: '2025-11-03', artifacts: ['ciqual-alim-grp'], hierarchy: 'is-a' },
  'ciqual-source': { name: 'Ciqual 2025 — Fuentes bibliográficas', sourceCode: 'NUTRITION_CIQUAL', version: '2025-11-03', artifacts: ['ciqual-sources'], hierarchy: null },
  'ciqual-constituent': { name: 'Ciqual 2025 — Constituyentes', sourceCode: 'NUTRITION_CIQUAL', version: '2025-11-03', artifacts: ['ciqual-const'], hierarchy: null },
  'cnf-food': { name: 'Canadian Nutrient File 2026 — Alimentos', sourceCode: 'NUTRITION_CNF', version: '2026', artifacts: ['cnf'], hierarchy: 'is-a' },
  'cnf-food-group': { name: 'Canadian Nutrient File 2026 — Grupos de alimentos', sourceCode: 'NUTRITION_CNF', version: '2026', artifacts: ['cnf'], hierarchy: null },
  'cnf-nutrient': { name: 'Canadian Nutrient File 2026 — Nutrientes', sourceCode: 'NUTRITION_CNF', version: '2026', artifacts: ['cnf'], hierarchy: null },
  'cnf-food-source': { name: 'Canadian Nutrient File 2026 — Fuente del alimento', sourceCode: 'NUTRITION_CNF', version: '2026', artifacts: ['cnf'], hierarchy: null },
  'cnf-nutrient-source': { name: 'Canadian Nutrient File 2026 — Fuente del valor de nutriente', sourceCode: 'NUTRITION_CNF', version: '2026', artifacts: ['cnf'], hierarchy: null },
  'cnf-measure': { name: 'Canadian Nutrient File 2026 — Medidas caseras', sourceCode: 'NUTRITION_CNF', version: '2026', artifacts: ['cnf'], hierarchy: null },
  'cnf-measure-type': { name: 'Canadian Nutrient File 2026 — Tipos de medida', sourceCode: 'NUTRITION_CNF', version: '2026', artifacts: ['cnf'], hierarchy: null },
};
