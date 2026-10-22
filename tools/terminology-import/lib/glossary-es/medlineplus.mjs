// =============================================================================
// Normalización de MedlinePlus en español (NLM) → filas del glosario.
//
// 1. Temas de salud: `mplus_topics_<fecha>.xml` (https://medlineplus.gov/xml.html),
//    elementos `<health-topic language="Spanish">`. Definición = `full-summary`
//    verbatim. Sinónimos = `also-called` + `see-reference`. MeSH = el del tema
//    inglés mapeado (`language-mapped-topic`), que es donde el XML lo declara.
// 2. Guías de pruebas médicas: https://medlineplus.gov/spanish/pruebas-de-laboratorio/
//    (una página por prueba). Definición = sección «¿Qué es…?» verbatim.
//
// El XML es regular (sin anidamiento de <health-topic>): se parsea con
// expresiones acotadas en vez de sumar una dependencia.
// =============================================================================

import { NO_IMAGE, decodeEntities, htmlToText, sanitizeHtml } from './common.mjs';
import { medlineplusTaxonomy } from './taxonomy.mjs';

export const MPLUS_SOURCE = 'nlm-medlineplus-es';
export const MPLUS_LAB_SOURCE = 'nlm-medlineplus-es-pruebas';
export const MPLUS_LICENSE =
  'MedlinePlus (U.S. National Library of Medicine): los resúmenes de temas de salud y la información de pruebas médicas son de dominio público; atribución pedida: «Fuente: MedlinePlus, National Library of Medicine». La Enciclopedia A.D.A.M. y las monografías de medicamentos NO son de dominio público y no se importan. https://medlineplus.gov/about/using/usingcontent/';

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = decodeEntities(m[2]);
  return out;
}

