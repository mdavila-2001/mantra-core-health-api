// =============================================================================
// Ayuda de REVISIÓN HUMANA de la identidad. Compara el nombre del término con el
// nombre (y sinónimos) del concepto de Orphanet al que la fuente lo unió por
// código. El resultado NUNCA decide ni cambia una unión: solo ordena la lista
// que un revisor debe mirar primero (la unión sigue siendo por código exacto).
// =============================================================================

const tokens = (s) => {
  const folded = String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return new Set((folded.match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 3));
};

export function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / (A.size + B.size - both);
}

/** Mejor solapamiento entre el nombre del término y el nombre/sinónimos de Orphanet. */
export function orphanetNameOverlap(termName, orpha) {
  return Math.max(...[orpha.name, ...(orpha.synonyms ?? [])].map((n) => jaccard(termName, n)));
}

/** Filas TSV (ordenadas de menor a mayor solapamiento) para revisar a mano. */
export function identityReviewRows(perTerm) {
  const rows = [];
  for (const { term, identity } of perTerm) {
    if (!identity.orpha) continue;
    rows.push({
      code: term.code, termName: term.esName, orphaName: identity.orpha.name, orpha: identity.orpha.orpha,
      overlap: orphanetNameOverlap(term.esName, identity.orpha), alsoMondo: Boolean(identity.mondo),
    });
  }
  return rows.sort((a, b) => a.overlap - b.overlap || a.code.localeCompare(b.code));
}

export function renderReviewTsv(rows) {
  const head = ['codigo_cie10es', 'nombre_en_el_glosario', 'nombre_en_orphanet', 'orpha', 'solapamiento_de_palabras', 'tambien_unido_a_mondo'];
  return `${[head, ...rows.map((r) => [r.code, r.termName, r.orphaName, `ORPHA:${r.orpha}`, r.overlap.toFixed(2), r.alsoMondo ? 'si' : 'no'])].map((r) => r.join('\t')).join('\n')}\n`;
}
