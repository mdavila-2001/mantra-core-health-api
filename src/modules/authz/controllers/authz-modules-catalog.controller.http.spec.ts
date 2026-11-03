import {
  describe,
  expect,
  it,
  jest,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { AuthzModulesCatalogService } from '../services/authz-modules-catalog.service';
import { AuthzModulesCatalogController } from './authz-modules-catalog.controller';

const CATALOG = {
  generatedAt: '2026-10-31T00:00:00.000Z',
  modules: [],
  roles: [],
  availableModules: [],
};

/**
 * `GET /authz/catalog/modules` por HTTP, con el `ValidationPipe` global real y el `RolesGuard`
 * real. El servicio es un doble: aquí se prueba el contrato de transporte (quién entra, quién
 * recibe 403, validación del filtro). La lectura real está en el spec del servicio.
 */
describe('GET /authz/catalog/modules (transporte)', () => {
  let app: INestApplication;
  const svc = {
    catalog: jest.fn(async (_q: unknown, _actor: unknown) => CATALOG),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthzModulesCatalogController],
      providers: [
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: AuthzModulesCatalogService, useValue: svc },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const header = req.headers['x-test-roles'];
      if (header !== undefined) {
        Object.assign(req, {
          user: {
            id: 'actor-1',
            roles: String(header).split(',').filter(Boolean),
          },
        });
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
    svc.catalog.mockClear();
  });

  const get = (path: string, roles?: string) => {
    const req = request(app.getHttpServer()).get(path);
    return roles === undefined ? req : req.set('x-test-roles', roles);
  };

  it('SECURITY_ADMIN lee el catálogo', async () => {
    const res = await get('/authz/catalog/modules', 'SECURITY_ADMIN').expect(
      200,
    );
    expect(res.body).toEqual(CATALOG);
    expect(svc.catalog).toHaveBeenCalledTimes(1);
    // El servicio recibe al actor: es quien resuelve el alcance de organización.
    expect(svc.catalog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'actor-1', roles: ['SECURITY_ADMIN'] }),
    );
  });

  it('SUPERADMIN entra por comodín', async () => {
    await get('/authz/catalog/modules', 'SUPERADMIN').expect(200);
  });

  it.each([
    'PATIENT',
    'PRACTITIONER',
    'CLINICIAN',
    'PLATFORM_ADMIN',
    'FINANCE',
    'USER',
  ])('el rol %s recibe 403 y el servicio no se toca', async (rol) => {
    await get('/authz/catalog/modules', rol).expect(403);
    expect(svc.catalog).not.toHaveBeenCalled();
  });

  it('sin sesión no llega al servicio', async () => {
    const res = await get('/authz/catalog/modules');
    expect([401, 403]).toContain(res.status);
    expect(svc.catalog).not.toHaveBeenCalled();
  });

  it('pasa el filtro de módulo y rechaza uno mal formado o desconocido con 400', async () => {
    await get(
      '/authz/catalog/modules?module=pharma_lab',
      'SECURITY_ADMIN',
    ).expect(200);
    expect(svc.catalog).toHaveBeenCalledWith(
      expect.objectContaining({ module: 'pharma_lab' }),
      expect.objectContaining({ id: 'actor-1' }),
    );
    await get(
      '/authz/catalog/modules?module=Pharma-Lab',
      'SECURITY_ADMIN',
    ).expect(400);
    await get('/authz/catalog/modules?module=a;drop', 'SECURITY_ADMIN').expect(
      400,
    );
    await get('/authz/catalog/modules?inventado=1', 'SECURITY_ADMIN').expect(
      400,
    );
    expect(svc.catalog).toHaveBeenCalledTimes(1);
  });

  it('es sólo lectura: ningún verbo de escritura existe en la ruta', async () => {
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const res = await request(app.getHttpServer())
        [method]('/authz/catalog/modules')
        .set('x-test-roles', 'SUPERADMIN');
      expect(res.status).toBe(404);
    }
  });
});
