// =============================================================================
// MedGen (NCBI/NLM): conceptos de condiciones y fenotipos genéticos, un
// concepto por CUI (`C#######`; `CN#######` los crea NCBI cuando UMLS no tiene
// uno). Archivos: MGCONSO (átomos = nombres por fuente), MGSTY (tipos
// semánticos), MGDEF (definiciones), MedGenIDMappings (nombre preferido de
// MedGen y códigos en otras fuentes).
//
// QUÉ SE CARGA Y QUÉ NO (licencias, ver SOURCES.md):
//   Nombres:  sólo átomos de fuentes abiertas — GTR (NCBI), MONDO, NCI
//             Thesaurus, MeSH, Orphanet (ORDO). Un CUI cuyos únicos nombres
//             vienen de SNOMED CT, OMIM, GeneReviews o HPO NO se carga (se cuenta).
//             HPO queda FUERA de los textos (nombres y definiciones) porque su
//             aviso legal habla de «personal, noncommercial use» y el
//             propietario no lo resolvió (symptoms/lib/approvals.mjs): sólo se
//             conserva su identificador como xref.
//   Defs:     NCI, MONDO, ORDO/Orphanet, MeSH, MedlinePlus (Genetics).
//   Xrefs:    sólo identificadores (HPO, MONDO, Orphanet, MeSH, NCI, número
//             MIM y serie fenotípica PS, GARD, UID de MedGen). Se EXCLUYEN los
//             ids de SNOMED CT y las variantes alélicas de OMIM (un id por
//             variante: no es vocabulario).
//   Nada se une por parecido de nombre: los mapas salen de los códigos que
//   MedGen publica en MGCONSO/MedGenIDMappings.
// =============================================================================

import { readDelimited } from './delimited.mjs';
import { readRrf } from './rrf.mjs';
import { cleanProps, designationList, prop, uniq, withProvenance } from './rows.mjs';

/** SAB (MGCONSO) cuyos NOMBRES se cargan, y a qué licencia remiten. */
export const OPEN_NAME_SABS = ['MONDO', 'NCI', 'ORDO', 'MSH', 'GTR'];
/** SAB (MGDEF) cuyas DEFINICIONES se cargan. */
export const OPEN_DEF_SABS = ['NCI', 'MONDO', 'ORDO', 'ORPHANET', 'MSH', 'MedlinePlus Genetics', 'MEDLINEPLUS'];
/** Orden de preferencia para elegir el nombre a mostrar si MedGen no coincide con ningún átomo abierto. */
const DISPLAY_PRIORITY = ['MONDO', 'NCI', 'ORDO', 'MSH', 'GTR'];
/** SAB de MGREL cuyas relaciones se cargan (fuentes abiertas; HPO queda fuera igual que sus nombres, OMIM por licencia). */
export const OPEN_REL_SABS = ['NCI', 'MSH', 'ORDO', 'GTR', 'MONDO'];
const PREFERRED_TTY = new Set(['PT', 'MH', 'NM', 'PCE']);

