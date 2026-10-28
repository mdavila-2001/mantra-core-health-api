// =============================================================================
// Catálogo de alergias · segunda tanda (2026-10-27): fuentes abiertas que el
// 2026-10-24 devolvían 403 y hoy responden, más las que no estaban listadas.
//
// Una sola tabla de verdad para tres consumidores: `fetch-allergy-open-sources.mjs`
// (descarga), `build-allergy-open.mjs` (normalización) y la carga (code systems
// y value sets de esta tanda). Cada licencia sale de lo que la propia fuente
// publica el día de la descarga; donde la fuente no la declara en una página
// alcanzable se dice y se cita la mejor evidencia pública que hay.
// =============================================================================

import { join } from 'node:path';

import { SOURCES_DIR } from './sources.mjs';

/** Carpeta de las descargas HTTP de esta tanda (fuera de git). */
export const OPEN_DIR = join(SOURCES_DIR, 'open');
export const OPEN_MANIFEST = join(SOURCES_DIR, 'manifest-open.json');

/** Identificación ante los servidores (política de cada API: User-Agent con contacto). */
export const OPEN_USER_AGENT = 'mantra-core-health-terminology-import/1.0 (contacto: equipo de terminologia de Mantra Core Health)';

export const OPEN_SOURCES = {
  iuis: {
    owner: 'WHO/IUIS Allergen Nomenclature Sub-Committee',
    license: 'Descarga libre con cita (allergen.org/downloads.php)',
    licenseEvidence:
      'allergen.org/downloads.php: «The contents of the WHO/IUIS Allergen Nomenclature Database is free to download. Please acknowledge the use of the database in your publications and presentation by citing the URL of the database website (https://www.allergen.org) and one of the recent official publications of the WHO/IUIS Allergen Nomenclature Sub-Committee». robots.txt: Crawl-delay 3 (se respeta).',
  },
  uniprot: {
    owner: 'UniProt Consortium (EMBL-EBI, SIB, PIR)',
    license: 'CC-BY-4.0',
    licenseEvidence: 'UniProt publica su contenido bajo Creative Commons Attribution 4.0 (https://www.uniprot.org/help/license).',
  },
  'cdc-cvx': {
    owner: 'U.S. Centers for Disease Control and Prevention — IIS code sets',
    license: 'Dominio público (obra del gobierno de EE. UU.)',
    licenseEvidence: 'Código CVX publicado por el CDC (www2a.cdc.gov/vaccines/iis/iisstandards). Contenido de una agencia federal de EE. UU.: sin restricción de copyright (17 U.S.C. §105).',
  },
  'chebi-lite': {
    owner: 'ChEBI (EMBL-EBI)',
    license: 'CC-BY-4.0',
    licenseEvidence:
      'LICENSE del directorio es «Attribution 4.0 International» y la cabecera de chebi_lite.obo declara «terms:license https://creativecommons.org/licenses/by/4.0/». AMBIGÜEDAD: el README del mismo directorio dice «CC Attribution-ShareAlike 4.0». Se aplica la más estricta para la atribución (citar la URL y la versión de ChEBI) y se consulta al propietario.',
  },
  ncit: {
    owner: 'National Cancer Institute — Enterprise Vocabulary Services (NCI Thesaurus)',
    license: 'CC-BY-4.0',
    licenseEvidence:
      'La ficha del NCIt OBO Edition en el registro de OBO Foundry (ontology/ncit.md) declara «license: CC BY 4.0»; las páginas de EVS alcanzables hoy no publican el texto de la licencia (el ReadMe.txt del FTP no la menciona). Confirmar con el propietario.',
  },
  'eurlex-1169': {
    owner: 'Unión Europea — Reglamento (UE) n.º 1169/2011 (Oficina de Publicaciones, EUR-Lex/Cellar)',
    license: 'Reutilización autorizada con cita de la fuente (Decisión 2011/833/UE)',
    licenseEvidence:
      'Decisión 2011/833/UE de la Comisión (reutilización de los documentos de la Comisión), descargada de Cellar (32011D0833). Los textos jurídicos de la UE se reutilizan citando la fuente y sin distorsionarlos.',
  },
  'eurlex-1333': {
    owner: 'Unión Europea — Reglamento (CE) n.º 1333/2008, anexo II (Oficina de Publicaciones, EUR-Lex/Cellar)',
    license: 'Reutilización autorizada con cita de la fuente (Decisión 2011/833/UE)',
    licenseEvidence: 'ídem eurlex-1169. Se usa la versión consolidada (informativa); el texto auténtico es el del Diario Oficial.',
  },
  'usc-21-321': {
    owner: 'U.S. Government Publishing Office — United States Code, título 21, §321(qq)',
    license: 'Dominio público (obra del gobierno de EE. UU.)',
    licenseEvidence: 'Texto de ley federal publicado por GovInfo; las leyes no tienen copyright.',
  },
  openfda: {
    owner: 'U.S. Food and Drug Administration — openFDA (NDC)',
    license: 'CC0-1.0 (openFDA)',
    licenseEvidence: 'La respuesta de la API enlaza https://open.fda.gov/license/ y https://open.fda.gov/terms/: datos públicos del gobierno de EE. UU., CC0 1.0.',
  },
  dailymed: {
    owner: 'U.S. National Library of Medicine — DailyMed (etiquetas SPL de la FDA)',
    license: 'Dominio público (etiquetas SPL enviadas a la FDA; DailyMed sin restricción de uso)',
    licenseEvidence: 'DailyMed publica las etiquetas SPL como datos públicos (https://dailymed.nlm.nih.gov/dailymed/app-support.cfm). El texto de cada etiqueta es del titular del registro; se toma sólo el identificador UNII y el nombre de cada ingrediente.',
  },
  gsrs: {
    owner: 'U.S. FDA / NCATS — Global Substance Registration System (GSRS) y UNII',
    license: 'Dominio público (FDA/NCATS)',
    licenseEvidence: 'El GSRS y los UNII son un registro de la FDA, de acceso público y sin restricción (https://gsrs.ncats.nih.gov).',
  },
  rxnav: {
    owner: 'U.S. National Library of Medicine — RxNorm / RxClass (RxNav)',
    license: 'RxNorm: sin restricción para las cadenas propias de NLM (SAB=RXNORM); MED-RT (VA) dominio público',
    licenseEvidence:
      'Términos de RxNorm (nlm.nih.gov/research/umls/rxnorm/docs/termsofservice.html): las cadenas de RxNorm (SAB=RXNORM) no tienen restricción adicional. MED-RT es del Department of Veterans Affairs (dominio público). No se toman clases con fuente SNOMED CT (DISPOS, STRUCT) ni ATC (WHO).',
  },
  'europepmc-ebs': {
    owner: 'Contact Dermatitis / ESSCA y grupo EBS (artículo en acceso abierto, vía Europe PMC)',
    license: 'CC-BY-4.0 (PMC13238334 y PMC13441338)',
    licenseEvidence: 'Europe PMC (search, resultType=core) devuelve license=«cc by» y isOpenAccess=Y para ambos artículos; el XML de texto completo lleva la declaración de licencia.',
  },
  'dailymed-true-test': {
    owner: 'SmartPractice (etiqueta SPL del T.R.U.E. TEST, vía DailyMed)',
    license: 'Etiqueta pública de un producto licenciado por la FDA (DailyMed)',
    licenseEvidence: 'Etiqueta SPL publicada en DailyMed. Se toman los nombres y UNII de los alérgenos como figuran en la etiqueta.',
  },
  mesh: {
    owner: 'U.S. National Library of Medicine — Medical Subject Headings (MeSH)',
    license: 'Uso libre con cita: «Courtesy of the U.S. National Library of Medicine» (términos de descarga de NLM)',
    licenseEvidence:
      'nlm.nih.gov/databases/download/terms_and_conditions.html: «No charges, usage fees or royalties are paid to NLM for this data»; quien use los datos acepta citar a NLM («Courtesy of the U.S. National Library of Medicine»), no insinuar respaldo, y quien los redistribuya mantiene la versión vigente o avisa que no lo es. Sólo MeSH en inglés: los términos en castellano (DeCS/BIREME) no se tocan.',
  },
  wikidata: {
    owner: 'Wikidata (Wikimedia Foundation)',
    license: 'CC0-1.0',
    licenseEvidence: 'Wikidata publica los datos estructurados bajo CC0 1.0 (https://www.wikidata.org/wiki/Wikidata:Licensing).',
  },
};

