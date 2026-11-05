import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import request from 'supertest';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { AdminGlossaryService } from '../services/admin-glossary.service';
import { AdminGlossaryController } from './admin-glossary.controller';

/**
 * Contrato HTTP del editor del glosario con la cadena REAL de autenticación,
 * autorización y validación. El servicio está DOBLADO (declarado). Lectura:
 * SECURITY_ADMIN o SUPERADMIN; escritura: sólo SUPERADMIN (catálogo global sin
 * tenant). BLOQUEADO contra PostgreSQL real: no existe en esta máquina.
 */
const SECRET = 'test-secret-only-for-this-spec';
const bearer = (roles: string[]) =>
  `Bearer ${jwt.sign({ sub: 'u-1', roles }, SECRET)}`;
const ID = '3f6c1c52-5b0d-4f53-9a35-0b1f6a2c9d10';

const term = (over: Record<string, unknown> = {}) => ({
  conceptId: ID,
  slug: 'anemia',
  code: 'GLOSSARY_ANEMIA',
  display: 'Anemia',
  nameEs: 'Anemia',
  state: 'active',
  audience: 'patient',
  text: { es: 'Pocos glóbulos rojos.' },
  rowVersion: 1,
  updatedAt: '2026-10-31T00:00:00.000Z',
  ...over,
});