/** Licencia de cada componente cuyo texto o código entra en un concepto. */
export const COMPONENT_LICENSES = {
  MONDO: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) — Mondo Disease Ontology, Monarch Initiative',
  NCI: 'CC BY 4.0 según los términos de uso de NCI EVS (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm, leídos el 2026-10-28: «The NCI Thesaurus™ is released under the Creative Commons Attribution 4.0 International license (CC BY 4.0)»). «NCI Thesaurus» es marca registrada: sólo la edición publicada por NCI puede llevar ese nombre; acá hay nombres y definiciones de NCI recibidos vía MedGen, no la edición oficial',
  ORDO: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode) — Orphanet (c) INSERM',
  ORPHANET: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode) — Orphanet (c) INSERM',
  MSH: 'MeSH (https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html, leída el 2026-10-28): «NLM freely provides MeSH data»; quien redistribuye acepta reconocer a NLM de forma clara, no insinuar su aval y mantener la versión vigente o dejar claro que no lo está (la versión de cada fila figura en source_version)',
  GTR: 'Genetic Testing Registry (NCBI/NLM): mismas condiciones que el resto de NCBI (aviso «Molecular Data Usage» en source_license)',
  MedlinePlus: 'MedlinePlus Genetics (NLM): los resúmenes de genética figuran como contenido sin copyright en https://medlineplus.gov/about/using/usingcontent/; se pide atribución: «Fuente: MedlinePlus, National Library of Medicine»',
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
export async function medgenRows({ mgconso, mgsty, mgdef, idmappings, mgrel = null, merged = null, cuiHistory = null, clinvarHistory = null, clinvarCategories = new Map() }, prov) {
  const stats = { atoms: 0, atomsSuppressed: 0, atomsByExcludedSab: {}, cuis: 0, cuisWithOpenName: 0, cuisWithoutOpenName: 0, displayRule: { 'pref_name coincide con un átomo abierto': 0, 'prioridad de fuente abierta': 0, 'primer átomo abierto': 0 }, defsKept: 0, defsDropped: {}, mappingKept: {}, mappingExcluded: {} };
  const open = new Set(OPEN_NAME_SABS);

  /** @type {Map<string, {atoms: any[], seen: Set<string>}>} */
  const byCui = new Map();
  const allCuis = new Set();
  const withHpoName = new Set(); // CUI con átomo HPO vigente: si el propietario aprueba HPO, entran sus nombres.
  await readRrf(mgconso, (o) => {
    stats.atoms++;
    allCuis.add(o.CUI);
    if (o.SUPPRESS !== 'N') {
      stats.atomsSuppressed++;
      return;
    }
    if (!open.has(o.SAB)) {
      if (o.SAB === 'HPO') withHpoName.add(o.CUI);
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

  // Jerarquía y roles de MGREL. Fila `CUI1 CHD CUI2` = CUI2 es hijo de CUI1 (README de MedGen: «CHD: has a child
  // relationship»; comprobado con MeSH: Abdominal Neoplasms CHD Peritoneal Neoplasms). Las filas PAR son el espejo.
  const hierarchy = new Map(); // hijo → [{ parent, sab, rela }]
  const roles = new Map(); // CUI1 → [{ rela, cui, sab }]
  stats.rel = { rows: 0, kept: {}, parNoMirror: {}, skippedSabs: {} };
  if (mgrel) {
    const openRel = new Set(OPEN_REL_SABS);
    const chdKeys = new Set();
    const parRows = [];
    await readRrf(mgrel, (o) => {
      stats.rel.rows++;
      if (o.SUPPRESS !== 'N') return;
      if (!openRel.has(o.SAB)) {
        stats.rel.skippedSabs[o.SAB] = (stats.rel.skippedSabs[o.SAB] ?? 0) + 1;
        return;
      }
      if (o.REL === 'CHD') {
        chdKeys.add(`${o.CUI1}>${o.CUI2}>${o.SAB}`);
        if (!hierarchy.has(o.CUI2)) hierarchy.set(o.CUI2, []);
        hierarchy.get(o.CUI2).push({ parent: o.CUI1, sab: o.SAB, rela: o.RELA === '' ? null : o.RELA });
        stats.rel.kept[`${o.SAB} CHD`] = (stats.rel.kept[`${o.SAB} CHD`] ?? 0) + 1;
      } else if (o.REL === 'PAR') parRows.push(o);
      else if (o.REL === 'RO' && o.RELA !== '') {
        if (!roles.has(o.CUI1)) roles.set(o.CUI1, []);
        roles.get(o.CUI1).push({ rela: o.RELA, cui: o.CUI2, sab: o.SAB });
        stats.rel.kept[`${o.SAB} RO`] = (stats.rel.kept[`${o.SAB} RO`] ?? 0) + 1;
      } else stats.rel.skippedSabs[`${o.SAB} ${o.REL}`] = (stats.rel.skippedSabs[`${o.SAB} ${o.REL}`] ?? 0) + 1;
    });
    // PAR es el espejo de CHD: se verifica, no se carga.
    for (const o of parRows) if (!chdKeys.has(`${o.CUI2}>${o.CUI1}>${o.SAB}`)) stats.rel.parNoMirror[o.SAB] = (stats.rel.parNoMirror[o.SAB] ?? 0) + 1;
  }
  // CUI retirados que hoy son otro CUI: MERGED.RRF (fusiones) y MedGen_CUI_history.txt (reemplazos, con fecha).
  const retired = new Map(); // CUI vigente → [{ cui, kind, date }]
  const addRetired = (current, cui, kind, date) => {
    if (!retired.has(current)) retired.set(current, []);
    retired.get(current).push({ cui, kind, date });
  };
  stats.retired = { merged: 0, history: 0, clinvarHistory: 0, clinvarNoLongerReported: 0 };
  if (merged) {
    await readRrf(merged, (o) => {
      stats.retired.merged++;
      addRetired(o.toCUI, o.CUI, 'MERGED.RRF', null);
    });
  }
  if (cuiHistory) {
    // Cada línea termina en «|» (también el encabezado `#Previous_CUI<TAB>Current_CUI<TAB>Date_Of_Action|`).
    const { header } = await readDelimited(cuiHistory, (f) => {
      stats.retired.history++;
      addRetired(f[1], f[0], 'MedGen_CUI_history.txt', f[2].replace(/\|$/, ''));
    }, { quote: null, stripHash: true });
    if (header.join('\t') !== 'Previous_CUI\tCurrent_CUI\tDate_Of_Action|') throw new Error(`${cuiHistory}: columnas inesperadas: ${header.join('\t')}`);
  }
  if (clinvarHistory) {
    // `Previous ConceptID<TAB>Current ConceptID<TAB>Date Of Action`; el vigente puede ser «No longer reported» (sin reemplazo).
    const { header } = await readDelimited(clinvarHistory, (f) => {
      stats.retired.clinvarHistory++;
      if (f[1] === 'No longer reported') stats.retired.clinvarNoLongerReported++;
      else addRetired(f[1], f[0], 'ConceptID_history.txt (ClinVar)', f[2]);
    }, { quote: null });
    if (header.join('\t') !== 'Previous ConceptID\tCurrent ConceptID\tDate Of Action') throw new Error(`${clinvarHistory}: columnas inesperadas: ${header.join('\t')}`);
  }
  const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const uniqBy = (list, key) => [...new Map(list.map((x) => [key(x), x])).values()];

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

    const hier = uniqBy(hierarchy.get(cui) ?? [], (h) => `${h.sab}|${h.parent}|${h.rela}`).sort((a, b) => byText(`${a.sab}|${a.parent}`, `${b.sab}|${b.parent}`));
    const role = uniqBy(roles.get(cui) ?? [], (r) => `${r.sab}|${r.rela}|${r.cui}`).sort((a, b) => byText(`${a.sab}|${a.rela}|${a.cui}`, `${b.sab}|${b.rela}|${b.cui}`));
    // Sólo NCI declara `isa` explícito: eso va como is-a. El resto de CHD (MeSH, Orphanet, GTR) es jerarquía de la fuente, sin afirmar is-a.
    // Dos códigos de NCI pueden compartir CUI (69 filas `isa` con CUI1 = CUI2): a nivel de concepto sería su propio padre, así que no es una arista is-a
    // (queda en source_hierarchy_parents con su fuente).
    const isaParents = uniq(hier.filter((h) => h.sab === 'NCI' && h.rela === 'isa' && h.parent !== cui).map((h) => h.parent)).sort(byText);
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
        prop('retired_cuis', 'json', retired.has(cui) ? uniqBy(retired.get(cui), (x) => `${x.kind}|${x.cui}|${x.date}`).sort((a, b) => byText(`${a.cui}|${a.kind}|${a.date}`, `${b.cui}|${b.kind}|${b.date}`)) : null),
        prop('clinvar_condition_categories', 'json', clinvarCategories.get(cui) ?? null),
        prop('source_hierarchy_parents', 'json', hier),
        prop('source_roles', 'json', role),
        prop('component_licenses', 'json', Object.fromEntries(usedComponents.sort().map((s) => [s, COMPONENT_LICENSES[s]]))),
      ]),
      parents: isaParents,
      maps,
      relations: [],
    };
    rows.push(withProvenance(row, prov, { source: 'medgen', sourceUrl: `https://www.ncbi.nlm.nih.gov/medgen/${medgenUid ?? cui}` }));
  }
  stats.cuisDroppedWithHpoName = dropped.filter((c) => withHpoName.has(c)).length;
  return { rows, dropped, stats };
}