function children(body, name) {
  const re = new RegExp(`<${name}(\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'g');
  return [...body.matchAll(re)].map((m) => ({ attrs: attrs(m[1] ?? ''), text: m[2] }));
}

/** Todos los `<health-topic>` del XML como objetos planos. */
export function parseTopics(xml) {
  const topics = [];
  for (const m of xml.matchAll(/<health-topic(\s[^>]*)>([\s\S]*?)<\/health-topic>/g)) {
    const a = attrs(m[1]);
    const body = m[2];
    topics.push({
      id: a.id,
      title: a.title,
      url: a.url,
      language: a.language,
      metaDesc: a['meta-desc'] ?? null,
      dateCreated: a['date-created'] ?? null,
      alsoCalled: children(body, 'also-called').map((c) => decodeEntities(c.text).trim()),
      seeReferences: children(body, 'see-reference').map((c) => decodeEntities(c.text).trim()),
      fullSummaryHtml: (() => {
        const fs = children(body, 'full-summary')[0];
        return fs ? decodeEntities(fs.text).trim() : null;
      })(),
      groups: children(body, 'group').map((g) => ({ id: g.attrs.id, url: g.attrs.url, name: decodeEntities(g.text).trim() })),
      mapped: children(body, 'language-mapped-topic').map((g) => ({ id: g.attrs.id, url: g.attrs.url, language: g.attrs.language, title: decodeEntities(g.text).trim() }))[0] ?? null,
      related: children(body, 'related-topic').map((g) => ({ id: g.attrs.id, url: g.attrs.url, title: decodeEntities(g.text).trim() })),
      mesh: children(body, 'mesh-heading').flatMap((h) => children(h.text, 'descriptor').map((d) => ({ id: d.attrs.id, name: decodeEntities(d.text).trim() }))),
    });
  }
  return topics;
}

function uniqSynonyms(name, list) {
  const seen = new Set([name.toLowerCase()]);
  const out = [];
  for (const s of list) {
    const k = s.toLowerCase();
    if (!s || seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

/** Temas → filas (sólo los `language="Spanish"`). */
export function topicRows(topics, prov) {
  const byId = new Map(topics.map((t) => [t.id, t]));
  const spanishIds = new Set(topics.filter((t) => t.language === 'Spanish').map((t) => t.id));
  return topics
    .filter((t) => t.language === 'Spanish')
    .map((t) => {
      const en = t.mapped ? byId.get(t.mapped.id) : null;
      const mesh = en?.mesh ?? [];
      const { categoryKey, tagKeys } = medlineplusTaxonomy(t.groups.map((g) => g.name));
      const html = sanitizeHtml(t.fullSummaryHtml);
      return {
        slug: `medlineplus-es-${t.id}`,
        code: t.id,
        codeSystem: 'medlineplus-es',
        display: t.title,
        esName: t.title,
        enDisplay: t.mapped?.title ?? null,
        esSynonyms: uniqSynonyms(t.title, [...t.alsoCalled, ...t.seeReferences]),
        definition: htmlToText(t.fullSummaryHtml),
        definitionHtml: html,
        definitionSource: { name: `MedlinePlus en español — «${t.title}»`, url: t.url, retrievedAt: prov.retrievedAt, license: MPLUS_LICENSE },
        // Resumen breve = la `meta-desc` que la NLM escribe para el tema (verbatim).
        plainSummaryEs: t.metaDesc ? decodeEntities(t.metaDesc).trim() : null,
        plainSummarySource: t.metaDesc ? { name: `MedlinePlus en español — descripción del tema «${t.title}»`, url: t.url, retrievedAt: prov.retrievedAt, kind: 'medlineplus-meta-desc' } : null,
        metaDescription: t.metaDesc,
        categoryKey,
        tagKeys,
        lang: 'es',
        hierarchy: t.groups.map((g) => ({ code: `group-${g.id}`, display: g.name })),
        externalIds: { ...(mesh.length ? { mesh: mesh.map((m) => m.id) } : {}), medlineplusEn: t.mapped?.id ?? undefined },
        relations: t.related
          .filter((r) => spanishIds.has(r.id))
          .map((r) => ({ type: 'RELATED_TERM', targetSlug: `medlineplus-es-${r.id}`, provenance: 'medlineplus:related-topic' })),
        ...NO_IMAGE,
        source: MPLUS_SOURCE,
        sourceName: 'MedlinePlus en español — Temas de salud (U.S. National Library of Medicine)',
        sourceUrl: t.url,
        sourceXmlUrl: prov.xmlUrl,
        sourceRetrievedAt: prov.retrievedAt,
        sourceLicense: MPLUS_LICENSE,
        reviewStatus: 'external-source',
      };
    });
}

// --- Guías de pruebas médicas -------------------------------------------------

export const LAB_INDEX_URL = 'https://medlineplus.gov/spanish/pruebas-de-laboratorio/';

export function labIndexLinks(html) {
  const set = new Set();
  for (const m of html.matchAll(/href="(https:\/\/medlineplus\.gov\/spanish\/pruebas-de-laboratorio\/[a-z0-9-]+\/)"/g)) set.add(m[1]);
  return [...set].sort();
}

/**
 * Categoría de una guía de prueba. La colección oficial se llama «Pruebas
 * médicas» y no clasifica cada guía, así que la regla lee SÓLO la descripción
 * oficial de la página (`<meta name="description">`, una frase escrita por la
 * NLM) y no aplica juicio clínico, en este orden:
 *  - guías generales (título que empieza por «Cómo», «Lo que», «Ayunar») → other;
 *  - la descripción habla de imágenes («imágenes», «rayos X», «ondas sonoras»,
 *    «radiactivo», «tinte de contraste») → diagnostic-test;
 *  - el título nombra un analito en un líquido corporal («… en sangre», «Conteo…»,
 *    «Nivel…», «Panel…», «Análisis…») → lab;
 *  - la descripción habla de una muestra biológica o de medir algo en un
 *    líquido corporal («muestra», «en la sangre», «en la orina», «de heces»,
 *    «líquido cefalorraquídeo/pleural/sinovial/amniótico», «cultivo») → lab;
 *  - resto (imagen, endoscopias, evaluaciones, pruebas funcionales) → diagnostic-test.
 * La regla aplicada queda en `categoryRule` de la fila. Es una heurística sobre
 * texto de la fuente y NO es perfecta (p. ej. «Prueba de troponina» cae en
 * diagnostic-test): la categoría es navegación, no dato clínico, y queda marcada
 * para revisión.
 */
const LAB_SPECIMEN = /\bmuestras?\b|\b(en|de)( la| las| los| el)? (sangre|orina|heces|saliva|semen|esputo)\b|\blíquido (cefalorraquídeo|pleural|sinovial|amniótico)|\bcultivo\b/i;
/** Título que nombra un analito medido en un líquido corporal (texto de la propia fuente). */
const LAB_TITLE = /\b(en|de)( la| las| el)? (sangre|orina|heces)\b|sanguíne|glóbulos|hemoglobina|^(Análisis|Conteo|Nivel|Niveles|Panel|Ionograma|Hematocrito|Frotis|Fórmula|Índices?)\b/i;

export function labCategory(title, metaDescription) {
  if (/^(Cómo|Lo que|Ayunar)\b/i.test(title)) return { categoryKey: 'other', categoryRule: 'medlineplus-lab:guia-general' };
  if (/im[aá]gen(es)?|rayos X|ondas sonoras|radiactiv|tinte de contraste/i.test(metaDescription ?? '')) return { categoryKey: 'diagnostic-test', categoryRule: 'medlineplus-lab:descripcion-habla-de-imagen' };
  if (LAB_TITLE.test(title) && !/^Análisis de cálculos/i.test(title)) return { categoryKey: 'lab', categoryRule: 'medlineplus-lab:titulo-nombra-analito' };
  if (LAB_SPECIMEN.test(metaDescription ?? '')) return { categoryKey: 'lab', categoryRule: 'medlineplus-lab:descripcion-menciona-muestra' };
  return { categoryKey: 'diagnostic-test', categoryRule: 'medlineplus-lab:prueba-medica' };
}

/** Una página de guía → fila (o null si no tiene la estructura esperada). */
export function labPageRow(url, html, prov) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!h1) return null;
  const title = htmlToText(h1[1]);
  const main = html.match(/<div class="main">([\s\S]*?)<\/article>/)?.[1] ?? html;
  // Secciones por <h2>; se corta en «Referencias».
  const parts = main.split(/(?=<h2[^>]*>)/).filter((p) => p.startsWith('<h2'));
  const sections = [];
  for (const p of parts) {
    const t = htmlToText(p.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]);
    if (/^Referencias|^Temas de salud relacionados|^Pruebas médicas relacionadas/i.test(t)) break;
    const bodyHtml = p.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '').replace(/<\/?section[^>]*>|<\/?div[^>]*>/g, '');
    sections.push({ title: t, html: sanitizeHtml(bodyHtml), text: htmlToText(bodyHtml) });
  }
  const whatIs = sections.find((s) => /^¿Qué (es|son)\b/i.test(s.title)) ?? sections[0] ?? null;
  // «Otros nombres: a, b, c» — la lista viene en el propio texto de la fuente.
  const allText = sections.map((s) => s.text ?? '').join('\n');
  const other = allText.match(/Otros nombres:\s*([^\n]+)/);
  const synonyms = other ? other[1].split(/,\s*/).map((s) => s.trim()).filter(Boolean) : [];
  const metaDesc = decodeEntities(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '') || null;
  const updated = html.match(/Última actualización\s*([^<]+)/)?.[1]?.trim() ?? null;
  const slugPart = url.replace(/\/$/, '').split('/').pop();
  const { categoryKey, categoryRule } = labCategory(title, metaDesc);
  let definition = whatIs?.text ?? null;
  if (definition) definition = definition.replace(/\n?Otros nombres:[^\n]*/, '').trim() || null;
  return {
    slug: `medlineplus-lab-${slugPart}`,
    code: slugPart,
    codeSystem: 'medlineplus-es-lab',
    display: title,
    esName: title,
    enDisplay: null,
    esSynonyms: uniqSynonyms(title, synonyms),
    definition,
    definitionHtml: sections.map((s) => `<h3>${s.title}</h3>\n${s.html ?? ''}`).join('\n'),
    definitionSource: { name: `MedlinePlus en español — Pruebas médicas: «${title}»${updated ? ` (última actualización: ${updated})` : ''}`, url, retrievedAt: prov.retrievedAt, license: MPLUS_LICENSE },
    plainSummaryEs: metaDesc ? metaDesc.trim() : null,
    plainSummarySource: metaDesc ? { name: `MedlinePlus en español — descripción de la guía «${title}»`, url, retrievedAt: prov.retrievedAt, kind: 'medlineplus-meta-description' } : null,
    metaDescription: metaDesc,
    sections: sections.map((s) => ({ title: s.title, text: s.text })),
    categoryKey,
    categoryRule,
    tagKeys: [],
    lang: 'es',
    hierarchy: [{ code: 'pruebas-medicas', display: 'MedlinePlus: Pruebas médicas' }],
    externalIds: {},
    relations: [],
    ...NO_IMAGE,
    source: MPLUS_LAB_SOURCE,
    sourceName: 'MedlinePlus en español — Pruebas médicas (U.S. National Library of Medicine)',
    sourceUrl: url,
    sourceUpdatedAt: updated,
    sourceRetrievedAt: prov.retrievedAt,
    sourceLicense: MPLUS_LICENSE,
    reviewStatus: 'external-source',
  };
}
