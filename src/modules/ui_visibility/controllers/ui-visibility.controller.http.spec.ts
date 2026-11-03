import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { IS_TENANT_AGNOSTIC_KEY } from '../../../common/tenant/tenant-agnostic.decorator';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { UiVisibilityStore } from '../repositories/ui-visibility.store';
import { UiVisibilityAdminService } from '../services/ui-visibility-admin.service';
import { UiVisibilityMeService } from '../services/ui-visibility-me.service';
import { InMemoryUiVisibilityStore } from '../testing/in-memory-ui-visibility.store';
import { UiVisibilityErrorReason as R } from '../ui-visibility.error-reasons';
import { AdminUiVisibilityController } from './admin-ui-visibility.controller';
import { MeUiVisibilityController } from './me-ui-visibility.controller';

const T1 = '33333333-3333-4333-8333-333333333333';
const T2 = '44444444-4444-4444-8444-444444444444';
const ADMIN1 = '0a000000-0000-4000-8000-000000000002';
const ADMIN2 = '0a000000-0000-4000-8000-000000000003';
const SUPER = '0a000000-0000-4000-8000-000000000001';
const MEMBER1 = '0a000000-0000-4000-8000-000000000004';
const GHOST = '0a000000-0000-4000-8000-0000000000ff';
const ME = '0a000000-0000-4000-8000-0000000000aa';
const OTHER = '0a000000-0000-4000-8000-0000000000bb';
const REASON = 'Motivo suficientemente largo';
const BASE = '/admin/ui-visibility';

/**
 * `/admin/ui-visibility` y `/me/ui-visibility` por HTTP, con el `ValidationPipe` global REAL y el
 * `RolesGuard` REAL. Los servicios también son los reales; lo único doble es la persistencia
 * (`InMemoryUiVisibilityStore`, regla 65), así que el alcance por organización (404) se ejerce de
 * verdad. No hay `JwtAuthGuard`: el sujeto lo inyecta un middleware de prueba desde cabeceras.
 */
