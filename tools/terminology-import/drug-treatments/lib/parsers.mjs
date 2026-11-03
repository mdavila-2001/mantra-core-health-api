// =============================================================================
// Parsers de cada fuente → afirmaciones comunes (puros, sin red ni base).
//
// Cada parser recibe el texto del archivo y su procedencia (`provenance`:
// versión, fecha de descarga, commit, archivo, SHA-256) y devuelve
// `{ assertions, stats }`. `stats.excluded` cuenta, por motivo, lo que la
// fuente trae pero NO entra como relación (p. ej. respuestas «no» del
// crowdsourcing, filas sin código): nada se descarta en silencio.
// =============================================================================

import { load as loadYaml } from 'js-yaml';
import { SYSTEM, code, curie, makeAssertion, mergeById, sortedUnique } from './common.mjs';

const splitList = (field) =>
  String(field ?? '')
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);

function counter() {
  const map = {};
  return { add: (k, n = 1) => (map[k] = (map[k] ?? 0) + n), value: map };
}

function lines(text) {
  return text.split(/\r?\n/).filter((l) => l.trim() !== '');
}

/** TSV con cabecera; quita las comillas dobles que envuelven campos (DrugCentral). */
function tsv(text) {
  const [head, ...rows] = lines(text);
  const cols = head.split('\t').map((c) => c.replace(/^"|"$/g, ''));
  return rows.map((l) => {
    const cells = l.split('\t');
    return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? '').replace(/^"|"$/g, '').trim()]));
  });
}

const mergeLabelEvidence = (a, b) => ({
  ...a,
  studyLabelIds: sortedUnique([...a.studyLabelIds, ...b.studyLabelIds]),
  dailyMedSetIds: sortedUnique([...a.dailyMedSetIds, ...b.dailyMedSetIds]),
  labelCount: sortedUnique([...a.dailyMedSetIds, ...b.dailyMedSetIds]).length,
});

// --- LabeledIn ---------------------------------------------------------------

/**
 * Una afirmación por (ingrediente[s] RxNorm, CUI de indicación). Varias fichas
 * con el mismo par se agrupan y se conservan todos los Set ID de DailyMed.
 * Un IN_RXCUI con varios valores es una COMBINACIÓN: el fármaco es el conjunto.
 */
function labeledInRows(text, { crowd }) {
  return lines(text).map((l) => {
    const f = l.split('|');
    return {
      studyLabelId: f[0].trim(),
      setId: f[1].trim(),
      cuis: splitList(f[2]),
      ingredients: splitList(f[3]),
      answer: crowd ? (f[8] ?? '').trim() : null,
    };
  });
}

