// =============================================================================
// MedlinePlus (NLM, dominio público): pares «descriptor MeSH → tema en español».
//
// El XML de temas trae, por cada tema en inglés, los `<mesh-heading><descriptor id="D…">`
// con que NLM lo indiza, y por cada tema en español, el tema inglés al que corresponde
// (`<language-mapped-topic>`). De acá sólo salen esos pares y el título en español tal
// como lo escribe MedlinePlus: no se toma el texto de los resúmenes.
//
// El destino (tema en español) es el concepto del glosario `medlineplus-es`
// (`import-medlineplus-es.mjs`); el mapeo se inserta sólo si ese concepto existe.
// =============================================================================

import { readFileSync } from 'node:fs';

import { parseTopics } from '../../lib/glossary-es/medlineplus.mjs';

/** @returns Map<UI de MeSH, [{ esId, esTitle, enId, enTitle }]> */
export function medlineplusMeshPairs(path) {
  const topics = parseTopics(readFileSync(path, 'utf8'));
  const byId = new Map(topics.map((t) => [t.id, t]));
  const out = new Map();
  for (const es of topics.filter((t) => t.language === 'Spanish')) {
    const en = es.mapped ? byId.get(es.mapped.id) : null;
    for (const d of en?.mesh ?? []) {
      const list = out.get(d.id) ?? out.set(d.id, []).get(d.id);
      if (!list.some((x) => x.esId === es.id)) list.push({ esId: es.id, esTitle: es.title, enId: en.id, enTitle: en.title });
    }
  }
  return out;
}

/** Agrega a los registros `mesh` el alineamiento publicado por MedlinePlus (y el título en español como propiedad). */
export function attachMedlineplus(meshRecords, pairs) {
  let attached = 0;
  for (const r of meshRecords) {
    const topics = pairs.get(r.code);
    if (!topics) continue;
    for (const t of topics) {
      r.xrefs.push({ cs: 'medlineplus-es', code: t.esId, equivalence: null, context: `medlineplus:mesh-heading (tema ${t.enId} → tema en español ${t.esId})`, external: true });
      attached += 1;
    }
    r.properties.medlineplus_es_topics = topics.map((t) => ({ id: t.esId, title: t.esTitle, englishTopic: { id: t.enId, title: t.enTitle } }));
  }
  return attached;
}
