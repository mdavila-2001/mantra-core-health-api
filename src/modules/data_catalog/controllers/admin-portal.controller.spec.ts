import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { jest } from '@jest/globals';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../../common/auth/auth-token.module';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../../common/auth/jwt.strategy';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { SessionValidator } from '../../../common/auth/session-validator';
import { TokenService } from '../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../observability';
import {
  INVENTARIO_DIR_ENV,
  PORTAL_READ_ROLES,
} from '../data_catalog.constants';
import { InventoryRepository } from '../inventory/inventory.repository';
import { PortalInventoryService } from '../services/portal-inventory.service';
import { AdminPortalController } from './admin-portal.controller';

/**
 * Las rutas `/admin/portal/*` con los guards reales (JWT y roles) y el mismo `ValidationPipe`
 * que `main.ts`, sobre el inventario real del repositorio.
 */
describe('AdminPortalController (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  let inventario: InventoryRepository;
  const previo = process.env[INVENTARIO_DIR_ENV];

  const token = (roles: string[]): string =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
    );
  const get = (ruta: string, roles?: string[]) => {
    const r = request(app.getHttpServer()).get(ruta);
    return roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r;
  };

  beforeAll(async () => {
    delete process.env[INVENTARIO_DIR_ENV];
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [AdminPortalController],
      providers: [
        InventoryRepository,
        PortalInventoryService,
        JwtStrategy,
        // La sesión no es lo que se prueba acá: se da por activa.
        {
          provide: SessionValidator,
          useValue: { assertActive: jest.fn(async () => undefined) },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: TracingService,
          useValue: {
            setAttribute: jest.fn(),
            recordException: jest.fn(),
            addEvent: jest.fn(),
          },
        },
      ],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    tokens = modulo.get(TokenService);
    inventario = modulo.get(InventoryRepository);
  });

  afterAll(async () => {
    await app.close();
    if (previo === undefined) delete process.env[INVENTARIO_DIR_ENV];
    else process.env[INVENTARIO_DIR_ENV] = previo;
  });

  const RUTAS = [
    '/admin/portal/version',
    '/admin/portal/operaciones',
    '/admin/portal/operaciones/SchedulingController_placeHold',
    '/admin/portal/operaciones/SchedulingController_placeHold/arbol',
    '/admin/portal/flujos',
    '/admin/portal/flujos/mapa',
    '/admin/portal/flujos/hallazgos',
    '/admin/portal/flujos/hallazgos/FLU-02',
    '/admin/portal/flujos/scheduling',
    '/admin/portal/flujos/scheduling/grafo',
    '/admin/portal/flujos/critico:scheduling/grafo',
    '/admin/portal/catalogo/tablas',
    '/admin/portal/catalogo/tablas/scheduling/slot_holds',
    '/admin/portal/catalogo/deriva',
    '/admin/portal/linaje',
    '/admin/portal/linaje/tablas/scheduling/slot_holds',
    '/admin/portal/glosario',
  ];

  describe('autorización', () => {
    it.each(RUTAS)('%s sin token → 401', async (ruta) => {
      await get(ruta).expect(401);
    });

    it.each(RUTAS)('%s con un rol clínico → 403', async (ruta) => {
      const res = await get(ruta, ['PATIENT', 'CLINICIAN']).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it.each(RUTAS)('%s con un rol del portal → 200', async (ruta) => {
      await get(ruta, ['DPO']).expect(200);
    });

    it.each(PORTAL_READ_ROLES)('el rol %s puede leer', async (rol) => {
      await get('/admin/portal/version', [rol]).expect(200);
    });

    it('un refresh token no autentica una petición ordinaria', async () => {
      const refresh = tokens.signAccessToken('u', 's', ['DPO']).split('.');
      // se rompe la firma: un token alterado es 401, no 403 ni 200
      await request(app.getHttpServer())
        .get('/admin/portal/version')
        .set('Authorization', `Bearer ${refresh[0]}.${refresh[1]}.firma-falsa`)
        .expect(401);
    });
  });

  describe('validación de entrada', () => {
    it('rechaza un límite fuera de rango, un riesgo inventado y propiedades no declaradas', async () => {
      await get('/admin/portal/operaciones?limit=999', ['DPO']).expect(400);
      await get('/admin/portal/operaciones?limit=0', ['DPO']).expect(400);
      await get('/admin/portal/operaciones?riesgo=EXTREMO', ['DPO']).expect(
        400,
      );
      await get('/admin/portal/operaciones?orden=asc', ['DPO']).expect(400);
      await get('/admin/portal/operaciones?modulo=a%20b', ['DPO']).expect(400);
    });

    it('rechaza identificadores con caracteres que no son del inventario', async () => {
      await get('/admin/portal/operaciones/..%2Fetc%2Fpasswd', ['DPO']).expect(
        400,
      );
      await get('/admin/portal/operaciones/a%20b', ['DPO']).expect(400);
      await get('/admin/portal/flujos/hallazgos/malo', ['DPO']).expect(400);
      await get('/admin/portal/catalogo/tablas/sch%3Bema/tabla', [
        'DPO',
      ]).expect(400);
    });

    it('un cursor corrupto es un 400, no un 500', async () => {
      await get('/admin/portal/operaciones?cursor=%25%25%25', ['DPO']).expect(
        400,
      );
    });

    it('`appendOnly=false` no se lee como verdadero', async () => {
      const si = await get(
        '/admin/portal/catalogo/tablas?appendOnly=true&limit=200',
        ['DPO'],
      ).expect(200);
      const no = await get(
        '/admin/portal/catalogo/tablas?appendOnly=false&limit=200',
        ['DPO'],
      ).expect(200);
      expect(
        si.body.items.every((t: { appendOnly: boolean }) => t.appendOnly),
      ).toBe(true);
      expect(
        no.body.items.every((t: { appendOnly: boolean }) => !t.appendOnly),
      ).toBe(true);
      expect(si.body.total + no.body.total).toBe(
        (await get('/admin/portal/catalogo/tablas?limit=1', ['DPO'])).body
          .total,
      );
    });
  });

  describe('no encontrado', () => {
    it.each([
      '/admin/portal/operaciones/NoExiste_nada',
      '/admin/portal/operaciones/NoExiste_nada/arbol',
      '/admin/portal/flujos/no_existe',
      '/admin/portal/flujos/no_existe/grafo',
      '/admin/portal/flujos/hallazgos/FLU-99',
      '/admin/portal/catalogo/tablas/scheduling/no_existe',
      '/admin/portal/linaje/tablas/scheduling/no_existe',
    ])('%s → 404', async (ruta) => {
      await get(ruta, ['DPO']).expect(404);
    });
  });

  describe('contenido', () => {
    it('el listado de operaciones respeta filtros y se recorre por cursor sin repetir ni saltar', async () => {
      const primera = await get(
        '/admin/portal/operaciones?modulo=scheduling&limit=10',
        ['DPO'],
      ).expect(200);
      expect(
        primera.body.items.every(
          (o: { modulo: string }) => o.modulo === 'scheduling',
        ),
      ).toBe(true);
      const ids: string[] = [];
      let cursor: string | null = null;
      do {
        const r: request.Response = await get(
          `/admin/portal/operaciones?modulo=scheduling&limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
          ['DPO'],
        ).expect(200);
        ids.push(...r.body.items.map((o: { id: string }) => o.id));
        cursor = r.body.nextCursor;
      } while (cursor);
      expect(ids).toHaveLength(primera.body.total);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('la señal ESCRIBE_SIN_ROLES filtra exactamente las operaciones que la tienen en el mapa', async () => {
      const ops = await get(
        '/admin/portal/operaciones?senal=ESCRIBE_SIN_ROLES&limit=200',
        ['DPO'],
      ).expect(200);
      const mapa = await get(
        '/admin/portal/flujos/mapa?senal=ESCRIBE_SIN_ROLES&limit=200',
        ['DPO'],
      ).expect(200);
      expect(ops.body.total).toBe(mapa.body.total);
      expect(ops.body.total).toBeGreaterThan(0);
      expect(
        ops.body.items.every((o: { senales: string[] }) =>
          o.senales.includes('ESCRIBE_SIN_ROLES'),
        ),
      ).toBe(true);
    });

    it('la búsqueda ignora tildes y mayúsculas', async () => {
      const a = await get(
        '/admin/portal/operaciones?q=RESERVAR%20TEMPORALMENTE&limit=50',
        ['DPO'],
      ).expect(200);
      expect(a.body.items.map((o: { id: string }) => o.id)).toContain(
        'SchedulingController_placeHold',
      );
    });

    it('la ficha de una operación trae las pestañas y el árbol de la misma operación', async () => {
      const ficha = await get(
        '/admin/portal/operaciones/SchedulingController_placeHold',
        ['DPO'],
      ).expect(200);
      expect(Object.keys(ficha.body)).toEqual(
        expect.arrayContaining([
          'negocio',
          'sistema',
          'requerimientos',
          'parametros',
          'cuerpo',
          'respuesta',
          'respuestasPosibles',
          'datos',
          'flujos',
          'pruebas',
          'razonesDeRiesgo',
        ]),
      );
      expect(ficha.body.datos.map((t: { tabla: string }) => t.tabla)).toEqual(
        expect.arrayContaining(['slot_holds', 'bookable_slots']),
      );
      const arbol = await get(
        '/admin/portal/operaciones/SchedulingController_placeHold/arbol',
        ['DPO'],
      ).expect(200);
      expect(
        arbol.body.respuestas.map((r: { estado: number }) => r.estado),
      ).toEqual(expect.arrayContaining([201, 404, 409, 422]));
      expect(arbol.body.respuestas).toEqual(ficha.body.respuestasPosibles);
    });

    it('la ficha no devuelve más que lo que la vista declara (no el registro crudo)', async () => {
      const ficha = await get(
        '/admin/portal/operaciones/SchedulingController_placeHold',
        ['DPO'],
      ).expect(200);
      for (const clave of [
        'explicacion',
        'casosDeUso',
        'autenticacion',
        'cierreParcial',
        'httpCode',
      ])
        expect(ficha.body).not.toHaveProperty(clave);
    });

    it('el proceso de la cita trae su máquina de estados y su grafo', async () => {
      const p = await get('/admin/portal/flujos/scheduling', ['DPO']).expect(
        200,
      );
      expect(
        p.body.maquinasDeEstado.map((m: { codigo: string }) => m.codigo),
      ).toContain('scheduling.BOOKING_TRANSITIONS');
      const g = await get('/admin/portal/flujos/scheduling/grafo', [
        'DPO',
      ]).expect(200);
      expect(g.body.nodos.length).toBeGreaterThan(10);
      const critico = await get(
        '/admin/portal/flujos/critico:scheduling/grafo',
        ['DPO'],
      ).expect(200);
      expect(critico.body.proceso).toBe('critico:scheduling');
    });

    it('los hallazgos se resumen y sus casos se paginan', async () => {
      const resumen = await get('/admin/portal/flujos/hallazgos', [
        'DPO',
      ]).expect(200);
      const flu07 = resumen.body.find((h: { id: string }) => h.id === 'FLU-07');
      const pagina = await get(
        '/admin/portal/flujos/hallazgos/FLU-07?limit=30',
        ['DPO'],
      ).expect(200);
      expect(pagina.body.items).toHaveLength(30);
      expect(pagina.body.cuenta).toBe(flu07.cuenta);
      expect(pagina.body.nextCursor).not.toBeNull();
    });

    it('la ficha de tabla trae columnas con su descripción o «sin dato», índices con «para qué» y operaciones', async () => {
      const t = await get(
        '/admin/portal/catalogo/tablas/scheduling/slot_holds',
        ['DPO'],
      ).expect(200);
      expect(t.body.columnas.length).toBeGreaterThan(5);
      expect(
        t.body.columnas.every(
          (c: { descripcion: object }) => typeof c.descripcion === 'object',
        ),
      ).toBe(true);
      expect(
        t.body.indices.every(
          (i: { paraQue: object[] }) => i.paraQue.length > 0,
        ),
      ).toBe(true);
      expect(t.body.operaciones.length).toBeGreaterThan(0);
      expect(t.body.gobierno.pii).toEqual({ estado: 'SIN_FUENTE' });
    });

    it('el linaje de una tabla cruza con las operaciones del inventario', async () => {
      const l = await get('/admin/portal/linaje/tablas/scheduling/slot_holds', [
        'DPO',
      ]).expect(200);
      expect(
        l.body.operaciones.some(
          (o: { id: string }) => o.id === 'SchedulingController_placeHold',
        ),
      ).toBe(true);
      expect(l.body.referencia).toContain('scheduling.bookable_slots');
    });

    it('el glosario busca por término y por definición', async () => {
      const r = await get('/admin/portal/glosario?q=tenant', ['DPO']).expect(
        200,
      );
      expect(r.body.total).toBeGreaterThan(0);
      expect(
        r.body.items.every((t: { fuente: string }) => t.fuente.length > 0),
      ).toBe(true);
    });
  });

  describe('sin inventario', () => {
    it('responde 503 con un mensaje que dice qué falta, y no 500', async () => {
      const vacio = mkdtempSync(join(tmpdir(), 'portal-vacio-'));
      process.env[INVENTARIO_DIR_ENV] = vacio;
      inventario.reset();
      try {
        const res = await get('/admin/portal/operaciones', ['DPO']).expect(503);
        expect(res.body.message).toMatch(
          /inventario del portal no está disponible/,
        );
        await get('/admin/portal/version', ['DPO']).expect(503);
      } finally {
        rmSync(vacio, { recursive: true, force: true });
        delete process.env[INVENTARIO_DIR_ENV];
        inventario.reset();
      }
      await get('/admin/portal/version', ['DPO']).expect(200);
    });
  });
});