describe('/admin/ui-visibility y /me/ui-visibility (transporte)', () => {
  let app: INestApplication;
  let store: InMemoryUiVisibilityStore;

  beforeAll(async () => {
    store = new InMemoryUiVisibilityStore();
    store.users.set(ADMIN1, 'Admin Uno');
    store.users.set(ADMIN2, 'Admin Dos');
    store.users.set(SUPER, 'Super');
    store.users.set(MEMBER1, 'Miembro Uno');
    store.users.set(ME, 'Yo');
    store.users.set(OTHER, 'Otra');
    store.tenants.set(T1, { name: 'Clínica Uno', orgType: 'CLINIC' });
    store.tenants.set(T2, { name: 'Farmacia Dos', orgType: 'PHARMACY' });
    store.memberships.add(`${MEMBER1}|${T1}`);
    const logger = {
      setContext: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminUiVisibilityController, MeUiVisibilityController],
      providers: [
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: UiVisibilityStore, useValue: store },
        { provide: PinoLogger, useValue: logger },
        UiVisibilityAdminService,
        UiVisibilityMeService,
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const roles = req.headers['x-test-roles'];
      if (roles !== undefined) {
        const id = String(req.headers['x-test-user'] ?? ADMIN1);
        const tenantIds = String(req.headers['x-test-tenants'] ?? '')
          .split(',')
          .filter(Boolean);
        const scoped = req.headers['x-test-scoped'];
        Object.assign(req, {
          user: {
            id,
            roles: String(roles).split(',').filter(Boolean),
            tenantIds,
            ...(typeof scoped === 'string'
              ? { scopedRoles: JSON.parse(scoped) as Record<string, string[]> }
              : {}),
          },
        });
      }
      // Lo que dejaría TenantScopeGuard antes de RolesGuard (MCH-001).
      if (typeof req.headers['x-test-tenant'] === 'string')
        Object.assign(req, { resolvedTenantId: req.headers['x-test-tenant'] });
      // El contexto de organización que fijaría TenantContextInterceptor.
      const tenant = req.headers['x-test-tenant'];
      if (typeof tenant === 'string') runWithTenant(tenant, () => next());
      else next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    store.elements.clear();
    store.rules.clear();
    store.writes = 0;
  });

  type Who = {
    roles?: string;
    user?: string;
    tenant?: string;
    tenants?: string;
  };
  const call = (
    method: 'get' | 'post' | 'patch' | 'delete' | 'put',
    path: string,
    who: Who = {},
  ) => {
    let req = request(app.getHttpServer())[method](path);
    if (who.roles !== undefined) req = req.set('x-test-roles', who.roles);
    if (who.user) req = req.set('x-test-user', who.user);
    if (who.tenant) req = req.set('x-test-tenant', who.tenant);
    if (who.tenants) req = req.set('x-test-tenants', who.tenants);
    return req;
  };
  const sa1: Who = {
    roles: 'SECURITY_ADMIN',
    user: ADMIN1,
    tenant: T1,
    tenants: T1,
  };
  const sa2: Who = {
    roles: 'SECURITY_ADMIN',
    user: ADMIN2,
    tenant: T2,
    tenants: T2,
  };
  const sup: Who = { roles: 'SUPERADMIN', user: SUPER };

  const sync = (elements: unknown[], who: Who = sup) =>
    call('post', `${BASE}/elements/sync`, who).send({ elements });
  const draft = (key: string, over: Record<string, unknown> = {}) => ({
    key,
    kind: 'ACTION',
    moduleCode: key.split('.')[0],
    parentKey: null,
    label: key,
    description: null,
    defaultVisible: true,
    ...over,
  });

  describe('autorización por rol (RolesGuard real)', () => {
    const ROUTES = [
      ['get', `${BASE}/elements`],
      ['post', `${BASE}/elements`],
      ['post', `${BASE}/elements/sync`],
      ['get', `${BASE}/rules`],
      ['post', `${BASE}/rules`],
      ['patch', `${BASE}/rules/${GHOST}`],
      ['post', `${BASE}/rules/${GHOST}/end`],
      ['get', `${BASE}/preview?roleCode=NURSE`],
    ] as const;

    it.each(ROUTES)(
      '%s %s: sin sesión no llega al servicio',
      async (method, path) => {
        const res = await call(method, path);
        expect([401, 403]).toContain(res.status);
        expect(store.writes).toBe(0);
      },
    );

    it.each(['PATIENT', 'PRACTITIONER', 'USER', 'AUDITOR'])(
      'el rol %s recibe 403 en todas las rutas admin',
      async (rol) => {
        for (const [method, path] of ROUTES) {
          const res = await call(method, path, { roles: rol }).send({});
          expect(res.status).toBe(403);
          expect(res.body).toMatchObject({ reason: 'ROLE_INSUFFICIENT' });
        }
        expect(store.writes).toBe(0);
      },
    );

    it('SECURITY_ADMIN lee', async () => {
      await call('get', `${BASE}/elements`, sa1).expect(200);
      await call('get', `${BASE}/rules`, sa1).expect(200);
    });

    it('SUPERADMIN entra por el comodín', async () => {
      await call('get', `${BASE}/elements`, sup).expect(200);
    });

    it('un SECURITY_ADMIN concedido sólo en la organización A recibe 403 al actuar en la B y 200 en la A', async () => {
      const scoped = JSON.stringify({ [T1]: ['SECURITY_ADMIN'] });
      const inA = await call('get', `${BASE}/rules`, sa1).set(
        'x-test-scoped',
        scoped,
      );
      expect(inA.status).toBe(200);
      const inB = await call('get', `${BASE}/rules`, {
        roles: 'SECURITY_ADMIN',
        user: ADMIN1,
        tenant: T2,
        tenants: `${T1},${T2}`,
      }).set('x-test-scoped', scoped);
      expect(inB.status).toBe(403);
      expect(inB.body).toMatchObject({ reason: 'ROLE_INSUFFICIENT' });
    });

    it('un SUPERADMIN acotado a una organización NO es comodín de plataforma', async () => {
      const scoped = JSON.stringify({ [T1]: ['SUPERADMIN'] });
      const res = await call('get', `${BASE}/rules`, {
        roles: 'SUPERADMIN',
        user: ADMIN1,
        tenant: T2,
        tenants: `${T1},${T2}`,
      }).set('x-test-scoped', scoped);
      expect(res.status).toBe(403);
    });

    it('no existe DELETE de elementos ni de reglas', async () => {
      await call('delete', `${BASE}/elements/${GHOST}`, sa1).expect(404);
      await call('delete', `${BASE}/rules/${GHOST}`, sa1).expect(404);
    });
  });

  describe('catálogo', () => {
    it('sync devuelve 200 con el resumen y es idempotente', async () => {
      const first = await sync([draft('a.one'), draft('a.two')]).expect(200);
      expect(first.body).toEqual({
        created: 2,
        updated: 0,
        retired: 0,
        unchanged: 0,
      });
      const again = await sync([draft('a.one'), draft('a.two')]).expect(200);
      expect(again.body).toEqual({
        created: 0,
        updated: 0,
        retired: 0,
        unchanged: 2,
      });
    });

    it('alta manual devuelve 201; repetirla es 409 UI_ELEMENT_KEY_EXISTS', async () => {
      const body = {
        key: 'manual.thing',
        kind: 'WIDGET',
        moduleCode: 'manual',
        label: 'Manual',
      };
      const ok = await call('post', `${BASE}/elements`, sa1)
        .send(body)
        .expect(201);
      expect(ok.body).toMatchObject({
        key: 'manual.thing',
        source: 'ADMIN',
        status: 'ACTIVE',
      });
      const dup = await call('post', `${BASE}/elements`, sa1)
        .send(body)
        .expect(409);
      expect(dup.body).toMatchObject({ reason: R.UI_ELEMENT_KEY_EXISTS });
    });

    it('lista con filtros y pagina por cursor', async () => {
      await sync([draft('m.a'), draft('m.b'), draft('m.c')]);
      const p1 = await call('get', `${BASE}/elements?limit=2`, sa1).expect(200);
      expect(p1.body.items.map((e: { key: string }) => e.key)).toEqual([
        'm.a',
        'm.b',
      ]);
      const p2 = await call(
        'get',
        `${BASE}/elements?limit=2&cursor=${p1.body.nextCursor}`,
        sa1,
      ).expect(200);
      expect(p2.body.items.map((e: { key: string }) => e.key)).toEqual(['m.c']);
      await call(
        'get',
        `${BASE}/elements?kind=ACTION&module=m&status=ACTIVE&q=m.`,
        sa1,
      ).expect(200);
    });

    describe('validación de DTO con lista blanca (400)', () => {
      it.each([
        [
          'kind fuera de la lista',
          { key: 'a.b', kind: 'BOTON', moduleCode: 'a', label: 'x' },
        ],
        [
          'clave con mayúsculas',
          { key: 'A.B', kind: 'ACTION', moduleCode: 'a', label: 'x' },
        ],
        [
          'clave con espacio',
          { key: 'a b', kind: 'ACTION', moduleCode: 'a', label: 'x' },
        ],
        [
          'clave con punto final',
          { key: 'a.', kind: 'ACTION', moduleCode: 'a', label: 'x' },
        ],
        [
          'clave de 161 caracteres',
          {
            key: `a${'b'.repeat(160)}`,
            kind: 'ACTION',
            moduleCode: 'a',
            label: 'x',
          },
        ],
        [
          'campo no declarado',
          {
            key: 'a.b',
            kind: 'ACTION',
            moduleCode: 'a',
            label: 'x',
            source: 'CODE',
          },
        ],
        [
          'label vacío',
          { key: 'a.b', kind: 'ACTION', moduleCode: 'a', label: '' },
        ],
        [
          'defaultVisible no booleano',
          {
            key: 'a.b',
            kind: 'ACTION',
            moduleCode: 'a',
            label: 'x',
            defaultVisible: 'si',
          },
        ],
      ])('alta: %s', async (_n, body) => {
        await call('post', `${BASE}/elements`, sa1).send(body).expect(400);
        expect(store.writes).toBe(0);
      });

      it('sync: lote no arreglo, elementos no válidos y campos extra', async () => {
        await call('post', `${BASE}/elements/sync`, sa1)
          .send({ elements: 'x' })
          .expect(400);
        await call('post', `${BASE}/elements/sync`, sa1)
          .send({ elements: [{ key: 'a' }] })
          .expect(400);
        await call('post', `${BASE}/elements/sync`, sa1)
          .send({ elements: [], extra: 1 })
          .expect(400);
        expect(store.writes).toBe(0);
      });

      it('sync: un lote vacío pasa la validación pero el servicio lo rechaza con 422', async () => {
        const res = await call('post', `${BASE}/elements/sync`, sa1)
          .send({ elements: [] })
          .expect(422);
        expect(res.body).toMatchObject({ reason: R.UI_ELEMENT_SYNC_INVALID });
      });

      it('listas: limit fuera de rango, enum inválido y cursor roto', async () => {
        await call('get', `${BASE}/elements?limit=0`, sa1).expect(400);
        await call('get', `${BASE}/elements?limit=201`, sa1).expect(400);
        await call('get', `${BASE}/elements?kind=BOTON`, sa1).expect(400);
        await call('get', `${BASE}/elements?cursor=%25%25`, sa1).expect(400);
        await call('get', `${BASE}/rules?subjectType=GROUP`, sa1).expect(400);
        await call('get', `${BASE}/rules?active=quizas`, sa1).expect(400);
        await call('get', `${BASE}/elements?tenantId=${T2}`, sa1).expect(400); // campo no declarado
      });
    });
  });

  describe('reglas', () => {
    const mkRule = (who: Who, over: Record<string, unknown> = {}) =>
      call('post', `${BASE}/rules`, who).send({
        elementKey: 'm.a',
        effect: 'HIDE',
        subjectType: 'TENANT',
        subjectId: T1,
        reason: REASON,
        ...over,
      });

    beforeEach(async () => {
      await sync([draft('m.a'), draft('m.b')]);
    });

    it('crea con 201 y devuelve la forma del contrato', async () => {
      const res = await mkRule(sa1).expect(201);
      expect(res.body).toMatchObject({
        elementKey: 'm.a',
        effect: 'HIDE',
        subjectType: 'TENANT',
        subjectId: T1,
        subjectLabel: 'Clínica Uno',
        validFrom: null,
        validTo: null,
        reason: REASON,
        version: 1,
        createdByLabel: 'Admin Uno',
      });
      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.createdAt).toBe('string');
    });

    describe('validación de DTO (400) y de negocio (409/422)', () => {
      it.each([
        ['reason de 9 caracteres', { reason: '123456789' }],
        ['reason de 501 caracteres', { reason: 'x'.repeat(501) }],
        ['reason ausente', { reason: undefined }],
        ['effect inválido', { effect: 'TOGGLE' }],
        ['subjectType inválido', { subjectType: 'GROUP' }],
        ['validFrom que no es fecha', { validFrom: 'ayer' }],
        ['campo no declarado (scopeTenantId)', { scopeTenantId: T2 }],
        ['campo no declarado (tenantId distinto)', { tenantId: T2 }],
      ])('%s → 400', async (_n, over) => {
        await mkRule(sa1, over).expect(400);
        expect(store.rules.size).toBe(0);
      });

      it('reason de exactamente 10 y de exactamente 500 caracteres es válido', async () => {
        await mkRule(sup, {
          subjectType: 'ALL',
          subjectId: null,
          reason: '0123456789',
        }).expect(201);
        await mkRule(sup, {
          elementKey: 'm.b',
          subjectType: 'ALL',
          subjectId: null,
          reason: 'x'.repeat(500),
        }).expect(201);
      });

      it('elemento inexistente → 404 UI_ELEMENT_NOT_FOUND', async () => {
        const res = await mkRule(sa1, { elementKey: 'no.existe' }).expect(404);
        expect(res.body).toMatchObject({ reason: R.UI_ELEMENT_NOT_FOUND });
      });

      it('misma terna → 409 UI_RULE_DUPLICATE', async () => {
        await mkRule(sa1).expect(201);
        const res = await mkRule(sa1).expect(409);
        expect(res.body).toMatchObject({ reason: R.UI_RULE_DUPLICATE });
      });

      it('sujeto fuera de alcance o inexistente → 422 UI_RULE_INVALID_SUBJECT', async () => {
        const foreign = await mkRule(sa1, { subjectId: T2 }).expect(422);
        expect(foreign.body).toMatchObject({
          reason: R.UI_RULE_INVALID_SUBJECT,
        });
        await mkRule(sup, { subjectType: 'ALL', subjectId: T1 }).expect(422);
        await mkRule(sup, { subjectType: 'USER', subjectId: GHOST }).expect(
          422,
        );
      });
    });

    describe('PATCH con If-Match', () => {
      let id: string;
      beforeEach(async () => {
        id = (await mkRule(sa1).expect(201)).body.id;
      });

      it('sin If-Match → 400 UI_RULE_IF_MATCH_REQUIRED', async () => {
        const res = await call('patch', `${BASE}/rules/${id}`, sa1)
          .send({ effect: 'SHOW' })
          .expect(400);
        expect(res.body).toMatchObject({ reason: R.UI_RULE_IF_MATCH_REQUIRED });
      });

      it.each(['abc', '-1', '1.5', '', '"x"'])(
        'If-Match inválido %p → 400',
        async (value) => {
          await call('patch', `${BASE}/rules/${id}`, sa1)
            .set('If-Match', value)
            .send({ effect: 'SHOW' })
            .expect(400);
        },
      );

      it.each(['1', '"1"', 'W/"1"'])('acepta If-Match %s', async (value) => {
        const res = await call('patch', `${BASE}/rules/${id}`, sa1)
          .set('If-Match', value)
          .send({ effect: 'SHOW' })
          .expect(200);
        expect(res.body).toMatchObject({ effect: 'SHOW', version: 2 });
      });

      it('versión vieja → 409 UI_RULE_VERSION_MISMATCH', async () => {
        await call('patch', `${BASE}/rules/${id}`, sa1)
          .set('If-Match', '1')
          .send({ effect: 'SHOW' })
          .expect(200);
        const res = await call('patch', `${BASE}/rules/${id}`, sa1)
          .set('If-Match', '1')
          .send({ effect: 'HIDE' })
          .expect(409);
        expect(res.body).toMatchObject({ reason: R.UI_RULE_VERSION_MISMATCH });
      });

      it('campos que el PATCH no admite (elementKey, subjectType) → 400', async () => {
        await call('patch', `${BASE}/rules/${id}`, sa1)
          .set('If-Match', '1')
          .send({ subjectType: 'ALL' })
          .expect(400);
        await call('patch', `${BASE}/rules/${id}`, sa1)
          .set('If-Match', '1')
          .send({ elementKey: 'm.b' })
          .expect(400);
      });

      it('id que no es uuid → 400', async () => {
        await call('patch', `${BASE}/rules/xyz`, sa1)
          .set('If-Match', '1')
          .send({ effect: 'SHOW' })
          .expect(400);
      });

      it('end: 200, idempotente, y editar después es 409 UI_RULE_ENDED', async () => {
        const first = await call('post', `${BASE}/rules/${id}/end`, sa1).expect(
          200,
        );
        expect(first.body.validTo).not.toBeNull();
        const second = await call(
          'post',
          `${BASE}/rules/${id}/end`,
          sa1,
        ).expect(200);
        expect(second.body).toEqual(first.body);
        const edit = await call('patch', `${BASE}/rules/${id}`, sa1)
          .set('If-Match', String(second.body.version))
          .send({ effect: 'SHOW' })
          .expect(409);
        expect(edit.body).toMatchObject({ reason: R.UI_RULE_ENDED });
      });
    });

    describe('404 idéntico por organización', () => {
      let id: string;
      beforeEach(async () => {
        id = (await mkRule(sa1).expect(201)).body.id;
      });

      it('la regla de otra organización responde igual que una inexistente (PATCH y end)', async () => {
        const ghost = await call('patch', `${BASE}/rules/${GHOST}`, sa2)
          .set('If-Match', '1')
          .send({ effect: 'SHOW' })
          .expect(404);
        const foreign = await call('patch', `${BASE}/rules/${id}`, sa2)
          .set('If-Match', '1')
          .send({ effect: 'SHOW' })
          .expect(404);
        expect(foreign.body).toEqual(ghost.body);
        expect(foreign.body).toMatchObject({ reason: R.UI_RULE_NOT_FOUND });
        const ghostEnd = await call(
          'post',
          `${BASE}/rules/${GHOST}/end`,
          sa2,
        ).expect(404);
        const foreignEnd = await call(
          'post',
          `${BASE}/rules/${id}/end`,
          sa2,
        ).expect(404);
        expect(foreignEnd.body).toEqual(ghostEnd.body);
        expect([...store.rules.values()][0].endedAt).toBeNull();
        expect([...store.rules.values()][0].rowVersion).toBe(1);
      });

      it('el listado no deja ver las reglas de otra organización; la plataforma las ve todas', async () => {
        const other = await call('get', `${BASE}/rules`, sa2).expect(200);
        expect(other.body.items).toEqual([]);
        expect(other.body.total).toBe(0);
        const own = await call('get', `${BASE}/rules`, sa1).expect(200);
        expect(own.body.items).toHaveLength(1);
        const all = await call('get', `${BASE}/rules`, sup).expect(200);
        expect(all.body.items).toHaveLength(1);
      });

      it('la vista previa de un usuario de otra organización es 404 indistinguible de uno inexistente', async () => {
        const ghost = await call(
          'get',
          `${BASE}/preview?userId=${GHOST}`,
          sa2,
        ).expect(404);
        const foreign = await call(
          'get',
          `${BASE}/preview?userId=${MEMBER1}`,
          sa2,
        ).expect(404);
        expect(foreign.body).toEqual(ghost.body);
        expect(foreign.body).toMatchObject({
          reason: R.UI_PREVIEW_SUBJECT_NOT_FOUND,
        });
        await call('get', `${BASE}/preview?userId=${MEMBER1}`, sa1).expect(200);
      });
    });

    describe('vista previa', () => {
      it('exige exactamente uno de userId o roleCode', async () => {
        const none = await call('get', `${BASE}/preview`, sup).expect(400);
        expect(none.body).toMatchObject({
          reason: R.UI_PREVIEW_SUBJECT_REQUIRED,
        });
        await call(
          'get',
          `${BASE}/preview?userId=${MEMBER1}&roleCode=NURSE`,
          sup,
        ).expect(400);
        await call('get', `${BASE}/preview?userId=no-uuid`, sup).expect(400);
      });

      it('devuelve lo oculto con su regla ganadora', async () => {
        const r = (
          await mkRule(sup, { subjectType: 'ALL', subjectId: null }).expect(201)
        ).body;
        const res = await call(
          'get',
          `${BASE}/preview?roleCode=SECURITY_ADMIN`,
          sup,
        ).expect(200);
        expect(res.body.subject).toEqual({
          type: 'ROLE',
          id: 'SECURITY_ADMIN',
          label: 'SECURITY_ADMIN',
        });
        expect(res.body.entries).toEqual([
          {
            elementKey: 'm.a',
            hidden: true,
            winningRuleId: r.id,
            reason: 'RULE',
            ancestorKey: null,
          },
        ]);
      });
    });
  });

  describe('GET /me/ui-visibility', () => {
    beforeEach(async () => {
      await sync([draft('m.a'), draft('m.b')]);
    });

    it('la clase no exige rol, no es pública y es agnóstica al tenant (cualquier usuario autenticado)', () => {
      expect(
        Reflect.getMetadata(ROLES_KEY, MeUiVisibilityController),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(IS_PUBLIC_KEY, MeUiVisibilityController),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(IS_TENANT_AGNOSTIC_KEY, MeUiVisibilityController),
      ).toBe(true);
    });

    it.each(['PATIENT', 'USER', 'PRACTITIONER'])(
      'cualquier rol (%s) obtiene 200 y la forma del contrato',
      async (rol) => {
        const res = await call('get', '/me/ui-visibility', {
          roles: rol,
          user: ME,
        }).expect(200);
        expect(res.body).toEqual({
          hiddenKeys: [],
          version: expect.any(String),
          generatedAt: expect.any(String),
        });
        expect(Number.isNaN(Date.parse(res.body.generatedAt))).toBe(false);
      },
    );

    it('devuelve sólo lo oculto para quien llama', async () => {
      await call('post', `${BASE}/rules`, sup)
        .send({
          elementKey: 'm.a',
          effect: 'HIDE',
          subjectType: 'USER',
          subjectId: ME,
          reason: REASON,
        })
        .expect(201);
      const me = await call('get', '/me/ui-visibility', {
        roles: 'USER',
        user: ME,
      }).expect(200);
      expect(me.body.hiddenKeys).toEqual(['m.a']);
      const other = await call('get', '/me/ui-visibility', {
        roles: 'USER',
        user: OTHER,
      }).expect(200);
      expect(other.body.hiddenKeys).toEqual([]);
    });

    it('no se puede pedir la resolución de otro: userId/roleCode en la query no cambian el sujeto', async () => {
      await call('post', `${BASE}/rules`, sup)
        .send({
          elementKey: 'm.a',
          effect: 'HIDE',
          subjectType: 'USER',
          subjectId: ME,
          reason: REASON,
        })
        .expect(201);
      const res = await call(
        'get',
        `/me/ui-visibility?userId=${ME}&roleCode=SECURITY_ADMIN`,
        { roles: 'USER', user: OTHER },
      ).expect(200);
      expect(res.body.hiddenKeys).toEqual([]);
    });

    it('X-Tenant-Id ajeno al token no cambia la resolución (se ignora)', async () => {
      await call('post', `${BASE}/rules`, sup)
        .send({
          elementKey: 'm.b',
          effect: 'HIDE',
          subjectType: 'TENANT',
          subjectId: T2,
          reason: REASON,
        })
        .expect(201);
      const spoof = await request(app.getHttpServer())
        .get('/me/ui-visibility')
        .set('x-test-roles', 'USER')
        .set('x-test-user', ME)
        .set('x-test-tenants', T1)
        .set('x-tenant-id', T2);
      expect(spoof.status).toBe(200);
      expect(spoof.body.hiddenKeys).toEqual([]);
      const legit = await request(app.getHttpServer())
        .get('/me/ui-visibility')
        .set('x-test-roles', 'USER')
        .set('x-test-user', ME)
        .set('x-test-tenants', `${T1},${T2}`)
        .set('x-tenant-id', T2);
      expect(legit.body.hiddenKeys).toEqual(['m.b']);
    });
  });
});
