// =============================================================================
// Catálogo de alergias · fuentes, licencias y code systems.
//
// Una sola tabla de verdad para tres consumidores: la descarga
// (`fetch-allergy-sources.mjs`), la normalización (`build-allergy-catalog.mjs`)
// y la carga (`load-allergy-catalog.mjs`). Las licencias se copiaron del propio
// artefacto descargado (campo `license` del package.json de npm, cabecera del
// .obo, archivo LICENSE del repositorio); donde el artefacto no la declara, se
// dice y se cita la página del titular.
//
// Las URL canónicas de los code systems son internas (mantracore.health), igual
// que el glosario y el catálogo de medicamentos: la URI real del sistema de
// origen viaja en la procedencia de cada concepto (`source_system`) y nunca se
// usa como `canonical_url` propia, para no chocar con otro importador que cargue
// el mismo sistema completo (p. ej. `rxnorm_full`).
// =============================================================================

import { join } from 'node:path';

import { BUILD_DIR } from '../../lib/glossary-es/common.mjs';

/** Carpeta de descargas, FUERA de git (hermana de los repos). */
export const SOURCES_DIR = process.env.ALLERGY_SOURCES_DIR ?? join(BUILD_DIR, 'allergy-sources');
export const NDJSON_DIR = join(BUILD_DIR, 'ndjson');

/**
 * Artefactos que se descargan. `npm` = tarball del registro npm (los paquetes
 * FHIR oficiales se publican también ahí); `github` = archivo crudo de un
 * repositorio, fijado al commit que se resolvió en la descarga.
 */
