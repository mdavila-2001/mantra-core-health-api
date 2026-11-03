import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import {
  IamAssistedRegistrationService,
  IamCredentialsService,
  IamDevicesService,
  IamMfaService,
  IamPractitionerSelfRegistrationService,
  IamUsersReadService,
  IamUsersService,
} from '../../application/services';
import { IamUsersController } from './iam-users.controller';

const STATUS_ACTIVE = '0b1f4a52-7c1e-4f0a-9a43-3c1d2e5f6a7b';

/** Una página como la que arma `IamUsersReadService.searchUsers`. */
const PAGE = {
  items: [
    {
      id: '5d8f3c2a-1b4e-4c6d-8e9f-0a1b2c3d4e5f',
      displayName: 'Ana Pérez',
      statusConceptId: STATUS_ACTIVE,
      emailVerified: true,
      phoneVerified: false,
      lastLoginAt: null,
      createdAt: '2026-10-01T12:00:00.000Z',
    },
  ],
  count: 1,
  limit: 1,
  nextCursor: 'cursor-opaco',
};

/**
 * `POST /iam/users/search` por HTTP, con el `ValidationPipe` global real
 * (`createGlobalValidationPipe`, el mismo de `main.ts`) y el `RolesGuard`
 * real. El servicio de lectura es un doble: lo que se prueba es el contrato
 * de transporte (validación del cuerpo, código 200, rol) y que la página que
 * devuelve el servicio llega tal cual. La consulta en sí está cubierta por
 * `iam-users-read.service.spec.ts`.
 *
 * El rol del actor llega por la cabecera `x-test-roles`, igual que en
 * `core-error-contract.http.spec.ts`.
 */
describe('POST /iam/users/search (UC-01-01, filtros en el cuerpo)', () => {
  let app: INestApplication;
  const searchUsers = jest.fn(async (_filters: unknown) => PAGE);

  beforeAll(async () => {
    const stub = {};
    const moduleRef = await Test.createTestingModule({
      controllers: [IamUsersController],
      providers: [
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: IamUsersReadService, useValue: { searchUsers } },
        { provide: IamUsersService, useValue: stub },
        { provide: IamCredentialsService, useValue: stub },
        { provide: IamMfaService, useValue: stub },
        { provide: IamDevicesService, useValue: stub },
        { provide: IamAssistedRegistrationService, useValue: stub },
        { provide: IamPractitionerSelfRegistrationService, useValue: stub },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const roles = String(req.headers['x-test-roles'] ?? '')
        .split(',')
        .filter(Boolean);
      Object.assign(req, { user: { id: 'actor-1', roles } });
      next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    searchUsers.mockClear();
  });

  const search = (body: object, roles = 'SECURITY_ADMIN') =>
    request(app.getHttpServer())
      .post('/iam/users/search')
      .set('x-test-roles', roles)
      .send(body);

  /** Los campos que el 400 de validación señala, de `details.fields`. */
  const fieldsOf = (body: {
    details?: { fields?: { field: string }[] };
  }): string[] => (body.details?.fields ?? []).map((f) => f.field);

  describe('Error', () => {
    it.each([0, 501, 2.5, 'diez'])(
      'limit %p → 400 con el mismo mensaje que el GET, sin llegar al servicio',
      async (limit) => {
        const res = await search({ limit }).expect(400);

        expect(res.body).toMatchObject({
          code: 'VALIDATION_FAILED',
          reason: 'VALIDATION_PIPE_REJECTED',
        });
        expect(fieldsOf(res.body)).toEqual(['limit']);
        expect(res.body.details.violations).toContain(
          'limit debe ser un entero entre 1 y 500',
        );
        expect(searchUsers).not.toHaveBeenCalled();
      },
    );

    it('status que no es uuid → 400 en `status`', async () => {
      const res = await search({ status: 'ACTIVE' }).expect(400);

      expect(fieldsOf(res.body)).toEqual(['status']);
      expect(searchUsers).not.toHaveBeenCalled();
    });

    it('una clave que el contrato no declara → 400 (`forbidNonWhitelisted`)', async () => {
      // `query` es el nombre del filtro en el front; en el cuerpo es `q`.
      // Ignorarla devolvería la lista entera como si fuera el resultado.
      const res = await search({ query: 'ana' }).expect(400);

      expect(res.body.details.fields).toEqual([
        expect.objectContaining({
          field: 'query',
          constraints: ['whitelistValidation'],
        }),
      ]);
      expect(searchUsers).not.toHaveBeenCalled();
    });

    it('q que no es texto → 400 en `q`', async () => {
      const res = await search({ q: ['ana'] }).expect(400);

      expect(fieldsOf(res.body)).toEqual(['q']);
      expect(searchUsers).not.toHaveBeenCalled();
    });

    it('sin SECURITY_ADMIN → 403 / ROLE_INSUFFICIENT, sin llegar al servicio', async () => {
      const res = await search({ q: 'ana' }, 'PATIENT').expect(403);

      expect(res.body).toMatchObject({ reason: 'ROLE_INSUFFICIENT' });
      expect(searchUsers).not.toHaveBeenCalled();
    });
  });

  describe('Límite', () => {
    it.each([1, 500])('limit %p se acepta y llega tal cual', async (limit) => {
      await search({ limit }).expect(200);

      expect(searchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ limit }),
      );
    });

    it('cuerpo vacío: sin filtros y con el tope por defecto del GET (50)', async () => {
      await search({}).expect(200);

      expect(searchUsers).toHaveBeenCalledWith({
        query: undefined,
        statusConceptId: undefined,
        cursor: undefined,
        limit: 50,
      });
    });

    it('SUPERADMIN pasa por el comodín del guard', async () => {
      await search({ q: 'ana' }, 'SUPERADMIN').expect(200);

      expect(searchUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('Correcto', () => {
    it('delega los cuatro filtros con sus nombres de dominio y responde 200 con la página', async () => {
      const res = await search({
        q: 'ana@alovida',
        status: STATUS_ACTIVE,
        cursor: 'cursor-anterior',
        limit: 1,
      }).expect(200);

      expect(searchUsers).toHaveBeenCalledWith({
        query: 'ana@alovida',
        statusConceptId: STATUS_ACTIVE,
        cursor: 'cursor-anterior',
        limit: 1,
      });
      expect(res.body).toEqual(PAGE);
    });
  });
});
