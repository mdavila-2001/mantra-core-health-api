import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  createGlobalValidationPipe,
  ResourceNotFoundException,
} from '../../../common';
import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { FaqsService, QuestionScriptsService } from '../services';
import { FormsQuestionScriptsController } from './forms-question-scripts.controller';
import { FormsFaqsController } from './forms-faqs.controller';
import { FormsFaqsPublicController } from './forms-faqs-public.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * The question-script and FAQ routes over HTTP with a real Nest app: routing,
 * the global `ValidationPipe`, status codes and exception mapping. Services
 * are doubles; the SQL runs in `test/integration/forms-question-scripts-faqs`.
 */
describe('Question scripts and FAQ routes (HTTP)', () => {
  const ID = '0b6f1f0e-4c1d-4c8a-9a51-2f6f2c0b7c11';
  const doctor = {
    id: 'u-1',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-1',
  };
  const scripts = {
    list: mockFn().mockResolvedValue({ items: [] }),
    get: mockFn(),
    create: mockFn().mockResolvedValue({ id: ID, items: [] }),
    update: mockFn().mockResolvedValue({ id: ID, items: [] }),
    archive: mockFn().mockResolvedValue(undefined),
  };
  const faqs = {
    list: mockFn().mockResolvedValue({ items: [] }),
    create: mockFn().mockResolvedValue({ id: ID }),
    update: mockFn().mockResolvedValue({ id: ID }),
    remove: mockFn().mockResolvedValue(undefined),
    reorder: mockFn().mockResolvedValue({ items: [] }),
    listPublic: mockFn().mockResolvedValue({ items: [] }),
  };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        FormsQuestionScriptsController,
        FormsFaqsController,
        FormsFaqsPublicController,
      ],
      providers: [
        { provide: QuestionScriptsService, useValue: scripts },
        { provide: FaqsService, useValue: faqs },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = doctor;
      next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });

  afterAll(() => app.close());

  const body = {
    title: 'Primera consulta',
    items: [{ questionText: '¿Fuma?', answerType: 'yes_no', required: true }],
  };

  it('POST script → 201; invalid options → 400 without reaching the service', async () => {
    await request(app.getHttpServer())
      .post('/forms/question-scripts')
      .send(body)
      .expect(201);
    expect(scripts.create).toHaveBeenCalledTimes(1);
    await request(app.getHttpServer())
      .post('/forms/question-scripts')
      .send({
        ...body,
        items: [{ ...body.items[0], answerType: 'single_choice' }],
      })
      .expect(400);
    expect(scripts.create).toHaveBeenCalledTimes(1);
  });

  it('PATCH without version → 400; DELETE → 204 with no body', async () => {
    await request(app.getHttpServer())
      .patch(`/forms/question-scripts/${ID}`)
      .send({ title: 'X' })
      .expect(400);
    const res = await request(app.getHttpServer())
      .delete(`/forms/question-scripts/${ID}`)
      .expect(204);
    expect(res.text).toBe('');
  });

  it('a foreign script surfaces the service 404', async () => {
    scripts.get.mockRejectedValueOnce(
      new ResourceNotFoundException('Guion de preguntas no encontrado'),
    );
    await request(app.getHttpServer())
      .get(`/forms/question-scripts/${ID}`)
      .expect(404);
  });

  it('PUT /forms/faqs/order reaches reorder, not the :id routes', async () => {
    await request(app.getHttpServer())
      .put('/forms/faqs/order')
      .send({ ids: [ID] })
      .expect(200);
    expect(faqs.reorder).toHaveBeenCalledWith({ ids: [ID] }, doctor);
  });

  it('FAQ POST → 201, DELETE → 204, bad uuid → 400', async () => {
    await request(app.getHttpServer())
      .post('/forms/faqs')
      .send({ question: 'Q', answer: 'A' })
      .expect(201);
    await request(app.getHttpServer()).delete(`/forms/faqs/${ID}`).expect(204);
    await request(app.getHttpServer())
      .patch('/forms/faqs/not-a-uuid')
      .send({})
      .expect(400);
  });

  it('public FAQ route answers by slug', async () => {
    await request(app.getHttpServer())
      .get('/public/profiles/p/dra-perez/faqs')
      .expect(200);
    expect(faqs.listPublic).toHaveBeenCalledWith('dra-perez');
  });

  it('owner routes require a practitioner role; the public one is @Public', () => {
    const reflector = new Reflector();
    for (const [ctrl, methods] of [
      [
        FormsQuestionScriptsController,
        ['list', 'get', 'create', 'update', 'archive'],
      ],
      [FormsFaqsController, ['list', 'create', 'update', 'remove', 'reorder']],
    ] as const) {
      for (const method of methods) {
        expect(
          reflector.get(ROLES_KEY, (ctrl.prototype as any)[method]),
        ).toEqual(['PRACTITIONER', 'CLINICIAN']);
      }
    }
    expect(
      reflector.get(
        IS_PUBLIC_KEY,
        (FormsFaqsPublicController.prototype as any).list,
      ),
    ).toBe(true);
  });
});
