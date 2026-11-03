import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { isInScope, run } from './generate-documentation.mjs';

const entity = `import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'demo', tableName: 'demo_items' })
export class DemoItems {
  @PrimaryKey({ type: 'uuid' })
  id!: string;
}
`;
const plain = `export class Helper {
  value = 1;
}
`;

// Archivos que el generador no debe tocar (issue #1246).
const outOfScope = [
  'src/common/helper.ts',
  'src/worker/helper.ts',
  'src/modules/demo/dto/demo.dto.ts',
  'src/modules/demo/services/demo.service.ts',
  'src/modules/demo/entities/demo_items.entity.spec.ts',
  'database/SQL/helper.ts',
  'mock-provider-server/helper.ts',
  'test/integration/helper.ts',
  'tools/helper.mjs',
];

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsdoc-scope-'));
  const write = (relative, content) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  write('src/modules/demo/entities/demo_items.entity.ts', entity);
  for (const relative of outOfScope) write(relative, plain);
  return root;
}

function readmes(root) {
  const found = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name === 'README.md')
        found.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  };
  walk(root);
  return found;
}

test('isInScope solo acepta TypeScript de entities/ bajo src/modules', () => {
  assert.equal(
    isInScope('src/modules/demo/entities/demo_items.entity.ts'),
    true,
  );
  assert.equal(isInScope('src/modules/demo/sub/entities/index.ts'), true);
  for (const relative of outOfScope)
    assert.equal(isInScope(relative), false, relative);
  assert.equal(isInScope('src/modules/demo/entities/types.d.ts'), false);
});

test('documenta solo las entidades, sin README y con la sangría correcta', () => {
  const root = fixture();
  try {
    const result = run({ root });
    assert.deepEqual(
      {
        changedFiles: result.changedFiles,
        createdReadmes: result.createdReadmes,
      },
      { changedFiles: 1, createdReadmes: 0 },
    );
    for (const relative of outOfScope)
      assert.equal(
        fs.readFileSync(path.join(root, relative), 'utf8'),
        plain,
        relative,
      );
    assert.deepEqual(readmes(root), []);

    const documented = fs.readFileSync(
      path.join(root, 'src/modules/demo/entities/demo_items.entity.ts'),
      'utf8',
    );
    assert.match(
      documented,
      /\n\/\*\*\n \* Mapea la entidad persistente asociada a `demo_items`\.\n \*\/\n@Entity\(/,
    );
    assert.match(
      documented,
      /\n {2}\/\*\*\n {3}\* Identificador único de la instancia\.\n {3}\*\/\n {2}@PrimaryKey\(/,
    );

    assert.equal(run({ root }).documentedDeclarations, 0, 'es idempotente');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('--readmes crea el índice solo en las carpetas del alcance', () => {
  const root = fixture();
  try {
    assert.equal(run({ root, readmes: true }).createdReadmes, 1);
    assert.deepEqual(readmes(root), ['src/modules/demo/entities/README.md']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
