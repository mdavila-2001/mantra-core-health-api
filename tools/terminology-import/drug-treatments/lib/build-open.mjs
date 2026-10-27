// =============================================================================
// Conexión de las fuentes HTTP con el build: parsers por fuente y cruces a ATC /
// MeSH / identificadores, todos leyendo SOLO de `cache/drug-treatments-http/`
// (manifiesto con SHA-256 verificado) y sin red.
// =============================================================================

import { httpFile } from './http-files.mjs';
import {
  chemblAtcIndex,
  drugCentralAtcIndex,
  drugCentralIdentifiers2027,
  meshConceptIndex,
  parseChembl,
  parseCivic,
  parseClinicalTrials,
  parseDrugCentral,
  parseEma,
  parseEeml,
  parseMedRt,
  parseOpenTargetsEma,
  parseWikidata,
  rxclassAtcIndex,
  wikidataAtcIndex,
} from './parsers-open.mjs';
import { CROSSWALKS, SOURCES } from './sources.mjs';

const file = (m, key, fileKey) => httpFile(m, SOURCES[key], fileKey);
const crossFile = (m, key, fileKey) => httpFile(m, CROSSWALKS[key], fileKey);

/** Parsers por clave de fuente. Cada uno recibe el manifiesto HTTP y devuelve `{ assertions, stats }`. */
export const OPEN_PARSERS = {
  medrt: (m) => {
    const f = file(m, 'medrt', 'xml');
    return parseMedRt(f.text(), f.provenance);
  },
  chembl: (m) => {
    const f = file(m, 'chembl', 'indications');
    return parseChembl(f.text(), f.provenance);
  },
  drugcentral: (m) => {
    const rel = file(m, 'drugcentral', 'relationships');
    return parseDrugCentral(rel.text(), file(m, 'drugcentral', 'structures').text(), rel.provenance);
  },
  wikidata: (m) => {
    const f = file(m, 'wikidata', 'statements');
    return parseWikidata(f.text(), crossFile(m, 'wikidata-ids', 'ids').text(), f.provenance);
  },
  eeml: (m) => {
    const f = file(m, 'eeml', 'recommendations');
    return parseEeml(f.text(), f.provenance);
  },
  ema: (m) => {
    const f = file(m, 'ema', 'medicines');
    return parseEma(f.text(), f.provenance);
  },
  opentargets: (m) => {
    const f = file(m, 'opentargets', 'reports');
    return parseOpenTargetsEma(f.text(), f.provenance);
  },
  clinicaltrials: (m) => {
    const f = file(m, 'clinicaltrials', 'studies');
    return parseClinicalTrials(f.text(), f.provenance);
  },
  civic: (m) => {
    const f = file(m, 'civic', 'evidence');
    return parseCivic(f.text(), f.provenance);
  },
};

const has = (m, def, fileKey) => Boolean(m.files[def.files[fileKey]]);

/**
 * Cruces abiertos presentes en el manifiesto (los que no se bajaron se omiten y se declaran en `used`):
 *   mesh                        concepto/encabezado → descriptor
 *   atc                         índices código de fármaco → ATC nivel 5 (RxClass, ChEMBL, Wikidata, DrugCentral)
 *   drugCentralIdentifiers2027  struct_id → códigos publicados por el volcado 2027
 */
export function openCrosswalks(m) {
  const used = [];
  const atc = [];
  let mesh = null;
  let drugCentralIdentifiers = null;
  if (has(m, CROSSWALKS['mesh-concepts'], 'concepts')) {
    mesh = meshConceptIndex(crossFile(m, 'mesh-concepts', 'concepts').text());
    used.push('mesh-concepts');
  }
  if (has(m, CROSSWALKS['rxclass-atc'], 'atc')) {
    const idx = rxclassAtcIndex(crossFile(m, 'rxclass-atc', 'atc').text());
    atc.push({ via: 'rxclass-atc', map: new Map([...idx].map(([rxcui, list]) => [`RXCUI:${rxcui}`, list])) });
    used.push('rxclass-atc');
  }
  if (has(m, CROSSWALKS['chembl-atc'], 'atc')) {
    atc.push({ via: 'chembl-atc', map: chemblAtcIndex(crossFile(m, 'chembl-atc', 'atc').text()) });
    used.push('chembl-atc');
  }
  if (has(m, CROSSWALKS['wikidata-ids'], 'ids')) {
    const { map } = wikidataAtcIndex(crossFile(m, 'wikidata-ids', 'ids').text());
    atc.push({ via: 'wikidata-ids', map });
    used.push('wikidata-ids');
  }
  if (has(m, CROSSWALKS['drugcentral-ids'], 'atc')) {
    atc.push({ via: 'drugcentral-ids', map: drugCentralAtcIndex(crossFile(m, 'drugcentral-ids', 'atc').text()) });
    drugCentralIdentifiers = drugCentralIdentifiers2027(crossFile(m, 'drugcentral-ids', 'identifiers').text());
    used.push('drugcentral-ids');
  }
  return { mesh, atc, drugCentralIdentifiers, used };
}
