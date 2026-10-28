// =============================================================================
// MedGen (NCBI/NLM): conceptos de condiciones y fenotipos genéticos, un
// concepto por CUI (`C#######`; `CN#######` los crea NCBI cuando UMLS no tiene
// uno). Archivos: MGCONSO (átomos = nombres por fuente), MGSTY (tipos
// semánticos), MGDEF (definiciones), MedGenIDMappings (nombre preferido de
// MedGen y códigos en otras fuentes).
//
// QUÉ SE CARGA Y QUÉ NO (licencias, ver SOURCES.md):
//   Nombres:  sólo átomos de fuentes abiertas — GTR (NCBI), HPO, MONDO, NCI
//             Thesaurus, MeSH, Orphanet (ORDO). Un CUI cuyos únicos nombres
//             vienen de SNOMED CT, OMIM o GeneReviews NO se carga (se cuenta).
//   Defs:     NCI, HPO, MONDO, ORDO/Orphanet, MeSH, MedlinePlus (Genetics).
//   Xrefs:    sólo identificadores (HPO, MONDO, Orphanet, MeSH, NCI, número
//             MIM y serie fenotípica PS, GARD, UID de MedGen). Se EXCLUYEN los
//             ids de SNOMED CT y las variantes alélicas de OMIM (un id por
//             variante: no es vocabulario).
//   Nada se une por parecido de nombre: los mapas salen de los códigos que
//   MedGen publica en MGCONSO/MedGenIDMappings.
// =============================================================================

import { readRrf } from './rrf.mjs';
import { cleanProps, designationList, prop, uniq, withProvenance } from './rows.mjs';

/** SAB (MGCONSO) cuyos NOMBRES se cargan, y a qué licencia remiten. */
export const OPEN_NAME_SABS = ['MONDO', 'HPO', 'NCI', 'ORDO', 'MSH', 'GTR'];
/** SAB (MGDEF) cuyas DEFINICIONES se cargan. */
export const OPEN_DEF_SABS = ['NCI', 'HPO', 'MONDO', 'ORDO', 'ORPHANET', 'MSH', 'MedlinePlus Genetics', 'MEDLINEPLUS'];
/** Orden de preferencia para elegir el nombre a mostrar si MedGen no coincide con ningún átomo abierto. */
const DISPLAY_PRIORITY = ['MONDO', 'HPO', 'NCI', 'ORDO', 'MSH', 'GTR'];
const PREFERRED_TTY = new Set(['PT', 'MH', 'NM', 'PCE']);

/** Licencia de cada componente cuyo texto o código entra en un concepto. */
export const COMPONENT_LICENSES = {
  MONDO: 'CC BY 4.0 (Mondo, Monarch Initiative)',
  HPO: 'HPO license (https://hpo.jax.org/app/license): reconocer al HPO Consortium, indicar fecha/versión y no alterar el contenido',
  NCI: 'CC BY 4.0 según los términos de uso de NCI EVS (NCI Thesaurus)',
  ORDO: 'CC BY 4.0 (Orphanet, © INSERM)',
  ORPHANET: 'CC BY 4.0 (Orphanet, © INSERM)',
  MSH: 'MeSH: uso libre con atribución a NLM e indicación de versión (https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html)',
  GTR: 'Dominio público de NCBI/NLM (Genetic Testing Registry)',
  MedlinePlus: 'MedlinePlus Genetics / Health Topics (NLM): dominio público, se pide atribución',
};

/** Fuente de MedGenIDMappings → sistema de xref y qué hacer con ella. */
const MAPPING_SOURCES = {
  HPO: { label: 'HPO' },
  MONDO: { label: 'MONDO' },
  MeSH: { label: 'MESH' },
  OMIM: { label: 'OMIM' },
  'OMIM included': { label: 'OMIM' },
  'OMIM Phenotypic Series': { label: 'OMIM' },
  Orphanet: { label: 'ORPHANET' },
  GARD: { label: 'GARD' },
  MedGen: { label: 'MEDGEN_UID' },
};
export const EXCLUDED_MAPPING_SOURCES = ['SNOMEDCT_US', 'OMIM allelic variant'];

