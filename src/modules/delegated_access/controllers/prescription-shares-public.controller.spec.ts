import { jest } from '@jest/globals';
import { HEADERS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import { ResourceNotFoundException } from '../../../common';
import {
  PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT,
  PrescriptionSharesPublicController,
} from './prescription-shares-public.controller';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { PrescriptionSharesService } from '../services/prescription-shares.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PrescriptionSharesPublicController', () => {
  const handler = Object.getOwnPropertyDescriptor(
    PrescriptionSharesPublicController.prototype,
    'read',
  )?.value as object;

  it('es público, sin roles y con no-store', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
    expect(
      Reflect.getMetadata(ROLES_KEY, PrescriptionSharesPublicController),
    ).toBeUndefined();
    const headers: Array<{ name: string; value: string }> =
      Reflect.getMetadata(HEADERS_METADATA, handler) ?? [];
    expect(headers).toContainEqual({
      name: 'Cache-Control',
      value: 'no-store',
    });
  });

  it('tiene el mismo límite por IP que el verify público', () => {
    expect(PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT).toEqual({
      default: { limit: 60, ttl: 60_000 },
    });
    expect(
      Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        PrescriptionSharesPublicController,
      ),
    ).toBe(60);
    expect(
      Reflect.getMetadata(
        'THROTTLER:TTLdefault',
        PrescriptionSharesPublicController,
      ),
    ).toBe(60_000);
  });

  it('delega en readPublic y devuelve lo que da el servicio', async () => {
    const view = {
      status: 'VALID' as const,
      issuedAt: new Date('2026-10-20T10:00:00.000Z'),
      prescriberName: 'Dra. Sintética Prueba',
      prescriberLicense: null,
      itemCount: 2,
    };
    const service = { readPublic: mockFn().mockResolvedValue(view) };
    const controller = new PrescriptionSharesPublicController(service as any);
    await expect(
      controller.read('tok', '203.0.113.9', 'agente-prueba'),
    ).resolves.toBe(view);
    expect(service.readPublic).toHaveBeenCalledWith('tok', {
      sourceIp: '203.0.113.9',
      userAgent: 'agente-prueba',
    });
  });
});

/** Por HTTP: ruta, parámetro, cabecera y el 404 por el filtro global. */
describe('PrescriptionSharesPublicController · HTTP', () => {
  const TOKEN = 'Q2hhbmdlTWVQbGVhc2VUaGlzSXNOb3RBUmVhbFRva2U';
  const service = { readPublic: mockFn() };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PrescriptionSharesPublicController],
      providers: [{ provide: PrescriptionSharesService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
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

  it('GET pasa el token de la ruta, responde no-store y solo las claves públicas', async () => {
    service.readPublic.mockResolvedValueOnce({
      status: 'VALID',
      issuedAt: '2026-10-20T10:00:00.000Z',
      prescriberName: 'Dra. Sintética Prueba',
      prescriberLicense: null,
      itemCount: 2,
    });
    const res = await request(app.getHttpServer())
      .get(`/public/prescription-shares/${TOKEN}`)
      .set('User-Agent', 'agente-prueba');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(service.readPublic).toHaveBeenLastCalledWith(TOKEN, {
      sourceIp: expect.any(String),
      userAgent: 'agente-prueba',
    });
    expect(Object.keys(res.body).sort()).toEqual([
      'issuedAt',
      'itemCount',
      'prescriberLicense',
      'prescriberName',
      'status',
    ]);
  });

  it('un token desconocido sale como 404 estándar, sin el token en el cuerpo', async () => {
    service.readPublic.mockRejectedValueOnce(
      new ResourceNotFoundException('Enlace no encontrado'),
    );
    const res = await request(app.getHttpServer()).get(
      `/public/prescription-shares/${TOKEN}`,
    );
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 'NOT_FOUND',
      path: '/public/prescription-shares/[token]',
    });
    expect(JSON.stringify(res.body)).not.toContain(TOKEN);
  });
});
