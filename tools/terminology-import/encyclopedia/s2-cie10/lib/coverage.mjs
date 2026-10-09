// =============================================================================
// Cobertura MEDIDA (no estimada) de la corrida: cuántos términos se unen a cada
// fuente por código CIE-10 exacto, qué secciones salen y por qué el resto queda
// sin artículo. `renderCoverage` vuelca las cifras a Markdown sin editarlas a mano.
// =============================================================================

import { REJECT_REASONS } from './config.mjs';

const inc = (obj, key, n = 1) => {
  obj[key] = (obj[key] ?? 0) + n;
};
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));

/** Clase del término para explicar por qué no tiene artículo (solo descriptiva: NUNCA decide una unión). */
export function termClass(term) {
  if (!term.isFinal) return 'categoria_no_final_(agrupa_subcategorias)';
  if (/no especificad/i.test(term.esName)) return 'no_especificada';
  if (/^otr[oa]s?\b/i.test(term.esName)) return 'residual_«otros/otras»';
  if (term.categoryKey === 'other') return 'categoria_«otros»_del_glosario';
  return 'categoria_final_especifica';
}

export function computeStats({ perTerm, rejected, orphanet, orphaIdx, mondoByCode, mesh, hpo, bridge, hpoAck, includeWikipediaCited, bridges, icd10cm, flags }) {
  const s = {
    total: perTerm.length,
    byCategory: {}, byFinal: { final: 0, notFinal: 0 },
    identity: {
      orphaExactDeclared: 0, orphaUsable: 0, orphaApproximateOnly: 0, mondoDeclared: 0, mondoUsable: 0, mondoViaCm: 0, mondoViaWho: 0,
      both: 0, bothCorroborated: 0, conflicts: 0, linkedAny: 0, orphaOnly: 0, mondoOnly: 0,
    },
    texts: { orphanetDefinition: 0, mondoDefinition: 0, doidDefinition: 0, meshScopeNote: 0, hpoSymptomsEmitted: 0, hpoSymptomsBlockedByLicense: flags.hpoBlockedTerms, withheldCitingWikipedia: flags.wikipediaWithheldSections },
    sections: { byKind: {}, bySource: {}, byKindSource: {}, termsWithAnySection: 0, termsWithSpanishSection: 0 },
    articles: { total: 0, byKind: { text: 0, 'image-only': 0, 'facts-only': 0 }, byCategory: {}, factsOnlyWikidataOnly: 0 },
    images: { total: 0, termsWithImages: 0, byLicense: {}, byHost: {}, outsideCsp: 0 },
    bridge: { termsWithBridgeCandidate: bridges?.size ?? 0, termsWithBridgedText: 0, termsTextOnlyFromBridge: 0 },
    icd10cm: { version: icd10cm?.label ?? null, codesInTabular: icd10cm?.codes.size ?? 0, termsWithCodeInTabular: 0, termsWithNotes: 0, termsTextOnlyFromTabular: 0 },
    wikidata: { uniqueQid: 0, qidWithImageFiles: 0, rejectedByReason: {} },
    noArticle: { total: 0, byClass: {}, byClassAndCause: {}, byChapter: {} },
    byChapter: {},
    rejectedByReason: {}, rejectedByLevel: {},
    hpo: { translationEs: hpo.es.size, englishLabels: hpo.en.size, annotatedDiseases: hpo.hpoa.diseases.size },
    sourceTotals: {
      orphanetConcepts: orphanet.concepts.size, orphanetExactIcd10Codes: orphaIdx.exact.size, orphanetApproximateIcd10Codes: orphaIdx.approximate.size,
      mondoIcd10Codes: mondoByCode.size, meshScopeNotesFetched: mesh.size, wikidataCodeRows: bridge.codes.length,
    },
  };
  for (const { term, identity, wd, article, kind } of perTerm) {
    inc(s.byCategory, term.categoryKey);
    s.byFinal[term.isFinal ? 'final' : 'notFinal']++;
    const chapter = term.hierarchy[0]?.code ?? 'sin_capitulo';
    inc(s.byChapter, chapter);
    const id = s.identity;
    if (identity.orphaDeclared.length) id.orphaExactDeclared++;
    else if (orphaIdx.approximate.has(term.code)) id.orphaApproximateOnly++;
    if (identity.mondoDeclared.length) id.mondoDeclared++;
    if (identity.orpha) id.orphaUsable++;
    if (identity.mondo) {
      id.mondoUsable++;
      const sys = identity.mondo.exact;
      if (sys.icd10cm.includes(term.code)) id.mondoViaCm++;
      else if (sys.icd10who.includes(term.code)) id.mondoViaWho++;
    }
    if (identity.conflict) id.conflicts++;
    if (identity.orpha && identity.mondo) {
      id.both++;
      id.bothCorroborated++;
    }
    if (identity.orpha || identity.mondo) id.linkedAny++;
    if (identity.orpha && !identity.mondo) id.orphaOnly++;
    if (identity.mondo && !identity.orpha) id.mondoOnly++;
    if (wd?.qid) {
      s.wikidata.uniqueQid++;
      if (wd.files.length) s.wikidata.qidWithImageFiles++;
    }
    if (wd?.rejectReason) inc(s.wikidata.rejectedByReason, wd.rejectReason);

    if (article) {
      s.articles.total++;
      inc(s.articles.byKind, kind);
      if (kind === 'facts-only' && article.facts.every((f) => f.source === 'sanidad-cie10es-2026' || f.source === 'wikidata')) s.articles.factsOnlyWikidataOnly++;
      inc(s.articles.byCategory, term.categoryKey);
      const kinds = new Set();
      for (const sec of article.sections) {
        inc(s.sections.byKind, sec.kind);
        inc(s.sections.bySource, sec.source);
        inc(s.sections.byKindSource, `${sec.kind} · ${sec.source} · ${sec.lang}`);
        kinds.add(sec.source);
        if (sec.source === 'orphanet-es') s.texts.orphanetDefinition++;
        if (sec.source === 'mondo') s.texts.mondoDefinition++;
        if (sec.source === 'disease-ontology') s.texts.doidDefinition++;
        if (sec.source === 'nlm-mesh') s.texts.meshScopeNote++;
        if (sec.source === 'hpo') s.texts.hpoSymptomsEmitted++;
      }
      const bridged = article.sections.filter((x) => /vía puente Wikidata/.test(x.locator));
      if (bridged.length) s.bridge.termsWithBridgedText++;
      if (bridged.length && bridged.length === article.sections.filter((x) => x.source !== 'icd10cm-tabular').length && article.sections.some((x) => x.source !== 'icd10cm-tabular')) s.bridge.termsTextOnlyFromBridge++;
      if (icd10cm?.codes.has(term.code)) s.icd10cm.termsWithCodeInTabular++;
      if (article.sections.some((x) => x.source === 'icd10cm-tabular')) {
        s.icd10cm.termsWithNotes++;
        if (article.sections.every((x) => x.source === 'icd10cm-tabular')) s.icd10cm.termsTextOnlyFromTabular++;
      }
      if (article.sections.length) s.sections.termsWithAnySection++;
      if (article.sections.some((x) => x.lang === 'es')) s.sections.termsWithSpanishSection++;
      if (article.images.length) s.images.termsWithImages++;
      for (const im of article.images) {
        s.images.total++;
        inc(s.images.byLicense, im.license);
        const host = new URL(im.url).hostname;
        inc(s.images.byHost, host);
        if (!['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es'].includes(host)) s.images.outsideCsp++;
      }
    } else {
      s.noArticle.total++;
      const klass = termClass(term);
      inc(s.noArticle.byClass, klass);
      inc(s.noArticle.byChapter, chapter);
      const cause = identity.conflict ? 'conflicto_orphanet_vs_mondo' : identity.orphaDeclared.length || identity.mondoDeclared.length ? 'fuente_declarada_pero_ambigua_o_vacia' : 'ninguna_fuente_declara_este_codigo';
      inc(s.noArticle.byClassAndCause, `${klass} · ${cause}`);
    }
  }
  for (const r of rejected) {
    inc(s.rejectedByReason, r.reason);
    inc(s.rejectedByLevel, r.level);
  }
  s.hpo.annotatedPhenotypeRowsNote = 'filas con calificador NOT o frecuencia «excluida» (0 %) descartadas al leer phenotype.hpoa';
  s.hpoAck = hpoAck;
  s.includeWikipediaCited = includeWikipediaCited;
  for (const k of ['byCategory', 'byChapter']) s[k] = sortObj(s[k]);
  s.sections.byKind = sortObj(s.sections.byKind);
  s.sections.bySource = sortObj(s.sections.bySource);
  s.sections.byKindSource = sortObj(s.sections.byKindSource);
  s.images.byLicense = sortObj(s.images.byLicense);
  s.images.byHost = sortObj(s.images.byHost);
  s.noArticle.byClass = sortObj(s.noArticle.byClass);
  s.noArticle.byClassAndCause = sortObj(s.noArticle.byClassAndCause);
  s.noArticle.byChapter = sortObj(s.noArticle.byChapter);
  s.rejectedByReason = sortObj(s.rejectedByReason);
  s.rejectedByLevel = sortObj(s.rejectedByLevel);
  return s;
}