describe('HTTP de /admin/catalogs/glossary', () => {
  let app: INestApplication;
  const service = {
    list: jest.fn<(...a: unknown[]) => Promise<unknown>>(),
    get: jest.fn<(...a: unknown[]) => Promise<unknown>>(),
    create: jest.fn<(...a: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...a: unknown[]) => Promise<unknown>>(),
    setActive: jest.fn<(...a: unknown[]) => Promise<unknown>>(),
  };

  beforeAll(async () => {
    passport.use(
      'jwt',
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: SECRET,
        },
        (
          payload: {
            sub: string;
            roles: string[];
            scopedRoles?: Record<string, string[]>;
          },
          done: (e: unknown, u?: unknown) => void,
        ) =>
          // Igual que `JwtStrategy`: `scopedRoles` viaja al actor (MCH-001).
          done(null, {
            id: payload.sub,
            roles: payload.roles,
            scopedRoles: payload.scopedRoles,
          }),
      ),
    );
    const module = await Test.createTestingModule({
      controllers: [AdminGlossaryController],
      providers: [{ provide: AdminGlossaryService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    Object.values(service).forEach((fn) => fn.mockReset());
  });

  const http = () => request(app.getHttpServer());
  const withAuth = (r: request.Test, a?: string) =>
    a ? r.set('Authorization', a) : r;

  const writes: Array<[string, string, (a?: string) => request.Test]> = [
    [
      'POST alta',
      'create',
      (a) =>
        withAuth(http().post('/admin/catalogs/glossary'), a).send({
          slug: 'nuevo',
          display: 'New',
          nameEs: 'Nuevo',
          audience: 'patient',
          text: { es: 'x' },
        }),
    ],
    [
      'PATCH',
      'update',
      (a) =>
        withAuth(http().patch(`/admin/catalogs/glossary/${ID}`), a).send({
          expectedRowVersion: 1,
          audience: 'patient',
          text: { es: 'y' },
        }),
    ],
    [
      'POST deactivate',
      'setActive',
      (a) =>
        withAuth(
          http().post(`/admin/catalogs/glossary/${ID}/deactivate`),
          a,
        ).send({
          expectedRowVersion: 1,
          audience: 'patient',
        }),
    ],
    [
      'POST reactivate',
      'setActive',
      (a) =>
        withAuth(
          http().post(`/admin/catalogs/glossary/${ID}/reactivate`),
          a,
        ).send({
          expectedRowVersion: 1,
          audience: 'patient',
        }),
    ],
  ];
  const reads: Array<[string, string, (a?: string) => request.Test]> = [
    [
      'GET lista',
      'list',
      (a) =>
        withAuth(http().get('/admin/catalogs/glossary?audience=patient'), a),
    ],
    [
      'GET uno',
      'get',
      (a) =>
        withAuth(
          http().get(`/admin/catalogs/glossary/${ID}?audience=patient`),
          a,
        ),
    ],
  ];

  describe('autorización', () => {
    it.each([...reads, ...writes])(
      '%s sin token => 401',
      async (_n, fn, call) => {
        await call().expect(401);
        expect(service[fn as keyof typeof service]).not.toHaveBeenCalled();
      },
    );

    it.each([...reads, ...writes])(
      '%s con PATIENT => 403',
      async (_n, fn, call) => {
        await call(bearer(['PATIENT'])).expect(403);
        expect(service[fn as keyof typeof service]).not.toHaveBeenCalled();
      },
    );

    it.each(writes)(
      '%s con SECURITY_ADMIN => 403 (catálogo global: sólo SUPERADMIN escribe)',
      async (_n, fn, call) => {
        await call(bearer(['SECURITY_ADMIN'])).expect(403);
        expect(service[fn as keyof typeof service]).not.toHaveBeenCalled();
      },
    );

    it('SECURITY_ADMIN puede leer', async () => {
      service.list.mockResolvedValue({
        items: [],
        count: 0,
        limit: 50,
        nextCursor: null,
      });
      await reads[0][2](bearer(['SECURITY_ADMIN'])).expect(200);
    });

    it.each(writes)(
      '%s con SUPERADMIN acotado a una organización => 403 (el glosario es global)',
      async (_n, fn, call) => {
        // Un SUPERADMIN de `scopedRoles` pasa @Roles dentro de su tenant, pero no es el de plataforma.
        const acotado = `Bearer ${jwt.sign(
          {
            sub: 'u-1',
            roles: ['SUPERADMIN'],
            scopedRoles: { 'tenant-1': ['SUPERADMIN'] },
          },
          SECRET,
        )}`;
        await call(acotado).expect(403);
        expect(service[fn as keyof typeof service]).not.toHaveBeenCalled();
      },
    );

    it('SUPERADMIN puede escribir', async () => {
      service.update.mockResolvedValue(term({ rowVersion: 2 }));
      const res = await writes[1][2](bearer(['SUPERADMIN'])).expect(200);
      expect(res.body.rowVersion).toBe(2);
    });
  });

  describe('validación (lista blanca)', () => {
    const su = () => bearer(['SUPERADMIN']);

    it.each([
      ['sin audience', '/admin/catalogs/glossary'],
      ['audience desconocida', '/admin/catalogs/glossary?audience=lab'],
      [
        'state desconocido',
        '/admin/catalogs/glossary?audience=patient&state=x',
      ],
      [
        'parámetro no declarado',
        '/admin/catalogs/glossary?audience=patient&zzz=1',
      ],
      ['limit 0', '/admin/catalogs/glossary?audience=patient&limit=0'],
      ['limit 201', '/admin/catalogs/glossary?audience=patient&limit=201'],
    ])('lista %s => 400', async (_n, url) => {
      await http().get(url).set('Authorization', su()).expect(400);
      expect(service.list).not.toHaveBeenCalled();
    });

    it.each([
      ['slug con mayúsculas', { slug: 'Anemia' }],
      ['slug con espacios', { slug: 'a b' }],
      ['slug vacío', { slug: '' }],
      ['audience inválida', { audience: 'admin' }],
      ['texto vacío', { text: { es: '' } }],
      ['campo no declarado', { rowVersion: 5 }],
    ])('alta con %s => 400', async (_n, patch) => {
      await http()
        .post('/admin/catalogs/glossary')
        .set('Authorization', su())
        .send({
          slug: 'nuevo',
          display: 'New',
          nameEs: 'Nuevo',
          audience: 'patient',
          text: { es: 'x' },
          ...patch,
        })
        .expect(400);
      expect(service.create).not.toHaveBeenCalled();
    });

    it('PATCH sin expectedRowVersion => 400', async () => {
      await http()
        .patch(`/admin/catalogs/glossary/${ID}`)
        .set('Authorization', su())
        .send({ audience: 'patient', text: { es: 'y' } })
        .expect(400);
    });
  });

  describe('códigos de éxito', () => {
    const su = () => bearer(['SUPERADMIN']);
    const body = {
      slug: 'anemia',
      display: 'Anemia',
      nameEs: 'Anemia',
      audience: 'patient',
      text: { es: 'Pocos glóbulos rojos.' },
    };

    it('alta nueva => 201; repetición idéntica => 200 con el mismo conceptId', async () => {
      service.create
        .mockResolvedValueOnce({ term: term(), created: true })
        .mockResolvedValueOnce({ term: term(), created: false });
      const a = await http()
        .post('/admin/catalogs/glossary')
        .set('Authorization', su())
        .send(body);
      const b = await http()
        .post('/admin/catalogs/glossary')
        .set('Authorization', su())
        .send(body);
      expect([a.status, b.status]).toEqual([201, 200]);
      expect(b.body.conceptId).toBe(a.body.conceptId);
    });

    it('deactivate llama con false y reactivate con true', async () => {
      service.setActive.mockResolvedValue(term());
      await http()
        .post(`/admin/catalogs/glossary/${ID}/deactivate`)
        .set('Authorization', su())
        .send({ expectedRowVersion: 1, audience: 'professional' })
        .expect(200);
      expect(service.setActive).toHaveBeenLastCalledWith(
        ID,
        false,
        1,
        'professional',
        expect.anything(),
      );
      await http()
        .post(`/admin/catalogs/glossary/${ID}/reactivate`)
        .set('Authorization', su())
        .send({ expectedRowVersion: 2, audience: 'professional' })
        .expect(200);
      expect(service.setActive).toHaveBeenLastCalledWith(
        ID,
        true,
        2,
        'professional',
        expect.anything(),
      );
    });

    it('no existe DELETE', async () => {
      await http()
        .delete(`/admin/catalogs/glossary/${ID}`)
        .set('Authorization', su())
        .expect(404);
    });
  });
});
