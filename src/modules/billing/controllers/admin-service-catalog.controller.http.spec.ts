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
import { AdminServiceCatalogService } from '../services/admin-service-catalog.service';
import { AdminServiceCatalogController } from './admin-service-catalog.controller';

/**
 * Contrato HTTP del editor de servicios con la cadena REAL de autenticación,
 * autorización y validación (`JwtAuthGuard` + `RolesGuard` + pipe global). El
 * servicio está DOBLADO (declarado): esto prueba el borde HTTP (401/403/400 y
 * códigos de éxito), no la persistencia. La pertenencia al tenant y el 404 de
 * recurso ajeno se prueban en `admin-service-catalog.service.spec.ts`.
 * BLOQUEADO contra PostgreSQL real: no existe en esta máquina.
 */
const SECRET = 'test-secret-only-for-this-spec';
const bearer = (roles: string[]) =>
  `Bearer ${jwt.sign({ sub: 'u-1', roles }, SECRET)}`;

const UUID = '3f6c1c52-5b0d-4f53-9a35-0b1f6a2c9d10';
const PRACTICE = '8a1d6a52-1c0b-4c1b-8b5e-4f0a3f5d7e21';

const item = (over: Record<string, unknown> = {}) => ({
  id: UUID,
  practiceId: PRACTICE,
  practiceTypeConceptId: 'type-1',
  code: 'CONS-001',
  name: 'Consulta',
  defaultPrice: '100.00',
  isActive: true,
  rowVersion: 1,
  updatedAt: '2026-10-31T00:00:00.000Z',
  ...over,
});

