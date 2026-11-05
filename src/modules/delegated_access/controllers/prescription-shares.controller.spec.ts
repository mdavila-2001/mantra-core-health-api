import { jest } from '@jest/globals';
import { HEADERS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import {
  ACCESS_LOGGED_KEY,
  AUDITED_KEY,
} from '../../../common/audit-trail/audit-trail.decorators';
import { PrescriptionSharesController } from './prescription-shares.controller';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { PrescriptionSharesService } from '../services/prescription-shares.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PATIENT = '11111111-1111-4111-8111-111111111111';
const actor = {
  id: 'user-patient',
  roles: ['PATIENT'],
  patientProfileId: PATIENT,
} as any;

function build() {
  const service = {
    create: mockFn().mockResolvedValue({ shareId: 's1' }),
    listForPatient: mockFn().mockResolvedValue([]),
    resolveOwnership: mockFn().mockResolvedValue({ shareId: 's1' }),
    revoke: mockFn().mockResolvedValue(undefined),
  };
  const controller = new PrescriptionSharesController(service as any);
  return { controller, service };
}

/** El handler de una ruta, para leer su metadata sin invocarlo. */
function handler(name: keyof PrescriptionSharesController): object {
  return Object.getOwnPropertyDescriptor(
    PrescriptionSharesController.prototype,
    name,
  )?.value as object;
}

describe('PrescriptionSharesController', () => {
  it('solo paciente y médica, nunca público', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, PrescriptionSharesController),
    ).toEqual(['PATIENT', 'PRACTITIONER']);
    for (const route of [
      handler('create'),
      handler('list'),
      handler('resolveOwnership'),
      handler('revoke'),
    ]) {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, route)).toBeUndefined();
    }
  });

  it('crear y revocar llevan su sello de bitácora; revocar responde 204', () => {
    expect(Reflect.getMetadata(AUDITED_KEY, handler('create'))).toEqual({
      action: 'PRESCRIPTION_SHARE_CREATED',
      entity: 'shared_access_link',
      entityId: 'result.shareId',
    });
    expect(Reflect.getMetadata(AUDITED_KEY, handler('revoke'))).toEqual({
      action: 'PRESCRIPTION_SHARE_REVOKED',
      entity: 'shared_access_link',
      entityId: 'param:shareId',
    });
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler('revoke'))).toBe(
      204,
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler('create'))).toBe(
      201,
    );
  });

  it('las lecturas quedan en el registro de acceso sin el token', () => {
    for (const route of [handler('list'), handler('resolveOwnership')]) {
      const options = Reflect.getMetadata(ACCESS_LOGGED_KEY, route);
      expect(options).toEqual({ resourceType: 'PRESCRIPTION_SHARE' });
    }
  });

  it('ninguna respuesta con token se guarda en caché', () => {
    for (const route of [
      handler('create'),
      handler('list'),
      handler('resolveOwnership'),
    ]) {
      const headers: Array<{ name: string; value: string }> =
        Reflect.getMetadata(HEADERS_METADATA, route) ?? [];
      const cacheControl = headers.find(
        (header) => header.name === 'Cache-Control',
      );
      expect(cacheControl?.value).toMatch(/no-store/);
    }
  });

  it('delega cada ruta en el servicio con el actor', async () => {
    const { controller, service } = build();
    const dto = { encounterId: 'e1' };
    await controller.create(dto, actor);
    expect(service.create).toHaveBeenCalledWith(dto, actor);

    await controller.list({ patientProfileId: PATIENT }, actor);
    expect(service.listForPatient).toHaveBeenCalledWith(PATIENT, actor);

    await controller.resolveOwnership('tok', actor);
    expect(service.resolveOwnership).toHaveBeenCalledWith('tok', actor);

    await controller.revoke('s1', actor);
    expect(service.revoke).toHaveBeenCalledWith('s1', actor);
  });
});

