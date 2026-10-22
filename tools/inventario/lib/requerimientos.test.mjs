import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { leerGlobales, requerimientosDe } from './requerimientos.mjs';

const MAIN = `
  app.use(json({ limit: '2mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
`;
const MODULO = `
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 30_000, limit: 120 }],
    }),
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
`;

function raiz(main = MAIN, modulo = MODULO) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-req-'));
  fs.mkdirSync(path.join(root, 'src'));
  if (main !== null) fs.writeFileSync(path.join(root, 'src', 'main.ts'), main);
  if (modulo !== null)
    fs.writeFileSync(path.join(root, 'src', 'app.module.ts'), modulo);
  return root;
}

const handler = (extra = {}) => ({
  source: 'src/modules/w/w.controller.ts',
  line: 12,
  isPublic: false,
  roles: ['W_ADMIN'],
  decorators: ['Roles'],
  requiresVerifiedIdentity: false,
  uuidParams: [],
  throttle: undefined,
  ...extra,
});
const tipos = (reqs) => reqs.map((r) => r.tipo);

test('leerGlobales toma los valores del código, no de un texto fijo', () => {
  const g = leerGlobales(raiz());
  assert.equal(g.cuerpo.limite, '2mb');
  assert.equal(g.cuerpo.fuente, 'src/main.ts:2');
  assert.deepEqual([g.tasa.limite, g.tasa.ttlMs], [120, 30000]);
  assert.ok(g.validacion);
  assert.ok(g.tenant);
});

test('si el código ya no tiene el patrón, el límite queda null y se declara «no determinado»', () => {
  const g = leerGlobales(raiz('// sin nada', null));
  assert.deepEqual(g, {
    cuerpo: null,
    tasa: null,
    validacion: null,
    tenant: null,
  });
  const reqs = requerimientosDe({
    operation: { security: [{ bearer: [] }] },
    handler: handler(),
    globales: g,
  });
  assert.match(
    reqs.find((r) => r.tipo === 'RATE_LIMIT').detalle,
    /no determinado/,
  );
});

test('una operación autenticada con rol, UUID y cuerpo JSON', () => {
  const reqs = requerimientosDe({
    operation: {
      security: [{ bearer: [] }],
      parameters: [
        { in: 'header', name: 'Idempotency-Key', required: true },
        { in: 'query', name: 'q', required: false },
      ],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: {} } },
      },
    },
    handler: handler({ uuidParams: ['id'], requiresVerifiedIdentity: true }),
    globales: leerGlobales(raiz()),
  });
  assert.deepEqual(tipos(reqs), [
    'AUTENTICACION',
    'ROL',
    'IDENTIDAD_VERIFICADA',
    'TENANT',
    'CABECERA',
    'PARAMETRO_RUTA',
    'CUERPO',
    'VALIDACION',
    'RATE_LIMIT',
  ]);
  assert.match(
    reqs.find((r) => r.tipo === 'CABECERA').detalle,
    /Idempotency-Key \(obligatoria\)/,
  );
  assert.match(reqs.find((r) => r.tipo === 'CUERPO').detalle, /máximo 2mb/);
  assert.match(
    reqs.find((r) => r.tipo === 'RATE_LIMIT').detalle,
    /120 solicitudes cada 30 s/,
  );
});

test('una ruta pública no pide rol ni tenant, pero siempre tiene límite de tasa', () => {
  const reqs = requerimientosDe({
    operation: { security: [] },
    handler: handler({ isPublic: true, roles: [] }),
    globales: leerGlobales(raiz()),
  });
  assert.deepEqual(tipos(reqs), ['AUTENTICACION', 'RATE_LIMIT']);
});

test('sin @Roles se dice que no hay, sin suponer una regla', () => {
  const reqs = requerimientosDe({
    operation: { security: [{ bearer: [] }] },
    handler: handler({ roles: [] }),
    globales: leerGlobales(raiz()),
  });
  assert.match(
    reqs.find((r) => r.tipo === 'ROL').detalle,
    /Sin @Roles en el controlador/,
  );
});

test('@Throttle propio reemplaza al límite global; @TenantAgnostic cambia el requerimiento de tenant', () => {
  const reqs = requerimientosDe({
    operation: { security: [{ bearer: [] }] },
    handler: handler({
      throttle: 'Throttle({ default: { limit: 5, ttl: 60000 } })',
      decorators: ['Roles', 'TenantAgnostic'],
    }),
    globales: leerGlobales(raiz()),
  });
  assert.match(
    reqs.find((r) => r.tipo === 'RATE_LIMIT').detalle,
    /Límite propio: Throttle/,
  );
  assert.match(
    reqs.find((r) => r.tipo === 'TENANT').detalle,
    /agnóstica de tenant/,
  );
});

test('multipart no hereda el límite de 1 MB del JSON', () => {
  const reqs = requerimientosDe({
    operation: {
      security: [{ bearer: [] }],
      requestBody: { content: { 'multipart/form-data': { schema: {} } } },
    },
    handler: handler(),
    globales: leerGlobales(raiz()),
  });
  assert.doesNotMatch(reqs.find((r) => r.tipo === 'CUERPO').detalle, /máximo/);
});

test('contra el código real: los límites globales se encuentran con su línea', () => {
  const g = leerGlobales(process.cwd());
  assert.ok(g.cuerpo && g.tasa && g.validacion && g.tenant, JSON.stringify(g));
  assert.match(g.cuerpo.fuente, /^src\/main\.ts:\d+$/);
  assert.match(g.tasa.fuente, /^src\/app\.module\.ts:\d+$/);
});
