// =============================================================================
// Catálogo de análisis · CDISC SDTM Controlled Terminology (NCI EVS).
//
// Fuente: `SDTM Terminology.txt` de https://evs.nci.nih.gov/ftp1/CDISC/SDTM/
// (tabulado, una fila por codelist y una por término). Entran SÓLO las
// codelists «Test Code» cuyo dominio SDTM es una prueba diagnóstica
// (`CDISC_CODELISTS`); las demás (hallazgos de examen, cuestionarios, signos
// vitales, mezclas como Cardiovascular u Ophthalmic Exam) quedan fuera y se
// cuentan en `stats.excludedCodelists`.
//
// Un mismo C-code de NCI puede estar en varias codelists (p. ej. Laboratory y
// Microscopic Findings) con dominios distintos: el concepto es el TÉRMINO DE
// LA CODELIST, `<codelist>.<término>`, como lo identifica CDISC. No se fusiona
// nada: CDISC publica un mapeo LOINC→LB aparte, que no se carga acá.
// =============================================================================

import { compact, conceptIdFor } from './records.mjs';

export const CDISC_CODE_SYSTEM = 'cdisc-sdtm';
export const CDISC_LICENSE =
  'CDISC Controlled Terminology, mantenida y distribuida por NCI EVS como parte del NCI Thesaurus (así lo declara cdisc.org); NCI Thesaurus se publica bajo Creative Commons Attribution 4.0 (CC BY 4.0, https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm): se cita a CDISC y a NCI EVS.';

/** Codelists incluidas: «Test Code» → su par «Test Name», dominio SDTM y dominio AloVida. */
export const CDISC_CODELISTS = {
  C65047: { name: 'C67154', sdtm: 'LB', domain: 'laboratory', evidence: 'Laboratory Test Code: analitos de laboratorio clínico.' },
  C120527: { name: 'C120528', sdtm: 'MB', domain: 'laboratory', evidence: 'Microbiology Test Code: organismos, antígenos y ácidos nucleicos detectados en muestras.' },
  C128688: { name: 'C128687', sdtm: 'MS', domain: 'laboratory', evidence: 'Microbiology Susceptibility Test Code: pruebas de sensibilidad antimicrobiana.' },
  C181173: { name: 'C181174', sdtm: 'CP', domain: 'laboratory', evidence: 'Cell Phenotyping Test Code: poblaciones celulares por citometría.' },
  C120525: { name: 'C120526', sdtm: 'IS', domain: 'laboratory', evidence: 'Immunogenicity Specimen Assessments Test Code: anticuerpos y citocinas medidos en muestras.' },
  C181178: { name: 'C181179', sdtm: 'GF', domain: 'genetics', evidence: 'Genomic Findings Test Code: tipos de hallazgo genómico (variante, fusión, metilación…).' },
  C132263: { name: 'C132262', sdtm: 'MI', domain: 'pathology', evidence: 'SDTM Microscopic Findings Test Code: marcadores y hallazgos evaluados al microscopio.' },
  C71153: { name: 'C71152', sdtm: 'EG', domain: 'functional', evidence: 'ECG Test Code: mediciones e interpretaciones del electrocardiograma.' },
  C120523: { name: 'C120524', sdtm: 'EG', domain: 'functional', evidence: 'Holter ECG Test Code: mediciones del Holter.' },
  C111106: { name: 'C111107', sdtm: 'RE', domain: 'functional', evidence: 'Respiratory Test Code: espirometría, volúmenes, difusión y ergoespirometría.' },
};

export const CDISC_COLUMNS = ['Code', 'Codelist Code', 'Codelist Extensible (Yes/No)', 'Codelist Name', 'CDISC Submission Value', 'CDISC Synonym(s)', 'CDISC Definition', 'NCI Preferred Term'];

/** Filas del archivo tabulado, validando la cabecera. */
export function parseCdiscTerminology(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const header = lines[0].split('\t');
  if (CDISC_COLUMNS.some((c, i) => header[i] !== c)) throw new Error(`CDISC: cabecera inesperada: ${header.join(' | ')}`);
  return lines.slice(1).map((l) => {
    const v = l.split('\t');
    return Object.fromEntries(CDISC_COLUMNS.map((c, i) => [c, (v[i] ?? '').trim()]));
  });
}