// --- Markdown ----------------------------------------------------------------------

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1).replace('.', ',')} %` : '—');
const fmt = (n) => Number(n).toLocaleString('es-ES').replace(/ /g, ' ');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

export function renderCoverage(s) {
  const id = s.identity;
  const t = s.total;
  const out = [];
  out.push('# Cobertura medida — S2 · Enfermedades de la CIE-10-ES', '');
  out.push(`> Generado por \`build-articles.mjs\` (no se edita a mano). Cifras **medidas** sobre ${fmt(t)} términos de la semilla del glosario.`);
  out.push(`> Versiones: Orphadata ${s.versions.orphadata} · Mondo ${s.versions.mondo} · ${s.versions.doid} · phenotype.hpoa ${s.versions.hpoa}.`, '');
  out.push('## 1 · Unión por código CIE-10 exacto declarado por la fuente', '');
  out.push(table(['Medida', 'Términos', '% de ' + fmt(t)], [
    ['Orphanet declara una correspondencia **exacta** (E, validada) con el código', fmt(id.orphaExactDeclared), pct(id.orphaExactDeclared, t)],
    ['… y es inequívoca (un solo ORPHA; ese ORPHA no corresponde a otro término)', fmt(id.orphaUsable), pct(id.orphaUsable, t)],
    ['Orphanet solo declara correspondencia **aproximada** (NTBT/BTNT/ND) — no se usa', fmt(id.orphaApproximateOnly), pct(id.orphaApproximateOnly, t)],
    ['MONDO declara `skos:exactMatch` con el código (CIE-10-CM u OMS)', fmt(id.mondoDeclared), pct(id.mondoDeclared, t)],
    ['… y es inequívoco', fmt(id.mondoUsable), pct(id.mondoUsable, t)],
    ['   · por `ICD10CM` (misma familia que la CIE-10-ES)', fmt(id.mondoViaCm), pct(id.mondoViaCm, t)],
    ['   · solo por `ICD10WHO` (CIE-10 de la OMS)', fmt(id.mondoViaWho), pct(id.mondoViaWho, t)],
    ['Ambos y **se corroboran** entre sí', fmt(id.bothCorroborated), pct(id.bothCorroborated, t)],
    ['Orphanet y MONDO declaran enfermedades **distintas** (se descartan los dos)', fmt(id.conflicts), pct(id.conflicts, t)],
    ['**Términos unidos a al menos una fuente**', fmt(id.linkedAny), pct(id.linkedAny, t)],
    ['   · solo Orphanet', fmt(id.orphaOnly), pct(id.orphaOnly, t)],
    ['   · solo MONDO', fmt(id.mondoOnly), pct(id.mondoOnly, t)],
  ]), '');
  const ir = s.identityReview;
  out.push(`Ayuda de revisión (NO decide uniones): de ${fmt(ir.orphanetLinkedTerms)} términos unidos a Orphanet, ${fmt(ir.nameOverlapZero)} no comparten ninguna palabra (de más de 3 letras) entre su nombre y el de Orphanet/sinónimos y ${fmt(ir.nameOverlapBelow20pct)} comparten menos del 20 %. Muchos son variantes ortográficas («Isosporiasis»/«Isosporosis») pero otros son grupo ↔ enfermedad concreta: ver \`identity-review.tsv\` y GAPS.md.`, '');
  out.push('## 2 · Qué texto sale (secciones literales)', '');
  out.push(table(['Sección · fuente · idioma', 'Secciones'], Object.entries(s.sections.byKindSource).map(([k, v]) => [k, fmt(v)])), '');
  out.push(`Términos con **alguna sección de texto**: ${fmt(s.sections.termsWithAnySection)} (${pct(s.sections.termsWithAnySection, t)}); con sección **en castellano**: ${fmt(s.sections.termsWithSpanishSection)} (${pct(s.sections.termsWithSpanishSection, t)}).`);
  out.push(`Síntomas de HPO: emitidos ${fmt(s.texts.hpoSymptomsEmitted)}; **retenidos por licencia sin verificar** en ${fmt(s.texts.hpoSymptomsBlockedByLicense)} términos (corrida ${s.hpoAck ? 'CON' : 'SIN'} \`--hpo-license-ack\`).`, '');
  out.push(`Definiciones de MONDO/DOID **retenidas** por citar a Wikipedia como referencia (CC BY-SA; regla §12.2.8): ${fmt(s.texts.withheldCitingWikipedia)} secciones (corrida ${s.includeWikipediaCited ? 'CON' : 'SIN'} \`--include-wikipedia-cited\`).`, '');
  out.push(`ICD-10-CM (${s.icd10cm.version ?? 'sin cargar'}): ${fmt(s.icd10cm.codesInTabular)} códigos en el tabular; ${fmt(s.icd10cm.termsWithCodeInTabular)} términos tienen su código ahí; ${fmt(s.icd10cm.termsWithNotes)} reciben notas de clasificación (${fmt(s.icd10cm.termsTextOnlyFromTabular)} solo con ellas).`);
  out.push(`Puente Wikidata (T3) para texto: ${fmt(s.bridge.termsWithBridgeCandidate)} candidatos; ${fmt(s.bridge.termsWithBridgedText)} términos reciben alguna sección vía puente (${fmt(s.bridge.termsTextOnlyFromBridge)} solo por él).`, '');
  out.push('## 3 · Artículos', '');
  out.push(table(['Resultado', 'Términos', '%'], [
    ['Con artículo — texto (≥1 sección)', fmt(s.articles.byKind.text), pct(s.articles.byKind.text, t)],
    ['Con artículo — solo imagen', fmt(s.articles.byKind['image-only']), pct(s.articles.byKind['image-only'], t)],
    ['Con artículo — solo datos de fuente (`facts`)', fmt(s.articles.byKind['facts-only']), pct(s.articles.byKind['facts-only'], t)],
    ['   · de ellos, solo identificadores de Wikidata (sin Orphanet ni MONDO)', fmt(s.articles.factsOnlyWikidataOnly), pct(s.articles.factsOnlyWikidataOnly, t)],
    ['**Sin artículo** (resultado válido: sin fuente, sin sección)', fmt(s.noArticle.total), pct(s.noArticle.total, t)],
  ]), '');
  out.push(`Por categoría del glosario — total: ${Object.entries(s.byCategory).map(([k, v]) => `${k} ${fmt(v)}`).join(' · ')}; con artículo: ${Object.entries(s.articles.byCategory).map(([k, v]) => `${k} ${fmt(v)}`).join(' · ')}.`, '');
  out.push('## 4 · Por qué quedan sin artículo', '');
  out.push(table(['Clase del término · causa', 'Términos', '%'], Object.entries(s.noArticle.byClassAndCause).map(([k, v]) => [k, fmt(v), pct(v, s.noArticle.total)])), '');
  out.push('> La «clase» es solo descriptiva (se deriva del propio término) y **nunca** decide una unión; la «causa» es lo que dicen las fuentes.', '');
  out.push('## 5 · Imágenes (Wikidata → Commons)', '');
  out.push(`Ítems de Wikidata inequívocos por código: ${fmt(s.wikidata.uniqueQid)} (${pct(s.wikidata.uniqueQid, t)}); con archivo de imagen P18: ${fmt(s.wikidata.qidWithImageFiles)}. Imágenes publicables: **${fmt(s.images.total)}** en ${fmt(s.images.termsWithImages)} términos. Fuera de la CSP: **${fmt(s.images.outsideCsp)}**.`, '');
  out.push(table(['Licencia', 'Imágenes'], Object.entries(s.images.byLicense).map(([k, v]) => [k, fmt(v)])), '');
  out.push(table(['Host', 'Imágenes'], Object.entries(s.images.byHost).map(([k, v]) => [k, fmt(v)])), '');
  out.push('## 6 · Rechazos y avisos (`rejected.ndjson`)', '');
  out.push(table(['Motivo', 'Filas'], Object.entries(s.rejectedByReason).map(([k, v]) => [k, fmt(v)])), '');
  out.push('## 7 · Por capítulo CIE-10', '');
  out.push(table(['Capítulo', 'Términos', 'Sin artículo'], Object.entries(s.byChapter).map(([k, v]) => [k, fmt(v), fmt(s.noArticle.byChapter[k] ?? 0)])), '');
  out.push(`<!-- motivos cerrados: ${Object.values(REJECT_REASONS).length} -->`, '');
  return `${out.join('\n')}`;
}
