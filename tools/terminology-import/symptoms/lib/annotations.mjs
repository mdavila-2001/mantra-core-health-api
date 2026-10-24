// =============================================================================
// Relaciones enfermedad → síntoma/fenotipo, SÓLO de anotaciones publicadas.
//
//   hpoa               phenotype.hpoa (HPO): OMIM, ORPHA (Orphanet) y DECIPHER,
//                      con frecuencia, evidencia, referencia, inicio, sexo y
//                      modificadores tal como vienen.
//   mondo              mondo.obo: `disease_has_feature` / `has_characteristic`
//                      hacia un término HP (axioma curado de Mondo).
//   doid               doid.owl: axioma `RO:0002452 has symptom` hacia SYMP.
//   hpo-common-disease anotaciones de enfermedades comunes de HPO (Groza et al.
//                      2015): evidencia ITM = minería de texto de PubMed hecha
//                      por la fuente; se conserva el código tal cual.
//
// Nada se deduce: cada fila es una línea/axioma de la fuente, con su id de
// origen. Una relación que la fuente niega (`NOT`) queda como `negated: true`
// y NUNCA se carga como asociación positiva.
// =============================================================================

import { createHash } from 'node:crypto';

/** Id estable de una relación del corpus (hex, 32). */
export function relationKey(parts) {
  return createHash('md5').update(parts.join('|'), 'utf8').digest('hex');
}

/** `OMIM:619340` → { prefix: 'OMIM', id: '619340', curie }. */
export function splitCurie(curie) {
  const i = curie.indexOf(':');
  if (i < 0) return { prefix: null, id: curie, curie };
  return { prefix: curie.slice(0, i), id: curie.slice(i + 1), curie };
}

/**
 * Frecuencia de HPOA tal como viene, más su lectura estructurada:
 * un término HP de frecuencia (HP:0040280…HP:0040285), `n/m` o `p%`.
 */
export function parseFrequency(raw) {
  const v = (raw ?? '').trim();
  if (!v) return null;
  if (/^HP:\d{7}$/.test(v)) return { raw: v, kind: 'hpo-term', hpo: v };
  let m = v.match(/^(\d+)\/(\d+)$/);
  if (m) return { raw: v, kind: 'ratio', numerator: Number(m[1]), denominator: Number(m[2]) };
  m = v.match(/^(\d+(?:\.\d+)?)%$/);
  if (m) return { raw: v, kind: 'percent', percent: Number(m[1]) };
  return { raw: v, kind: 'other' };
}

const list = (s) => (s ?? '').split(';').map((x) => x.trim()).filter(Boolean);

