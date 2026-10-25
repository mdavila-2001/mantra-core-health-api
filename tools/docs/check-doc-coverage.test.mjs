import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = join(
  dirname(fileURLToPath(import.meta.url)),
  'check-doc-coverage.mjs',
);

// Repo mínimo que pasa todas las validaciones: un módulo documentado y los dos contratos.
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'alovida-doc-coverage-'));
  const write = (rel, text) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text, 'utf8');
  };
  write(
    'docs/index.md',
    '# Portal\n\nDescribe la API tal como existe hoy, módulo por módulo.\n',
  );
  write(
    'docs/modules/index.md',
    '# Módulos\n\n- [example](example.md): módulo de ejemplo de la prueba.\n',
  );
  write(
    'docs/modules/example.md',
    '# example\n\nEspejo del README del módulo de ejemplo de la prueba.\n',
  );
  write(
    'src/modules/example/README.md',
    '# example\n\n## Todo lo redactado llega redactado\n',
  );
  write(
    'src/modules/example/example.service.ts',
    '// TODO el catálogo se lee una vez: es castellano, no un marcador.\nexport const x = 1;\n',
  );
  write('openapi/openapi.yaml', `openapi: 3.1.0\n# ${'x'.repeat(10_000)}\n`);
  write('asyncapi/asyncapi.yaml', `asyncapi: 3.0.0\n# ${'x'.repeat(500)}\n`);
  return { root, write };
}

function run(root) {
  const r = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
  });
  return { code: r.status, out: `${r.stdout}\n${r.stderr}` };
}

function withFixture(fn) {
  const fx = fixture();
  try {
    fn(fx);
  } finally {
    rmSync(fx.root, { recursive: true, force: true });
  }
}

test('un repo sin pendientes pasa (incluye «Todo lo…» y «// TODO el…» en castellano)', () => {
  withFixture(({ root }) => {
    const r = run(root);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /Cobertura documental OK/);
  });
});

test('falla si existe docs/trabajo/ y dice dónde va el plan', () => {
  withFixture(({ root, write }) => {
    write(
      'docs/trabajo/2026-10-24-algo/notas.md',
      '# Notas\n\nCualquier contenido de una bitácora de trabajo.\n',
    );
    const r = run(root);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /WORK LOG: docs\/trabajo\/2026-10-24-algo\/notas\.md/);
    assert.match(r.out, /descripción del PR/);
    assert.match(r.out, /issue/);
  });
});

test('falla con PLAN.md, REPORTE.md o PENDIENTES*.md fuera de lo excluido', () => {
  withFixture(({ root, write }) => {
    write('tools/importador/PLAN.md', '# Plan\n');
    write('src/modules/example/REPORTE.md', '# Reporte\n');
    write('PENDIENTES-octubre.md', '# Lista\n');
    const r = run(root);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /WORK LOG: tools\/importador\/PLAN\.md/);
    assert.match(r.out, /WORK LOG: src\/modules\/example\/REPORTE\.md/);
    assert.match(r.out, /WORK LOG: PENDIENTES-octubre\.md/);
  });
});

test('falla con un encabezado de pendientes en docs/ o en un README de módulo', () => {
  withFixture(({ root, write }) => {
    write(
      'docs/guia.md',
      '# Guía\n\nTexto descriptivo suficiente para no ser una página vacía.\n\n## Pendiente\n\n- algo\n',
    );
    write('src/modules/example/README.md', '# example\n\n### Próximos pasos\n');
    write(
      'tools/x/README.md',
      '# x\n\n## **Falta:** cargar\n\n## TODO\n\n## Pendientes (bloqueados)\n\n## 3. Próximos pasos del importador\n',
    );
    const r = run(root);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /PENDING SECTION: docs\/guia\.md:5/);
    assert.match(r.out, /PENDING SECTION: src\/modules\/example\/README\.md:3/);
    assert.match(r.out, /PENDING SECTION: tools\/x\/README\.md:3/);
    assert.match(r.out, /PENDING SECTION: tools\/x\/README\.md:5/);
    assert.match(r.out, /PENDING SECTION: tools\/x\/README\.md:7/);
    assert.match(r.out, /PENDING SECTION: tools\/x\/README\.md:9/);
  });
});

test('no confunde palabras parecidas ni ejemplos dentro de un bloque de código', () => {
  withFixture(({ root, write }) => {
    write(
      'docs/estados.md',
      '# Estados\n\n## Pendiente de pago\n\n## Falta de stock\n\n## Faltantes\n\n```markdown\n## Pendiente\n```\n',
    );
    const r = run(root);
    assert.equal(r.code, 0, r.out);
  });
});

test('ignora lo vendorizado, .agents/, .claude/ y .github/', () => {
  withFixture(({ root, write }) => {
    write('database/SQL/PLAN.md', '# Plan del modelo\n\n## Pendientes\n');
    write('.agents/skills/x/PLAN.md', '# Plantilla\n\n## Pendiente\n');
    write('.claude/notas.md', '## Pendiente\n');
    write(
      '.github/PULL_REQUEST_TEMPLATE.md',
      '## Resumen\n\n- [ ] `yarn build`\n',
    );
    write('node_modules/pkg/PLAN.md', '# Plan\n');
    const r = run(root);
    assert.equal(r.code, 0, r.out);
  });
});

test('falla con un comentario TODO: o FIXME en src/', () => {
  withFixture(({ root, write }) => {
    write('src/modules/example/a.ts', 'export const a = 1; // TODO: validar\n');
    write(
      'src/modules/example/b.ts',
      '/**\n * FIXME el borde\n */\nexport const b = 1;\n',
    );
    write(
      'src/modules/example/c.ts',
      '// TODO(justin): cachear\nexport const c = 1;\n',
    );
    const r = run(root);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /TODO COMMENT: src\/modules\/example\/a\.ts:1/);
    assert.match(r.out, /TODO COMMENT: src\/modules\/example\/b\.ts:2/);
    assert.match(r.out, /TODO COMMENT: src\/modules\/example\/c\.ts:1/);
    assert.match(r.out, /ver #123/);
  });
});

test('en un repo git mira lo versionado y lo nuevo sin ignorar, no lo ignorado', () => {
  withFixture(({ root, write }) => {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    write('.gitignore', 'tmp/\n');
    write('tmp/PLAN.md', '# Plan local ignorado\n');
    assert.equal(run(root).code, 0);
    write('docs/trabajo/x/PLAN.md', '# Plan sin commitear\n');
    const r = run(root);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /WORK LOG: docs\/trabajo\/x\/PLAN\.md/);
    assert.doesNotMatch(r.out, /tmp\/PLAN\.md/);
  });
});
