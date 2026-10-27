// =============================================================================
// Orphadata, producto 4 (`en_product4.xml` / `es_product4.xml`): fenotipos HPO
// de enfermedades raras, directo de Orphanet (CC BY 4.0, declarada en el XML).
//
// Cada `HPODisorderAssociation` es una afirmación «la enfermedad ORPHA:n
// presenta el término HPO h con frecuencia f». Se conserva tal cual, con:
//   - el id de la asociación en Orphanet (clave estable de la línea),
//   - la frecuencia como la publica Orphanet (clase y rango, EN y ES) y su
//     término HPO equivalente (ver ORPHA_FREQUENCY_TO_HPO),
//   - la marca de criterio diagnóstico / signo patognomónico si la hay,
//   - la fecha de validación y las fuentes (PMID) de la enfermedad.
//
// El archivo en castellano trae igual los términos HPO (en inglés): lo único
// que traduce Orphanet es el nombre de la enfermedad, su tipo/grupo, las
// clases de frecuencia y la marca de criterio. Nada se traduce acá.
// =============================================================================

import { createHash } from 'node:crypto';

/**
 * Clase de frecuencia de Orphanet (`HPOFrequency@id`) → término HPO de la
 * subrama «Frequency». NO es una suposición de nombres: se comprobó contra las
 * 116 517 asociaciones que Orphadata (2026-06-23) y `phenotype.hpoa`
 * (2026-09-02) comparten; cada clase coincide con un único término HPO en el
 * 99,9 % de los pares (los 15 desvíos son cambios de frecuencia entre las dos
 * publicaciones, ver `orphadata-crosscheck` en coverage). «Excluded (0%)» es el
 * `NOT` de HPOA, que no trae frecuencia.
 */