/** Destinos (internal_code de otro importador) de cada xref, por código exacto. */
export const XREF_TARGETS = {
  HPO: { systems: ['hpo'], code: (c) => c },
  MONDO: { systems: ['mondo'], code: (c) => c },
  ORPHANET: { systems: ['orphanet'], code: (c) => c.replace(/^Orphanet_/, '') },
  MESH: { systems: ['mesh'], code: (c) => c },
  NCI: { systems: ['ncit-disease', 'ncit-xref', 'ncit'], code: (c) => c },
  OMIM: { systems: ['omim'], code: (c) => c },
};

const crToLf = (s) => s.replace(/\r\n?/g, '\n');

/**
 * Lee los cuatro archivos y arma las filas. Devuelve además estadísticas y los
 * CUI descartados (sin ningún nombre de fuente abierta).
 */
export async function medgenRows({ mgconso, mgsty, mgdef, idmappings }, prov) {
  const stats = { atoms: 0, atomsSuppressed: 0, atomsByExcludedSab: {}, cuis: 0, cuisWithOpenName: 0, cuisWithoutOpenName: 0, displayRule: { 'pref_name coincide con un átomo abierto': 0, 'prioridad de fuente abierta': 0, 'primer átomo abierto': 0 }, defsKept: 0, defsDropped: {}, mappingKept: {}, mappingExcluded: {} };
  const open = new Set(OPEN_NAME_SABS);

  /** @type {Map<string, {atoms: any[], seen: Set<string>}>} */
  const byCui = new Map();
  const allCuis = new Set();
  await readRrf(mgconso, (o) => {
    stats.atoms++;
    allCuis.add(o.CUI);
    if (o.SUPPRESS !== 'N') {
      stats.atomsSuppressed++;
      return;
    }
    if (!open.has(o.SAB)) {
      stats.atomsByExcludedSab[o.SAB] = (stats.atomsByExcludedSab[o.SAB] ?? 0) + 1;
      return;
    }
    let e = byCui.get(o.CUI);
    if (!e) byCui.set(o.CUI, (e = { atoms: [] }));
    e.atoms.push({ sab: o.SAB, tty: o.TTY, ts: o.TS, stt: o.STT, code: o.CODE, str: o.STR });
  });
  stats.cuis = allCuis.size;

  const prefName = new Map();
  const mappings = new Map();
  await readRrf(idmappings, (o) => {
    if (!prefName.has(o.CUI_or_CN_id)) prefName.set(o.CUI_or_CN_id, o.pref_name);
    if (EXCLUDED_MAPPING_SOURCES.includes(o.source)) {
      stats.mappingExcluded[o.source] = (stats.mappingExcluded[o.source] ?? 0) + 1;
      return;
    }
    const m = MAPPING_SOURCES[o.source];
    if (!m) throw new Error(`MedGenIDMappings: fuente sin tratamiento definido: ${o.source}`);
    stats.mappingKept[o.source] = (stats.mappingKept[o.source] ?? 0) + 1;
    if (!mappings.has(o.CUI_or_CN_id)) mappings.set(o.CUI_or_CN_id, []);
    mappings.get(o.CUI_or_CN_id).push({ label: m.label, code: o.source_id, source: o.source });
  });

  const semTypes = new Map();
  await readRrf(mgsty, (o) => {
    if (!semTypes.has(o.CUI)) semTypes.set(o.CUI, []);
    semTypes.get(o.CUI).push({ tui: o.TUI, name: o.STY });
  });

  const defs = new Map();
  const defOpen = new Set(OPEN_DEF_SABS);
  await readRrf(mgdef, (o) => {
    if (o.SUPPRESS !== 'N' || !defOpen.has(o.source)) {
      stats.defsDropped[o.source] = (stats.defsDropped[o.source] ?? 0) + 1;
      return;
    }
    stats.defsKept++;
    if (!defs.has(o.CUI)) defs.set(o.CUI, []);
    defs.get(o.CUI).push({ source: o.source, text: crToLf(o.DEF) });
  });

  const rows = [];
  const dropped = [];
  for (const cui of [...allCuis].sort()) {
    const entry = byCui.get(cui);
    if (!entry) {
      dropped.push(cui);
      stats.cuisWithoutOpenName++;
      continue;
    }
    stats.cuisWithOpenName++;
    const atoms = entry.atoms;
    const pref = prefName.get(cui) ?? null;
    let display;
    let rule;
    if (pref && atoms.some((a) => a.str === pref)) {
      display = pref;
      rule = 'pref_name coincide con un átomo abierto';
    } else {
      const ranked = [...atoms].sort((a, b) => {
        const pa = DISPLAY_PRIORITY.indexOf(a.sab);
        const pb = DISPLAY_PRIORITY.indexOf(b.sab);
        const ta = PREFERRED_TTY.has(a.tty) ? 0 : a.ts === 'P' && a.stt === 'PF' ? 1 : 2;
        const tb = PREFERRED_TTY.has(b.tty) ? 0 : b.ts === 'P' && b.stt === 'PF' ? 1 : 2;
        return ta - tb || pa - pb || a.str.localeCompare(b.str, 'en') || (a.str < b.str ? -1 : a.str > b.str ? 1 : 0);
      });
      display = ranked[0].str;
      rule = PREFERRED_TTY.has(ranked[0].tty) ? 'prioridad de fuente abierta' : 'primer átomo abierto';
    }
    stats.displayRule[rule]++;

    // Designaciones: cada texto exacto una vez, con las fuentes que lo aportan.
    const sourcesByText = new Map();
    for (const a of atoms) {
      if (!sourcesByText.has(a.str)) sourcesByText.set(a.str, []);
      sourcesByText.get(a.str).push(`${a.sab}:${a.tty}`);
    }
    const synonyms = [...sourcesByText.keys()].filter((s) => s !== display).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const designationSources = [display, ...synonyms].map((t) => ({ text: t, sources: uniq(sourcesByText.get(t)).sort() }));

    // Xrefs: códigos de los átomos abiertos + MedGenIDMappings (sin SNOMED ni variantes alélicas).
    const xrefSet = new Map();
    const addXref = (label, code) => xrefSet.set(`${label}:${code}`, { label, code });
    // Los códigos de HPO, MONDO, Orphanet y MeSH salen de MedGenIDMappings (columna source_id, explícita);
    // en MGCONSO esos átomos traen códigos de átomo (AN#######) y no sirven. NCI sí publica su código en CODE.
    for (const a of atoms) if (a.sab === 'NCI') addXref('NCI', a.code);
    for (const m of mappings.get(cui) ?? []) addXref(m.label, m.code);
    const xrefs = [...xrefSet.values()].sort((a, b) => (a.label + a.code < b.label + b.code ? -1 : 1));

    const maps = [];
    for (const x of xrefs) {
      const t = XREF_TARGETS[x.label];
      if (!t) continue;
      const code = t.code(x.code);
      for (const system of t.systems) maps.push({ system, code, context: `código ${x.label} publicado por MedGen para ${cui} (${x.label === 'NCI' ? 'MGCONSO' : 'MedGenIDMappings'})` });
    }

    const defList = defs.get(cui) ?? [];
    const usedComponents = uniq([...atoms.map((a) => a.sab), ...defList.map((d) => d.source)]).map((s) => (s === 'MedlinePlus Genetics' || s === 'MEDLINEPLUS' ? 'MedlinePlus' : s));
    const medgenUid = (mappings.get(cui) ?? []).find((m) => m.label === 'MEDGEN_UID')?.code ?? null;

    const row = {
      codeSystem: 'medgen',
      code: cui,
      display,
      designations: designationList(display, synonyms),
      definition: null,
      properties: cleanProps([
        prop('medgen_uid', 'string', medgenUid),
        prop('medgen_preferred_name', 'string', pref),
        prop('display_rule', 'string', rule),
        prop('semantic_types', 'json', (semTypes.get(cui) ?? []).sort((a, b) => (a.tui < b.tui ? -1 : 1))),
        prop('source_definitions', 'json', defList),
        prop('designation_sources', 'json', designationSources),
        prop('xrefs', 'json', xrefs.map((x) => `${x.label}:${x.code}`)),
        prop('component_licenses', 'json', Object.fromEntries(usedComponents.sort().map((s) => [s, COMPONENT_LICENSES[s]]))),
      ]),
      parents: [],
      maps,
      relations: [],
    };
    rows.push(withProvenance(row, prov, { source: 'medgen', sourceUrl: `https://www.ncbi.nlm.nih.gov/medgen/${medgenUid ?? cui}` }));
  }
  return { rows, dropped, stats };
}
