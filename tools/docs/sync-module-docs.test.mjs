import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = join(dirname(fileURLToPath(import.meta.url)), 'sync-module-docs.mjs');

test('el espejo generado enlaza dev y termina con un solo salto de línea', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'alovida-docs-sync-'));

  try {
    const moduleDir = join(fixture, 'src', 'modules', 'example');
    mkdirSync(moduleDir, { recursive: true });
    writeFileSync(join(moduleDir, 'README.md'), '# Example\n', 'utf8');

    execFileSync('git', ['init', '--quiet'], { cwd: fixture });
    execFileSync(
      'git',
      ['remote', 'add', 'origin', 'https://github.com/example/alovida.git'],
      { cwd: fixture },
    );
    execFileSync(process.execPath, [script], { cwd: fixture });

    const mirror = readFileSync(
      join(fixture, 'docs', 'modules', 'example.md'),
      'utf8',
    );
    assert.equal(mirror.endsWith('\n'), true);
    assert.equal(mirror.endsWith('\n\n'), false);
    assert.match(
      mirror,
      /\*\*Fuente:\*\* \[`src\/modules\/example\/README\.md`\]\(https:\/\/github\.com\/example\/alovida\/blob\/dev\/src\/modules\/example\/README\.md\)/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
