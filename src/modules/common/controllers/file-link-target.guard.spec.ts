import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import type { TracingService } from '../../../observability';
import { FileUploadService, FilesService } from '../services';
import { CommonFilesController } from './common-files.controller';

const FILE_ID = '9f2c4e1a-0000-4000-8000-000000000001';
const USER_ID = '9f2c4e1a-0000-4000-8000-0000000000aa';
const OTHER_ID = '9f2c4e1a-0000-4000-8000-0000000000bb';
const TENANT_ID = '9f2c4e1a-0000-4000-8000-0000000000cc';

/**
 * `POST /common/files/:id/links` por HTTP: el destino del vínculo se autoriza
 * antes de llegar al servicio (AUTHZ-T03). El servicio es un doble: lo que se
 * prueba es qué dueños admite la ruta genérica.
 */
describe('POST /common/files/:id/links · destino del vínculo (AUTHZ-T03)', () => {
  let app: INestApplication;
  const createLink = jest
    .fn<(...args: unknown[]) => Promise<unknown>>()
    .mockResolvedValue({ id: 'link-1' });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CommonFilesController],
      providers: [
        { provide: FilesService, useValue: { createLink } },
        { provide: FileUploadService, useValue: {} },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const roles = String(req.headers['x-test-roles'] ?? '')
        .split(',')
        .filter(Boolean);
      Object.assign(req, {
        user: { id: USER_ID, roles, tenantIds: [TENANT_ID] },
        resolvedTenantId: TENANT_ID,
      });
      next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(
        {
          setContext: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        } as unknown as PinoLogger,
        {
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          addEvent: jest.fn(),
        } as unknown as TracingService,
      ),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => createLink.mockClear());

  const link = (
    body: Record<string, unknown>,
    roles = 'PATIENT',
  ): request.Test =>
    request(app.getHttpServer())
      .post(`/common/files/${FILE_ID}/links`)
      .set('x-test-roles', roles)
      .send(body);

  it('Correcto: un usuario vincula su archivo a sí mismo', async () => {
    await link({ ownerType: 'USER', ownerId: USER_ID }).expect(201);
    expect(createLink).toHaveBeenCalledTimes(1);
  });

  it('Correcto: vincula a su tenant resuelto', async () => {
    await link({ ownerType: 'TENANT', ownerId: TENANT_ID }).expect(201);
    expect(createLink).toHaveBeenCalledTimes(1);
  });

  it('Error: otro usuario como dueño → 403 FORBIDDEN / FILE_LINK_OWNER_NOT_ALLOWED sin llegar al servicio', async () => {
    const res = await link({ ownerType: 'USER', ownerId: OTHER_ID }).expect(
      403,
    );
    expect(res.body).toMatchObject({
      code: 'FORBIDDEN',
      reason: 'FILE_LINK_OWNER_NOT_ALLOWED',
    });
    expect(JSON.stringify(res.body)).not.toContain(OTHER_ID);
    expect(createLink).not.toHaveBeenCalled();
  });

  it('Error: otro tenant como dueño → 403', async () => {
    await link({ ownerType: 'TENANT', ownerId: OTHER_ID }).expect(403);
    expect(createLink).not.toHaveBeenCalled();
  });

  it.each([
    'PATIENT',
    'CONDITION',
    'PROCEDURE',
    'MEDICATION_REQUEST',
    'ALLERGY_INTOLERANCE',
    'ENCOUNTER',
  ])(
    'Falla catalogada: el tipo clínico %s no se vincula por la ruta genérica',
    async (ownerType) => {
      const res = await link({ ownerType, ownerId: OTHER_ID }).expect(403);
      expect(res.body.reason).toBe('FILE_LINK_OWNER_NOT_ALLOWED');
      expect(createLink).not.toHaveBeenCalled();
    },
  );

  it('Límite: SUPERADMIN conserva el acceso total de plataforma', async () => {
    await link(
      { ownerType: 'PATIENT', ownerId: OTHER_ID },
      'SUPERADMIN',
    ).expect(201);
    expect(createLink).toHaveBeenCalledTimes(1);
  });

  it('un tipo de dueño ajeno al contrato lo rechaza la validación del DTO (400), no el guard', async () => {
    const res = await link({ ownerType: 'NOPE', ownerId: OTHER_ID }).expect(
      400,
    );
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(createLink).not.toHaveBeenCalled();
  });
});
