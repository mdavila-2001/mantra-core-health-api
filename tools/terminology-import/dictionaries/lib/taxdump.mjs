// =============================================================================
// NCBI Taxonomy (dominio público) desde el archivo mensual `taxdmp_AAAA-MM-DD.zip`
// que publica el NCBI en ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump_archive/.
// Se usa para completar la etiqueta de los taxones que Mondo y Disease Ontology
// DECLARAN como agente infeccioso o vector pero cuyos módulos de importación
// OBO no traen (el de Mondo es más viejo que sus aristas), y para contrastar las
// etiquetas que ya había.
//
// Formato (taxdump_readme.txt): campos separados por `\t|\t`, línea terminada
// en `\t|`. nodes.dmp: tax_id, parent tax_id, rank, … ; names.dmp: tax_id,
// name_txt, unique name, name class ; merged.dmp: old_tax_id, new_tax_id.
// Los nombres siguen las clases del propio NCBI; el mapeo de clase a alcance
// de sinónimo copia el que usa el módulo OBO de NCBITaxon (genbank common name
// → EXACT; el resto → RELATED, con la clase como tipo).
// =============================================================================

import { zipEntryLines } from './zip-mini.mjs';

export const splitDmp = (line) => line.replace(/\t\|\s*$/, '').split('\t|\t');

/** nodes.dmp → { parent: Int32Array, rankIndex: Uint8Array, ranks: string[] } indexados por tax_id. */
export async function readNodes(zipPath) {
  const ranks = [];
  const rankIdx = new Map();
  const pairs = [];
  let max = 0;
  for await (const line of zipEntryLines(zipPath, 'nodes.dmp')) {
    if (line === '') continue;
    const f = splitDmp(line);
    const id = Number(f[0]);
    const parent = Number(f[1]);
    if (!Number.isInteger(id) || !Number.isInteger(parent)) throw new Error(`nodes.dmp: línea inesperada «${line.slice(0, 80)}»`);
    if (!rankIdx.has(f[2])) { rankIdx.set(f[2], ranks.length); ranks.push(f[2]); }
    pairs.push(id, parent, rankIdx.get(f[2]));
    if (id > max) max = id;
  }
  const parent = new Int32Array(max + 1).fill(-1);
  const rankIndex = new Uint8Array(max + 1);
  for (let i = 0; i < pairs.length; i += 3) { parent[pairs[i]] = pairs[i + 1]; rankIndex[pairs[i]] = pairs[i + 2]; }
  return { parent, rankIndex, ranks, has: (id) => id >= 0 && id <= max && parent[id] !== -1 };
}

/** names.dmp → Map tax_id → [{ name, unique, nameClass }] sólo para los ids pedidos (un set de números). */
export async function readNames(zipPath, wanted) {
  const out = new Map();
  for await (const line of zipEntryLines(zipPath, 'names.dmp')) {
    if (line === '') continue;
    const f = splitDmp(line);
    const id = Number(f[0]);
    if (!wanted.has(id)) continue;
    if (!out.has(id)) out.set(id, []);
    out.get(id).push({ name: f[1], unique: f[2] || null, nameClass: f[3] });
  }
  return out;
}

/** merged.dmp → Map old_tax_id → new_tax_id. */
export async function readMerged(zipPath) {
  const out = new Map();
  for await (const line of zipEntryLines(zipPath, 'merged.dmp')) {
    if (line === '') continue;
    const f = splitDmp(line);
    out.set(Number(f[0]), Number(f[1]));
  }
  return out;
}

/** delnodes.dmp → Set de tax_id eliminados del NCBI. */
export async function readDeleted(zipPath) {
  const out = new Set();
  for await (const line of zipEntryLines(zipPath, 'delnodes.dmp')) if (line !== '') out.add(Number(splitDmp(line)[0]));
  return out;
}

const taxId = (curie) => Number(String(curie).replace(/^NCBITaxon:/, ''));

/** Ids (números) cuyo nombre hace falta: los faltantes y sus ancestros hasta el primer taxón que ya tiene etiqueta. */
export function taxdumpWanted(missingCuries, known, nodes) {
  const wanted = new Set();
  const queue = missingCuries.map(taxId);
  while (queue.length) {
    const id = queue.shift();
    if (wanted.has(id) || known.has(`NCBITaxon:${id}`) || !nodes.has(id)) continue;
    wanted.add(id);
    const p = nodes.parent[id];
    if (p !== id) queue.push(p);
  }
  return wanted;
}

/**
 * Taxones faltantes (con su linaje hasta el primer ancestro que ya tiene
 * etiqueta en `known`) → mapa con la misma forma que `taxaFromObo`.
 * Devuelve además los ids que el NCBI ya no tiene (sólo en merged.dmp o ausentes).
 */
export function taxaFromTaxdump(missingCuries, known, nodes, names, merged, deleted = new Set()) {
  const out = new Map();
  const unresolved = [];
  const queue = [...missingCuries];
  while (queue.length) {
    const curie = queue.shift();
    if (known.has(curie) || out.has(curie)) continue;
    const id = taxId(curie);
    if (!nodes.has(id)) {
      unresolved.push({ id: curie, reason: merged.has(id) ? `fusionado en NCBITaxon:${merged.get(id)} (merged.dmp)` : deleted.has(id) ? 'eliminado del NCBI Taxonomy (delnodes.dmp)' : 'ausente de nodes.dmp, merged.dmp y delnodes.dmp' });
      continue;
    }
    const entries = names.get(id) ?? [];
    const sci = entries.filter((e) => e.nameClass === 'scientific name');
    if (sci.length !== 1) {
      unresolved.push({ id: curie, reason: `${sci.length} nombres científicos en names.dmp` });
      continue;
    }
    const exact = [];
    const other = [];
    for (const e of entries) {
      if (e.nameClass === 'scientific name') continue;
      if (e.nameClass === 'genbank common name') exact.push(e.name);
      else other.push({ value: e.name, scope: 'RELATED', type: e.nameClass.replace(/ /g, '_') });
    }
    const parentId = nodes.parent[id];
    const parents = id === 1 || parentId === id ? [] : [`NCBITaxon:${parentId}`];
    out.set(curie, {
      id: curie,
      name: sci[0].name,
      parents,
      exact: [...new Set(exact)].filter((s) => s !== sci[0].name),
      other,
      rank: nodes.ranks[nodes.rankIndex[id]] ?? null,
      origin: 'taxdump',
    });
    for (const p of parents) queue.push(p);
  }
  return { taxa: out, unresolved };
}

/** Contrasta las etiquetas de los módulos OBO con el scientific name del NCBI (mismos ids). */
export function crossCheckLabels(taxa, names) {
  const differ = [];
  let compared = 0;
  let equal = 0;
  let absent = 0;
  for (const [curie, t] of taxa) {
    const entries = names.get(taxId(curie));
    const sci = entries?.find((e) => e.nameClass === 'scientific name');
    if (!sci) { absent++; continue; }
    compared++;
    if (sci.name === t.name) equal++;
    else differ.push({ id: curie, obo: t.name, ncbi: sci.name });
  }
  return { compared, equal, absent, differ: differ.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })) };
}