/** Code systems nuevos de esta tanda. */
export const OPEN_CODE_SYSTEMS = {
  'allergy-iuis-allergens': {
    sourceCode: 'IUIS_ALLERGEN_NOMENCLATURE',
    owner: 'WHO/IUIS Allergen Nomenclature Sub-Committee',
    officialUrl: 'https://www.allergen.org/',
    name: 'WHO/IUIS — nomenclatura oficial de alérgenos (moléculas e isoalérgenos)',
  },
  'allergy-iuis-sources': {
    sourceCode: 'IUIS_ALLERGEN_NOMENCLATURE',
    owner: 'WHO/IUIS Allergen Nomenclature Sub-Committee',
    officialUrl: 'https://www.allergen.org/treeview.php',
    name: 'WHO/IUIS — fuentes biológicas (especies) de los alérgenos',
  },
  'allergy-uniprot': {
    sourceCode: 'UNIPROT_ALLERGEN',
    owner: 'UniProt Consortium',
    officialUrl: 'https://www.uniprot.org/keywords/KW-0020',
    name: 'UniProtKB — proteínas con la palabra clave KW-0020 «Allergen»',
  },
  'allergy-fda-unii': {
    sourceCode: 'FDA_UNII_ALLERGENICS',
    owner: 'U.S. FDA (UNII / GSRS), con DailyMed y openFDA NDC',
    officialUrl: 'https://gsrs.ncats.nih.gov/',
    name: 'FDA — sustancias activas (UNII) de los extractos alergénicos autorizados (NDC)',
  },
  'allergy-fda-allergenic-products': {
    sourceCode: 'FDA_UNII_ALLERGENICS',
    owner: 'U.S. FDA (openFDA NDC)',
    officialUrl: 'https://open.fda.gov/apis/drug/ndc/',
    name: 'FDA — productos alergénicos del directorio NDC (estandarizados y no estandarizados)',
  },
  'allergy-medrt-classes': {
    sourceCode: 'NLM_RXCLASS_MEDRT',
    owner: 'U.S. Department of Veterans Affairs (MED-RT), vía RxClass de NLM',
    officialUrl: 'https://lhncbc.nlm.nih.gov/RxNav/applications/RxClassIndex.html',
    name: 'MED-RT / RxClass — clases farmacológicas (EPC, MoA, PE, PK, TC, químicas, VA)',
  },
  'allergy-ncit': {
    sourceCode: 'NCIT_ALLERGY',
    owner: 'National Cancer Institute (EVS) — NCI Thesaurus',
    officialUrl: 'https://evsexplore.semantics.cancer.gov/',
    name: 'NCI Thesaurus — Allergen (C62651) y Hypersensitivity (C3114)',
  },
  'allergy-eu-allergens': {
    sourceCode: 'EU_REG_1169_2011',
    owner: 'Unión Europea',
    officialUrl: 'https://eur-lex.europa.eu/eli/reg/2011/1169/oj/spa',
    name: 'Reglamento (UE) 1169/2011, anexo II — sustancias que causan alergias o intolerancias',
  },
  'allergy-eu-additives': {
    sourceCode: 'EU_REG_1333_2008',
    owner: 'Unión Europea',
    officialUrl: 'https://eur-lex.europa.eu/eli/reg/2008/1333/oj/spa',
    name: 'Reglamento (CE) 1333/2008, anexo II parte B — lista de la Unión de aditivos alimentarios (número E)',
  },
  'allergy-fda-major-allergens': {
    sourceCode: 'US_FDCA_321_QQ',
    owner: 'Congreso de EE. UU. — Federal Food, Drug, and Cosmetic Act §201(qq)',
    officialUrl: 'https://www.govinfo.gov/content/pkg/USCODE-2023-title21/html/USCODE-2023-title21-chap9-subchapII-sec321.htm',
    name: 'FDCA §201(qq) — alérgenos alimentarios mayores (FALCPA + FASTER Act)',
  },
  'allergy-patch-test-series': {
    sourceCode: 'PATCH_TEST_SERIES',
    owner: 'ESCD/ESSCA (serie basal europea) y SmartPractice (T.R.U.E. TEST)',
    officialUrl: 'https://www.escd.org/',
    name: 'Pruebas de parche — alérgenos de la serie basal europea y del T.R.U.E. TEST',
  },
  'allergy-mesh': {
    sourceCode: 'NLM_MESH_ALLERGY',
    owner: 'U.S. National Library of Medicine — MeSH',
    officialUrl: 'https://www.nlm.nih.gov/mesh/',
    name: 'MeSH — alérgenos (D23.050.063) e hipersensibilidad (C20.543)',
  },
};

