// =============================================================================
// Nutrición y alimentos · identidad y definiciones compartidas por el build y la carga.
// Ids deterministas, fuentes (`terminology_sources`), licencias y code systems. Sin red, sin base.
// =============================================================================

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';

export { md5uuid };

/** Conceptos internos que siembra la API (`src/common/constants/concepts.ts`); la carga exige que existan. */
export const INTERNAL = {
  STATE: {
    active: deterministicId('terminology:state:active'),
    retired: deterministicId('terminology:state:retired'),
  },
  LANG: { es: deterministicId('terminology:language:es'), en: deterministicId('terminology:language:en') },
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
};

// --- ids -------------------------------------------------------------------------------------
export const sourceRowId = (code) => md5uuid(`mantra:nutrition-foods:source:${code}`);
export const codeSystemRowId = (internalCode) => md5uuid(`mantra:nutrition-foods:cs:${internalCode}`);
export const codeSystemVersionRowId = (internalCode, version) => md5uuid(`mantra:nutrition-foods:csv:${internalCode}:${version}`);
export const conceptRowId = (internalCode, version, code) => md5uuid(`mantra:nutrition-foods:concept:${internalCode}:${version}:${code}`);

// --- fuentes (terminology_sources.code) ----------------------------------------------------------
export const LICENSES = {
  FDC:
    'Dominio público / CC0 1.0 Universal. Texto de https://fdc.nal.usda.gov/api-guide/ (sección Licensing): «USDA FoodData Central data are in the public domain and they are not copyrighted. They are published under CC0 1.0 Universal (CC0 1.0)». Pide citar la fuente: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov.',
  FOODON:
    'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Declarada en el propio foodon.owl (dcterms:license) y en OBO Foundry (https://obofoundry.org/ontology/foodon.html). Exige atribución a FoodOn (https://foodon.org/).',
  CDNO:
    'CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). Declarada en el propio cdno.owl (dcterms:license) y en OBO Foundry. Ojo: el LICENSE del repositorio (CompositionalDietaryNutritionOntology/cdno) dice CC0 1.0; se registra la más restrictiva (CC BY 3.0, atribución). Exige atribución a CDNO.',
  FOBI:
    'CC BY 4.0 (http://creativecommons.org/licenses/by/4.0/). Declarada en el propio fobi.owl (terms:license) y en el LICENSE del repositorio (pcastellanoescuder/FoodBiomarkerOntology: «Attribution 4.0 International (CC BY 4.0)»). OBO Foundry lista CC BY 3.0; prevalece lo que declara el archivo. Exige atribución a FOBI.',
  ONS:
    'CC BY 4.0. LICENSE del repositorio enpadasi/Ontology-for-Nutritional-Studies («Attribution 4.0 International»); el ons.owl no trae dcterms:license y OBO Foundry también lista CC BY 4.0. Exige atribución a ONS (proyecto ENPADASI).',
  CIQUAL:
    'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Metadato license.id = cc-by-4.0 del registro Zenodo 10.5281/zenodo.17550133 «Ciqual French food composition table 2025» (ANSES, Ciqual). Exige atribución a ANSES-Ciqual.',
  CNF:
    'Open Government Licence – Canada (https://open.canada.ca/en/open-government-licence-canada): licencia mundial, libre de regalías, perpetua y no exclusiva, incluso para fines comerciales; permite copiar, modificar, publicar, traducir, adaptar y distribuir; exige reconocer la fuente (Health Canada) y, si es posible, enlazar la licencia. Metadato license_id = ca-ogl-lgo del conjunto de datos «Canadian Nutrient File, 2026» en open.canada.ca.',
};

/**
 * Identificador corto de cada licencia: es lo que viaja en cada concepto (`source_license` y `nutrition_provenance.license`);
 * el texto completo que se leyó está en `LICENSES`, en `terminology_sources.license`, en el manifiesto y en SOURCES.md.
 */
export const LICENSE_IDS = {
  FDC: 'CC0-1.0',
  FOODON: 'CC-BY-4.0',
  CDNO: 'CC-BY-3.0',
  FOBI: 'CC-BY-4.0',
  ONS: 'CC-BY-4.0',
  CIQUAL: 'CC-BY-4.0',
  CNF: 'OGL-Canada',
};

/** Una entrada por `terminology_sources.code` que crea esta carga. */
export const SOURCE_DEFS = {
  NUTRITION_USDA_FDC: {
    name: 'USDA FoodData Central (Foundation, SR Legacy, FNDDS Survey, Branded) — alimentos, nutrientes y vocabularios de apoyo',
    owner: 'U.S. Department of Agriculture, Agricultural Research Service',
    officialUrl: 'https://fdc.nal.usda.gov/',
    license: 'CC0 1.0 / dominio público (https://fdc.nal.usda.gov/api-guide/)',
  },
  NUTRITION_FOODON: {
    name: 'FoodOn — ontología de alimentos (clases FOODON_)',
    owner: 'FoodOn consortium (Damion Dooley et al.)',
    officialUrl: 'https://foodon.org/',
    license: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)',
  },
  NUTRITION_CDNO: {
    name: 'CDNO — Compositional Dietary Nutrition Ontology (clases CDNO_)',
    owner: 'CDNO consortium (Compositional Dietary Nutrition Ontology)',
    officialUrl: 'https://github.com/CompositionalDietaryNutritionOntology/cdno',
    license: 'CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)',
  },
  NUTRITION_FOBI: {
    name: 'FOBI — Food-Biomarker Ontology (clases FOBI_)',
    owner: 'FOBI project (Pol Castellano-Escuder et al.)',
    officialUrl: 'https://github.com/pcastellanoescuder/FoodBiomarkerOntology',
    license: 'CC BY 4.0 (http://creativecommons.org/licenses/by/4.0/)',
  },
  NUTRITION_ONS: {
    name: 'ONS — Ontology for Nutritional Studies (clases ONS_)',
    owner: 'ENPADASI WP4',
    officialUrl: 'https://github.com/enpadasi/Ontology-for-Nutritional-Studies',
    license: 'CC BY 4.0 (LICENSE del repositorio)',
  },
  NUTRITION_CIQUAL: {
    name: 'Ciqual — tabla francesa de composición de alimentos 2025',
    owner: 'ANSES (Agence nationale de sécurité sanitaire de l’alimentation, de l’environnement et du travail) — Ciqual',
    officialUrl: 'https://ciqual.anses.fr/',
    license: 'CC BY 4.0 (registro Zenodo 10.5281/zenodo.17550133)',
  },
  NUTRITION_CNF: {
    name: 'Canadian Nutrient File (CNF) 2026',
    owner: 'Health Canada / Santé Canada',
    officialUrl: 'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-about-us.html',
    license: 'Open Government Licence – Canada (https://open.canada.ca/en/open-government-licence-canada)',
  },
};
