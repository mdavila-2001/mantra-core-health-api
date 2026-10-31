import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { AdminServiceCatalogService } from '../services/admin-service-catalog.service';
import { AdminServiceCatalogController } from './admin-service-catalog.controller';

const PRACTICE = '0b1f4a52-7c1e-4f0a-9a43-3c1d2e5f6a7b';
const SERVICE = '5d8f3c2a-1b4e-4c6d-8e9f-0a1b2c3d4e5f';
const ITEM = { id: SERVICE, code: 'CONS', rowVersion: 1 };

/**
 * `/admin/catalogs/services` por HTTP, con el `ValidationPipe` global real y el
 * `RolesGuard` real. El servicio es un doble: se prueba el contrato de transporte
 * (rol, validación de cuerpo y query, 201 vs 200, ausencia de DELETE). La
 * persistencia está en `admin-service-catalog.service.spec.ts`.
 * Sin token no hay `req.user`: el `RolesGuard` global responde 401/403 antes del servicio.
 */
describe('/admin/catalogs/services (transporte)', () => {
  let app: INestApplication;
  const svc = {
    scopes: jest.fn(async () => ({ types: [], practices: [], currencies: [] })),
    list: jest.fn(async (_q: unknown) => ({
      items: [ITEM],
      count: 1,
      limit: 50,
      nextCursor: null,
    })),
    get: jest.fn(async (_id: string) => ITEM),
    create: jest.fn(async (_dto: unknown, _actor: unknown) => ({
      item: ITEM,
      created: true,
    })),
    update: jest.fn(
      async (_id: string, _dto: unknown, _actor: unknown) => ITEM,
    ),
    setActive: jest.fn(
      async (_id: string, _v: number, _a: boolean, _actor: unknown) => ITEM,
    ),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminServiceCatalogController],
      providers: [
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: AdminServiceCatalogService, useValue: svc },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const header = req.headers['x-test-roles'];
      if (header !== undefined) {
        const roles = String(header).split(',').filter(Boolean);
        Object.assign(req, { user: { id: 'actor-1', roles } });
      }
      next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    for (const fn of Object.values(svc)) fn.mockClear();
  });

  const call = (
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    roles?: string,
  ) => {
    const req = request(app.getHttpServer())[method](path);
    return roles === undefined ? req : req.set('x-test-roles', roles);
  };

  describe('autorización', () => {
    it.each([
      ['get', '/admin/catalogs/services'],
      ['get', '/admin/catalogs/services/scopes'],
      ['post', '/admin/catalogs/services'],
      ['patch', `/admin/catalogs/services/${SERVICE}`],
      ['post', `/admin/catalogs/services/${SERVICE}/deactivate`],
    ] as const)(
      '%s %s: sin sesión no llega al servicio',
      async (method, path) => {
        const res = await call(method, path);
        expect([401, 403]).toContain(res.status);
        expect(svc.list).not.toHaveBeenCalled();
        expect(svc.create).not.toHaveBeenCalled();
      },
    );

    it.each(['PATIENT', 'PRACTITIONER'])(
      'el rol %s recibe 403 también en escritura',
      async (rol) => {
        await call('get', '/admin/catalogs/services', rol).expect(403);
        await call('post', '/admin/catalogs/services', rol)
          .send({})
          .expect(403);
        await call('patch', `/admin/catalogs/services/${SERVICE}`, rol)
          .send({ expectedRowVersion: 1, name: 'x' })
          .expect(403);
        expect(svc.list).not.toHaveBeenCalled();
        expect(svc.create).not.toHaveBeenCalled();
        expect(svc.update).not.toHaveBeenCalled();
      },
    );

    it('SECURITY_ADMIN lee y escribe', async () => {
      await call('get', '/admin/catalogs/services', 'SECURITY_ADMIN').expect(
        200,
      );
      expect(svc.list).toHaveBeenCalled();
    });

    it('no existe DELETE', async () => {
      await call(
        'delete',
        `/admin/catalogs/services/${SERVICE}`,
        'SECURITY_ADMIN',
      ).expect(404);
    });
  });

  describe('lectura', () => {
    it('`scopes` se resuelve antes que `:id`', async () => {
      await call(
        'get',
        '/admin/catalogs/services/scopes',
        'SECURITY_ADMIN',
      ).expect(200);
      expect(svc.scopes).toHaveBeenCalledTimes(1);
      expect(svc.get).not.toHaveBeenCalled();
    });

    it('la query se convierte: isActive=false es false (no true) y limit es número', async () => {
      await call(
        'get',
        '/admin/catalogs/services?isActive=false&limit=20&q=%20hemo%20',
        'SECURITY_ADMIN',
      ).expect(200);
      expect(svc.list.mock.calls[0]![0]).toMatchObject({
        isActive: false,
        limit: 20,
        q: 'hemo',
      });
    });

    it.each([
      'limit=0',
      'limit=201',
      'practiceId=no-uuid',
      'rowVersion=1',
      'isActive=quizas',
    ])('query %s → 400 sin llegar al servicio', async (query) => {
      await call(
        'get',
        `/admin/catalogs/services?${query}`,
        'SECURITY_ADMIN',
      ).expect(400);
      expect(svc.list).not.toHaveBeenCalled();
    });

    it('un id que no es uuid es 400', async () => {
      await call(
        'get',
        '/admin/catalogs/services/abc',
        'SECURITY_ADMIN',
      ).expect(400);
    });
  });

  describe('escritura', () => {
    const alta = {
      practiceId: PRACTICE,
      code: 'CONS',
      name: 'Consulta',
      defaultPrice: '100.00',
    };

    it('alta nueva → 201; repetición idéntica → 200', async () => {
      await call('post', '/admin/catalogs/services', 'SECURITY_ADMIN')
        .send(alta)
        .expect(201);
      svc.create.mockResolvedValueOnce({ item: ITEM, created: false });
      await call('post', '/admin/catalogs/services', 'SECURITY_ADMIN')
        .send(alta)
        .expect(200);
    });

    it.each([
      [
        'campo no declarado (rowVersion)',
        { ...alta, rowVersion: 1 },
        'rowVersion',
      ],
      ['precio con coma', { ...alta, defaultPrice: '10,5' }, 'defaultPrice'],
      [
        'precio con tres decimales',
        { ...alta, defaultPrice: '10.123' },
        'defaultPrice',
      ],
      ['precio negativo', { ...alta, defaultPrice: '-1' }, 'defaultPrice'],
      ['precio como número', { ...alta, defaultPrice: 10 }, 'defaultPrice'],
      ['código vacío', { ...alta, code: '  ' }, 'code'],
      ['práctica que no es uuid', { ...alta, practiceId: 'x' }, 'practiceId'],
    ])(
      'alta inválida: %s → 400 señalando el campo',
      async (_caso, cuerpo, campo) => {
        const res = await call(
          'post',
          '/admin/catalogs/services',
          'SECURITY_ADMIN',
        )
          .send(cuerpo)
          .expect(400);
        expect(
          (res.body.details.fields as { field: string }[]).map((f) => f.field),
        ).toContain(campo);
        expect(svc.create).not.toHaveBeenCalled();
      },
    );

    it('la edición exige expectedRowVersion y no admite code ni practiceId', async () => {
      await call(
        'patch',
        `/admin/catalogs/services/${SERVICE}`,
        'SECURITY_ADMIN',
      )
        .send({ name: 'x' })
        .expect(400);
      await call(
        'patch',
        `/admin/catalogs/services/${SERVICE}`,
        'SECURITY_ADMIN',
      )
        .send({ expectedRowVersion: 1, code: 'otro' })
        .expect(400);
      await call(
        'patch',
        `/admin/catalogs/services/${SERVICE}`,
        'SECURITY_ADMIN',
      )
        .send({ expectedRowVersion: 0, name: 'x' })
        .expect(400);
      expect(svc.update).not.toHaveBeenCalled();
    });

    it('la edición acepta null para limpiar un texto y lo entrega tal cual', async () => {
      await call(
        'patch',
        `/admin/catalogs/services/${SERVICE}`,
        'SECURITY_ADMIN',
      )
        .send({ expectedRowVersion: 2, descriptionText: null })
        .expect(200);
      expect(svc.update.mock.calls[0]![1]).toMatchObject({
        expectedRowVersion: 2,
        descriptionText: null,
      });
    });

    it('desactivar y reactivar llevan la versión y el sentido correcto', async () => {
      await call(
        'post',
        `/admin/catalogs/services/${SERVICE}/deactivate`,
        'SECURITY_ADMIN',
      )
        .send({ expectedRowVersion: 3 })
        .expect(200);
      expect(svc.setActive.mock.calls[0]!.slice(0, 3)).toEqual([
        SERVICE,
        3,
        false,
      ]);
      await call(
        'post',
        `/admin/catalogs/services/${SERVICE}/reactivate`,
        'SECURITY_ADMIN',
      )
        .send({ expectedRowVersion: 4 })
        .expect(200);
      expect(svc.setActive.mock.calls[1]!.slice(0, 3)).toEqual([
        SERVICE,
        4,
        true,
      ]);
      await call(
        'post',
        `/admin/catalogs/services/${SERVICE}/deactivate`,
        'SECURITY_ADMIN',
      )
        .send({})
        .expect(400);
    });
  });
});
