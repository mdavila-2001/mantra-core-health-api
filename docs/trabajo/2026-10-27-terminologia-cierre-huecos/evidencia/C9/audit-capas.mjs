// Auditoría C9: cuántos términos produce cada capa y cuántos entran al corpus del glosario.
// Uso: GLOSSARY_BUILD_DIR=... node audit-capas.mjs > salida.json
import { existsSync } from 'node:fs';
import { ndjsonPath, readNdjson } from '../../../../../tools/terminology-import/lib/glossary-es/common.mjs';
import { TERM_LAYERS, loadCorpus } from '../../../../../tools/terminology-import/lib/glossary-es/corpus.mjs';
import { isGlossaryDxLevel } from '../../../../../tools/terminology-import/lib/glossary-es/taxonomy.mjs';

const ALL = ['cie10es-diagnosticos', 'cie10es-procedimientos', 'cima', 'medlineplus-es', 'medlineplus-es-pruebas', 'wikidata-anatomia', 'wikidata-images', 'loinc-es', 'inlasa-aranceles', 'nci-diccionario-cancer-es', 'nci-diccionario-genetica-es'];
const out = { capas: {} };
for (const l of ALL) {
  const p = ndjsonPath(l);
  if (!existsSync(p)) { out.capas[l] = { archivo: false }; continue; }
  const rows = readNdjson(p);
  const c = { archivo: true, filas: rows.length, enTermLayers: TERM_LAYERS.includes(l) };
  if (l === 'wikidata-images') { out.capas[l] = c; continue; }
  c.conDefinicion = rows.filter((r) => r.definition).length;
  c.conImagen = rows.filter((r) => r.imageUrl).length;
  c.porCategoria = rows.reduce((a, r) => ((a[r.categoryKey] = (a[r.categoryKey] ?? 0) + 1), a), {});
  if (l === 'cie10es-diagnosticos') {
    c.codigosFinales = rows.filter((r) => r.flags?.final).length;
    c.nivelGlosario3o4Caracteres = rows.filter((r) => isGlossaryDxLevel(r.code)).length;
  }
  out.capas[l] = c;
}
const corpus = loadCorpus({ log: () => {} });
out.corpus = { total: corpus.rows.length, porCapa: corpus.perLayer, relacionesHuerfanas: corpus.orphanRelations, grafo: corpus.graph };
out.corpus.porCategoria = corpus.rows.reduce((a, r) => ((a[r.categoryKey] = (a[r.categoryKey] ?? 0) + 1), a), {});
out.corpus.conDefinicion = corpus.rows.filter((r) => r.definition).length;
out.corpus.conImagen = corpus.rows.filter((r) => r.imageUrl).length;
console.log(JSON.stringify(out, null, 2));
