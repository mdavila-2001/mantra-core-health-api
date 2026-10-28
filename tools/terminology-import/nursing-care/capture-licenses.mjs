#!/usr/bin/env node
// =============================================================================
// Captura textual de las licencias que sustentan lo cargado o lo descartado (2026-10-27). Para cada fuente baja la página o el PDF,
// extrae el pasaje entre dos marcadores y guarda: URL final, estado HTTP, SHA-256 de los bytes, fecha y el TEXTO verbatim del pasaje
// (sin resumir). Si un marcador ya no está, falla: la licencia cambió o la página se movió y hay que volver a leerla.
//
//   node tools/terminology-import/nursing-care/capture-licenses.mjs --out <dir>     escribe <dir>/licencias-capturas.json y .md
//
// Un pedido a la vez, ≥ 600 ms entre pedidos, User-Agent identificable. Requiere `pdftotext` para los PDF.
// =============================================================================

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { HttpClient, USER_AGENT, decodeEntities, ensureDir, nowIso } from '../lib/glossary-es/common.mjs';

const outIdx = process.argv.indexOf('--out');
if (outIdx < 0) throw new Error('Falta --out <dir>');
const OUT = resolve(process.argv[outIdx + 1]);

/** kind: html | pdf | json. `from`/`to`: marcadores del pasaje (inclusive `from`, exclusive `to`; `to` null = `max` caracteres). */
const TARGETS = [
  { key: 'omaha-faq-1', what: 'Omaha System — FAQ, pregunta 1 (licencia de términos)', url: 'https://www.omahasystem.org/faq', kind: 'html', from: '1. Do I need to buy a license', to: '2. What Omaha System publications are available?' },
  { key: 'mosug-kbs-copyright', what: 'MOSUG — portada del KBS Rating Supplement', url: 'https://www.omahasystemmn.org/booklet/OmahaSystemKBSRatingSupplement2010_8x11.pdf', kind: 'pdf', from: 'Copyright 2010 Minnesota Omaha System Users Group', max: 200 },
  { key: 'glasgow-permissions', what: 'Glasgow Coma Scale — página de permisos', url: 'https://www.glasgowcomascale.org/permissions/', kind: 'html', from: 'The Glasgow Coma Scale (GCS), GCS Aid, GCS-P score', to: 'Contact Us' },
  { key: 'news2-copyright', what: 'RCP — NEWS2 and copyright', url: 'https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/', kind: 'html', from: 'NEWS2 and copyright', to: 'Access the NEWS2 elearning tool' },
  { key: 'braden-license', what: 'Braden Scale — FAQ de licencia', url: 'https://www.bradenscale.com/faqs-braden-scale-ii', kind: 'html', from: 'How do I license the Braden Scale Toolkit?', max: 420 },
  { key: 'barthel-medchi-via-strokengine', what: 'Barthel Index — aviso de MedChi reproducido por Stroke Engine (fuente SECUNDARIA)', url: 'https://strokengine.ca/en/assessments/barthel-index-bi/', kind: 'html', from: 'Copyright Information:', to: 'Table of contents' },
  { key: 'sanidad-aviso-legal', what: 'Ministerio de Sanidad — Aviso legal (propiedad intelectual y reutilización)', url: 'https://www.sanidad.gob.es/avisoLegal/home.htm', kind: 'html', latin1: true, from: 'Derechos de Propiedad Intelectual y de Propiedad Industrial', to: 'Links o Hiperenlaces' },
  { key: 'imss-gpc-375', what: 'IMSS — GPC IMSS-375-17 (aviso de reproducción)', url: 'https://www.imss.gob.mx/sites/all/statics/guiasclinicas/375GER.pdf', kind: 'pdf', from: 'Este documento puede reproducirse libremente', to: 'En la integración de esta Guía' },
  { key: 'guiasalud-aviso', what: 'GuíaSalud — aviso legal', url: 'https://portal.guiasalud.es/aviso-legal/', kind: 'html', from: 'Los contenidos elaborados por GuíaSalud', max: 420 },
  { key: 'nnac-bolivia', what: 'Bolivia — NNAC 2012 (aviso de la portada)', url: 'https://comunidad.org.bo/assets/archivos/herramienta/e0c314a57745ee92764a692f3ac7e9fa.pdf', kind: 'pdf', from: 'Esta publicación es propiedad del Ministerio de Salud y Deportes', max: 220 },
  { key: 'datos-gov-co-pbs-license', what: 'datos.gov.co — dataset «Procedimiento del PBS» (metadatos de licencia)', url: 'https://www.datos.gov.co/api/views/9zcz-bjue.json', kind: 'json', fields: ['name', 'attribution', 'licenseId', 'license'] },
  { key: 'ley-23-1982-art-41', what: 'Colombia — Ley 23 de 1982, art. 41 (texto en el régimen legal de Bogotá, SECUNDARIA del texto oficial)', url: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=3431', kind: 'html', latin1: true, from: 'Artículo 41º.', to: 'Artículo 42º.' },
];

const http = new HttpClient({ concurrency: 1, minDelayMs: 600, maxRetries: 4, headers: { 'User-Agent': `${USER_AGENT} (license capture; +https://github.com/mdavila-2001/mantra-core-health-api)` } });
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const plain = (html) => decodeEntities(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n');

function pdfText(bytes) {
  const dir = mkdtempSync(join(tmpdir(), 'lic-'));
  try {
    writeFileSync(join(dir, 'a.pdf'), bytes);
    return execFileSync('pdftotext', ['-layout', join(dir, 'a.pdf'), '-'], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const passage = (text, t) => {
  const flat = text.replace(/\s+/g, ' ');
  const i = flat.indexOf(t.from.replace(/\s+/g, ' '));
  if (i < 0) throw new Error(`${t.key}: ya no está el marcador «${t.from}»`);
  const j = t.to ? flat.indexOf(t.to.replace(/\s+/g, ' '), i + 1) : -1;
  if (t.to && j < 0) throw new Error(`${t.key}: ya no está el marcador final «${t.to}»`);
  return flat.slice(i, t.to ? j : i + t.max).trim();
};

const out = [];
for (const t of TARGETS) {
  const res = await http.get(t.url);
  let text;
  if (t.kind === 'pdf') text = pdfText(res.body);
  else if (t.kind === 'json') {
    const j = JSON.parse(res.body.toString('utf8'));
    text = JSON.stringify(Object.fromEntries(t.fields.map((f) => [f, j[f]])));
  } else text = plain(res.body.toString(t.latin1 ? 'latin1' : 'utf8'));
  const excerpt = t.kind === 'json' ? text : passage(text, t);
  out.push({ key: t.key, what: t.what, url: t.url, httpStatus: res.status, contentType: res.headers.get('content-type'), bytes: res.body.length, sha256: sha256(res.body), capturedAt: nowIso(), excerpt });
  console.log(`[captura] ${t.key}: ${res.status} ${res.body.length} B, ${excerpt.length} caracteres`);
}
ensureDir(OUT);
writeFileSync(join(OUT, 'licencias-capturas.json'), `${JSON.stringify(out, null, 2)}\n`);
writeFileSync(
  join(OUT, 'licencias-capturas.md'),
  `# Capturas textuales de licencias (${out[0].capturedAt.slice(0, 10)})\n\nGeneradas por \`capture-licenses.mjs\`: pasaje verbatim, SHA-256 de los bytes bajados y URL. Los pasajes son texto de terceros reproducido como evidencia de licencia.\n\n${out
    .map((c) => `## ${c.key}\n- ${c.what}\n- URL: ${c.url} (HTTP ${c.httpStatus}, SHA-256 \`${c.sha256}\`)\n\n> ${c.excerpt.replace(/\n/g, '\n> ')}\n`)
    .join('\n')}`,
);
