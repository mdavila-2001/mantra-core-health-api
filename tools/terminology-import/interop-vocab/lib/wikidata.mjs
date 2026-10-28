// =============================================================================
// Wikidata (CC0) → subdivisiones ISO 3166-2. Una fila por (código P300, ítem); sólo se carga un código si Wikidata lo
// asigna a UN solo ítem. Si lo asigna a varios, no se elige uno (sería una heurística propia): queda listado como ambiguo.
// Nombres verbatim de las etiquetas en inglés y español del ítem; lo que Wikidata no tiene no se completa.
// =============================================================================

const QID = /^http:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/;
const ISO_3166_2 = /^[A-Z]{2}-[A-Z0-9]{1,3}$/;

/**
 * @param {Array<{file: string, sha256: string, json: object}>} pages respuestas SPARQL tal cual se bajaron
 * @returns {{ rows: object[], ambiguous: Array<{code: string, items: string[]}>, invalid: string[], total: number }}
 */
export function parseIso31662(pages) {
  const byCode = new Map();
  const invalid = [];
  let total = 0;
  for (const page of pages) {
    for (const b of page.json.results.bindings) {
      total++;
      const code = b.code?.value;
      const m = QID.exec(b.item?.value ?? '');
      if (!m) throw new Error(`Wikidata: ítem con URI inesperada «${b.item?.value}»`);
      if (!code || !ISO_3166_2.test(code)) {
        invalid.push(`${code}\t${m[1]}`);
        continue;
      }
      const list = byCode.get(code) ?? byCode.set(code, []).get(code);
      if (list.some((x) => x.qid === m[1])) throw new Error(`Wikidata: (${code}, ${m[1]}) repetido: la paginación se solapó`);
      list.push({ qid: m[1], labelEn: b.labelEn?.value ?? null, labelEs: b.labelEs?.value ?? null, file: page.file, sha256: page.sha256 });
    }
  }
  const rows = [];
  const ambiguous = [];
  for (const [code, items] of [...byCode].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (items.length > 1) ambiguous.push({ code, items: items.map((i) => i.qid) });
    else rows.push({ code, ...items[0] });
  }
  return { rows, ambiguous, invalid, total };
}