export const ARTIFACTS = [
  {
    key: 'fhir-r5-core',
    kind: 'npm',
    spec: 'hl7.fhir.r5.core@5.0.0',
    owner: 'HL7 International (FHIR Project)',
    license: 'CC0-1.0',
    licenseEvidence: 'package.json → "license": "CC0-1.0"',
  },
  {
    key: 'hl7-terminology',
    kind: 'npm',
    spec: 'hl7.terminology.r4@7.0.1',
    owner: 'HL7 International (HL7 Terminology, THO)',
    license: 'CC0-1.0',
    licenseEvidence:
      'package.json → "license": "CC0-1.0"; copyright de cada CodeSystem: «THO is copyright ©1989+ Health Level Seven International and is made available under the CC0 designation»',
  },
  {
    key: 'vsac',
    kind: 'npm',
    spec: 'us.nlm.vsac@0.24.0',
    owner: 'U.S. National Library of Medicine — Value Set Authority Center (paquete FHIR armado por el FHIR Project)',
    license: 'US Govt',
    licenseEvidence:
      'package.json → "license": "US Govt". Contenido: RxNorm (NLM; las cadenas propias de RxNorm, SAB=RXNORM, no tienen restricciones adicionales), NDF-RT (VA, dominio público), CVX (CDC, dominio público). Los códigos SNOMED CT del paquete NO se usan (licencia de país miembro).',
  },
  {
    key: 'phinvads',
    kind: 'npm',
    spec: 'us.cdc.phinvads@0.12.0',
    owner: 'U.S. CDC — PHIN Vocabulary Access and Distribution System',
    license: 'HHS/Open',
    licenseEvidence: 'package.json → "license": "HHS/Open". Sólo se usan los value sets con CVX; los de SNOMED CT no.',
  },
  {
    key: 'hpo',
    kind: 'github',
    repo: 'obophenotype/human-phenotype-ontology',
    ref: 'master',
    path: 'hp.obo',
    owner: 'Human Phenotype Ontology Consortium (The Jackson Laboratory)',
    license: 'HPO license (uso libre con cita y sin modificar el contenido)',
    licenseEvidence: 'cabecera del .obo → «property_value: terms:license https://hpo.jax.org/app/license»',
  },
  {
    key: 'hpo-es',
    kind: 'github',
    repo: 'obophenotype/hpo-translations',
    ref: 'main',
    path: 'babelon/hp-es.babelon.tsv',
    owner: 'Human Phenotype Ontology Consortium — proyecto de traducciones',
    license: 'HPO license (uso libre con cita y sin modificar el contenido)',
    licenseEvidence: 'misma licencia que la HPO; cada fila declara translation_status (sólo se usa OFFICIAL)',
  },
  {
    key: 'doid',
    kind: 'github',
    repo: 'DiseaseOntology/HumanDiseaseOntology',
    ref: 'main',
    path: 'src/ontology/doid.obo',
    owner: 'Disease Ontology (Institute for Genome Sciences, University of Maryland)',
    license: 'CC0-1.0',
    licenseEvidence: 'cabecera del .obo → «property_value: terms:license https://creativecommons.org/publicdomain/zero/1.0/»',
  },
  {
    key: 'mondo',
    kind: 'github',
    repo: 'monarch-initiative/mondo',
    ref: 'master',
    path: 'src/ontology/mondo-edit.obo',
    owner: 'Monarch Initiative — Mondo Disease Ontology',
    license: 'CC-BY-4.0',
    licenseEvidence: 'cabecera del .obo → «http://purl.org/dc/terms/license http://creativecommons.org/licenses/by/4.0/»; LICENSE del repositorio: Attribution 4.0 International',
  },
  {
    key: 'off-allergens',
    kind: 'github',
    repo: 'openfoodfacts/openfoodfacts-server',
    ref: 'main',
    path: 'taxonomies/allergens.txt',
    owner: 'Open Food Facts',
    license: 'ODbL-1.0',
    licenseEvidence:
      'Open Food Facts publica su base bajo Open Database License 1.0 (https://world.openfoodfacts.org/terms-of-use); el LICENSE del repositorio (AGPL-3.0) cubre el código, no los datos. ODbL exige atribución y compartir igual una base derivada: ver SOURCES.md.',
  },
  {
    key: 'off-additives',
    kind: 'github',
    repo: 'openfoodfacts/openfoodfacts-server',
    ref: 'main',
    path: 'taxonomies/additives.txt',
    owner: 'Open Food Facts',
    license: 'ODbL-1.0',
    licenseEvidence: 'ídem off-allergens',
  },
  {
    key: 'ecto',
    kind: 'github',
    repo: 'EnvironmentOntology/environmental-exposure-ontology',
    ref: 'master',
    path: 'ecto.owl',
    owner: 'Environmental Conditions, Treatments and Exposures Ontology (ECTO), con el extracto de ChEBI (EMBL-EBI) que importa',
    license: 'CC0-1.0 (ECTO) · CC-BY-4.0 (contenido de ChEBI)',
    licenseEvidence:
      'ecto.owl → «terms:license https://creativecommons.org/publicdomain/zero/1.0/». Las clases CHEBI:* son de ChEBI, que EMBL-EBI publica bajo CC BY 4.0: se cita a ChEBI en cada concepto.',
  },
  {
    key: 'oae',
    kind: 'github',
    repo: 'OAE-ontology/OAE',
    ref: 'master',
    path: 'oae.owl',
    owner: 'Ontology of Adverse Events (OAE)',
    license: 'CC-BY-4.0',
    licenseEvidence: 'oae.owl → «terms:license http://creativecommons.org/licenses/by/4.0/»',
  },
  {
    key: 'foodon',
    kind: 'github',
    repo: 'FoodOntology/foodon',
    ref: 'master',
    path: 'foodon.owl',
    owner: 'FoodOn — Food Ontology Consortium',
    license: 'CC-BY-4.0',
    licenseEvidence: 'foodon.owl → «dcterms:license https://creativecommons.org/licenses/by/4.0/»',
  },
  {
    key: 'symp',
    kind: 'github',
    repo: 'DiseaseOntology/SymptomOntology',
    ref: 'main',
    path: 'src/ontology/symp.obo',
    owner: 'Symptom Ontology (Disease Ontology project)',
    license: 'CC0-1.0',
    licenseEvidence: 'cabecera del .obo → «property_value: terms:license https://creativecommons.org/publicdomain/zero/1.0/»',
  },
  {
    key: 'fhir-cl-core',
    kind: 'npm',
    spec: 'hl7.fhir.cl.clcore@1.9.4',
    owner: 'HL7 Chile — CL Core',
    license: 'CC0-1.0',
    licenseEvidence: 'package.json → "license": "CC0-1.0"',
  },
  {
    key: 'fhir-eu-base',
    kind: 'npm',
    spec: 'hl7.fhir.eu.base@2.0.0-ballot',
    owner: 'HL7 Europe — EU Base',
    license: 'CC0-1.0',
    licenseEvidence: 'package.json → "license": "CC0-1.0"',
  },
];

