// El corpus versionado en data/out/ coincide con data/MANIFEST.json (filas y SHA-256) y se lee con readCorpus.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { readCorpus } from '../lib/common.mjs';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const manifest = JSON.parse(readFileSync(join(DATA, 'MANIFEST.json'), 'utf8'));
const rowsOf = (name) => manifest.files.filter((f) => new RegExp(`^out/${name}(\\.part\\d+)?\\.ndjson\\.gz$`).test(f.path)).reduce((n, f) => n + f.rows, 0);

test('readCorpus lee las partes versionadas y verifica el SHA-256 del MANIFEST', () => {
  for (const name of ['procedures', 'assertions', 'maps']) {
    const rows = readCorpus(name);
    assert.equal(rows.length, rowsOf(name), name);
    assert.ok(rows.length > 0);
  }
  assert.equal(readCorpus('procedures').length, 84990);
});
