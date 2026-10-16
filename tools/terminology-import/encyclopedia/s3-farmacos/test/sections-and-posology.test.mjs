// La sección 4.2 (posología) NO se descarga, NO se procesa y NO se guarda.
// Correr: node --test tools/terminology-import/encyclopedia/s3-farmacos/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCimaArticle, buildCimaSection } from '../lib/article.mjs';
import { slimVtm } from '../lib/corpus.mjs';
import { ALLOWED_SECTIONS, ForbiddenSectionError, SECTION_ORDER, assertAllowedSection, revisionDateUrl, sectionPublicUrl, sectionUrl } from '../lib/sections.mjs';
import { sectionCachePath } from '../fetch-cima.mjs';
import { POSOLOGY_MARKER, fakePosologyResponse, fx } from './helpers.mjs';

const seedRow = fx('seed-cima-vtm-27658006.json');
const vtm = slimVtm(fx('cima-vtm-27658006.json'));

test('la lista blanca no contiene la 4.2 ni variantes', () => {
  assert.deepEqual(ALLOWED_SECTIONS, ['4.1', '4.3', '4.4', '4.5', '4.6', '4.8', '5.1']);
  for (const bad of ['4.2', '4.2.1', '4.20', ' 4.2', '4.2 ', 4.2, null, undefined, '', '4', '4.7', '4.9', '10']) {
    assert.throws(() => assertAllowedSection(bad), ForbiddenSectionError, `debió rechazar ${JSON.stringify(bad)}`);
  }
});

test('no existe forma de armar la URL de la 4.2: ni el endpoint, ni el enlace público, ni la ruta de caché', () => {
  assert.throws(() => sectionUrl('50239', '4.2'), ForbiddenSectionError);
  assert.throws(() => sectionPublicUrl('50239', '4.2'), ForbiddenSectionError);
  assert.throws(() => sectionCachePath('50239', '4.2'), ForbiddenSectionError);
  // Una URL sin `seccion` devolvería TODAS las secciones (incluida la 4.2): nunca se construye.
  for (const code of ALLOWED_SECTIONS) assert.match(sectionUrl('50239', code), /&seccion=\d\.\d$/);
  // La única petición fuera de la lista blanca es la sección 10 (fecha de revisión), nunca la 4.2.
  assert.match(revisionDateUrl('50239'), /&seccion=10$/);
});

test('buildCimaSection rechaza pedir la 4.2 aunque la respuesta la traiga', () => {
  assert.throws(
    () => buildCimaSection({ seedRow, code: '4.2', response: fakePosologyResponse(), nregistro: '50239', fichaDate: '2025-06-07', retrievedAt: '2026-10-08' }),
    ForbiddenSectionError,
  );
});

test('una respuesta que mezcla 4.3 y 4.2 solo publica la 4.3', () => {
  const real43 = fx('cima-50239-4.3.json');
  const mixed = [...fakePosologyResponse(), ...real43];
  const { section } = buildCimaSection({ seedRow, code: '4.3', response: mixed, nregistro: '50239', fichaDate: '2025-06-07', retrievedAt: '2026-10-08' });
  assert.ok(section);
  assert.equal(section.kind, 'contraindications');
  assert.ok(!JSON.stringify(section).includes(POSOLOGY_MARKER));
});

test('un mapa de secciones con una «4.2» inyectada NO aparece en la salida del artículo', () => {
  const sections = {
    '4.3': { response: fx('cima-50239-4.3.json'), retrievedAt: '2026-10-08', fichaDate: '2025-06-07' },
    '4.2': { response: fakePosologyResponse(), retrievedAt: '2026-10-08', fichaDate: '2025-06-07' },
  };
  const { article, rejected } = buildCimaArticle({ seedRow, vtm, sections, listingDate: '2026-09-30', retrievedAt: '2026-09-30' });
  const out = JSON.stringify({ article, rejected });
  assert.ok(!out.includes(POSOLOGY_MARKER), 'el texto de la 4.2 salió en la salida');
  assert.ok(!article.sections.some((s) => /^4\.2\b/.test(s.locator)));
  assert.ok(!SECTION_ORDER.includes('4.2'));
  assert.deepEqual(article.sections.map((s) => s.kind), ['contraindications', 'presentations']);
});

test('slimVtm descarta drugFacts.sections (donde el importador anterior dejó la 4.2)', () => {
  const row = fx('cima-vtm-27658006.json');
  row.drugFacts.sections = [{ section: '4.2', text: POSOLOGY_MARKER, html: POSOLOGY_MARKER }];
  const slim = slimVtm(row);
  assert.ok(!JSON.stringify(slim).includes(POSOLOGY_MARKER));
  assert.equal('sections' in slim, false);
});
