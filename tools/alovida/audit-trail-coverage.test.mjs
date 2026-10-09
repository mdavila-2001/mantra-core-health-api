// Pruebas del control de CI de bitácora transversal (`audit-trail-coverage.mjs`).
// Uso: `node --test tools/alovida/audit-trail-coverage.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAuditTrailCoverage,
  classifyMutation,
  collectActionLiterals,
  interceptorRegistration,
  parseControllerRoutes,
  routeKey,
} from './audit-trail-coverage-lib.mjs';

const APP_MODULE_OK = `
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditTrailInterceptor },
`;

const controller = (body, classDecorators = '') => `
import { Controller, Post } from '@nestjs/common';

export class SomeDto {
  name!: string;
}

${classDecorators}@ApiTags('x')
@Controller('things')
export class ThingsController {
  constructor(private readonly service: ThingsService) {}
${body}
}
`;

const check = (text, allowlist = new Map(), appModuleText = APP_MODULE_OK) =>
  checkAuditTrailCoverage({
    controllers: [{ file: 'src/modules/things/controllers/things.controller.ts', text }],
    appModuleText,
    allowlist,
  });

test('una ruta autenticada que muta queda SELLADA por el interceptor', () => {
  const routes = parseControllerRoutes(
    controller(`
  @Post(':id/close')
  @Roles('ADMIN')
  close(@Param('id') id: string) {
    return this.service.close(id);
  }`),
  );
  assert.equal(routes.length, 1);
  assert.equal(routeKey(routes[0]), 'POST /things/:id/close');
  assert.equal(classifyMutation(routes[0]), 'SEALED');
  assert.deepEqual(
    check(controller(`
  @Post()
  create() {}`)).violations,
    [],
  );
});

test('la clase que cuenta es la del @Controller, no un DTO anterior', () => {
  const [route] = parseControllerRoutes(
    controller(`
  @Delete(':id')
  remove() {}`),
  );
  assert.equal(route.template, '/things/:id');
  assert.equal(route.handler, 'remove');
});

test('comentarios entre decoradores no pierden la ruta', () => {
  const routes = parseControllerRoutes(
    controller(`
  @Post()
  // El alta es de la administración; el servicio comprueba la pertenencia.
  @Roles('ADMIN')
  create() {}`),
  );
  assert.equal(routes.length, 1);
});

test('una ruta @Public que muta y no está en la allowlist rompe el build', () => {
  const text = controller(`
  @Public()
  @Post('webhook')
  receive() {}`);
  const { violations } = check(text);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, 'UNTRACED_PUBLIC_MUTATION');
  assert.match(violations[0].msg, /POST \/things\/webhook/);

  const allowed = check(text, new Map([['POST /things/webhook', 'tabla propia']]));
  assert.deepEqual(allowed.violations, []);
});

test('@Public a nivel de clase vuelve públicas todas sus rutas', () => {
  const routes = parseControllerRoutes(
    controller(
      `
  @Post()
  create() {}`,
      '@Public()\n',
    ),
  );
  assert.equal(classifyMutation(routes[0]), 'PUBLIC');
});

test('@SkipAuditTrail exige allowlist y motivo', () => {
  const skipped = controller(`
  @Post('relay')
  @SkipAuditTrail(QUEUE_PLUMBING)
  relay() {}`);
  assert.equal(check(skipped).violations[0].code, 'UNREVIEWED_SKIP');
  assert.deepEqual(
    check(skipped, new Map([['POST /things/relay', 'plomería']])).violations,
    [],
  );

  const empty = controller(`
  @Post('relay')
  @SkipAuditTrail('')
  relay() {}`);
  const codes = check(empty, new Map([['POST /things/relay', 'x']])).violations.map(
    (v) => v.code,
  );
  assert.deepEqual(codes, ['EMPTY_SKIP_REASON']);
});

test('@SkipAuditTrail multilínea y a nivel de clase', () => {
  const multiline = parseControllerRoutes(
    controller(`
  @Post('relay')
  @SkipAuditTrail(
    'Plomería de cola',
  )
  relay() {}`),
  );
  assert.equal(multiline[0].skipReason, 'Plomería de cola');

  const classLevel = parseControllerRoutes(
    controller(
      `
  @Post()
  create() {}`,
      "@SkipAuditTrail('rastro propio')\n",
    ),
  );
  assert.equal(classifyMutation(classLevel[0]), 'SKIPPED');
  assert.equal(classLevel[0].skipReason, 'rastro propio');
});

test('las lecturas no cuentan como mutación', () => {
  const { summary } = check(
    controller(`
  @Get(':id')
  find() {}`),
  );
  assert.equal(summary.size, 0);
});

test('allowlist vencida: una entrada sin ruta rompe el build', () => {
  const { violations } = check(
    controller(`
  @Post()
  create() {}`),
    new Map([['POST /things/gone', 'ya no existe']]),
  );
  assert.deepEqual(
    violations.map((v) => v.code),
    ['STALE_ALLOWLIST'],
  );
});

test('el interceptor debe estar registrado y después del de tenant', () => {
  assert.equal(interceptorRegistration(APP_MODULE_OK), 'OK');
  assert.equal(
    interceptorRegistration(
      '{ provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },',
    ),
    'MISSING',
  );
  assert.equal(
    interceptorRegistration(`
    { provide: APP_INTERCEPTOR, useClass: AuditTrailInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },`),
    'BEFORE_TENANT',
  );
  const codes = check(controller(''), new Map(), '').violations.map((v) => v.code);
  assert.deepEqual(codes, ['INTERCEPTOR_NOT_REGISTERED']);
});

test('colisión de acción: la misma acción de bitácora en dos módulos', () => {
  const seal = (action) => `
    await this.auditTrail.record(tx, actor, {
      action: '${action}',
      entity: 'x',
    });`;
  const files = [
    { file: 'src/modules/a/services/a.service.ts', text: seal('THING_CLOSED') },
    { file: 'src/modules/b/services/b.service.ts', text: seal('THING_CLOSED') },
    { file: 'src/modules/b/services/c.service.ts', text: seal('OTHER_DONE') },
    // `action` fuera de un sello (PDP de authz) no es una acción de bitácora.
    { file: 'src/modules/c/services/pdp.ts', text: "const q = { action: 'THING_CLOSED' };" },
  ];
  const byAction = collectActionLiterals(files);
  assert.deepEqual([...byAction.get('THING_CLOSED')], ['a', 'b']);
  assert.deepEqual([...byAction.get('OTHER_DONE')], ['b']);

  const { violations } = checkAuditTrailCoverage({
    controllers: [],
    appModuleText: APP_MODULE_OK,
    allowlist: new Map(),
    sources: files,
  });
  assert.deepEqual(
    violations.map((v) => v.code),
    ['ACTION_COLLISION'],
  );
});
