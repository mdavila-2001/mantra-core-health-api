// =============================================================================
// Fuentes que sólo se MIDEN (no se cargan): cada una se reduce a ítems con los
// cruces que la propia fuente (o MONDO, hacia ella) publica. Un ítem es nuevo
// si ninguno de sus cruces de equivalencia cae en un concepto ya cargado.
// `closeMatch` y similares no deduplican.
// =============================================================================

import { readFileSync } from 'node:fs';

/** NANDO (Turtle): clases vigentes con su `skos:exactMatch` a MONDO. */
export function measureNando(path, mondoRecords) {
  const ttl = readFileSync(path, 'utf8');
  const reverse = new Map();
  for (const r of mondoRecords) {
    if (r.status !== 'active') continue;
    for (const x of r.properties.disease_external_xrefs?.NANDO ?? []) (reverse.get(x) ?? reverse.set(x, []).get(x)).push(r.code);
  }
  const items = [];
  for (const block of ttl.split(/\n(?=<http:\/\/nanbyodata\.jp\/ontology\/NANDO_)/)) {
    const id = /dcterms:identifier "(NANDO:\d+)"/.exec(block)?.[1];
    if (!id || /owl:deprecated true/.test(block)) continue;
    const exact = [...(/skos:exactMatch ([^;]+);/.exec(block)?.[1] ?? '').matchAll(/obo:MONDO_(\d+)/g)].map((m) => `MONDO:${m[1]}`);
    const links = [...new Set([...exact, ...(reverse.get(id) ?? [])])].map((code) => ({ cs: 'mondo', code }));
    items.push({ id, links });
  }
  return items;
}

/** OncoTree: tipos tumorales (nivel ≥ 2, bajo tejido) con sus NCI/UMLS y el ONCOTREE que publica MONDO. */
export function measureOncotree(path, mondoRecords) {
  const tree = JSON.parse(readFileSync(path, 'utf8'));
  const reverse = new Map();
  for (const r of mondoRecords) {
    if (r.status !== 'active') continue;
    for (const x of r.properties.disease_external_xrefs?.ONCOTREE ?? []) (reverse.get(x.slice(9)) ?? reverse.set(x.slice(9), []).get(x.slice(9))).push(r.code);
  }
  const items = [];
  const walk = (nodes, depth) => {
    for (const n of Object.values(nodes ?? {})) {
      if (depth >= 2) {
        const refs = n.externalReferences ?? {};
        items.push({
          id: `ONCOTREE:${n.code}`,
          links: [
            ...(refs.NCI ?? []).map((code) => ({ cs: 'ncit-disease', code })),
            ...(refs.UMLS ?? []).map((code) => ({ cs: 'umls', code })),
            ...(reverse.get(n.code) ?? []).map((code) => ({ cs: 'mondo', code })),
          ],
        });
      }
      walk(n.children, depth + 1);
    }
  };
  walk(tree, 0);
  return items;
}

/** Hetionet: nodos Disease (DOID); un DOID retirado resuelve por su `alt_id` en DOID vigente. */
export function measureHetionet(path, doidRecords) {
  const alt = new Map();
  for (const r of doidRecords) for (const a of r.properties.disease_alt_ids ?? []) alt.set(a, r.code);
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('Disease::'))
    .map((l) => {
      const code = l.split('\t')[0].slice('Disease::'.length);
      return { id: code, links: [{ cs: 'doid', code: alt.get(code) ?? code }] };
    });
}

/**
 * GARD (conversión PyOBO de NCATS GARD, ids heredados): enlazado si DOID lo
 * cita como xref u Orphanet lo alinea con relación E. GARD no publica cruces.
 */
export function measureGard(path, doidRecords, orphanetRecords) {
  const linked = new Map();
  const add = (gard, link) => (linked.get(gard) ?? linked.set(gard, []).get(gard)).push(link);
  for (const r of doidRecords) if (r.status === 'active') for (const x of r.properties.disease_external_xrefs?.GARD ?? []) add(x.slice(5), { cs: 'doid', code: r.code });
  for (const r of orphanetRecords) {
    if (r.status !== 'active') continue;
    for (const x of r.properties.disease_external_xrefs?.GARD ?? []) if (x.relation === 'E') add(x.code, { cs: 'orphanet', code: r.code });
  }
  return [...readFileSync(path, 'utf8').matchAll(/^id: gard:(\d+)$/gm)].map((m) => ({ id: `GARD:${m[1]}`, links: linked.get(m[1]) ?? [] }));
}

/**
 * MeSH 2025 (conversión PyOBO): descriptores bajo las cabezas del árbol C
 * (Enfermedades), sin C22 «Animal Diseases». Las cabezas se verifican por
 * nombre en el propio archivo; si alguna no está, se avisa.
 */
export const MESH_C_HEADS = {
  D007239: 'Infections',
  D009369: 'Neoplasms',
  D009140: 'Musculoskeletal Diseases',
  D004066: 'Digestive System Diseases',
  D009057: 'Stomatognathic Diseases',
  D012140: 'Respiratory Tract Diseases',
  D010038: 'Otorhinolaryngologic Diseases',
  D009422: 'Nervous System Diseases',
  D005128: 'Eye Diseases',
  D052801: 'Male Urogenital Diseases',
  D005261: 'Female Urogenital Diseases and Pregnancy Complications',
  D002318: 'Cardiovascular Diseases',
  D006425: 'Hemic and Lymphatic Diseases',
  D009358: 'Congenital, Hereditary, and Neonatal Diseases and Abnormalities',
  D017437: 'Skin and Connective Tissue Diseases',
  D009750: 'Nutritional and Metabolic Diseases',
  D004700: 'Endocrine System Diseases',
  D007154: 'Immune System Diseases',
  D013568: 'Pathological Conditions, Signs and Symptoms',
  D009784: 'Occupational Diseases',
  D064419: 'Chemically-Induced Disorders',
  D014947: 'Wounds and Injuries',
};

export function measureMeshC(terms) {
  const byId = new Map(terms.map((t) => [t.id.replace(/^mesh:/, ''), t]));
  const missing = Object.entries(MESH_C_HEADS).filter(([id, name]) => byId.get(id)?.name.replace(/\\,/g, ',') !== name);
  const children = new Map();
  for (const t of terms) for (const p of t.isA) (children.get(p.id.replace(/^mesh:/, '')) ?? children.set(p.id.replace(/^mesh:/, ''), []).get(p.id.replace(/^mesh:/, ''))).push(t.id.replace(/^mesh:/, ''));
  const seen = new Set();
  const stack = Object.keys(MESH_C_HEADS);
  while (stack.length) {
    const c = stack.pop();
    if (seen.has(c)) continue;
    seen.add(c);
    stack.push(...(children.get(c) ?? []));
  }
  return { missingHeads: missing.map(([id]) => id), items: [...seen].filter((id) => id.startsWith('D')).map((id) => ({ id: `MESH:${id}`, links: [{ cs: 'mesh', code: id }] })) };
}