/** Value sets nuevos de esta tanda. */
export const OPEN_VALUE_SETS = {
  'allergy-substances-allergen-molecule': {
    name: 'Alergias · moléculas alergénicas (WHO/IUIS)',
    description: 'Alérgenos con nomenclatura oficial WHO/IUIS (p. ej. Ara h 1, Bet v 1, Der p 1) e isoalérgenos.',
  },
  'allergy-substances-allergen-source': {
    name: 'Alergias · fuentes biológicas de alérgenos (especies)',
    description: 'Especies que el sub-comité WHO/IUIS registra como fuente de alérgenos, con su nombre común cuando lo publica.',
  },
  'allergy-substances-allergenic-extract-substance': {
    name: 'Alergias · sustancias de extractos alergénicos (UNII)',
    description: 'Sustancias activas con UNII de los extractos alergénicos del directorio NDC de la FDA.',
  },
  'allergy-substances-protein-allergen': {
    name: 'Alergias · proteínas alergénicas (UniProt KW-0020)',
    description: 'Entradas de UniProtKB anotadas con la palabra clave «Allergen».',
  },
  'allergy-substances-eu-allergen': {
    name: 'Alergias · alérgenos de declaración obligatoria en la UE',
    description: 'Los 14 grupos del anexo II del Reglamento (UE) 1169/2011, con texto oficial en castellano e inglés.',
  },
  'allergy-substances-us-major-allergen': {
    name: 'Alergias · alérgenos alimentarios mayores (EE. UU.)',
    description: 'Los nueve alérgenos alimentarios mayores del FDCA §201(qq).',
  },
  'allergy-substances-eu-additive': {
    name: 'Alergias · aditivos alimentarios de la lista de la UE',
    description: 'Aditivos del anexo II parte B del Reglamento (CE) 1333/2008, con número E y denominación oficial en castellano.',
  },
  'allergy-substances-patch-test': {
    name: 'Alergias · alérgenos de pruebas de parche',
    description: 'Sustancias de la serie basal europea (ESCD) y del T.R.U.E. TEST.',
  },
  'allergy-substances-drug-class-medrt': {
    name: 'Alergias · clases de medicamentos MED-RT / RxClass',
    description: 'Clases farmacológicas vigentes de MED-RT vía RxClass (EPC, MoA, PE, PK, TC, químicas, VA). Complementan las de NDF-RT 20180301.',
  },
  'allergy-substances-ncit-allergen': {
    name: 'Alergias · alérgenos del NCI Thesaurus',
    description: 'Descendientes de «Allergen» (C62651) del NCI Thesaurus.',
  },
  'allergy-substances-mesh-allergen': {
    name: 'Alergias · alérgenos de MeSH',
    description: 'Descriptores de MeSH bajo «Allergens» (D23.050.063): Allergens y Allergoids.',
  },
};
