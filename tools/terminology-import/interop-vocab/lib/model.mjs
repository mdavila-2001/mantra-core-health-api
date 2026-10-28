// =============================================================================
// Identidad y definiciones compartidas por el build y la carga: ids deterministas,
// fuentes (`terminology_sources`), licencias y estados. Sin red, sin base.
// =============================================================================

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';

export { md5uuid };

/** Conceptos internos que siembra la API (`src/common/constants/concepts.ts`); la carga exige que existan. */
export const INTERNAL = {
  STATE: {
    active: deterministicId('terminology:state:active'),
    draft: deterministicId('terminology:state:draft'),
    retired: deterministicId('terminology:state:retired'),
    deprecated: deterministicId('terminology:state:deprecated'),
  },
  LANG: { es: deterministicId('terminology:language:es'), en: deterministicId('terminology:language:en') },
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
  REL_PART_OF: deterministicId('terminology:relationship:part-of'),
  CS_CONTENT_COMPLETE: deterministicId('terminology:content-type:complete'),
  EQUIVALENCE: {
    equivalent: deterministicId('terminology:equivalence:equivalent'),
    wider: deterministicId('terminology:equivalence:wider'),
    narrower: deterministicId('terminology:equivalence:narrower'),
    inexact: deterministicId('terminology:equivalence:inexact'),
    unmatched: deterministicId('terminology:equivalence:unmatched'),
  },
};

// --- ids ----------------------------------------------------------------------------------
export const sourceRowId = (code) => md5uuid(`mantra:interop-vocab:source:${code}`);
export const codeSystemRowId = (internalCode) => md5uuid(`mantra:interop-vocab:cs:${internalCode}`);
export const codeSystemVersionRowId = (internalCode, version) => md5uuid(`mantra:interop-vocab:csv:${internalCode}:${version}`);
export const conceptRowId = (internalCode, version, code) => md5uuid(`mantra:interop-vocab:concept:${internalCode}:${version}:${code}`);
export const valueSetRowId = (internalCode) => md5uuid(`mantra:interop-vocab:vs:${internalCode}`);
export const valueSetVersionRowId = (internalCode, version) => md5uuid(`mantra:interop-vocab:vsv:${internalCode}:${version}`);
export const memberRowId = (vsvId, conceptId) => md5uuid(`mantra:interop-vocab:vsm:${vsvId}:${conceptId}`);

// --- fuentes -------------------------------------------------------------------------------
export const LICENSES = {
  CC0_HL7: (pkg) =>
    `CC0-1.0. Paquete ${pkg.name}@${pkg.version} (package.json → license: CC0-1.0). Texto: THO https://terminology.hl7.org/7.5.0/en/license.html («made available… in accordance with the Creative Commons Zero (CC0) designation»); FHIR https://hl7.org/fhir/R5/license.html y https://hl7.org/fhir/R4/license.html («licensed under Creative Commons "No Rights Reserved" (CC0)»). Sólo recursos que no nombran contenido de terceros.`,
  UCUM:
    '© 1999-2024 Regenstrief Institute, Inc. y la UCUM Organization. UCUM License v1.1 (https://ucum.org/license; LICENSE.md de ucum-org/ucum): reproducción y distribución sin cargo y regalías; prohíbe modificar el contenido (campos, valores, descripciones) y crear obras derivadas; exige conservar el aviso de copyright, la referencia a esta licencia y el descargo de garantías. Esta fila reproduce el elemento de ucum-essence.xml sin modificarlo.',
  CDC:
    'Dominio público: obra del CDC (agencia federal de EE. UU., NCIRD), 17 U.S.C. §105 (https://www.usa.gov/government-copyright: «Works created by U.S. Government employees are not eligible for copyright protection»). cvx.txt/mvx.txt no traen licencia propia y la política del CDC (https://www.cdc.gov/other/agencymaterials.html) responde 403 desde esta red: la condición se infiere de la autoría federal.',
  IANA:
    'CC0-1.0: declaración conjunta de IANA e IETF Trust (10-nov-2021) sobre los Protocol Registries, https://www.iana.org/help/licensing-terms («subject to the Creative Commons CC0 1.0 dedication»).',
};

/** Una entrada por `terminology_sources.code` que crea esta carga. */
export const SOURCE_DEFS = {
  INTEROP_HL7_THO: { name: 'HL7 Terminology (THO) — code systems y value sets', owner: 'HL7 International', officialUrl: 'https://terminology.hl7.org/', license: 'CC0-1.0 (THO License, https://terminology.hl7.org/7.5.0/en/license.html)' },
  INTEROP_HL7_FHIR: { name: 'HL7 FHIR core (R4 4.0.1, R4B 4.3.0, R5 5.0.0) — code systems y value sets', owner: 'HL7 International', officialUrl: 'https://hl7.org/fhir/', license: 'CC0-1.0 (FHIR License, https://hl7.org/fhir/R5/license.html)' },
  INTEROP_HL7_IG: { name: 'HL7 FHIR IG oficiales (extensiones, genómica, SDC) — code systems y value sets', owner: 'HL7 International', officialUrl: 'https://hl7.org/fhir/', license: 'CC0-1.0 (package.json de cada IG)' },
  INTEROP_CLDR: { name: 'Unicode CLDR — códigos y nombres de territorios, idiomas, escrituras, variantes y monedas', owner: 'Unicode, Inc.', officialUrl: 'https://cldr.unicode.org/', license: 'Unicode-3.0 (Unicode License v3)' },
  INTEROP_WIKIDATA: { name: 'Wikidata — códigos ISO 3166-2 (propiedad P300) y etiquetas en/es', owner: 'Wikimedia Foundation (contribuyentes de Wikidata)', officialUrl: 'https://www.wikidata.org/', license: 'CC0-1.0 (https://www.wikidata.org/wiki/Wikidata:Licensing)' },
  INTEROP_UCUM: { name: 'UCUM — Unified Code for Units of Measure (ucum-essence.xml)', owner: 'Regenstrief Institute, Inc. / UCUM Organization', officialUrl: 'https://ucum.org/', license: 'UCUM License v1.1 (https://ucum.org/license): redistribución verbatim con aviso; sin modificaciones ni obras derivadas' },
  INTEROP_CDC_CVX: { name: 'CVX — Vaccines Administered (CDC)', owner: 'CDC, National Center for Immunization and Respiratory Diseases (NCIRD)', officialUrl: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx', license: 'Dominio público (17 U.S.C. §105)' },
  INTEROP_CDC_MVX: { name: 'MVX — Manufacturers of Vaccines (CDC)', owner: 'CDC, National Center for Immunization and Respiratory Diseases (NCIRD)', officialUrl: 'https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=mvx', license: 'Dominio público (17 U.S.C. §105)' },
  INTEROP_IANA_LSR: { name: 'IANA Language Subtag Registry (BCP 47 / RFC 5646: ISO 639, ISO 15924, ISO 3166-1, UN M.49)', owner: 'IANA', officialUrl: 'https://www.iana.org/assignments/language-subtag-registry', license: 'CC0-1.0 (https://www.iana.org/help/licensing-terms)' },
};

/** FHIR → estado interno (los cuatro que siembra la API). `experimental` de un concepto cuenta como borrador. */
export const STATE_KEY = { active: 'active', draft: 'draft', retired: 'retired', deprecated: 'deprecated', experimental: 'draft', inactive: 'retired' };
export const stateKeyOf = (s) => STATE_KEY[s] ?? null;
