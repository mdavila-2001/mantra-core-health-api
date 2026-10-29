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

type Profile = { id: string; tenantId: string; targetTypeConceptId: string };

function doubleBase(profiles: Record<string, Profile>) {
  const execute = mockFn(async (sql: string, params: unknown[]) => {
    if (sql.includes('FROM community.public_profiles')) {
      const profile = profiles[params[0] as string];
      return profile ? [profile] : [];
    }
    if (sql.includes('AS "siteName"')) {
      return [
        {
          siteId: '33333333-3333-4333-8333-333333333331',
          siteName: 'Norte',
          pharmacyName: 'Farmacia Central',
          addressLines: 'Av. Sintética 1',
          city: 'Santa Cruz',
          latitude: '-17.70',
          longitude: '-63.18',
          description: 'Lun a Sáb 08:00–22:00',
          locationUrl: 'https://maps.example/norte',
        },
        {
          siteId: '33333333-3333-4333-8333-333333333332',
          siteName: 'Sur',
          pharmacyName: 'Farmacia Central',
          addressLines: null,
          city: 'Santa Cruz',
          latitude: null,
          longitude: null,
          description: null,
          locationUrl: null,
        },
      ];
    }
    if (sql.includes('AS "searchText"')) {
      return [
        {
          siteId: '33333333-3333-4333-8333-333333333332',
          productId: '22222222-2222-4222-8222-222222222222',
          genericName: 'Paracetamol',
          brandName: null,
          strengthText: '500 mg',
          packageSizeText: null,
          searchText: 'Paracetamol 500 mg',
          price: '4.50',
          currency: 'BOB',
        },
      ];
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
    const double = doubleBase({
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
    execute = double.execute;

    @Global()
    @Module({
      providers: [{ provide: EntityManager, useValue: double.em }],
      exports: [EntityManager],
    })
    class DoubleBaseModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [DoubleBaseModule, PublicCatalogModule],
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
    const nonexistent = await request(app.getHttpServer())
      .get('/public/profiles/o/no-existe/services')
      .expect(404);
    const otherType = await request(app.getHttpServer())
      .get('/public/profiles/o/farmacia-central/services')
      .expect(404);

    // Misma forma, mismo código y mismo mensaje: lo único que cambia es el
    // slug que cada respuesta repite. Nada delata que detrás del segundo hay
    // una farmacia.
    const withoutSlug = (body: any) => ({ ...body, details: undefined });
    expect(withoutSlug(otherType.body)).toEqual(withoutSlug(nonexistent.body));
    expect(nonexistent.body.details).toEqual({ slug: 'no-existe' });
    expect(otherType.body.details).toEqual({ slug: 'farmacia-central' });
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

  describe('P37 — sucursales y receta', () => {
    it('GET /public/profiles/f/:slug/branches sin token → 200 con las sedes', async () => {
      const res = await request(app.getHttpServer())
        .get('/public/profiles/f/farmacia-central/branches')
        .expect(200);

      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0]).toEqual({
        id: '33333333-3333-4333-8333-333333333331',
        slug: 'farmacia-central',
        name: 'Farmacia Central · Norte',
        siteName: 'Norte',
        city: 'Santa Cruz',
        addressText: 'Av. Sintética 1',
        phone: null,
        openingHours: null,
        description: 'Lun a Sáb 08:00–22:00',
        locationUrl: 'https://maps.example/norte',
        location: { lat: -17.7, lng: -63.18 },
        locationAccuracy: null,
        isCurrent: false,
      });
      expect(res.body.items[1].location).toBeNull();
    });

    it('POST …/branch-availability → 200 (no 201), ordenado por el servidor y sin la receta en la URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/public/profiles/f/farmacia-central/branch-availability')
        .send({ items: ['paracetamol'], lat: -17.7, lng: -63.18 })
        .expect(200);

      expect(res.body.count).toBe(2);
      expect(res.body.items[0]).toMatchObject({
        branch: { siteName: 'Sur' },
        complete: true,
        missing: [],
        totalAmount: '4.50',
        currency: 'BOB',
        distanceKm: null,
      });
      expect(res.body.items[1]).toMatchObject({
        branch: { siteName: 'Norte' },
        complete: false,
        missing: ['paracetamol'],
        distanceKm: 0,
      });
    });

    it('cuerpo inválido → 400: sin renglones, demasiados, uno larguísimo, una sola coordenada o una clave de más', async () => {
      const post = (body: unknown) =>
        request(app.getHttpServer())
          .post('/public/profiles/f/farmacia-central/branch-availability')
          .send(body as object);
      await post({}).expect(400);
      await post({ items: [] }).expect(400);
      await post({
        items: Array.from({ length: 21 }, (_, i) => `m${i}`),
      }).expect(400);
      await post({ items: ['x'.repeat(121)] }).expect(400);
      await post({ items: [42] }).expect(400);
      await post({ items: ['a'], lat: -17.7 }).expect(400);
      await post({ items: ['a'], lat: 200, lng: 0 }).expect(400);
      await post({ items: ['a'], patientId: 'x' }).expect(400);
    });

    it('la vieja lectura por GET con ?items= no existe (404): la receta no viaja en la URL', async () => {
      await request(app.getHttpServer())
        .get(
          '/public/profiles/f/farmacia-central/branch-availability?items=paracetamol',
        )
        .expect(404);
    });

    it('una ficha que no es farmacia responde 404 en las dos rutas', async () => {
      await request(app.getHttpServer())
        .get('/public/profiles/f/clinica-norte/branches')
        .expect(404);
      await request(app.getHttpServer())
        .post('/public/profiles/f/clinica-norte/branch-availability')
        .send({ items: ['paracetamol'] })
        .expect(404);
    });
  });
});
