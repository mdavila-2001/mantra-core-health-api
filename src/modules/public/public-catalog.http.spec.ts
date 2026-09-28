import { jest } from '@jest/globals';
import {
  Global,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import request from 'supertest';
import { COMM } from '../community/community.concepts';
import { PublicCatalogModule } from './public.module';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * M4 · H2 — las dos lecturas de ficha por HTTP, con la app de Nest de verdad:
 * enrutado, inyección del módulo, `ValidationPipe` igual al global de
 * `main.ts`, filtros de excepción y serialización. Lo único doble es la base:
 * `EntityManager#getConnection().execute` devuelve filas preparadas según la
 * consulta que llega.
 *
 * No es la verificación de runtime (`VERIFIED`): el SQL no corre contra
 * Postgres. Eso lo hace M1 con la API levantada.
 */
const TENANT = '0a0a0a0a-0000-4000-8000-000000000001';

type Perfil = { id: string; tenantId: string; targetTypeConceptId: string };

function baseDoble(perfiles: Record<string, Perfil>) {
  const execute = mockFn(async (sql: string, params: unknown[]) => {
    if (sql.includes('FROM community.public_profiles')) {
      const perfil = perfiles[params[0] as string];
      return perfil ? [perfil] : [];
    }
    if (sql.includes('FROM billing.service_catalog')) {
      return [
        {
          id: '11111111-1111-4111-8111-111111111111',
          code: 'CONS-GEN',
          name: 'Consulta general',
          descriptionText: null,
          price: '150.00',
          currency: 'BOB',
          isActive: true,
        },
      ];
    }
    if (sql.includes('FROM pharmacy.pharmacy_products')) {
      return [
        {
          id: '22222222-2222-4222-8222-222222222222',
          sortName: 'Paracetamol',
          brandName: null,
          strengthText: '500 mg',
          packageSizeText: null,
          requiresPrescription: false,
          price: '4.50',
          currency: 'BOB',
          availableQuantity: '0',
        },
      ];
    }
    return [];
  });
  const em: any = { getConnection: () => ({ execute }) };
  em.fork = () => em;
  return { em, execute };
}

describe('Fichas públicas por HTTP (M4 · H2)', () => {
  let app: INestApplication;
  let execute: any;

  beforeAll(async () => {
    const doble = baseDoble({
      'clinica-norte': {
        id: 'prof-org',
        tenantId: TENANT,
        targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
      },
      'farmacia-central': {
        id: 'prof-far',
        tenantId: TENANT,
        targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
      },
    });
    execute = doble.execute;

    @Global()
    @Module({
      providers: [{ provide: EntityManager, useValue: doble.em }],
      exports: [EntityManager],
    })
    class BaseDobleModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [BaseDobleModule, PublicCatalogModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /public/profiles/o/:slug/services sin token → 200 con la envoltura pública', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/profiles/o/clinica-norte/services')
      .expect(200);

    expect(res.body).toEqual({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          code: 'CONS-GEN',
          name: 'Consulta general',
          description: null,
          price: '150.00',
          currency: 'BOB',
          isActive: true,
        },
      ],
      nextCursor: null,
      totalHint: null,
      generatedAt: expect.any(String),
    });
  });

  it('GET /public/profiles/f/:slug/products sin token → 200; el agotado viaja inStock=false', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/profiles/f/farmacia-central/products?limit=10')
      .expect(200);

    expect(res.body.items).toEqual([
      {
        id: '22222222-2222-4222-8222-222222222222',
        genericName: 'Paracetamol',
        brandName: null,
        presentation: '500 mg',
        therapeuticGroup: null,
        price: '4.50',
        currency: 'BOB',
        inStock: false,
        requiresPrescription: false,
      },
    ]);
    // `limit=10` llegó como número y la consulta pidió una fila de más.
    const [, params] = execute.mock.calls.find(([sql]: [string]) =>
      sql.includes('FROM pharmacy.pharmacy_products'),
    );
    expect(params[params.length - 1]).toBe(11);
  });

  it('un slug inexistente y uno de otro tipo responden el mismo 404', async () => {
    const inexistente = await request(app.getHttpServer())
      .get('/public/profiles/o/no-existe/services')
      .expect(404);
    const otroTipo = await request(app.getHttpServer())
      .get('/public/profiles/o/farmacia-central/services')
      .expect(404);

    // Misma forma, mismo código y mismo mensaje: lo único que cambia es el
    // slug que cada respuesta repite. Nada delata que detrás del segundo hay
    // una farmacia.
    const sinSlug = (body: any) => ({ ...body, details: undefined });
    expect(sinSlug(otroTipo.body)).toEqual(sinSlug(inexistente.body));
    expect(inexistente.body.details).toEqual({ slug: 'no-existe' });
    expect(otroTipo.body.details).toEqual({ slug: 'farmacia-central' });
  });

  it('limit fuera de rango, un parámetro no declarado o un cursor corrupto → 400', async () => {
    await request(app.getHttpServer())
      .get('/public/profiles/o/clinica-norte/services?limit=0')
      .expect(400);
    await request(app.getHttpServer())
      .get('/public/profiles/o/clinica-norte/services?limit=500')
      .expect(400);
    await request(app.getHttpServer())
      .get('/public/profiles/f/farmacia-central/products?city=Cochabamba')
      .expect(400);
    await request(app.getHttpServer())
      .get(
        '/public/profiles/f/farmacia-central/products?cursor=no-es-un-cursor',
      )
      .expect(400);
  });
});
