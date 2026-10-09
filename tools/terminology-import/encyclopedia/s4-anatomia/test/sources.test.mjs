// Pruebas de los lectores de fuentes: HPO, MeSH y Commons.
// Fixtures: recortes REALES de la caché de red del 2026-10-08 (hp.json v2026-09-01
// y su traducción oficial, respuesta del SPARQL de NLM, respuesta de la API de
// Commons con `extmetadata`), sin editar los valores.
// Correr: node --test tools/terminology-import/encyclopedia/s4-anatomia/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hpIdFromIri, hpoVersionOf, labelAgrees, parseHpoJson } from '../lib/hpo.mjs';
import { meshLabelAgrees, parseMeshBindings, tokenKey } from '../lib/mesh.mjs';
import { imageKind, isAllowedImageHost, licenseFamily, parseCommonsResponse, toImage } from '../lib/commons.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => JSON.parse(readFileSync(join(FX, f), 'utf8'));

// --- HPO ----------------------------------------------------------------------

test('HPO: el IRI se convierte a HP:id y la versión sale de la fecha de release', () => {
  assert.equal(hpIdFromIri('http://purl.obolibrary.org/obo/HP_0012196'), 'HP:0012196');
  assert.equal(hpIdFromIri('http://example.org/otra'), null);
  assert.equal(hpoVersionOf({ graphs: [{ meta: { version: fx('hpo-excerpt.json').version } }] }), '2026-09-01');
});

test('HPO: la definición se conserva LITERAL (con el nodo real de Cheyne-Stokes)', () => {
  const { node } = fx('hpo-excerpt.json');
  const terms = parseHpoJson({ graphs: [{ nodes: [node] }] });
  const term = terms.get('HP:0012196');
  assert.equal(term.label, 'Cheyne-Stokes respiration');
  assert.equal(term.definition, node.meta.definition.val);
  assert.match(term.definition, /^An abnormal pattern of respiration characterized by cycles of respiration/);
});

test('HPO: la identidad exige que la etiqueta (o un sinónimo) coincida con la del ítem de Wikidata', () => {
  const term = parseHpoJson({ graphs: [{ nodes: [fx('hpo-excerpt.json').node] }] }).get('HP:0012196');
  assert.equal(labelAgrees(['Cheyne-Stokes respiration'], term), true);
  assert.equal(labelAgrees(['periodic breathing', 'cheyne stokes respiration'], term), true);
  assert.equal(labelAgrees(['ageusia'], term), false);
  assert.equal(labelAgrees([], term), false);
});

// --- MeSH ---------------------------------------------------------------------

test('MeSH: se agrupan filas por descriptor y la nota de alcance queda literal', () => {
  const parsed = parseMeshBindings(fx('mesh-bindings.json'));
  const abdomen = parsed.get('D000005');
  assert.equal(abdomen.label, 'Abdomen');
  assert.equal(abdomen.scopeNote, 'That portion of the body that lies between the THORAX and the PELVIS.');
  assert.ok(abdomen.terms.includes('Abdomen'));
  assert.match(parsed.get('D002639').scopeNote, /alternating periods of apnea/);
});

test('MeSH: el control de identidad compara sin mayúsculas, puntuación ni orden de palabras', () => {
  assert.equal(tokenKey('Lens, Crystalline'), tokenKey('crystalline lens'));
  const abdomen = parseMeshBindings(fx('mesh-bindings.json')).get('D000005');
  assert.equal(meshLabelAgrees(['abdomen'], abdomen), true);
  assert.equal(meshLabelAgrees(['thorax'], abdomen), false);
});

// --- Commons ------------------------------------------------------------------

const commons = parseCommonsResponse(fx('commons-response.json'));
const ctx = { termName: 'Abdomen', retrievedAt: '2026-10-08' };

test('Commons: la compuerta de licencia deja pasar PD/CC0/CC BY/CC BY-SA y frena el resto', () => {
  for (const ok of ['Public domain', 'CC0', 'CC BY 3.0', 'CC BY 4.0', 'CC BY-SA 2.1 jp', 'CC BY-SA 4.0']) assert.ok(licenseFamily(ok), ok);
  for (const no of ['GFDL', 'GFDL 1.2', 'No restrictions', 'Copyrighted free use', 'CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', 'Attribution', 'FAL', null, '']) {
    assert.equal(licenseFamily(no), null, String(no));
  }
});

