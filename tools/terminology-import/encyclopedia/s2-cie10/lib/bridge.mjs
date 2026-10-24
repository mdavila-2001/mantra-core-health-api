// =============================================================================
// Puente Wikidata → Orphanet/MONDO/MeSH/DOID para TEXTO.
//
// Cuando ninguna fuente declara el código del término pero el ítem de Wikidata de
// ese código (único, ver wikidata.mjs) declara el id de un concepto de Orphanet
// (P1550), MONDO (P5270), MeSH (P486) o DOID (P699), ese concepto se acepta como
// nivel T3 («conocimiento colaborativo», sugerencia). Solo si:
//   · el ítem declara UN solo id de esa propiedad, y
//   · ese concepto no es el que otro término reclama (ni por la fuente ni por el puente).
// Siempre por código declarado, nunca por etiqueta. Queda marcado `via` en `identity`.
// =============================================================================

const pad7 = (v) => `MONDO:${String(v).replace(/^MONDO[:_]/, '').padStart(7, '0')}`;
const only = (values) => (values?.length === 1 ? values[0] : null);

export function computeBridges(terms, identities, wikidata, { orphaConcepts, mondoConcepts }) {
  const claims = new Map();
  const claim = (key, code) => {
    if (!claims.has(key)) claims.set(key, new Set());
    claims.get(key).add(code);
  };
  const candidates = new Map();
  for (const { code } of terms) {
    const id = identities.get(code);
    if (id?.orpha) claim(`orpha:${id.orpha.orpha}`, code);
    if (id?.mondo) claim(`mondo:${id.mondo.id}`, code);
    const wd = wikidata.get(code);
    if (!wd?.qid) continue;
    const orphaId = only(wd.facts.P1550);
    const mondoId = wd.facts.P5270 ? only(wd.facts.P5270) : null;
    const c = {
      orpha: !id?.orpha && orphaId && orphaConcepts.has(orphaId) ? orphaConcepts.get(orphaId) : null,
      mondo: !id?.mondo && mondoId && mondoConcepts.has(pad7(mondoId)) ? mondoConcepts.get(pad7(mondoId)) : null,
      meshId: only(wd.facts.P486),
      doidId: only(wd.facts.P699)?.replace(/^DOID:/, '') ?? null,
    };
    if (c.orpha) claim(`orpha:${c.orpha.orpha}`, code);
    if (c.mondo) claim(`mondo:${c.mondo.id}`, code);
    if (c.meshId) claim(`mesh:${c.meshId}`, code);
    if (c.doidId) claim(`doid:${c.doidId}`, code);
    candidates.set(code, c);
  }
  const free = (key, code) => claims.get(key)?.size === 1 && claims.get(key).has(code);
  const out = new Map();
  for (const [code, c] of candidates) {
    const id = identities.get(code);
    const b = {
      orpha: c.orpha && free(`orpha:${c.orpha.orpha}`, code) ? c.orpha : null,
      mondo: c.mondo && free(`mondo:${c.mondo.id}`, code) ? c.mondo : null,
      meshId: c.meshId && free(`mesh:${c.meshId}`, code) ? c.meshId : null,
      doidId: c.doidId && free(`doid:${c.doidId}`, code) ? c.doidId : null,
    };
    // Lo que la unión por código ya aporta no se vuelve a pedir al puente.
    if (b.meshId && id?.mondo?.exact.mesh.includes(b.meshId)) b.meshId = null;
    if (b.doidId && id?.mondo?.exact.doid.includes(b.doidId)) b.doidId = null;
    if (b.orpha || b.mondo || b.meshId || b.doidId) out.set(code, b);
  }
  return out;
}
