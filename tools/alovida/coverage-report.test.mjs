// Pruebas de la puerta ORPHAN_ENDPOINT de `coverage-report.mjs` (O3-3).
//
// Cada caso arma un repositorio mínimo en un directorio temporal (un
// controlador, el `auth.module.ts` con el guard JWT global y un commit, porque
// el informe dice de qué SHA sale) y corre el script real con ese directorio
// como raíz. Ejecutar: `node --test tools/alovida/coverage-report.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  'coverage-report.mjs',
);

const AUTH_MODULE = `
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
export const providers = [{ provide: APP_GUARD, useClass: JwtAuthGuard }];
`;

/**
 * Arma el repositorio de prueba y corre el informe.
 *
 * @param controller - Fuente del controlador de `src/modules/demo/controllers`.
 * @param args - Flags del script.
 * @param allowlist - Contenido de `tools/catalog/permission-drift-allowlist.json`.
 * @returns Código de salida, stdout y stderr.
 */
function run(controller, args = [], allowlist) {
  const root = mkdtempSync(join(tmpdir(), 'coverage-report-'));
  try {
    const write = (rel, text) => {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), text);
    };
    write('src/common/auth/auth.module.ts', AUTH_MODULE);
    write('src/modules/demo/controllers/demo.controller.ts', controller);
    mkdirSync(join(root, 'docs', 'reports'), { recursive: true });
    if (allowlist)
      write(
        'tools/catalog/permission-drift-allowlist.json',
        JSON.stringify(allowlist),
      );
    const git = (...a) =>
      execFileSync('git', a, { cwd: root, stdio: 'ignore' });
    git('init', '-q');
    git('add', '.');
    git(
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.invalid',
      'commit',
      '-q',
      '-m',
      'fixture',
    );
    const r = spawnSync(process.execPath, [SCRIPT, ...args], {
      cwd: root,
      encoding: 'utf8',
    });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const ORPHAN = `
@Controller('demo')
export class DemoController {
  @Post('things')
  create(@Body() dto: unknown) {
    return dto;
  }
}
`;

test('--fail-on-orphan sale con 1 y nombra el endpoint huérfano', () => {
  const r = run(ORPHAN, ['--fail-on-orphan']);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /ORPHAN_ENDPOINT: 1 endpoint/);
  assert.match(r.stderr, /demo\.controller\.ts:4 — @Post 'things'/);
});

test('sin el flag el informe sigue siendo informativo (exit 0)', () => {
  const r = run(ORPHAN);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /orphan_endpoint=1/);
});

test('@Roles en el método o en la clase lo declara', () => {
  const metodo = run(
    `
@Controller('demo')
export class DemoController {
  @Post('things')
  @Roles('SECURITY_ADMIN')
  create() {}
}
`,
    ['--fail-on-orphan'],
  );
  assert.equal(metodo.status, 0, metodo.stderr);
  const clase = run(
    `
@Roles('SYSTEM')
@Controller('demo')
export class DemoController {
  @Post('things')
  create() {}
}
`,
    ['--fail-on-orphan'],
  );
  assert.equal(clase.status, 0, clase.stderr);
});

test('un @Roles de otro handler no exime al vecino', () => {
  const r = run(
    `
@Controller('demo')
export class DemoController {
  @Post('a')
  @Roles('SECURITY_ADMIN')
  a() {}

  @Post('b')
  b() {}
}
`,
    ['--fail-on-orphan'],
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /@Post 'b'/);
  assert.doesNotMatch(r.stderr, /@Post 'a'/);
});

test('un @Roles de otra clase del mismo archivo no exime', () => {
  const r = run(
    `
@Roles('SYSTEM')
@Controller('internal/demo')
export class DemoInternalController {
  @Post('tick')
  tick() {}
}

@Controller('demo')
export class DemoController {
  @Post('things')
  create() {}
}
`,
    ['--fail-on-orphan'],
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /@Post 'things'/);
  assert.doesNotMatch(r.stderr, /@Post 'tick'/);
});

test('las lecturas (GET) y @Public no cuentan como huérfanas', () => {
  const r = run(
    `
@Controller('demo')
export class DemoController {
  @Get('things')
  list() {}

  @Public()
  @Post('login')
  login() {}
}
`,
    ['--fail-on-orphan'],
  );
  assert.equal(r.status, 0, r.stderr);
});

test('@UseGuards(LabStaffGuard) de clase autoriza; otro guard no', () => {
  const lab = run(
    `
@UseGuards(LabStaffGuard)
@Controller('demo')
export class DemoController {
  @Post('things')
  create() {}
}
`,
    ['--fail-on-orphan'],
  );
  assert.equal(lab.status, 0, lab.stderr);
  const otro = run(
    `
@UseGuards(ThrottlerGuard)
@Controller('demo')
export class DemoController {
  @Post('things')
  create() {}
}
`,
    ['--fail-on-orphan'],
  );
  assert.equal(otro.status, 1);
});

test('una ruta revisada en permission-drift-allowlist exime; una sin revisar no', () => {
  const revisada = run(ORPHAN, ['--fail-on-orphan'], {
    roles: [],
    routes: [],
    reviewed: [
      { reason: 'prueba', evidence: ['x'], routes: ['POST /demo/things'] },
    ],
  });
  assert.equal(revisada.status, 0, revisada.stderr);
  const sinRevisar = run(ORPHAN, ['--fail-on-orphan'], {
    roles: [],
    routes: ['POST /demo/things'],
    reviewed: [],
  });
  assert.equal(sinRevisar.status, 1);
});