test('Commons: solo los hosts de la CSP', () => {
  assert.equal(isAllowedImageHost('https://upload.wikimedia.org/wikipedia/commons/4/4a/Belly_button.jpg'), true);
  assert.equal(isAllowedImageHost('https://thumb.wikimedia.org/wikipedia/commons/thumb/a.jpg'), true);
  assert.equal(isAllowedImageHost('https://cima.aemps.es/cima/fotos/x.jpg'), true);
  assert.equal(isAllowedImageHost('https://example.com/x.jpg'), false);
  assert.equal(isAllowedImageHost('http://upload.wikimedia.org/x.jpg'), false);
  assert.equal(isAllowedImageHost('no es url'), false);
});

test('Commons: una foto CC BY real produce la imagen del contrato con autor, licencia y página de origen', () => {
  const { image, rejected } = toImage(commons.get('Belly button.jpg'), ctx);
  assert.equal(rejected, undefined);
  assert.equal(image.license, 'CC BY 3.0');
  assert.equal(image.author, 'Kayau');
  assert.equal(image.licenseUrl, 'https://creativecommons.org/licenses/by/3.0');
  assert.equal(image.sourcePage, 'https://commons.wikimedia.org/wiki/File:Belly_button.jpg');
  assert.equal(image.kind, 'photo');
  assert.equal(image.altTextQuality, 'caption');
  assert.equal(image.altText, image.caption);
  assert.equal(new URL(image.url).hostname, 'upload.wikimedia.org');
  assert.equal(image.retrievedAt, '2026-10-08');
});

test('Commons: un SVG CC0 real es un diagrama; sin descripción corta el alt es genérico', () => {
  const info = commons.get('Cheyne-Stokes respiration no lang.svg');
  const { image } = toImage(info, ctx);
  assert.equal(image.kind, 'diagram');
  assert.equal(image.license, 'CC0');
  const noCaption = toImage({ ...info, description: null }, ctx).image;
  assert.equal(noCaption.altText, 'Imagen de Abdomen');
  assert.equal(noCaption.altTextQuality, 'generic');
  const tooLong = toImage({ ...info, description: 'x'.repeat(301) }, ctx).image;
  assert.equal(tooLong.caption, null);
});

test('Commons: imágenes con GFDL o «No restrictions» (reales) se rechazan con motivo', () => {
  assert.match(toImage(commons.get('Blinddarm-01.jpg'), ctx).rejected, /^licencia-no-permitida:GFDL/);
  assert.match(toImage(commons.get('Atlas and epitome of operative ophthalmology (1905) (14782610945).jpg'), ctx).rejected, /^licencia-no-permitida:No restrictions/);
  assert.equal(toImage(undefined, ctx).rejected, 'commons-sin-metadatos');
});

test('Commons: advertencia de derechos de la personalidad (real) frena la imagen', () => {
  const info = commons.get('Crying-girl.jpg');
  assert.match(info.restrictions, /personality/i);
  assert.match(toImage(info, ctx).rejected, /^restriccion-de-uso:/);
});

test('Commons: CC BY sin autor o sin URL de licencia se rechaza; un host fuera de la CSP también', () => {
  const base = commons.get('Belly button.jpg');
  assert.equal(toImage({ ...base, artist: null, credit: null }, ctx).rejected, 'cc-sin-autor');
  assert.equal(toImage({ ...base, licenseUrl: null }, ctx).rejected, 'sin-url-de-licencia');
  assert.match(toImage({ ...base, url: 'https://example.com/a.jpg' }, ctx).rejected, /^host-fuera-de-csp/);
});

test('Commons: el kind sale de metadatos y la propiedad de Wikidata manda', () => {
  assert.equal(imageKind({ impliedKind: 'diagram', categories: ['X-rays of the elbows'] }), 'diagram');
  assert.equal(imageKind({ categories: ["Gray's Anatomy plates of digestive system"] }), 'diagram');
  assert.equal(imageKind({ categories: ['X-rays of the elbows'] }), 'imaging');
  assert.equal(imageKind({ categories: ['Histology of kidney'] }), 'histology');
  assert.equal(imageKind({ categories: ['Cholera'] , file: 'Cholera rehydration nurses.jpg' }), 'photo');
  assert.equal(imageKind({ mime: 'image/svg+xml' }), 'diagram');
  assert.equal(imageKind({ mime: 'image/gif', categories: ['Cuboid bone', 'Animated GIF files'] }), 'diagram');
  assert.equal(imageKind({ mime: 'image/jpeg', categories: ['Paintings of fear'] }), 'diagram');
});
