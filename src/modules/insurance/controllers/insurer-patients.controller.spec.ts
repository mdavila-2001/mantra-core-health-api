import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { TenantScopeGuard } from '../../../common/auth/tenant-scope.guard';
import { TenantContextInterceptor } from '../../../common/tenant/tenant-context.interceptor';
import { getCurrentTenantId } from '../../../common/tenant/tenant-context';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import request from 'supertest';
import { jest } from '@jest/globals';
import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { InsurerPatientsController } from './insurer-patients.controller';
import { InsurerPatientsService } from '../services/insurer-patients.service';

/** Transport and OpenAPI only. Persistence and authorization use the integration suite. */
describe('InsurerPatientsController contract', () => {
  let app: INestApplication;
  const actor: {
    id: string;
    roles: string[];
    tenantIds?: string[];
    scopedRoles?: Record<string, string[]>;
  } = { id: 'test-actor', roles: ['SECURITY_ADMIN'] };
  const list = jest.fn(async () => ({
    items: [],
    total: 0,
    limit: 25,
    nextCursor: null,
  }));
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [InsurerPatientsController],
      providers: [
        {
          provide: InsurerPatientsService,
          useValue: {
            list,
            options: async () => ({ insurers: [] }),
            openConversation: async () => ({
              conversationId: '00000000-0000-4000-8000-000000000001',
            }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use((req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      Object.assign(req, { user: actor });
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalGuards(new TenantScopeGuard(app.get(Reflector)));
    app.useGlobalInterceptors(
      new TenantContextInterceptor({} as never, app.get(Reflector)),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('uses POST bodies and returns no-store, with no legacy GET search', async () => {
    await request(app.getHttpServer())
      .post('/insurance/patients/search')
      .send({ search: 'Sintetico', occupation: 'Docente' })
      .expect(200)
      .expect('Cache-Control', 'private, no-store');
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Sintetico', occupation: 'Docente' }),
      actor,
    );
    await request(app.getHttpServer()).get('/insurance/patients').expect(404);
    await request(app.getHttpServer())
      .post('/insurance/patients/search')
      .send({ documentNumber: 'forbidden' })
      .expect(400);
  });

  it('rejects external channels and client-selected community profile ids', async () => {
    await request(app.getHttpServer())
      .post('/insurance/patients/conversation')
      .send({
        patientProfileId: '00000000-0000-4000-8000-000000000001',
        channel: 'whatsapp',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/insurance/patients/conversation')
      .send({
        patientProfileId: '00000000-0000-4000-8000-000000000001',
        channel: 'internal',
        participantProfileIds: [],
      })
      .expect(400);
  });

  it('allows platform SECURITY_ADMIN without membership but denies the same tenant-scoped role', async () => {
    await request(app.getHttpServer())
      .get('/insurance/patients/options')
      .expect(200);
    actor.scopedRoles = { 'tenant-a': ['SECURITY_ADMIN'] };
    try {
      await request(app.getHttpServer())
        .get('/insurance/patients/options')
        .expect(403);
    } finally {
      delete actor.scopedRoles;
    }
  });

  it('preserves insurer tenant resolution and rejects foreign headers', async () => {
    actor.roles = ['INSURANCE_OPERATOR'];
    actor.tenantIds = ['tenant-a'];
    list.mockImplementationOnce(async () => {
      expect(getCurrentTenantId()).toBe('tenant-a');
      return { items: [], total: 0, limit: 25, nextCursor: null };
    });
    try {
      await request(app.getHttpServer())
        .post('/insurance/patients/search')
        .set('X-Tenant-Id', 'tenant-a')
        .send({})
        .expect(200);
      await request(app.getHttpServer())
        .post('/insurance/patients/search')
        .set('X-Tenant-Id', 'tenant-b')
        .send({})
        .expect(403);
    } finally {
      actor.roles = ['SECURITY_ADMIN'];
      delete actor.tenantIds;
    }
  });

  it('publishes the exact minimized response schema and body filters', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Directory')
        .setVersion('1')
        .addBearerAuth()
        .build(),
    );
    expect(document.paths['/insurance/patients']).toBeUndefined();
    expect(
      document.paths['/insurance/patients/search'].post?.requestBody,
    ).toBeDefined();
    expect(document.paths['/insurance/patients/options'].get).toBeDefined();
    expect(
      document.paths['/insurance/patients/conversation'].post,
    ).toBeDefined();
    expect(
      document.paths['/insurance/patients/conversation'].post?.responses['422'],
    ).toBeDefined();
    expect(
      document.paths['/insurance/patients/conversation'].post?.responses['412'],
    ).toBeUndefined();
    const item = document.components?.schemas?.InsurerPatientListItemDto as {
      properties: Record<string, unknown>;
    };
    expect(Object.keys(item.properties).sort()).toEqual(
      [
        'patientProfileId',
        'fullName',
        'birthDate',
        'age',
        'phone',
        'email',
        'genderCode',
        'occupationDisplay',
        'insurers',
        'messaging',
      ].sort(),
    );
  });
});
