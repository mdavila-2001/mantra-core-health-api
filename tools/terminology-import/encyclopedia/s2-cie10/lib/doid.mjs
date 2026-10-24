// =============================================================================
// Human Disease Ontology (CC0) — solo definiciones, por id DOID.
// El DOID se alcanza únicamente a través de un `exactMatch` de MONDO: los
// `xref` planos del .obo no declaran tipo de correspondencia y no unen nada.
// =============================================================================

/** Desescapa una cadena OBO entre comillas (`\"`, `\\`, `\:`, `\,` …). */
export function unescapeObo(s) {
  return s.replace(/\\(.)/g, '$1');
}

/** doid.obo → {license, version, terms: Map<'DOID:123', {id, name, definition}>}. */
export function parseDoid(obo) {
  const terms = new Map();
  const license = obo.match(/^property_value: terms:license (\S+)/m)?.[1] ?? null;
  const version = obo.match(/^data-version: (\S+)/m)?.[1] ?? null;
  for (const stanza of obo.split(/\n\[Term\]\n/).slice(1)) {
    const end = stanza.indexOf('\n\n');
    const body = end === -1 ? stanza : stanza.slice(0, end);
    if (/^is_obsolete: true/m.test(body)) continue;
    const id = body.match(/^id: (DOID:\d+)/m)?.[1];
    if (!id) continue;
    const def = body.match(/^def: "((?:[^"\\]|\\.)*)"(?: \[(.*)\])?/m);
    terms.set(id, {
      id,
      name: body.match(/^name: (.+)$/m)?.[1] ?? null,
      definition: def ? unescapeObo(def[1]).trim() || null : null,
      definitionRefs: def?.[2] ?? '',
    });
  }
  return { license, version, terms };
}