/**
 * Por HTTP, con la app de Nest de verdad: enrutado, `ValidationPipe` global,
 * pipes de parámetro, cabeceras y el filtro global de errores. El servicio es
 * un doble; la autorización por recurso la prueban sus specs.
 */
describe('PrescriptionSharesController · HTTP', () => {
  const OTHER = '22222222-2222-4222-8222-222222222222';
  const SHARE_ID = '77777777-7777-4777-8777-777777777777';
  let app: INestApplication;
  let service: ReturnType<typeof build>['service'];

  beforeAll(async () => {
    service = build().service;
    const moduleRef = await Test.createTestingModule({
      controllers: [PrescriptionSharesController],
      providers: [{ provide: PrescriptionSharesService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = actor;
      next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(
        { setContext: mockFn(), warn: mockFn(), error: mockFn() } as never,
        {
          setAttribute: mockFn(),
          recordException: mockFn(),
          addEvent: mockFn(),
        } as never,
      ),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET ?patientProfileId= pasa el id del query y responde no-store', async () => {
    const res = await request(app.getHttpServer())
      .get('/clinical/prescription-shares')
      .query({ patientProfileId: OTHER });
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(service.listForPatient).toHaveBeenLastCalledWith(OTHER, actor);
  });

  it('GET sin patientProfileId UUID es 400 y no llega al servicio', async () => {
    service.listForPatient.mockClear();
    const res = await request(app.getHttpServer())
      .get('/clinical/prescription-shares')
      .query({ patientProfileId: 'no-es-uuid' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(service.listForPatient).not.toHaveBeenCalled();
  });

  it('POST con un id que no es UUID es 400 y no llega al servicio', async () => {
    service.create.mockClear();
    const res = await request(app.getHttpServer())
      .post('/clinical/prescription-shares')
      .send({ encounterId: 'no-es-uuid' });
    expect(res.status).toBe(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('POST responde 201 no-store con lo que da el servicio', async () => {
    service.create.mockResolvedValueOnce({
      shareId: SHARE_ID,
      url: 'https://web.example.test/rx/t',
      token: 't',
      expiresAt: '2026-11-01T00:00:00.000Z',
      itemCount: 2,
    });
    const res = await request(app.getHttpServer())
      .post('/clinical/prescription-shares')
      .send({ encounterId: OTHER });
    expect(res.status).toBe(201);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toMatchObject({ shareId: SHARE_ID, itemCount: 2 });
    expect(service.create).toHaveBeenLastCalledWith(
      { encounterId: OTHER },
      actor,
    );
  });

  it('by-token pasa el token tal cual (no es un UUID)', async () => {
    const res = await request(app.getHttpServer()).get(
      '/clinical/prescription-shares/by-token/abc_DEF-123',
    );
    expect(res.status).toBe(200);
    expect(service.resolveOwnership).toHaveBeenLastCalledWith(
      'abc_DEF-123',
      actor,
    );
  });

  it('revoke responde 204 sin cuerpo; un shareId que no es UUID es 400', async () => {
    const ok = await request(app.getHttpServer()).post(
      `/clinical/prescription-shares/${SHARE_ID}/revoke`,
    );
    expect(ok.status).toBe(204);
    expect(ok.text).toBe('');
    expect(service.revoke).toHaveBeenLastCalledWith(SHARE_ID, actor);

    service.revoke.mockClear();
    const bad = await request(app.getHttpServer()).post(
      '/clinical/prescription-shares/no-es-uuid/revoke',
    );
    expect(bad.status).toBe(400);
    expect(service.revoke).not.toHaveBeenCalled();
  });

  it('el 404 del servicio sale con el cuerpo estándar', async () => {
    service.listForPatient.mockRejectedValueOnce(
      new ResourceNotFoundException('Paciente no encontrado'),
    );
    const res = await request(app.getHttpServer())
      .get('/clinical/prescription-shares')
      .query({ patientProfileId: OTHER });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Paciente no encontrado',
      path: '/clinical/prescription-shares',
    });
  });
});
