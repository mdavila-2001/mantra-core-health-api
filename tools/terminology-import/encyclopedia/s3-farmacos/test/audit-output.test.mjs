// La auditoría independiente de la salida detecta dosis, secciones 4.2 e imágenes fuera de política.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { audit } from '../audit-output.mjs';

const base = () => ({
  conceptRef: { system: 'cima-vtm', code: '1', slug: 'cima-vtm-1' },
  sections: [{ kind: 'indications', text: 'Texto limpio.', locator: '4.1 Indicaciones terapéuticas' }],
  images: [{ url: 'https://cima.aemps.es/a.jpg', thumbUrl: 'https://cima.aemps.es/t.jpg', license: 'AEMPS/CIMA — reproducción autorizada citando la fuente' }],
  facts: [{ label: 'Código ATC', value: 'A11G · CLASE', source: 'aemps-cima', sourceUrl: 'https://cima.aemps.es/' }],
});

async function run(article, rejected = []) {
  const dir = mkdtempSync(join(tmpdir(), 's3-audit-'));
  try {
    writeFileSync(join(dir, 'articles.ndjson'), JSON.stringify(article) + '\n');
    writeFileSync(join(dir, 'rejected.ndjson'), rejected.map((r) => JSON.stringify(r)).join('\n') + (rejected.length ? '\n' : ''));
    return await audit(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('un artículo limpio pasa (el código ATC «A11G» no es «11 g»)', async () => {
  const r = await run(base());
  assert.equal(r.ok, true);
  assert.equal(r.doseHits.length, 0);
});

test('una dosis en el texto, en un fact o en rejected.ndjson hace fallar la auditoría', async () => {
  const text = base(); text.sections[0].text = 'Tomar 500 mg cada 8 horas.';
  assert.equal((await run(text)).ok, false);
  const fact = base(); fact.facts[0].value = '10 UI';
  assert.equal((await run(fact)).ok, false);
  const rej = await run(base(), [{ conceptRef: { slug: 'x' }, scope: 'sentences', excerpt: 'No superar 4 g.' }]);
  assert.equal(rej.ok, false);
  assert.equal(rej.doseHits[0].file, 'rejected');
});

test('una sección con locator 4.2 hace fallar la auditoría', async () => {
  const a = base(); a.sections.push({ kind: 'indications', text: 'x', locator: '4.2 Posología' });
  const r = await run(a);
  assert.equal(r.section42, 1);
  assert.equal(r.ok, false);
});

test('una imagen fuera de la CSP o con licencia NC hace fallar la auditoría', async () => {
  const host = base(); host.images[0].url = 'https://example.com/a.jpg';
  assert.equal((await run(host)).ok, false);
  const nc = base(); nc.images[0].license = 'CC BY-NC 4.0';
  assert.equal((await run(nc)).ok, false);
});
