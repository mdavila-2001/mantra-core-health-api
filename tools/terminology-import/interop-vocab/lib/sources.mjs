// =============================================================================
// Fuentes del importador de vocabularios de interoperabilidad abiertos.
// Una entrada por archivo descargado. La licencia de cada una está leída en la
// propia fuente (ver SOURCES.md y evidencia/C11/licencias-*.txt); lo que no se
// pudo leer o restringe la redistribución NO figura acá: queda en `NOT_LOADED`.
// =============================================================================

export const SOURCES = [
  // --- HL7 Terminology (THO) y FHIR core: paquetes oficiales (CC0-1.0 en package.json) ---
  {
    key: 'tho-r4',
    kind: 'fhir-package',
    // 7.5.0 es la última de packages.fhir.org (el npm `hl7.terminology.r4` quedó en 7.0.1).
    url: 'https://packages.fhir.org/hl7.terminology.r4/7.5.0',
    file: 'tho-r4-7.5.0.tgz',
    name: 'hl7.terminology.r4',
    version: '7.5.0',
    pkgLicense: 'CC0-1.0',
  },
  {
    key: 'fhir-r4',
    kind: 'fhir-package',
    url: 'https://packages.fhir.org/hl7.fhir.r4.core/4.0.1',
    file: 'fhir-r4-4.0.1.tgz',
    name: 'hl7.fhir.r4.core',
    version: '4.0.1',
    pkgLicense: 'CC0-1.0',
  },
  {
    key: 'fhir-r4b',
    kind: 'npm-package',
    url: 'https://registry.npmjs.org/hl7.fhir.r4b.core/-/hl7.fhir.r4b.core-4.3.0.tgz',
    metaUrl: 'https://registry.npmjs.org/hl7.fhir.r4b.core/4.3.0',
    file: 'fhir-r4b-4.3.0.tgz',
    name: 'hl7.fhir.r4b.core',
    version: '4.3.0',
    pkgLicense: 'CC0-1.0',
  },
  {
    key: 'fhir-r5',
    kind: 'npm-package',
    url: 'https://registry.npmjs.org/hl7.fhir.r5.core/-/hl7.fhir.r5.core-5.0.0.tgz',
    metaUrl: 'https://registry.npmjs.org/hl7.fhir.r5.core/5.0.0',
    file: 'fhir-r5-5.0.0.tgz',
    name: 'hl7.fhir.r5.core',
    version: '5.0.0',
    pkgLicense: 'CC0-1.0',
  },
  // Textos de licencia leídos para el SOURCES.md (no entran al corpus).
  { key: 'lic-fhir-r4', kind: 'license-page', url: 'https://hl7.org/fhir/R4/license.html', file: 'license-fhir-r4.html' },
  { key: 'lic-fhir-r5', kind: 'license-page', url: 'https://hl7.org/fhir/R5/license.html', file: 'license-fhir-r5.html' },

  // --- CDC: CVX (vacunas) y MVX (fabricantes), con estado ---
  { key: 'cdc-cvx', kind: 'cdc', url: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/downloads/cvx.txt', file: 'cdc/cvx.txt' },
  { key: 'cdc-mvx', kind: 'cdc', url: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/downloads/mvx.txt', file: 'cdc/mvx.txt' },
  { key: 'cdc-cvx-page', kind: 'license-page', url: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx', file: 'cdc/cvx-page.html' },
  { key: 'cdc-mvx-page', kind: 'license-page', url: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=mvx', file: 'cdc/mvx-page.html' },
  { key: 'cdc-policy', kind: 'license-page', url: 'https://www.cdc.gov/other/agencymaterials.html', file: 'cdc/agencymaterials.html' },

  // --- IANA: registro de subtags de lenguaje (BCP 47 / RFC 5646), CC0 por declaración de IANA e IETF ---
  { key: 'iana-lsr', kind: 'iana', url: 'https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry', file: 'iana/language-subtag-registry.txt' },
  { key: 'iana-licensing', kind: 'license-page', url: 'https://www.iana.org/help/licensing-terms', file: 'iana/licensing-terms.html' },

  // --- UCUM: ucum-essence.xml oficial (repositorio ucum-org/ucum) y su licencia ---
  { key: 'ucum-essence', kind: 'ucum', url: 'https://raw.githubusercontent.com/ucum-org/ucum/main/ucum-essence.xml', file: 'ucum/ucum-essence.xml' },
  { key: 'ucum-license', kind: 'license-page', url: 'https://raw.githubusercontent.com/ucum-org/ucum/main/LICENSE.md', file: 'ucum/LICENSE.md' },
];

export const sourceByKey = (key) => {
  const s = SOURCES.find((x) => x.key === key);
  if (!s) throw new Error(`fuente desconocida: ${key}`);
  return s;
};

/**
 * Fuentes evaluadas que NO se cargan, con el motivo exacto leído hoy. Va al reporte de cobertura
 * y a `docs/seed-research/interop-vocab.md`. `decision` = lo que tiene que resolver el propietario.
 */
export const NOT_LOADED = [
  {
    source: 'ISO 4217 — lista oficial (SIX, list-one.xml / list-three.xml)',
    url: 'https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml',
    http: 200,
    reason:
      'Accesible, con estado (vigente/histórica con fecha de retiro). Pero los términos de uso de SIX (https://www.six-group.com/en/services/legal/terms-and-conditions/terms-of-use.html) dicen que «the entire content of the SIX website is protected by copyright law» y que no puede «reproduced or reused in any way or used for commercial purposes»; el archivo no trae licencia propia. Licencia no verificada.',
    decision: 'Pedir a SIX (Secretariat of the ISO 4217 Maintenance Agency) permiso escrito de redistribución, o aceptar que se cargue sin versionar el archivo.',
  },
  {
    source: 'ISO 4217 vía Wikidata (P498)',
    url: 'https://query.wikidata.org/sparql',
    http: 200,
    reason:
      'Licencia CC0 clara, pero los datos no sirven sin curar: 324 declaraciones para 312 valores, con ítems que no son monedas (p. ej. P498=GBP en «economy of the United Kingdom»), valores numéricos (200, 203) y varios ítems por código (ZWD/ZWR/ZWN/ZWL). Elegir cuál es «la» moneda sería una heurística propia.',
    decision: 'Fuente alternativa con licencia clara para ISO 4217, o curaduría del propietario.',
  },
  {
    source: 'ISO 639-3 (SIL), tablas oficiales',
    url: 'https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab',
    http: 200,
    reason:
      'Términos de uso de SIL: se puede incorporar el código en productos «provided that… the product, system, or device does not provide a means to redistribute the code set» y «the ISO 639-3 website is the only authorized distribution site». Versionar el corpus en git y servirlo por la API es una redistribución. Los mismos identificadores sí están en el registro de subtags de IANA (CC0), que es lo que se carga.',
    decision: 'Si se quiere la tabla de SIL (nombres de referencia, alcance, tipo), pedir autorización a SIL o cargarla sin versionar.',
  },
  {
    source: 'ISO 639-2 (Library of Congress), ISO-639-2_utf-8.txt',
    url: 'https://www.loc.gov/standards/iso639-2/ISO-639-2_utf-8.txt',
    http: 200,
    reason: 'Accesible, pero ni el archivo ni las páginas de la agencia (ISO 639-2 Language Coding Agency) declaran licencia de reutilización. Licencia no verificada. Los códigos alfa-3 y alfa-2 están en el registro de subtags de IANA (CC0).',
    decision: 'Pedir confirmación a la Library of Congress si se quieren los nombres en francés y alemán del archivo.',
  },
  {
    source: 'UN M49 (UNSD), códigos de países y áreas',
    url: 'https://unstats.un.org/unsd/methodology/m49/overview/',
    http: 200,
    reason: 'Los datos están en la página (tabla HTML), pero los Terms of Use de la ONU (https://www.un.org/en/about-us/terms-of-use) responden 403 desde esta sesión: licencia no verificada.',
    decision: 'Leer los términos de la ONU desde otra red; si permiten reutilización, se agrega el parser.',
  },
  {
    source: 'ISO 3166-1 / 3166-2 en iso.org (Online Browsing Platform)',
    url: 'https://www.iso.org/obp/ui/',
    http: 403,
    reason: 'iso.org responde 403 y la lista completa es obra con derechos de ISO. No se eludió.',
    decision: '—',
  },
  {
    source: 'SNOMED CT, LOINC, CPT, NUCC y demás sistemas externos referenciados por HL7',
    url: 'http://snomed.info/sct · http://loinc.org · http://www.ama-assn.org/go/cpt',
    http: null,
    reason: 'Excluidos por pedido: ningún concepto de estos sistemas entra aunque los CodeSystem/ValueSet de HL7 los referencien. Un value set que depende de uno de ellos no se carga (no se carga una membresía parcial).',
    decision: '—',
  },
];
