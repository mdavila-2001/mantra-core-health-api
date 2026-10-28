// =============================================================================
// AbreMES-DB — base de datos de abreviaturas médicas en castellano (Plan TL /
// BSC, Zenodo 10.5281/zenodo.2207130). La construyó una extracción AUTOMÁTICA:
// detecta, en títulos y resúmenes en castellano de SciELO, IBECS y PubMed,
// abreviaturas con su definición escrita en la misma oración. No es un
// diccionario curado: hay pares ruidosos y de áreas no médicas, y la fuente
// publica la frecuencia de cada par para que quien consulta pueda filtrar.
//
// La unidad es el PAR (abreviatura, definición) de `pairs.tsv`, con el id de
// par de la fuente. display = definición (la forma larga), designación =
// abreviatura, igual que el Metainventario. Todo verbatim, en castellano.
// =============================================================================

import { provenance } from './terms.mjs';

export const PAIRS_COLUMNS = ['# Pair ID', 'Abbreviation ID', 'Definition ID', 'Frequency', 'Abbreviation', 'Definition', 'Appears on'];

/** `pairs.tsv` → [{ pairId, abbreviationId, definitionId, frequency, abbreviation, definition, publications }]. */
export function parsePairs(text) {
  const lines = text.split(/\r?\n/).filter((l) => l !== '');
  const header = lines[0].split('\t');
  if (PAIRS_COLUMNS.some((c, i) => header[i] !== c)) throw new Error(`AbreMES-DB: cabecera inesperada «${lines[0]}»`);
  return lines.slice(1).map((l, i) => {
    const v = l.split('\t');
    if (v.length !== PAIRS_COLUMNS.length) throw new Error(`AbreMES-DB: la línea ${i + 2} tiene ${v.length} columnas`);
    const frequency = Number(v[3]);
    if (!Number.isInteger(frequency) || frequency < 1) throw new Error(`AbreMES-DB: frecuencia inválida en el par ${v[0]}`);
    return {
      pairId: v[0],
      abbreviationId: v[1],
      definitionId: v[2],
      frequency,
      abbreviation: v[4],
      definition: v[5],
      // «Appears on»: ids o URL de publicaciones separados por coma. Se guarda sólo el conteo (las URL pesan más que el término).
      publications: v[6] === '' ? 0 : v[6].split(',').length,
    };
  });
}

/** Pares → filas. `minFrequency` define el piso de la carga por defecto (los demás quedan opt-in). */
export function abremesRows(pairs, source, file) {
  const stats = { pairs: pairs.length, distinctAbbreviations: new Set(pairs.map((p) => p.abbreviation)).size, byFrequency: {} };
  const rows = pairs.map((p) => {
    const bucket = p.frequency >= 10 ? '10+' : p.frequency >= 3 ? '3-9' : String(p.frequency);
    stats.byFrequency[bucket] = (stats.byFrequency[bucket] ?? 0) + 1;
    return {
      key: `${source.codeSystem}|${p.pairId}`,
      codeSystem: source.codeSystem,
      code: p.pairId,
      domain: source.domain,
      lang: 'es',
      display: p.definition,
      definition: null,
      definitionXrefs: [],
      synonymsExact: p.abbreviation === p.definition ? [] : [p.abbreviation],
      synonymsOther: [],
      xrefs: [],
      subsets: [],
      namespace: 'automatic-extraction',
      altIds: [],
      relations: [],
      otherRelations: [],
      tier: p.frequency >= source.defaultMinFrequency ? 'default' : 'opt-in',
      extra: {
        abbreviation: p.abbreviation,
        abbreviationId: p.abbreviationId,
        definitionId: p.definitionId,
        frequency: p.frequency,
        publications: p.publications,
        curation: 'extracción automática de metadatos de publicaciones en castellano; no revisada por personas',
      },
      provenance: provenance(source, p.pairId, { file }),
    };
  });
  return { rows, stats };
}