/** phenotype.hpoa → { header, rows }. Columnas por nombre (la fuente las declara). */
export function parseHpoa(text, provenance) {
  const header = {};
  const rows = [];
  let cols = null;
  for (const line of text.split('\n')) {
    if (!line) continue;
    if (line.startsWith('#')) {
      const m = line.match(/^#([\w-]+):\s*(.*)$/);
      if (m) header[m[1]] = m[2].trim();
      continue;
    }
    const f = line.split('\t');
    if (!cols) {
      cols = Object.fromEntries(f.map((name, i) => [name, i]));
      for (const c of ['database_id', 'disease_name', 'qualifier', 'hpo_id', 'reference', 'evidence', 'onset', 'frequency', 'sex', 'modifier', 'aspect', 'biocuration']) {
        if (!(c in cols)) throw new Error(`phenotype.hpoa sin columna ${c}`);
      }
      continue;
    }
    const get = (c) => (f[cols[c]] ?? '').trim();
    const disease = splitCurie(get('database_id'));
    const hpo = get('hpo_id');
    const negated = get('qualifier') === 'NOT';
    const row = {
      source: 'hpoa',
      sourceLabel: disease.prefix === 'ORPHA' ? 'HPO annotations (Orphanet)' : `HPO annotations (${disease.prefix})`,
      disease,
      diseaseName: get('disease_name'),
      phenotypeSystem: 'hpo',
      phenotype: hpo,
      negated,
      aspect: get('aspect'),
      frequency: parseFrequency(get('frequency')),
      evidence: get('evidence') || null,
      references: list(get('reference')),
      onset: get('onset') || null,
      sex: get('sex') || null,
      modifiers: list(get('modifier')),
      biocuration: list(get('biocuration')),
      version: header.version ?? null,
      sourceUri: 'https://hpo.jax.org/data/annotations',
      retrievedAt: provenance.retrievedAt,
      license: provenance.license,
    };
    // Una línea de HPOA es única por todas sus columnas; la clave las usa todas.
    row.key = relationKey(['hpoa', ...f.map((x) => x.trim())]);
    rows.push(row);
  }
  return { header, rows };
}

/** Mondo: axiomas `disease_has_feature` / `has_characteristic` hacia HP. */
export function mondoFeatureRows(terms, header, provenance) {
  const rows = [];
  for (const t of terms.values()) {
    if (t.obsolete || !t.id.startsWith('MONDO:')) continue;
    for (const r of t.relationships) {
      if (!['disease_has_feature', 'has_characteristic', 'RO:0004029', 'RO:0000053'].includes(r.pred)) continue;
      if (!r.target.startsWith('HP:')) continue;
      rows.push({
        source: 'mondo',
        sourceLabel: 'Mondo Disease Ontology',
        disease: splitCurie(t.id),
        diseaseName: t.name,
        phenotypeSystem: 'hpo',
        phenotype: r.target,
        negated: false,
        aspect: null,
        predicate: r.pred,
        frequency: null,
        evidence: r.qualifiers ?? null,
        references: [],
        onset: null,
        sex: null,
        modifiers: [],
        biocuration: [],
        version: header.dataVersion?.replace(/^releases\//, '') ?? null,
        sourceUri: `http://purl.obolibrary.org/obo/${t.id.replace(':', '_')}`,
        retrievedAt: provenance.retrievedAt,
        license: provenance.license,
        key: relationKey(['mondo', t.id, r.pred, r.target]),
      });
    }
  }
  return rows.sort((a, b) => a.disease.curie.localeCompare(b.disease.curie) || a.phenotype.localeCompare(b.phenotype));
}

/**
 * doid.owl (RDF/XML de OWL API): por cada `owl:Class` DOID no obsoleta, las
 * restricciones `RO_0002452` (has symptom) con `someValuesFrom` SYMP. Se lee
 * por bloques de clase; el formato lo escribe siempre la misma herramienta.
 */
export function doidSymptomAxioms(owlText, provenance) {
  const version = owlText.match(/owl:versionIRI rdf:resource="[^"]*releases\/([^/"]+)\//)?.[1] ?? null;
  const rows = [];
  // Se corta por apertura de clase con IRI: las clases anidadas (intersecciones
  // dentro de equivalentClass) son anónimas y no tienen rdf:about.
  const chunks = owlText.split('<owl:Class rdf:about="http://purl.obolibrary.org/obo/').slice(1);
  const restrRe = /<owl:onProperty rdf:resource="http:\/\/purl\.obolibrary\.org\/obo\/RO_0002452"\/>\s*<owl:someValuesFrom rdf:resource="http:\/\/purl\.obolibrary\.org\/obo\/(SYMP_\d+)"\/>/g;
  for (const chunk of chunks) {
    const m = chunk.match(/^(DOID_\d+)">([\s\S]*)$/);
    if (!m) continue;
    const body = m[2];
    if (/<owl:deprecated rdf:datatype="[^"]*">true<\/owl:deprecated>/.test(body)) continue;
    const id = m[1].replace('_', ':');
    const label = body.match(/<rdfs:label[^>]*>([^<]*)<\/rdfs:label>/)?.[1] ?? null;
    const seen = new Set();
    let r;
    while ((r = restrRe.exec(body))) {
      const symp = r[1].replace('_', ':');
      if (seen.has(symp)) continue;
      seen.add(symp);
      rows.push({
        source: 'doid',
        sourceLabel: 'Human Disease Ontology',
        disease: splitCurie(id),
        diseaseName: label,
        phenotypeSystem: 'symp',
        phenotype: symp,
        negated: false,
        aspect: null,
        predicate: 'RO:0002452',
        frequency: null,
        evidence: null,
        references: [],
        onset: null,
        sex: null,
        modifiers: [],
        biocuration: [],
        version,
        sourceUri: `http://purl.obolibrary.org/obo/${m[1]}`,
        retrievedAt: provenance.retrievedAt,
        license: provenance.license,
        key: relationKey(['doid', id, 'RO:0002452', symp]),
      });
    }
  }
  return rows.sort((a, b) => a.disease.curie.localeCompare(b.disease.curie) || a.phenotype.localeCompare(b.phenotype));
}

/**
 * Un archivo `.tab` de enfermedades comunes. `resolveHp` traduce ids viejos
 * con alt_id/replaced_by de HPO; lo que no resuelve se descarta y se cuenta.
 */
/**
 * Ids de clase DOID que declara doid.owl. Las anotaciones de enfermedades
 * comunes escriben el id con ceros a la izquierda (`DOID:0003660`) donde DO
 * publica `DOID:3660`; se normaliza SÓLO si el id tal cual no existe y el id
 * sin ceros sí (comprobado contra la release, no supuesto).
 */
export function doidIds(owlText) {
  const ids = new Set();
  for (const m of owlText.matchAll(/<owl:Class rdf:about="http:\/\/purl\.obolibrary\.org\/obo\/DOID_(\d+)">/g)) ids.add(`DOID:${m[1]}`);
  return ids;
}

export function doidNormalizer(ids) {
  return (curie) => {
    if (!curie.startsWith('DOID:') || ids.has(curie)) return { curie, normalized: null };
    const stripped = `DOID:${String(Number(curie.slice(5)))}`;
    return ids.has(stripped) ? { curie: stripped, normalized: 'zero-padding' } : { curie, normalized: null };
  };
}

export function commonDiseaseRows(tabText, file, resolveHp, provenance, stats, normalizeDoid = (c) => ({ curie: c, normalized: null })) {
  const lines = tabText.split('\n').filter((l) => l.trim() !== '');
  if (!lines.length) return [];
  const head = lines[0].split('\t');
  const c = (n) => head.indexOf(n);
  const rows = [];
  for (const line of lines.slice(1)) {
    const f = line.split('\t');
    const rawDisease = f[c('Disease ID')];
    // «DO:DOID:0003660» → DOID:0003660; «MESH:D049291» se queda.
    const published = rawDisease.startsWith('DO:') ? rawDisease.slice(3) : rawDisease;
    const { curie: diseaseCurie, normalized } = normalizeDoid(published);
    if (normalized) stats.doidNormalized = (stats.doidNormalized ?? 0) + 1;
    const rawHp = f[c('Phenotype ID')];
    const hit = resolveHp(rawHp);
    stats.read++;
    if (!hit) {
      stats.unresolvedHpo++;
      continue;
    }
    if (hit.via) stats.remapped++;
    const negated = Boolean(f[c('Negation ID')]?.trim());
    rows.push({
      source: 'hpo-common-disease',
      sourceLabel: 'HPO common disease annotations (Groza et al. 2015)',
      disease: splitCurie(diseaseCurie),
      diseaseAsPublished: published,
      diseaseIdNormalized: normalized,
      diseaseName: f[c('Disease Name')],
      phenotypeSystem: 'hpo',
      phenotype: hit.id,
      phenotypeAsPublished: rawHp,
      phenotypeRemap: hit.via,
      negated,
      aspect: null,
      frequency: parseFrequency(f[c('Frequency')]),
      evidence: f[c('Evidence ID')] || null,
      references: list(f[c('Pub')]),
      onset: f[c('Age of Onset ID')] || null,
      sex: f[c('Sex ID')] || null,
      modifiers: [],
      biocuration: [f[c('Assigned by')], f[c('Date Created')]].filter(Boolean),
      description: f[c('Description')] || null,
      version: '2015 (Groza et al., AJHG 97:111-124)',
      sourceUri: `https://data.monarchinitiative.org/hpo/common_disease_annot.tar.gz#${file}`,
      retrievedAt: provenance.retrievedAt,
      license: provenance.license,
      key: relationKey(['hpo-common-disease', file, line]),
    });
  }
  return rows;
}
