import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_IMAGE_HOSTS, allowedHost, classifyImageLicense, commonsRowToImage, licenseUrlFor } from '../lib/images.mjs';
import { fx } from './helpers.mjs';

test('hosts: solo los tres de la CSP, por https', () => {
  assert.deepEqual([...ALLOWED_IMAGE_HOSTS], ['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es']);
  assert.equal(allowedHost('https://upload.wikimedia.org/a.png'), 'upload.wikimedia.org');
  assert.equal(allowedHost('https://cima.aemps.es/cima/fotos/full/1/a.jpg'), 'cima.aemps.es');
  for (const bad of ['http://upload.wikimedia.org/a.png', 'https://commons.wikimedia.org/a.png', 'https://example.com/a.png', 'https://upload.wikimedia.org.evil.com/a.png', 'not a url', null]) {
    assert.equal(allowedHost(bad), null, String(bad));
  }
});

test('licencias: admitidas y rechazadas', () => {
  for (const ok of ['Public domain', 'CC0', 'CC0 1.0', 'CC BY 2.0', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 4.0', 'CC BY-SA 2.1 jp', 'PD-USGov']) {
    assert.equal(classifyImageLicense(ok).ok, true, ok);
  }
  for (const bad of ['CC BY-NC 4.0', 'CC BY-NC-SA 3.0', 'CC BY-ND 2.0', 'CC BY-NC-ND 4.0', 'No restrictions', 'GFDL', 'All rights reserved', '', null, 'Attribution']) {
    assert.equal(classifyImageLicense(bad).ok, false, String(bad));
  }
});

test('licenseUrlFor arma la URL de CC solo con versión explícita', () => {
  assert.equal(licenseUrlFor('CC BY-SA 4.0', null), 'https://creativecommons.org/licenses/by-sa/4.0/');
  assert.equal(licenseUrlFor('CC BY 2.0', null), 'https://creativecommons.org/licenses/by/2.0/');
  assert.equal(licenseUrlFor('Public domain', null), null);
  assert.equal(licenseUrlFor('CC BY 4.0', 'https://x.test/l'), 'https://x.test/l');
});

test('filas reales de Commons: dominio público y CC BY-SA entran; «No restrictions» y CC BY sin autor, no', () => {
  const rows = fx('commons-rows.json');
  const ctx = { termName: 'Término', retrievedAt: '2026-09-30' };
  const pd = commonsRowToImage(rows['Public domain'], ctx);
  assert.equal(pd.image.license, 'Public domain');
  assert.equal(pd.image.author, 'Ed (Edgar181)');
  assert.ok(!pd.image.url.includes('utm_source'));

  const sa = commonsRowToImage(rows['CC BY-SA 4.0'], ctx);
  assert.equal(sa.image.licenseUrl, 'https://creativecommons.org/licenses/by-sa/4.0'); // tal cual lo trae Commons
  assert.equal(new URL(sa.image.thumbUrl).hostname, 'thumb.wikimedia.org');

  assert.equal(commonsRowToImage(rows['No restrictions'], ctx).reason, 'license:license-not-recognized');
  assert.equal(commonsRowToImage(rows['noauthor-ccby'], ctx).reason, 'attribution-required-author-missing');
});
