// =============================================================================
// Wikidata P3841 «Human Phenotype Ontology ID» → cruce HPO ↔ ítem de Wikidata.
//
// El cruce lo PUBLICA Wikidata (declaración del ítem), no se infiere por
// nombre. Cada fila: ítem, id de HPO tal como lo declara Wikidata, id vigente
// de HPO si Wikidata usa un `alt_id`/`replaced_by` que HPO declara, y las
// etiquetas EN/ES del ítem sólo como ayuda de lectura (no se cargan como
// nombres: el nombre oficial en castellano es el de HPO). Si la declaración
// trae el calificador P4390 (tipo de mapeo) se conserva.
// =============================================================================

const qidOf = (uri) => String(uri ?? '').split('/').pop();

/** Resultado JSON de SPARQL → filas del cruce (únicas por ítem+HPO, ordenadas). */
export function wikidataHpoRows(json, resolveHp, { retrievedAt, license, queryUrl }) {
  const seen = new Map();
  const stats = { bindings: 0, duplicateBindings: 0, malformed: 0, remapped: 0, unresolved: 0, mappingRelation: 0 };
  for (const b of json?.results?.bindings ?? []) {
    stats.bindings++;
    const qid = qidOf(b.item?.value);
    const published = b.hpo?.value?.trim();
    if (!/^Q\d+$/.test(qid) || !published) throw new Error(`Fila P3841 inesperada: ${JSON.stringify(b)}`);
    const k = `${qid}|${published}`;
    if (seen.has(k)) {
      stats.duplicateBindings++;
      continue;
    }
    // Un id mal escrito en Wikidata (p. ej. «HP:000962», 6 dígitos) NO se corrige:
    // queda como se publicó, sin resolver, y se cuenta.
    const wellFormed = /^HP:\d{7}$/.test(published);
    if (!wellFormed) stats.malformed = (stats.malformed ?? 0) + 1;
    const hit = wellFormed ? resolveHp(published) : null;
    if (!hit) stats.unresolved++;
    else if (hit.via) stats.remapped++;
    const rel = b.rel?.value ? qidOf(b.rel.value) : null;
    if (rel) stats.mappingRelation++;
    seen.set(k, {
      source: 'wikidata-p3841',
      qid,
      itemUri: `http://www.wikidata.org/entity/${qid}`,
      hpoAsPublished: published,
      hpo: hit?.id ?? null,
      hpoRemap: hit?.via ?? null,
      mappingRelation: rel,
      labelEn: b.itemLabelEn?.value ?? null,
      labelEs: b.itemLabelEs?.value ?? null,
      retrievedAt,
      license,
      sourceUri: queryUrl,
    });
  }
  const rows = [...seen.values()].sort((a, b) => a.qid.localeCompare(b.qid, 'en', { numeric: true }) || a.hpoAsPublished.localeCompare(b.hpoAsPublished));
  return { rows, stats };
}