export const ORPHA_FREQUENCY_TO_HPO = {
  28405: 'HP:0040280', // Obligate (100%)
  28412: 'HP:0040281', // Very frequent (99-80%)
  28419: 'HP:0040282', // Frequent (79-30%)
  28426: 'HP:0040283', // Occasional (29-5%)
  28433: 'HP:0040284', // Very rare (<4-1%)
  28440: 'HP:0040285', // Excluded (0%)
};
export const ORPHA_EXCLUDED_FREQUENCY_ID = '28440';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
export const unescapeXml = (s) =>
  s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e]));

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([^<]*)</${name}>`));
  return m ? unescapeXml(m[1]).trim() : null;
};

/** Primer `<Name lang="…">` dentro de un elemento hijo (p. ej. DisorderType). */
const nameIn = (block, element) => {
  const m = block.match(new RegExp(`<${element}\\b[^>]*>\\s*<Name lang="[a-z]+">([^<]*)</Name>`));
  return m ? unescapeXml(m[1]).trim() : null;
};

/** `27555459[PMID]_27116393[PMID]` → ['PMID:27555459','PMID:27116393']; lo que no calza se deja como se publicó. */
export function parseSources(raw) {
  if (!raw) return [];
  return raw
    .split('_')
    .map((t) => t.replace(/ /g, ' ').trim())
    .filter(Boolean)
    .map((t) => {
      const m = t.match(/^(\d+)\s*\[PMID\]$/);
      return m ? `PMID:${m[1]}` : t;
    });
}

/** XML de producto 4 → { header, disorders }. Regular y pretty-printed: se recorre por bloques, sin cargar un DOM. */
export function parseProduct4(xml) {
  const head = xml.slice(0, 2000);
  const header = {
    date: head.match(/<JDBOR date="(\d{4}-\d{2}-\d{2})/)?.[1] ?? null,
    dateTime: head.match(/<JDBOR date="([^"]+)"/)?.[1] ?? null,
    schemaVersion: head.match(/<JDBOR[^>]* version="([^"]+)"/)?.[1] ?? null,
    licenseShort: tag(head, 'ShortIdentifier'),
    licenseName: tag(head, 'FullName'),
    licenseLegalCode: tag(head, 'LegalCode'),
  };
  const disorders = [];
  for (const block of xml.split('</HPODisorderSetStatus>')) {
    const start = block.indexOf('<HPODisorderSetStatus ');
    if (start < 0) continue;
    const b = block.slice(start);
    const orphaCode = tag(b, 'OrphaCode');
    if (!orphaCode) continue;
    const associations = [];
    for (const a of b.split('<HPODisorderAssociation ').slice(1)) {
      const diag = a.match(/<DiagnosticCriteria id="(\d+)">\s*<Name lang="[a-z]+">([^<]*)<\/Name>/);
      associations.push({
        id: a.match(/^id="(\d+)"/)[1],
        hpoId: tag(a, 'HPOId'),
        hpoTerm: tag(a, 'HPOTerm'),
        frequencyId: a.match(/<HPOFrequency id="(\d+)">/)?.[1] ?? null,
        frequencyName: nameIn(a, 'HPOFrequency'),
        diagnosticCriteriaId: diag?.[1] ?? null,
        diagnosticCriteriaName: diag ? unescapeXml(diag[2]).trim() : null,
      });
    }
    disorders.push({
      orphaCode,
      expertLink: tag(b, 'ExpertLink'),
      name: (() => {
        const m = b.match(/<\/ExpertLink>\s*<Name lang="[a-z]+">([^<]*)<\/Name>/);
        return m ? unescapeXml(m[1]).trim() : null;
      })(),
      typeName: nameIn(b, 'DisorderType'),
      groupName: nameIn(b, 'DisorderGroup'),
      sourceRaw: tag(b, 'Source'),
      validationStatus: tag(b, 'ValidationStatus'),
      validationDate: tag(b, 'ValidationDate')?.slice(0, 10) ?? null,
      associations,
    });
  }
  return { header, disorders };
}

const md5 = (parts) => createHash('md5').update(parts.join('|'), 'utf8').digest('hex');

/**
 * EN + ES → filas con la forma de las demás relaciones del corpus.
 * @param resolveHp  (id) → { id, via } | null   (hpoIdResolver)
 */
export function orphadataRows(enXml, esXml, resolveHp, prov) {
  const en = parseProduct4(enXml);
  const es = parseProduct4(esXml);
  const esByCode = new Map(es.disorders.map((d) => [d.orphaCode, d]));
  const esAssoc = new Map();
  for (const d of es.disorders) for (const a of d.associations) esAssoc.set(a.id, a);
  const stats = { disorders: en.disorders.length, associations: 0, unresolvedHpo: 0, remapped: 0, missingInEs: 0, excluded: 0, diagnosticCriteria: 0, pathognomonic: 0, unknownFrequency: 0 };
  const rows = [];
  for (const d of en.disorders) {
    const dEs = esByCode.get(d.orphaCode);
    if (!dEs) stats.missingInEs++;
    const references = parseSources(d.sourceRaw);
    for (const a of d.associations) {
      stats.associations++;
      const hit = resolveHp(a.hpoId);
      if (!hit) {
        stats.unresolvedHpo++;
        continue;
      }
      if (hit.via) stats.remapped++;
      const aEs = esAssoc.get(a.id);
      const hpoFreq = ORPHA_FREQUENCY_TO_HPO[a.frequencyId] ?? null;
      if (!hpoFreq) stats.unknownFrequency++;
      const negated = a.frequencyId === ORPHA_EXCLUDED_FREQUENCY_ID;
      if (negated) stats.excluded++;
      if (a.diagnosticCriteriaName === 'Diagnostic criterion') stats.diagnosticCriteria++;
      if (a.diagnosticCriteriaName === 'Pathognomonic sign') stats.pathognomonic++;
      rows.push({
        source: 'orphadata',
        sourceLabel: 'Orphadata producto 4 (Orphanet)',
        disease: { prefix: 'ORPHA', id: d.orphaCode, curie: `ORPHA:${d.orphaCode}` },
        diseaseName: d.name,
        diseaseNameEs: dEs?.name ?? null,
        diseaseType: d.typeName,
        diseaseTypeEs: dEs?.typeName ?? null,
        phenotypeSystem: 'hpo',
        phenotype: hit.id,
        phenotypeAsPublished: a.hpoId,
        phenotypeTermAsPublished: a.hpoTerm,
        phenotypeRemap: hit.via,
        negated,
        aspect: null,
        frequency: a.frequencyName
          ? { raw: a.frequencyName, rawEs: aEs?.frequencyName ?? null, kind: hpoFreq ? 'hpo-term' : 'other', hpo: hpoFreq, orphanetFrequencyId: a.frequencyId }
          : null,
        evidence: null,
        references,
        onset: null,
        sex: null,
        modifiers: [],
        biocuration: [d.validationStatus ? `ValidationStatus=${d.validationStatus}` : null, d.validationDate ? `ValidationDate=${d.validationDate}` : null].filter(Boolean),
        diagnosticCriteria: a.diagnosticCriteriaName ? { en: a.diagnosticCriteriaName, es: aEs?.diagnosticCriteriaName ?? null } : null,
        orphanetAssociationId: a.id,
        validationDate: d.validationDate,
        version: en.header.date,
        sourceUri: d.expertLink,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
        key: md5(['orphadata', a.id]),
      });
    }
  }
  return { rows, header: en.header, headerEs: es.header, stats };
}

/**
 * Compara contra `phenotype.hpoa` (filas ORPHA): pares compartidos, sólo en
 * uno u otro, y tabla clase de frecuencia ↔ término HPO. Es el control que
 * respalda ORPHA_FREQUENCY_TO_HPO.
 */
export function crossCheckWithHpoa(orphadataRows, hpoaRows) {
  const orphaPairs = new Map();
  for (const r of orphadataRows) orphaPairs.set(`${r.disease.curie}|${r.phenotype}`, r);
  const hpoaOrpha = hpoaRows.filter((r) => r.disease.prefix === 'ORPHA');
  const hpoaPairs = new Set();
  const crossTab = {};
  let shared = 0;
  for (const r of hpoaOrpha) {
    const k = `${r.disease.curie}|${r.phenotype}`;
    hpoaPairs.add(k);
    const o = orphaPairs.get(k);
    if (!o) continue;
    shared++;
    const key = `${o.frequency?.raw ?? '(sin dato)'} => ${r.frequency?.raw ?? '(sin dato)'}`;
    crossTab[key] = (crossTab[key] ?? 0) + 1;
  }
  const onlyOrphadata = [...orphaPairs.keys()].filter((k) => !hpoaPairs.has(k));
  return {
    orphadataDistinctPairs: orphaPairs.size,
    hpoaOrphaRows: hpoaOrpha.length,
    sharedPairs: shared,
    onlyInOrphadata: onlyOrphadata.length,
    onlyInHpoa: hpoaOrpha.filter((r) => !orphaPairs.has(`${r.disease.curie}|${r.phenotype}`)).length,
    frequencyCrossTab: Object.fromEntries(Object.entries(crossTab).sort((x, y) => y[1] - x[1])),
    onlyInOrphadataSample: onlyOrphadata.slice(0, 5),
  };
}