const slug = (s) => s.toLowerCase();

export function cdiscRecords(rows, prov) {
  const codelists = new Map(rows.filter((r) => !r['Codelist Code']).map((r) => [r.Code, r]));
  const termsOf = new Map();
  for (const r of rows) if (r['Codelist Code']) (termsOf.get(r['Codelist Code']) ?? termsOf.set(r['Codelist Code'], []).get(r['Codelist Code'])).push(r);
  for (const [code, cfg] of Object.entries(CDISC_CODELISTS)) {
    if (!codelists.has(code) || !codelists.has(cfg.name)) throw new Error(`CDISC: falta la codelist ${code} o su par ${cfg.name}`);
  }
  const records = [];
  const byCodelist = {};
  let withoutTestName = 0;
  for (const [listCode, cfg] of Object.entries(CDISC_CODELISTS)) {
    const list = codelists.get(listCode);
    const testNames = new Map((termsOf.get(cfg.name) ?? []).map((t) => [t.Code, t['CDISC Submission Value']]));
    const terms = termsOf.get(listCode) ?? [];
    byCodelist[listCode] = terms.length;
    for (const t of terms) {
      const code = `${listCode}.${t.Code}`;
      const testName = testNames.get(t.Code) ?? null;
      if (!testName) withoutTestName += 1;
      records.push({
        id: conceptIdFor(CDISC_CODE_SYSTEM, code),
        codeSystem: CDISC_CODE_SYSTEM,
        code,
        display: testName ?? t['NCI Preferred Term'] ?? t['CDISC Submission Value'],
        definition: t['CDISC Definition'] || null,
        lang: 'en',
        selectable: true,
        status: 'active',
        category: { scheme: 'cdisc-sdtm-codelist', code: listCode, display: list['Codelist Name'] },
        domain: cfg.domain,
        domainRule: `cdisc:codelist-${listCode}-${cfg.sdtm}`,
        properties: compact({
          cdisc_nci_code: t.Code,
          cdisc_codelist_code: listCode,
          cdisc_codelist_name: list['Codelist Name'],
          cdisc_sdtm_domain: cfg.sdtm,
          cdisc_submission_value: t['CDISC Submission Value'],
          cdisc_test_name: testName,
          cdisc_test_name_codelist: cfg.name,
          cdisc_synonyms: t['CDISC Synonym(s)'] ? t['CDISC Synonym(s)'].split(';').map((s) => s.trim()).filter(Boolean) : [],
          cdisc_nci_preferred_term: t['NCI Preferred Term'],
          cdisc_codelist_extensible: list['Codelist Extensible (Yes/No)'],
          lab_catalog_domain: cfg.domain,
          lab_catalog_domain_rule: `cdisc:codelist-${listCode}-${cfg.sdtm}`,
        }),
        designations: [],
        relations: [],
        valueSets: [`lab-catalog-${CDISC_CODE_SYSTEM}`, `lab-catalog-${CDISC_CODE_SYSTEM}-cat-${slug(listCode)}`, `lab-catalog-domain-${cfg.domain}`],
        provenance: {
          source: CDISC_CODE_SYSTEM,
          sourceName: 'CDISC SDTM Controlled Terminology (NCI EVS)',
          sourceId: `${listCode}/${t.Code} (${t['CDISC Submission Value']})`,
          sourceVersion: prov.sourceVersion,
          sourceUrl: `https://evs.nci.nih.gov/ftp1/CDISC/SDTM/`,
          sourceFile: prov.sourceFile,
          sourceSha256: prov.sourceSha256,
          retrievedAt: prov.retrievedAt,
          license: CDISC_LICENSE,
        },
      });
    }
  }
  const excludedCodelists = {};
  for (const [code, l] of codelists) {
    if (/Test Code$/.test(l['Codelist Name']) && !CDISC_CODELISTS[code]) excludedCodelists[`${code} ${l['Codelist Name']}`] = termsOf.get(code)?.length ?? 0;
  }
  return { records, stats: { rows: rows.length, codelists: codelists.size, byCodelist, withoutTestName, excludedCodelists } };
}