describe('HTTP de /admin/catalogs/services', () => {
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
          payload: { sub: string; roles: string[] },
          done: (e: unknown, u?: unknown) => void,
        ) => done(null, { id: payload.sub, roles: payload.roles }),
      ),
    );
    const module = await Test.createTestingModule({
      controllers: [AdminServiceCatalogController],
      providers: [{ provide: AdminServiceCatalogService, useValue: service }],
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

  describe('autorización (sin token, rol insuficiente)', () => {
    const calls: Array<[string, string, (a?: string) => request.Test]> = [
      [
        'GET lista',
        'list',
        (a) => auth(http().get('/admin/catalogs/services'), a),
      ],
      [
        'GET uno',
        'get',
        (a) => auth(http().get(`/admin/catalogs/services/${UUID}`), a),
      ],
      [
        'POST alta',
        'create',
        (a) =>
          auth(http().post('/admin/catalogs/services'), a).send({
            practiceId: PRACTICE,
            code: 'X',
            name: 'X',
            defaultPrice: '1.00',
          }),
      ],
      [
        'PATCH',
        'update',
        (a) =>
          auth(http().patch(`/admin/catalogs/services/${UUID}`), a).send({
            expectedRowVersion: 1,
            name: 'Y',
          }),
      ],
      [
        'POST deactivate',
        'setActive',
        (a) =>
          auth(
            http().post(`/admin/catalogs/services/${UUID}/deactivate`),
            a,
          ).send({
            expectedRowVersion: 1,
          }),
      ],
      [
        'POST reactivate',
        'setActive',
        (a) =>
          auth(
            http().post(`/admin/catalogs/services/${UUID}/reactivate`),
            a,
          ).send({
            expectedRowVersion: 1,
          }),
      ],
    ];
    function auth(r: request.Test, a?: string): request.Test {
      return a ? r.set('Authorization', a) : r;
    }

    it.each(calls)(
      '%s sin token => 401 y no llega al servicio',
      async (_n, fn, call) => {
        await call().expect(401);
        expect(service[fn as keyof typeof service]).not.toHaveBeenCalled();
      },
    );

    it.each(calls)('%s con rol PATIENT => 403', async (_n, fn, call) => {
      await call(bearer(['PATIENT'])).expect(403);
      expect(service[fn as keyof typeof service]).not.toHaveBeenCalled();
    });

    it.each(calls)(
      '%s con rol PRACTITIONER => 403 (el editor global no es del profesional)',
      async (_n, fn, call) => {
        await call(bearer(['PRACTITIONER'])).expect(403);
        expect(service[fn as keyof typeof service]).not.toHaveBeenCalled();
      },
    );

    it('SECURITY_ADMIN y SUPERADMIN pasan', async () => {
      service.list.mockResolvedValue({
        items: [],
        count: 0,
        limit: 50,
        nextCursor: null,
      });
      await http()
        .get('/admin/catalogs/services')
        .set('Authorization', bearer(['SECURITY_ADMIN']))
        .expect(200);
      await http()
        .get('/admin/catalogs/services')
        .set('Authorization', bearer(['SUPERADMIN']))
        .expect(200);
    });
  });

  describe('validación (lista blanca)', () => {
    const admin = () => bearer(['SECURITY_ADMIN']);

    it('query con parámetro no declarado => 400', async () => {
      await http()
        .get('/admin/catalogs/services?hack=1')
        .set('Authorization', admin())
        .expect(400);
      expect(service.list).not.toHaveBeenCalled();
    });

    it.each(['limit=0', 'limit=201', 'practiceId=no-uuid', 'isActive=quizas'])(
      'query inválida %s => 400',
      async (q) => {
        await http()
          .get(`/admin/catalogs/services?${q}`)
          .set('Authorization', admin())
          .expect(400);
      },
    );

    it('isActive=false se entiende como false (no como true)', async () => {
      service.list.mockResolvedValue({
        items: [],
        count: 0,
        limit: 50,
        nextCursor: null,
      });
      await http()
        .get('/admin/catalogs/services?isActive=false&limit=10')
        .set('Authorization', admin())
        .expect(200);
      expect(service.list).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false, limit: 10 }),
      );
    });

    it('PATCH sin expectedRowVersion => 400 (la precondición es obligatoria)', async () => {
      await http()
        .patch(`/admin/catalogs/services/${UUID}`)
        .set('Authorization', admin())
        .send({ name: 'Sin versión' })
        .expect(400);
      expect(service.update).not.toHaveBeenCalled();
    });

    it.each([
      ['campo no declarado', { expectedRowVersion: 1, isActive: false }],
      ['precio con signo', { expectedRowVersion: 1, defaultPrice: '-5.00' }],
      [
        'precio con 3 decimales',
        { expectedRowVersion: 1, defaultPrice: '5.123' },
      ],
      ['versión 0', { expectedRowVersion: 0 }],
      ['versión no entera', { expectedRowVersion: 1.5 }],
    ])('PATCH %s => 400', async (_n, body) => {
      await http()
        .patch(`/admin/catalogs/services/${UUID}`)
        .set('Authorization', admin())
        .send(body)
        .expect(400);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('POST alta con campo no declarado (mass assignment: rowVersion) => 400', async () => {
      await http()
        .post('/admin/catalogs/services')
        .set('Authorization', admin())
        .send({
          practiceId: PRACTICE,
          code: 'X',
          name: 'X',
          defaultPrice: '1.00',
          rowVersion: 99,
        })
        .expect(400);
      expect(service.create).not.toHaveBeenCalled();
    });

    it('id no uuid => 400', async () => {
      await http()
        .get('/admin/catalogs/services/no-es-uuid')
        .set('Authorization', admin())
        .expect(400);
    });
  });

  describe('códigos de éxito', () => {
    const admin = () => bearer(['SECURITY_ADMIN']);
    const body = {
      practiceId: PRACTICE,
      code: 'CONS-001',
      name: 'Consulta',
      defaultPrice: '100.00',
    };

    it('alta nueva => 201; repetición idempotente => 200 con el mismo id', async () => {
      service.create
        .mockResolvedValueOnce({ item: item(), created: true })
        .mockResolvedValueOnce({ item: item(), created: false });
      const first = await http()
        .post('/admin/catalogs/services')
        .set('Authorization', admin())
        .send(body);
      const second = await http()
        .post('/admin/catalogs/services')
        .set('Authorization', admin())
        .send(body);
      expect(first.status).toBe(201);
      expect(second.status).toBe(200);
      expect(second.body.id).toBe(first.body.id);
    });

    it('PATCH 200 y entrega al servicio la versión esperada', async () => {
      service.update.mockResolvedValue(item({ rowVersion: 2 }));
      const res = await http()
        .patch(`/admin/catalogs/services/${UUID}`)
        .set('Authorization', admin())
        .send({ expectedRowVersion: 1, name: 'Nuevo' })
        .expect(200);
      expect(res.body.rowVersion).toBe(2);
      expect(service.update).toHaveBeenCalledWith(
        UUID,
        expect.objectContaining({ expectedRowVersion: 1, name: 'Nuevo' }),
        expect.objectContaining({ id: 'u-1' }),
      );
    });

    it('deactivate y reactivate => 200 con el estado pedido', async () => {
      service.setActive.mockResolvedValue(
        item({ isActive: false, rowVersion: 2 }),
      );
      await http()
        .post(`/admin/catalogs/services/${UUID}/deactivate`)
        .set('Authorization', admin())
        .send({ expectedRowVersion: 1 })
        .expect(200);
      expect(service.setActive).toHaveBeenLastCalledWith(
        UUID,
        false,
        1,
        expect.anything(),
      );
      await http()
        .post(`/admin/catalogs/services/${UUID}/reactivate`)
        .set('Authorization', admin())
        .send({ expectedRowVersion: 2 })
        .expect(200);
      expect(service.setActive).toHaveBeenLastCalledWith(
        UUID,
        true,
        2,
        expect.anything(),
      );
    });

    it('no existe DELETE: se desactiva, no se borra', async () => {
      await http()
        .delete(`/admin/catalogs/services/${UUID}`)
        .set('Authorization', admin())
        .expect(404);
    });
  });
});