export function parseLabeledIn(text, provenance, { crowd = false } = {}) {
  const stats = counter();
  const type = crowd ? 'labeledin:crowd-label-indication' : 'labeledin:expert-label-indication';
  const out = [];
  for (const row of labeledInRows(text, { crowd })) {
    stats.add('rows');
    if (crowd && row.answer !== 'yes') {
      stats.add(`excluded:answer=${row.answer || '(vacío)'}`);
      continue;
    }
    const ingredients = row.ingredients.map((r) => code(SYSTEM.RXCUI, r));
    if (ingredients.length === 0 || ingredients.some((c) => c === null)) {
      stats.add('excluded:sin IN_RXCUI válido');
      continue;
    }
    const drugKey = ingredients.map((c) => c.code).sort((a, b) => Number(a) - Number(b)).join('+');
    for (const cui of row.cuis) {
      const condition = code(SYSTEM.UMLS, cui);
      if (!condition) {
        stats.add('excluded:CUI con formato inválido');
        continue;
      }
      out.push(
        makeAssertion({
          source: 'labeledin',
          recordId: `${crowd ? 'crowd' : 'expert'}:${drugKey}|${condition.code}`,
          uri: `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${row.setId}`,
          type,
          drug: { label: null, codes: ingredients, combination: ingredients.length > 1 },
          condition: { label: null, codes: [condition] },
          evidence: {
            ingredientRxcuis: ingredients.map((c) => c.code),
            combination: ingredients.length > 1,
            studyLabelIds: [row.studyLabelId],
            dailyMedSetIds: [row.setId],
            labelCount: 1,
            dailyMedVersion: '2012-08-28',
            ...(crowd ? { crowdMajorityAnswer: row.answer } : {}),
          },
          provenance,
        }),
      );
    }
  }
  const assertions = mergeById(out, mergeLabelEvidence);
  for (const a of assertions) a.drug.combination = a.evidence.combination;
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- PharmacotherapyDB -----------------------------------------------------------

export function parsePharmacotherapyDb(text, provenance) {
  const stats = counter();
  const assertions = [];
  for (const r of tsv(text)) {
    stats.add('rows');
    const type = `pharmacotherapydb:${r.category}`;
    const drug = code(SYSTEM.DRUGBANK, r.drugbank_id);
    const condition = curie(r.doid_id);
    if (!drug || !condition || !['DM', 'SYM', 'NOT'].includes(r.category)) {
      stats.add('excluded:fila sin códigos o categoría válidos');
      continue;
    }
    assertions.push(
      makeAssertion({
        source: 'pharmacotherapydb',
        recordId: `${r.doid_id}|${r.drugbank_id}`,
        uri: `https://github.com/dhimmel/indications/blob/${provenance.commit}/catalog/indications.tsv`,
        type,
        drug: { label: r.drug, codes: [drug] },
        condition: { label: r.disease, codes: [condition] },
        evidence: { category: r.category, nCurators: Number(r.n_curators), nResources: Number(r.n_resources) },
        provenance,
      }),
    );
  }
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- DrugCentral (extracto 2016) --------------------------------------------------

/** DRUG_ID de DrugCentral → códigos que la propia DrugCentral publica (identifiers.tsv). */
export function drugCentralIdentifiers(text) {
  const wanted = { RXNORM: SYSTEM.RXCUI, DRUGBANK_ID: SYSTEM.DRUGBANK, ChEMBL_ID: SYSTEM.CHEMBL, UNII: SYSTEM.UNII, MESH_DESCRIPTOR_UI: SYSTEM.MESH, MESH_SUPPLEMENTAL_RECORD_UI: SYSTEM.MESH, CHEBI: SYSTEM.CHEBI };
  const byDrug = new Map();
  for (const r of tsv(text)) {
    const system = wanted[r.ID_TYPE];
    if (!system) continue;
    const raw = system === SYSTEM.CHEBI ? r.IDENTIFIER.replace(/^CHEBI:/, '') : r.IDENTIFIER;
    const c = code(system, raw);
    if (!c) continue;
    if (!byDrug.has(r.DRUG_ID)) byDrug.set(r.DRUG_ID, []);
    byDrug.get(r.DRUG_ID).push(c);
  }
  return byDrug;
}

export function parseDrugCentral2016(text, provenance) {
  const stats = counter();
  const out = [];
  for (const r of tsv(text)) {
    stats.add('rows');
    const drug = code(SYSTEM.DRUGCENTRAL, r.DRUG_ID);
    const conditionCodes = [code(SYSTEM.UMLS, r.UMLS_CUI), r.DOID ? curie(r.DOID) : null].filter(Boolean);
    if (r.SNOMEDCT_CUI) stats.add('dropped:SNOMEDCT_CUI (Bolivia no es miembro de SNOMED International)');
    if (!drug || conditionCodes.length === 0) {
      stats.add('excluded:fila sin DRUG_ID o sin UMLS_CUI/DOID');
      continue;
    }
    const conditionKey = conditionCodes[0].system === SYSTEM.UMLS ? conditionCodes[0].code : `DOID:${conditionCodes[0].code}`;
    out.push(
      makeAssertion({
        source: 'drugcentral-2016',
        recordId: `${r.DRUG_ID}|${conditionKey}`,
        uri: `https://drugcentral.org/drugcard/${r.DRUG_ID}`,
        type: 'drugcentral-2016:indication',
        drug: { label: r.DRUG_NAME, codes: [drug] },
        condition: { label: r.INDICATION_FDB, codes: conditionCodes },
        evidence: { indicationText: [r.INDICATION_FDB] },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a, b) => ({ indicationText: sortedUnique([...a.indicationText, ...b.indicationText]) }));
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- DrugMechDB -----------------------------------------------------------------

/** Una afirmación por (fármaco, enfermedad); los caminos (`_id`) quedan como evidencia. */
export function parseDrugMechDb(text, provenance) {
  const stats = counter();
  const out = [];
  for (const entry of loadYaml(text)) {
    stats.add('paths');
    const g = entry.graph ?? {};
    const drugCodes = [g.drug_mesh ? curie(g.drug_mesh) : null, g.drugbank ? curie(g.drugbank) : null].filter(Boolean);
    const condition = g.disease_mesh ? curie(g.disease_mesh) : null;
    if (drugCodes.length === 0 || !condition) {
      stats.add('excluded:camino sin código de fármaco o de enfermedad');
      continue;
    }
    const drugKey = drugCodes.find((c) => c.system === SYSTEM.MESH)?.code ?? drugCodes[0].code;
    out.push(
      makeAssertion({
        source: 'drugmechdb',
        recordId: `${drugKey}|${condition.code}`,
        uri: `https://github.com/SuLab/DrugMechDB/blob/${provenance.commit}/indication_paths.yaml`,
        type: 'drugmechdb:indication-mechanism-path',
        drug: { label: g.drug ?? null, codes: drugCodes },
        condition: { label: g.disease ?? null, codes: [condition] },
        evidence: { pathIds: [g._id] },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a, b) => ({ pathIds: sortedUnique([...a.pathIds, ...b.pathIds]) }));
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}

// --- MAxO annotations --------------------------------------------------------------

const MAXO_RELATION = {
  treats: 'maxo:treats',
  prevents: 'maxo:prevents',
  contraindicated: 'maxo:contraindicated',
  'lack of observed response': 'maxo:lack-of-observed-response',
  no_observed_benefit: 'maxo:no-observed-benefit',
  investigates: 'maxo:investigates',
};

/** Sólo filas con extensión CHEBI: sin sustancia no hay fármaco (lo demás es de la sesión de procedimientos). */
export function parseMaxo(text, provenance) {
  const stats = counter();
  const out = [];
  for (const r of tsv(text)) {
    stats.add('rows');
    if (!r.extension_id.startsWith('CHEBI:')) {
      stats.add('excluded:sin extensión CHEBI (acción no farmacológica o sin sustancia)');
      continue;
    }
    const type = MAXO_RELATION[r.relation];
    if (!type) {
      stats.add(`excluded:relation=${r.relation || '(vacío)'}`);
      continue;
    }
    const drug = curie(r.extension_id);
    const condition = curie(r.disease_id);
    if (!drug || !condition) {
      stats.add('excluded:códigos inválidos');
      continue;
    }
    const pmid = /^PMID:(\d+)$/.exec(r.source_id)?.[1];
    out.push(
      makeAssertion({
        source: 'maxo',
        recordId: `${r.disease_id}|${r.maxo_id}|${r.extension_id}|${r.relation}|${r.hpo_id || '-'}|${r.source_id}`,
        uri: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : r.source_id,
        type,
        drug: { label: r.extension_name || null, codes: [drug] },
        condition: { label: r.disease_name || null, codes: [condition] },
        evidence: {
          maxoId: r.maxo_id,
          maxoName: r.maxo_name,
          hpoId: r.hpo_id || null,
          evidenceCode: r.evidence || null,
          citation: r.source_id,
          curator: r.author || null,
          lastUpdated: r.last_updated || null,
        },
        provenance,
      }),
    );
  }
  const assertions = mergeById(out, (a) => a);
  stats.add('assertions', assertions.length);
  return { assertions, stats: stats.value };
}