/**
 * Code systems que crea la carga. `system` es la URI real del sistema de
 * origen (procedencia); `internalCode` es la clave propia en `terminology`.
 */
export const CODE_SYSTEMS = {
  'allergy-hl7-fhir': {
    sourceCode: 'HL7_FHIR_ALLERGY',
    owner: 'HL7 International',
    officialUrl: 'https://hl7.org/fhir/R5/allergyintolerance.html',
    name: 'HL7 FHIR / HL7 Terminology — enumeraciones de AllergyIntolerance',
  },
  'allergy-rxnorm-ingredients': {
    sourceCode: 'NLM_VSAC_ALLERGY',
    owner: 'U.S. National Library of Medicine (VSAC / RxNorm)',
    officialUrl: 'https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1010.7/expansion',
    name: 'RxNorm — ingredientes (IN/PIN/MIN) del value set C-CDA «Clinical Drug Ingredient»',
  },
  'allergy-ndfrt-drug-classes': {
    sourceCode: 'NLM_VSAC_ALLERGY',
    owner: 'U.S. Department of Veterans Affairs (NDF-RT), vía VSAC',
    officialUrl: 'https://vsac.nlm.nih.gov/valueset/2.16.840.1.113883.3.88.12.80.18/expansion',
    name: 'NDF-RT — clases de medicamentos del value set C-CDA «Medication Drug Class»',
  },
  'allergy-cvx-vaccines': {
    sourceCode: 'CDC_CVX_ALLERGY',
    owner: 'U.S. Centers for Disease Control and Prevention (CVX)',
    officialUrl: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx',
    name: 'CVX — vacunas administradas (CDC)',
  },
  'allergy-hpo': {
    sourceCode: 'HPO_ALLERGY',
    owner: 'Human Phenotype Ontology Consortium',
    officialUrl: 'https://hpo.jax.org/',
    name: 'HPO — fenotipos (manifestaciones) y alergias, con traducción oficial al castellano',
  },
  'allergy-doid': {
    sourceCode: 'DOID_ALLERGY',
    owner: 'Disease Ontology',
    officialUrl: 'https://disease-ontology.org/',
    name: 'Disease Ontology — enfermedades alérgicas (DOID:1205 y descendientes)',
  },
  'allergy-mondo': {
    sourceCode: 'MONDO_ALLERGY',
    owner: 'Monarch Initiative',
    officialUrl: 'https://mondo.monarchinitiative.org/',
    name: 'Mondo — enfermedades alérgicas (MONDO:0005271 y descendientes) sin equivalente en DOID',
  },
  'allergy-off-allergens': {
    sourceCode: 'OFF_ALLERGY',
    owner: 'Open Food Facts',
    officialUrl: 'https://world.openfoodfacts.org/allergens',
    name: 'Open Food Facts — taxonomía de alérgenos alimentarios',
  },
  'allergy-off-additives': {
    sourceCode: 'OFF_ALLERGY',
    owner: 'Open Food Facts',
    officialUrl: 'https://world.openfoodfacts.org/additives',
    name: 'Open Food Facts — taxonomía de aditivos alimentarios (número E)',
  },
  'allergy-chebi': {
    sourceCode: 'CHEBI_ALLERGY',
    owner: 'ChEBI (EMBL-EBI), vía el extracto de ECTO',
    officialUrl: 'https://www.ebi.ac.uk/chebi/',
    name: 'ChEBI — químicos con rol «allergen» (CHEBI:50904) y sus clases de alérgeno',
  },
  'allergy-oae': {
    sourceCode: 'OAE_ALLERGY',
    owner: 'Ontology of Adverse Events',
    officialUrl: 'https://github.com/OAE-ontology/OAE',
    name: 'OAE — eventos adversos alérgicos («allergy AE», OAE:0000568 y descendientes)',
  },
  'allergy-foodon': {
    sourceCode: 'FOODON_ALLERGY',
    owner: 'FoodOn',
    officialUrl: 'https://foodon.org/',
    name: 'FoodOn — rótulos de alérgenos alimentarios («food allergen labelling»)',
  },
};

/** Value sets propios de la carga: el paraguas de sustancias, el de condiciones y el de manifestaciones. */
export const VALUE_SETS = {
  'allergy-substances': {
    name: 'Sustancias causantes de alergia o intolerancia',
    description:
      'Todo lo que puede registrarse como sustancia de una alergia: ingredientes de medicamentos (RxNorm), clases de medicamentos (NDF-RT), vacunas (CVX), alérgenos y aditivos alimentarios (Open Food Facts).',
  },
  'allergy-substances-medication-ingredient': {
    name: 'Alergias · principios activos e ingredientes (RxNorm)',
    description: 'Ingredientes RxNorm (IN, PIN, MIN), incluidos los extractos alergénicos registrados como ingrediente.',
  },
  'allergy-substances-drug-class': {
    name: 'Alergias · clases de medicamentos (NDF-RT)',
    description: 'Clases farmacológicas de NDF-RT que C-CDA usa para registrar alergias por clase.',
  },
  'allergy-substances-vaccine': {
    name: 'Alergias · vacunas (CVX)',
    description: 'Vacunas del catálogo CVX del CDC, activas, inactivas y no comercializadas en EE. UU.',
  },
  'allergy-substances-food-allergen': {
    name: 'Alergias · alérgenos alimentarios (Open Food Facts)',
    description: 'Alérgenos de la taxonomía de Open Food Facts (incluye los 14 del anexo II del Reglamento UE 1169/2011).',
  },
  'allergy-substances-food-additive': {
    name: 'Alergias · aditivos alimentarios (número E)',
    description: 'Aditivos de la taxonomía de Open Food Facts que declaran número E.',
  },
  'allergy-substances-chemical-allergen': {
    name: 'Alergias · químicos alérgenos (ChEBI)',
    description: 'Químicos que ChEBI declara con rol de alérgeno (contacto, ocupacionales, fármacos), más sus clases «metal allergen», «penicillin allergen», etc.',
  },
  'allergy-food-allergen-labelling': {
    name: 'Alergias · rótulos de alérgenos alimentarios (FoodOn)',
    description: 'Categorías de rotulado de alérgenos alimentarios que modela FoodOn (no son sustancias: son el grupo que exige el rótulo).',
  },
  'allergy-adverse-event-types': {
    name: 'Eventos adversos alérgicos (OAE)',
    description: 'Tipos de evento adverso alérgico de la Ontology of Adverse Events, útiles para farmacovigilancia y reacciones a vacunas.',
  },
  'allergy-conditions': {
    name: 'Tipos de alergia (condiciones)',
    description: 'Alergias e hipersensibilidades como condición clínica: HPO «Allergy», Disease Ontology y Mondo.',
  },
  'allergy-manifestations': {
    name: 'Manifestaciones de una reacción',
    description:
      'Fenotipos clínicos de la HPO (subárbol «Phenotypic abnormality»), el equivalente abierto de «clinical finding» que FHIR pide para AllergyIntolerance.reaction.manifestation.',
  },
};

/**
 * Grupos de navegación de los ingredientes RxNorm, por **regla léxica sobre el
 * nombre que publica RxNorm** (no es clasificación clínica). Cada concepto que
 * cae en un grupo lleva la regla en su propiedad `category_rule`.
 */
export const RXNORM_LEXICAL_GROUPS = [
  { key: 'pollen', name: 'Pólenes', pattern: /\bpollen\b/i },
  { key: 'venom', name: 'Venenos de himenópteros y otros', pattern: /\bvenom/i },
  { key: 'house-dust-mite', name: 'Ácaros del polvo', pattern: /\bdust mite\b/i },
  { key: 'animal-epithelia', name: 'Epitelios, pelo, caspa y plumas de animales', pattern: /\b(dander|epitheli\w*|feathers?)\b|\bhair extract\b|\bskin extract\b/i },
  { key: 'allergenic-extract', name: 'Extractos alergénicos (todos)', pattern: /\ballergenic extract\b|\bpollen extract\b|\ballergen\b/i },
];
