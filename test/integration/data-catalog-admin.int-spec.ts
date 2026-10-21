import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { MikroORM, EntityManager, defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../src/common/auth/auth-token.module';
import { JwtAuthGuard } from '../../src/common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../src/common/auth/jwt.strategy';
import { RolesGuard } from '../../src/common/auth/roles.guard';
import { TokenService } from '../../src/common/auth/token.service';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { AdminCatalogController } from '../../src/modules/data_catalog/controllers/admin-catalog.controller';
import { CatalogRepository } from '../../src/modules/data_catalog/repositories/catalog.repository';
import { CatalogGovernanceService } from '../../src/modules/data_catalog/services/catalog-governance.service';
import { CatalogReadService } from '../../src/modules/data_catalog/services/catalog-read.service';
import { CatalogScanService } from '../../src/modules/data_catalog/services/catalog-scan.service';
import { TracingService } from '../../src/observability';

/**
 * `/admin/catalog/*` contra PostgreSQL real: el escaneo lee el `pg_catalog` de verdad, la
 * concurrencia la deciden los índices únicos y la versión de la fila, y los guards son los reales.
 *
 * No hay dobles de la base. El único montaje propio es un Nest mínimo (el `AppModule` completo
 * exige Mongo, OpenSearch y MinIO, que esta prueba no necesita).
 *
 * Requiere el esquema `data_catalog` aplicado. Los usuarios de prueba se crean con una
 * `status_concept_id` existente; si la base no tiene conceptos (una base descartable sin seeds)
 * se insertan con las claves foráneas suspendidas en esa transacción, lo que sólo puede un
 * superusuario. Al terminar se retiran las fichas, revisiones, evidencia y escaneos de la prueba y
 * se desligan de los usuarios de prueba los objetos que el escaneo creó (el catálogo observado
 * queda, que es lo que cualquier escaneo deja).
 */
describe('Catálogo de datos vivo /admin/catalog (DB real)', () => {
  let orm: MikroORM;
  let app: INestApplication;
  let tokens: TokenService;
  let scans: CatalogScanService;
  const autor = randomUUID();
  const revisor = randomUUID();
  const lector = randomUUID();
  const tabla = `zz_catalog_it_${randomUUID().slice(0, 8)}`;
  const ids = [autor, revisor, lector];

  const as = (usuario: string, roles: string[]): Record<string, string> => ({
    Authorization: `Bearer ${tokens.signAccessToken(usuario, `s-${usuario}`, roles)}`,
  });
  const admin = (usuario = autor) => as(usuario, ['GOVERNANCE_ADMIN']);
  const get = (ruta: string, cab: Record<string, string> = admin()) =>
    request(app.getHttpServer()).get(ruta).set(cab);
  const put = (ruta: string, cuerpo: object, cab = admin()) =>
    request(app.getHttpServer()).put(ruta).set(cab).send(cuerpo);
  const post = (ruta: string, cuerpo?: object, cab = admin()) =>
    request(app.getHttpServer()).post(ruta).set(cab).send(cuerpo);
  const sql = <T = unknown>(consulta: string, params: unknown[] = []) =>
    orm.em
      .getConnection()
      .execute(consulta, params as never[], 'all') as Promise<T>;

  /** Pide un escaneo, espera a que termine y devuelve su estado final. */
  async function escanear(clave = `it-${randomUUID()}`) {
    const res = await post('/admin/catalog/scans', undefined, {
      ...admin(),
      'Idempotency-Key': clave,
    }).expect(202);
    await scans.drain();
    const fin = await get(`/admin/catalog/scans/${res.body.scanId}`).expect(
      200,
    );
    return { aceptado: res.body, scan: fin.body };
  }

  beforeAll(async () => {
    orm = await MikroORM.init(
      defineConfig({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dbName: process.env.DB_NAME,
        entities: [],
        discovery: { warnWhenNoEntities: false },
      }),
    );
    // usuarios de la prueba
    const [concepto] = await sql<{ id: string }[]>(
      'select id from terminology.catalog_concepts limit 1',
    );
    await orm.em.transactional(async (tx) => {
      const ctx = tx.getTransactionContext();
      if (!concepto)
        await tx
          .getConnection()
          .execute(
            'set local session_replication_role = replica',
            [],
            'run',
            ctx,
          );
      for (const id of ids)
        await tx.getConnection().execute(
          `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at, row_version)
           values (?, ?, ?, now(), now(), 1)`,
          [id, concepto?.id ?? randomUUID(), `it-${id.slice(0, 8)}`],
          'run',
          ctx,
        );
    });
    await sql(`create table public.${tabla} (id int primary key, ref int)`);

    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [AdminCatalogController],
      providers: [
        { provide: EntityManager, useValue: orm.em },
        CatalogRepository,
        CatalogReadService,
        CatalogGovernanceService,
        CatalogScanService,
        JwtStrategy,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
        {
          provide: PinoLogger,
          useValue: {
            setContext: () => undefined,
            warn: () => undefined,
            // con IT_DEBUG=1 un 500 deja su causa en la salida
            error: (...args: unknown[]) => {
              if (process.env.IT_DEBUG) console.error(...args);
            },
          },
        },
        {
          provide: TracingService,
          useValue: {
            setAttribute: () => undefined,
            recordException: () => undefined,
            addEvent: () => undefined,
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
    scans = modulo.get(CatalogScanService);
  });

  afterAll(async () => {
    await scans?.drain();
    await app?.close();
    const lista = JSON.stringify(ids);
    const deLaPrueba = `(select value::uuid from jsonb_array_elements_text('${lista}'::jsonb))`;
    // lo curado por la prueba, en orden de dependencias
    await sql(
      `delete from data_catalog.catalog_review_decisions where reviewer_user_id in ${deLaPrueba}`,
    );
    await sql(
      `delete from data_catalog.catalog_annotation_revisions where author_user_id in ${deLaPrueba}`,
    );
    await sql(
      `delete from data_catalog.catalog_evidence_items where added_by_user_id in ${deLaPrueba}`,
    );
    await sql(
      `delete from data_catalog.catalog_annotations where created_by_user_id in ${deLaPrueba}`,
    );
    // lo observado queda, sin apuntar a usuarios que se van
    await sql(
      `update data_catalog.catalog_objects set created_by_user_id = null where created_by_user_id in ${deLaPrueba}`,
    );
    await sql(
      `update data_catalog.catalog_objects set updated_by_user_id = null where updated_by_user_id in ${deLaPrueba}`,
    );
    await sql(
      `update data_catalog.catalog_columns set created_by_user_id = null where created_by_user_id in ${deLaPrueba}`,
    );
    await sql(
      `update data_catalog.catalog_columns set updated_by_user_id = null where updated_by_user_id in ${deLaPrueba}`,
    );
    await sql(
      `update data_catalog.catalog_scan_runs set requested_by_user_id = null, idempotency_key = null where requested_by_user_id in ${deLaPrueba}`,
    );
    await sql(
      `update data_catalog.catalog_scan_runs set created_by_user_id = null where created_by_user_id in ${deLaPrueba}`,
    );
    await sql(
      `update data_catalog.catalog_scan_runs set updated_by_user_id = null where updated_by_user_id in ${deLaPrueba}`,
    );
    await sql(`drop table if exists public.${tabla}`);
    await sql(`delete from iam.users where id in ${deLaPrueba}`);
    await orm.close(true);
  });

  // ------------------------------------------------------------------------------------------
  describe('autorización (matriz negativa)', () => {
    const LECTURAS = [
      '/admin/catalog/schemas',
      '/admin/catalog/objects',
      '/admin/catalog/coverage',
      '/admin/catalog/scans',
    ];
    const ESCRITURAS: [string, 'put' | 'post', object | undefined][] = [
      [
        `/admin/catalog/objects/${randomUUID()}/annotation`,
        'put',
        { expectedVersion: 0 },
      ],
      [
        `/admin/catalog/objects/${randomUUID()}/evidence`,
        'post',
        { kind: 'DOCUMENT', reference: 'docs/x.md' },
      ],
      [
        `/admin/catalog/annotations/${randomUUID()}/review`,
        'post',
        {
          decision: 'REJECTED',
          expectedRevisionNo: 1,
          comment: 'falta el propósito',
        },
      ],
      ['/admin/catalog/scans', 'post', undefined],
    ];
    const enviar = (
      m: 'put' | 'post',
      ruta: string,
      cuerpo: object | undefined,
      cab?: Record<string, string>,
    ) => {
      const r = request(app.getHttpServer())[m](ruta);
      if (cab) r.set(cab);
      return r.set('Idempotency-Key', `authz-${randomUUID()}`).send(cuerpo);
    };

    it.each(LECTURAS)('%s sin token → 401', async (ruta) => {
      await request(app.getHttpServer()).get(ruta).expect(401);
    });
    it.each(LECTURAS)('%s con rol clínico → 403', async (ruta) => {
      await get(ruta, as(lector, ['PATIENT', 'CLINICIAN'])).expect(403);
    });
    it.each(LECTURAS)('%s con DPO (sólo lectura) → 200', async (ruta) => {
      await get(ruta, as(lector, ['DPO'])).expect(200);
    });
    it.each(ESCRITURAS)('%s (%s) sin token → 401', async (ruta, m, cuerpo) => {
      await enviar(m, ruta, cuerpo).expect(401);
    });
    it.each(ESCRITURAS)(
      '%s (%s) con rol clínico → 403',
      async (ruta, m, cuerpo) => {
        await enviar(m, ruta, cuerpo, as(lector, ['PATIENT'])).expect(403);
      },
    );
    it.each(ESCRITURAS)(
      '%s (%s) con DPO (lector) → 403',
      async (ruta, m, cuerpo) => {
        await enviar(m, ruta, cuerpo, as(lector, ['DPO'])).expect(403);
      },
    );
    it.each([
      'SECURITY_ADMIN',
      'PLATFORM_ADMIN',
      'DATA_PLATFORM_ADMIN',
      'GOVERNANCE_ADMIN',
      'DPO',
    ])('el rol %s puede leer', async (rol) => {
      await get('/admin/catalog/schemas', as(lector, [rol])).expect(200);
    });
  });

  // ------------------------------------------------------------------------------------------
  describe('contrato OpenAPI que describen los decoradores', () => {
    it('declara las 15 operaciones con operationId único, los códigos de error y el esquema de cada respuesta', () => {
      const doc = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().build(),
      );
      const rutas = Object.entries(doc.paths).filter(([ruta]) =>
        ruta.startsWith('/admin/catalog'),
      );
      const operaciones = rutas.flatMap(([ruta, metodos]) =>
        Object.entries(
          metodos as Record<
            string,
            {
              operationId?: string;
              responses: Record<string, { content?: unknown }>;
            }
          >,
        ).map(([metodo, op]) => ({ ruta, metodo, op })),
      );
      expect(operaciones).toHaveLength(15);
      const operationIds = operaciones.map((o) => o.op.operationId);
      expect(
        operationIds.every((id) => id && id.startsWith('adminCatalog')),
      ).toBe(true);
      expect(new Set(operationIds).size).toBe(15);
      const por = (m: string, r: string) =>
        operaciones.find((o) => o.metodo === m && o.ruta === r)!.op;
      expect(
        Object.keys(por('post', '/admin/catalog/scans').responses),
      ).toEqual(expect.arrayContaining(['202', '409']));
      expect(
        Object.keys(
          por('put', '/admin/catalog/objects/{id}/annotation').responses,
        ),
      ).toEqual(expect.arrayContaining(['200', '409', '422']));
      expect(
        Object.keys(
          por('post', '/admin/catalog/annotations/{id}/review').responses,
        ),
      ).toEqual(expect.arrayContaining(['200', '403', '409', '422']));
      expect(
        Object.keys(
          por('post', '/admin/catalog/objects/{id}/evidence').responses,
        ),
      ).toContain('201');
      // cada operación que devuelve cuerpo lo describe
      for (const { ruta, metodo, op } of operaciones) {
        const ok = Object.entries(op.responses).find(([c]) =>
          c.startsWith('2'),
        );
        expect([ruta, metodo, ok?.[1].content !== undefined]).toEqual([
          ruta,
          metodo,
          true,
        ]);
      }
      const schemas = Object.keys(doc.components?.schemas ?? {});
      expect(schemas).toEqual(
        expect.arrayContaining([
          'AnnotationDto',
          'CatalogObjectDetailDto',
          'ImpactDto',
          'ScanAcceptedDto',
        ]),
      );
    });
  });

  // ------------------------------------------------------------------------------------------
  describe('escaneo', () => {
    it('exige Idempotency-Key', async () => {
      const res = await post('/admin/catalog/scans').expect(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      await post('/admin/catalog/scans', undefined, {
        ...admin(),
        'Idempotency-Key': 'corta',
      }).expect(422);
    });

    it('acepta (202), lee pg_catalog y deja el escaneo SUCCEEDED con contadores y límites', async () => {
      const { aceptado, scan } = await escanear();
      expect(aceptado).toMatchObject({ created: true, status: 'QUEUED' });
      expect(aceptado.statusUrl).toBe(
        `/admin/catalog/scans/${aceptado.scanId}`,
      );
      expect(scan.status).toBe('SUCCEEDED');
      expect(scan.counters.objectsObserved).toBeGreaterThan(50);
      expect(scan.counters.columnsObserved).toBeGreaterThan(
        scan.counters.objectsObserved,
      );
      expect(scan.limitations.length).toBeGreaterThan(0);
      expect(scan.snapshotHash).toMatch(/^[0-9a-f]{64}$/);
      expect(scan.excludedSchemas).toEqual(
        expect.arrayContaining(['information_schema']),
      );
    });

    it('la misma Idempotency-Key devuelve el mismo escaneo sin crear otro', async () => {
      const clave = `idem-${randomUUID()}`;
      const primero = await escanear(clave);
      const antes = (
        await sql<{ n: number }[]>(
          'select count(*)::int n from data_catalog.catalog_scan_runs',
        )
      )[0].n;
      const repetido = await post('/admin/catalog/scans', undefined, {
        ...admin(),
        'Idempotency-Key': clave,
      }).expect(202);
      await scans.drain();
      expect(repetido.body.created).toBe(false);
      expect(repetido.body.scanId).toBe(primero.aceptado.scanId);
      const despues = (
        await sql<{ n: number }[]>(
          'select count(*)::int n from data_catalog.catalog_scan_runs',
        )
      )[0].n;
      expect(despues).toBe(antes);
    });

    it('un segundo escaneo sin cambios no duplica objetos ni columnas ni genera cambios', async () => {
      await escanear();
      const conteo = async () =>
        (
          await sql<{ o: number; c: number; e: number }[]>(
            `select (select count(*) from data_catalog.catalog_objects)::int o,
                  (select count(*) from data_catalog.catalog_columns)::int c,
                  (select count(*) from data_catalog.catalog_change_events)::int e`,
          )
        )[0];
      const antes = await conteo();
      const { scan } = await escanear();
      const despues = await conteo();
      expect(scan.status).toBe('SUCCEEDED');
      expect(despues).toEqual(antes);
      expect(scan.counters).toMatchObject({
        objectsAdded: 0,
        objectsChanged: 0,
        objectsNotObserved: 0,
        objectsReappeared: 0,
      });
    });

    it('dos pedidos simultáneos: uno se acepta y el otro recibe 409 (índice único, no un if)', async () => {
      const [a, b] = await Promise.all([
        post('/admin/catalog/scans', undefined, {
          ...admin(),
          'Idempotency-Key': `par-a-${randomUUID()}`,
        }),
        post('/admin/catalog/scans', undefined, {
          ...admin(),
          'Idempotency-Key': `par-b-${randomUUID()}`,
        }),
      ]);
      await scans.drain();
      expect([a.status, b.status].sort()).toEqual([202, 409]);
      const activos = (
        await sql<{ n: number }[]>(
          `select count(*)::int n from data_catalog.catalog_scan_runs where status in ('QUEUED','RUNNING')`,
        )
      )[0].n;
      expect(activos).toBe(0);
    });

    it('detecta tabla nueva, columna nueva y tabla retirada, con su evento', async () => {
      const { scan: base } = await escanear();
      expect(base.status).toBe('SUCCEEDED');
      const buscar = async () => {
        const r = await get(`/admin/catalog/objects?q=${tabla}`).expect(200);
        return r.body.items.find(
          (i: { objectName: string }) => i.objectName === tabla,
        );
      };
      const existente = await buscar();
      expect(existente).toBeDefined();
      const id = existente.id as string;
      await sql(`alter table public.${tabla} add column nota text`);
      const { scan: cambio } = await escanear();
      expect(cambio.counters.objectsChanged).toBeGreaterThanOrEqual(1);
      const cols = await get(`/admin/catalog/objects/${id}/columns`).expect(
        200,
      );
      expect(
        cols.body.items.map((c: { columnName: string }) => c.columnName),
      ).toEqual(['id', 'ref', 'nota']);
      await sql(`drop table public.${tabla}`);
      await escanear();
      const retirado = await get(`/admin/catalog/objects/${id}`).expect(200);
      expect(retirado.body.observation.status).toBe('NOT_OBSERVED');
      expect(retirado.body.observation.notObservedSince).toEqual(
        expect.any(String),
      );
      const cambios = await get(`/admin/catalog/objects/${id}/changes`).expect(
        200,
      );
      expect(
        cambios.body.items.map((c: { changeKind: string }) => c.changeKind),
      ).toEqual(expect.arrayContaining(['NOT_OBSERVED']));
      // reaparece
      await sql(`create table public.${tabla} (id int primary key, ref int)`);
      const { scan: vuelve } = await escanear();
      expect(vuelve.counters.objectsReappeared).toBeGreaterThanOrEqual(1);
      const eventos = (
        await sql<{ n: number }[]>(
          'select count(*)::int n from data_catalog.catalog_change_events where object_id = ?',
          [id],
        )
      )[0].n;
      expect(eventos).toBeGreaterThanOrEqual(3);
      const vistosCambios: string[] = [];
      let cursorCambios: string | null = null;
      do {
        const pagina: request.Response = await get(
          `/admin/catalog/objects/${id}/changes?limit=1${cursorCambios ? `&cursor=${cursorCambios}` : ''}`,
        ).expect(200);
        vistosCambios.push(
          ...pagina.body.items.map((c: { id: string }) => c.id),
        );
        cursorCambios = pagina.body.nextCursor;
      } while (cursorCambios && vistosCambios.length < 50);
      expect(vistosCambios).toHaveLength(eventos);
      expect(new Set(vistosCambios).size).toBe(eventos);
      const de_nuevo = await get(`/admin/catalog/objects/${id}`).expect(200);
      expect(de_nuevo.body.observation.status).toBe('OBSERVED');
    });
  });

  // ------------------------------------------------------------------------------------------
  describe('lecturas', () => {
    beforeAll(async () => {
      await escanear();
    });

    const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    it('el cursor de escaneos recorre todos una vez aunque sean más que una página', async () => {
      const total = (
        await sql<{ n: number }[]>(
          'select count(*)::int n from data_catalog.catalog_scan_runs',
        )
      )[0].n;
      expect(total).toBeGreaterThan(3);
      const vistos: string[] = [];
      let cursor: string | null = null;
      let paginas = 0;
      do {
        const res: request.Response = await get(
          `/admin/catalog/scans?limit=3${cursor ? `&cursor=${cursor}` : ''}`,
        ).expect(200);
        vistos.push(...res.body.items.map((i: { id: string }) => i.id));
        cursor = res.body.nextCursor;
        paginas++;
      } while (cursor && paginas < 500);
      expect(vistos).toHaveLength(total);
      expect(new Set(vistos).size).toBe(total);
    });

    it('toda fecha sale en ISO 8601 UTC, nunca en el texto de Postgres', async () => {
      const escaneos = await get('/admin/catalog/scans?limit=1').expect(200);
      const e = escaneos.body.items[0];
      expect(e.requestedAt).toMatch(ISO);
      expect(e.finishedAt).toMatch(ISO);
      const lista = await get(
        '/admin/catalog/objects?q=data_catalog.catalog_objects',
      ).expect(200);
      expect(lista.body.items[0].lastSeenAt).toMatch(ISO);
      expect(lista.body.items[0].statistics.observedAt).toMatch(ISO);
      const detalle = await get(
        `/admin/catalog/objects/${lista.body.items[0].id}`,
      ).expect(200);
      expect(detalle.body.observation.lastSeenAt).toMatch(ISO);
      const cols = await get(
        `/admin/catalog/objects/${lista.body.items[0].id}/columns`,
      ).expect(200);
      expect(cols.body.items[0].lastSeenAt).toMatch(ISO);
      const cobertura = await get('/admin/catalog/coverage').expect(200);
      expect(cobertura.body.lastScan.finishedAt).toMatch(ISO);
      const aceptado = await post('/admin/catalog/scans', undefined, {
        ...admin(),
        'Idempotency-Key': `iso-${randomUUID()}`,
      }).expect(202);
      await scans.drain();
      expect(aceptado.body.acceptedAt).toMatch(ISO);
    });

    it('lista schemas con conteos coherentes', async () => {
      const res = await get('/admin/catalog/schemas').expect(200);
      const nombres = res.body.map((s: { schemaName: string }) => s.schemaName);
      expect(nombres).toEqual(expect.arrayContaining(['data_catalog', 'iam']));
      expect(nombres).not.toContain('information_schema');
      expect(nombres.some((n: string) => n.startsWith('pg_'))).toBe(false);
    });

    it('el cursor recorre todos los objetos una vez, sin saltos ni repetidos', async () => {
      const total = (
        await sql<{ n: number }[]>(
          `select count(*)::int n from data_catalog.catalog_objects where observation_status = 'OBSERVED'`,
        )
      )[0].n;
      const vistos: string[] = [];
      let cursor: string | null = null;
      let paginas = 0;
      do {
        const res: request.Response = await get(
          `/admin/catalog/objects?observationStatus=OBSERVED&limit=37${cursor ? `&cursor=${cursor}` : ''}`,
        ).expect(200);
        vistos.push(...res.body.items.map((i: { id: string }) => i.id));
        cursor = res.body.nextCursor;
        paginas++;
      } while (cursor && paginas < 200);
      expect(vistos.length).toBe(total);
      expect(new Set(vistos).size).toBe(total);
    });

    it('filtra por schema y por texto, y rechaza entradas inválidas con 400', async () => {
      const res = await get(
        '/admin/catalog/objects?schema=data_catalog&limit=200',
      ).expect(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(8);
      expect(
        new Set(
          res.body.items.map((i: { schemaName: string }) => i.schemaName),
        ),
      ).toEqual(new Set(['data_catalog']));
      const q = await get('/admin/catalog/objects?q=catalog_scan_runs').expect(
        200,
      );
      expect(
        q.body.items.map((i: { objectName: string }) => i.objectName),
      ).toContain('catalog_scan_runs');
      // `%` y `_` no son comodines
      const comodin = await get('/admin/catalog/objects?q=%25').expect(200);
      expect(comodin.body.items).toEqual([]);
      await get('/admin/catalog/objects?limit=0').expect(400);
      await get('/admin/catalog/objects?limit=9999').expect(400);
      await get('/admin/catalog/objects?kind=NOPE').expect(400);
      await get('/admin/catalog/objects?cursor=basura').expect(400);
      await get('/admin/catalog/objects?desconocido=1').expect(400);
    });

    it('detalle: ficha técnica con clave primaria y estadísticas marcadas como estimación', async () => {
      const lista = await get(
        '/admin/catalog/objects?q=data_catalog.catalog_annotations',
      ).expect(200);
      const o = lista.body.items.find(
        (i: { objectName: string }) => i.objectName === 'catalog_annotations',
      );
      const res = await get(`/admin/catalog/objects/${o.id}`).expect(200);
      expect(res.body.technical).toMatchObject({
        schemaName: 'data_catalog',
        objectName: 'catalog_annotations',
        primaryKey: ['id'],
      });
      expect(res.body.technical.statistics.isEstimate).toBe(true);
      expect(res.body.annotation).toBeNull();
      expect(res.body.coverage).toMatchObject({
        technical: 'COMPLETE',
        semantic: 'MISSING',
        review: 'NOT_APPROVED',
      });
    });

    it('columnas con tipo, nulabilidad, clave foránea y única', async () => {
      const lista = await get(
        '/admin/catalog/objects?q=data_catalog.catalog_columns',
      ).expect(200);
      const o = lista.body.items.find(
        (i: { objectName: string }) => i.objectName === 'catalog_columns',
      );
      const res = await get(`/admin/catalog/objects/${o.id}/columns`).expect(
        200,
      );
      const porNombre = Object.fromEntries(
        res.body.items.map((c: { columnName: string }) => [c.columnName, c]),
      );
      expect(porNombre['id']).toMatchObject({
        isPrimaryKey: true,
        isNullable: false,
      });
      expect(porNombre['object_id'].foreignKey).toMatchObject({
        targetSchema: 'data_catalog',
        targetTable: 'catalog_objects',
      });
    });

    it('404 para un objeto inexistente y 400 para un id mal formado', async () => {
      await get(`/admin/catalog/objects/${randomUUID()}`).expect(404);
      await get(`/admin/catalog/objects/${randomUUID()}/columns`).expect(404);
      await get(`/admin/catalog/objects/${randomUUID()}/impact`).expect(404);
      await get('/admin/catalog/objects/no-es-uuid').expect(400);
    });

    it('impacto: quién referencia a catalog_scan_runs, y avisa que hay más allá de la profundidad pedida', async () => {
      const lista = await get(
        '/admin/catalog/objects?q=data_catalog.catalog_scan_runs',
      ).expect(200);
      const o = lista.body.items.find(
        (i: { objectName: string }) => i.objectName === 'catalog_scan_runs',
      );
      const res = await get(
        `/admin/catalog/objects/${o.id}/impact?direction=downstream&depth=1`,
      ).expect(200);
      expect(res.body.root).toBe(o.id);
      const nombres = res.body.nodes.map(
        (n: { schemaName: string; objectName: string }) =>
          `${n.schemaName}.${n.objectName}`,
      );
      expect(nombres).toEqual(
        expect.arrayContaining([
          'data_catalog.catalog_scan_runs',
          'data_catalog.catalog_objects',
          'data_catalog.catalog_columns',
          'data_catalog.catalog_change_events',
        ]),
      );
      expect(res.body.nodes[0]).toMatchObject({ objectId: o.id, depth: 0 });
      expect(res.body.nodes.every((n: { depth: number }) => n.depth <= 1)).toBe(
        true,
      );
      expect(
        res.body.edges.every(
          (e: { toObjectId: string }) => e.toObjectId === o.id,
        ),
      ).toBe(true);
      expect(res.body.edges[0]).toMatchObject({
        kind: 'REFERENCES',
        provenance: 'STRUCTURAL_FK_OBSERVED',
      });
      // sus referenciantes (p. ej. catalog_objects) tienen a su vez referenciantes: hay más allá
      expect(res.body).toMatchObject({
        truncated: true,
        truncatedReason: 'MAX_DEPTH',
      });
      expect(res.body.scope).toMatch(/no prueba ausencia/);
      // en sentido inverso, a quién referencia ella: sólo usuarios
      const arriba = await get(
        `/admin/catalog/objects/${o.id}/impact?direction=upstream&depth=1`,
      ).expect(200);
      expect(
        arriba.body.nodes
          .filter((n: { depth: number }) => n.depth === 1)
          .map((n: { objectName: string }) => n.objectName),
      ).toEqual(['users']);
      await get(`/admin/catalog/objects/${o.id}/impact?depth=6`).expect(400);
      await get(
        `/admin/catalog/objects/${o.id}/impact?direction=sideways`,
      ).expect(400);
    });

    it('impacto: una tabla que nadie referencia no sale truncada', async () => {
      const lista = await get(
        '/admin/catalog/objects?q=data_catalog.catalog_review_decisions',
      ).expect(200);
      const o = lista.body.items.find(
        (i: { objectName: string }) =>
          i.objectName === 'catalog_review_decisions',
      );
      const res = await get(
        `/admin/catalog/objects/${o.id}/impact?direction=downstream&depth=3`,
      ).expect(200);
      expect(res.body.nodes).toHaveLength(1);
      expect(res.body.edges).toEqual([]);
      expect(res.body).toMatchObject({
        truncated: false,
        truncatedReason: null,
      });
    });

    it('impacto: iam.users tiene más referenciantes que el tope; lo dice y el resultado es estable', async () => {
      const lista = await get(
        '/admin/catalog/objects?q=iam.users&schema=iam',
      ).expect(200);
      const o = lista.body.items.find(
        (i: { objectName: string }) => i.objectName === 'users',
      );
      const url = `/admin/catalog/objects/${o.id}/impact?direction=downstream&depth=1`;
      const a = await get(url).expect(200);
      const b = await get(url).expect(200);
      expect(a.body.nodes).toHaveLength(100);
      expect(a.body.truncated).toBe(true);
      expect(a.body.truncatedReason).toBe('MAX_NODES');
      expect(a.body.nodes.map((n: { objectId: string }) => n.objectId)).toEqual(
        b.body.nodes.map((n: { objectId: string }) => n.objectId),
      );
    });

    it('cobertura: el denominador son los objetos observados; sin objetos no inventa un porcentaje', async () => {
      const observados = (
        await sql<{ n: number }[]>(
          `select count(*)::int n from data_catalog.catalog_objects where observation_status = 'OBSERVED'`,
        )
      )[0].n;
      const res = await get('/admin/catalog/coverage').expect(200);
      expect(res.body.denominator).toBe(observados);
      expect(res.body.modelVersion).toBe('catalog-coverage/v1');
      expect(res.body.dimensions.technical.status).toBe('MEASURED');
      const vacio = await get(
        '/admin/catalog/coverage?schema=no_existe',
      ).expect(200);
      expect(vacio.body.denominator).toBe(0);
      expect(vacio.body.dimensions.review).toMatchObject({
        status: 'NOT_APPLICABLE',
        ratio: null,
      });
    });
  });

  // ------------------------------------------------------------------------------------------
  describe('ficha: versiones, envío a revisión y segregación', () => {
    let objetoId = '';
    let fichaId = '';

    beforeAll(async () => {
      await escanear();
      const lista = await get(
        '/admin/catalog/objects?q=data_catalog.catalog_evidence_items',
      ).expect(200);
      objetoId = lista.body.items.find(
        (i: { objectName: string }) =>
          i.objectName === 'catalog_evidence_items',
      ).id;
    });

    const respuestasBuenas = {
      purpose:
        'Guarda los enlaces a la evidencia que respalda cada ficha del catálogo de datos',
      existenceRationale:
        'Sin evidencia enlazada una ficha aprobada no se puede auditar después',
      rowGrain:
        'Una fila por cada enlace de evidencia agregado a un objeto o columna',
    };

    it('crea la ficha con expectedVersion 0 (borrador, versión 1, revisión 1)', async () => {
      const res = await put(`/admin/catalog/objects/${objetoId}/annotation`, {
        expectedVersion: 0,
        businessName: 'Evidencia del catálogo',
        sensitivity: 'INTERNAL',
        businessOwner: 'Equipo de datos',
      }).expect(200);
      fichaId = res.body.id;
      expect(res.body).toMatchObject({
        version: 1,
        reviewStatus: 'DRAFT',
        currentRevisionNo: 1,
        approvedRevisionNo: null,
        approvalIsCurrent: false,
      });
      expect(res.body.content.businessName).toBe('Evidencia del catálogo');
    });

    it('409 CONCURRENCY_CONFLICT si la versión esperada ya no es la vigente', async () => {
      const res = await put(`/admin/catalog/objects/${objetoId}/annotation`, {
        expectedVersion: 0,
        purpose: 'otro',
      }).expect(409);
      expect(res.body.code).toBe('CONCURRENCY_CONFLICT');
      expect(res.body.details).toMatchObject({
        expectedVersion: 0,
        latestVersion: 1,
      });
    });

    it('dos ediciones simultáneas con la misma versión: una gana, la otra recibe 409', async () => {
      const [a, b] = await Promise.all([
        put(`/admin/catalog/objects/${objetoId}/annotation`, {
          expectedVersion: 1,
          technicalOwner: 'A',
        }),
        put(`/admin/catalog/objects/${objetoId}/annotation`, {
          expectedVersion: 1,
          technicalOwner: 'B',
        }),
      ]);
      expect([a.status, b.status].sort()).toEqual([200, 409]);
      const ficha = await get(`/admin/catalog/objects/${objetoId}`).expect(200);
      expect(ficha.body.annotation.version).toBe(2);
      expect(ficha.body.annotation.currentRevisionNo).toBe(2);
      const historia = await get(
        `/admin/catalog/objects/${objetoId}/history`,
      ).expect(200);
      expect(
        historia.body.revisions.map(
          (r: { revisionNo: number }) => r.revisionNo,
        ),
      ).toEqual([2, 1]);
    });

    it('enviar a revisión sin respuestas que expliquen → 422 con las violaciones por campo', async () => {
      const res = await put(`/admin/catalog/objects/${objetoId}/annotation`, {
        expectedVersion: 2,
        submit: true,
        purpose:
          'Esta tabla almacena datos del sistema para su uso posterior en general',
        rowGrain: 'corto',
      }).expect(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      const por = Object.fromEntries(
        res.body.details.violations.map(
          (v: { field: string; reason: string }) => [v.field, v.reason],
        ),
      );
      expect(por).toEqual({
        purpose: 'FILLER_TEXT',
        existenceRationale: 'REQUIRED_OR_OPEN_QUESTION',
        rowGrain: 'TOO_SHORT',
      });
      // nada se guardó
      const ficha = await get(`/admin/catalog/objects/${objetoId}`).expect(200);
      expect(ficha.body.annotation.version).toBe(2);
      expect(ficha.body.annotation.content.rowGrain).toBeNull();
    });

    it('rechaza campos no declarados y valores fuera de la lista (400)', async () => {
      await put(`/admin/catalog/objects/${objetoId}/annotation`, {
        expectedVersion: 2,
        reviewStatus: 'APPROVED',
      }).expect(400);
      await put(`/admin/catalog/objects/${objetoId}/annotation`, {
        expectedVersion: 2,
        sensitivity: 'TOP',
      }).expect(400);
      await put(`/admin/catalog/objects/${objetoId}/annotation`, {
        sensitivity: 'PII',
      }).expect(400);
    });

    it('una pregunta abierta declarada en el campo deja pasar el envío (deuda reconocida)', async () => {
      // se prueba sobre otro objeto para no consumir versiones de éste
      const lista = await get(
        '/admin/catalog/objects?q=data_catalog.catalog_review_decisions',
      ).expect(200);
      const otro = lista.body.items.find(
        (i: { objectName: string }) =>
          i.objectName === 'catalog_review_decisions',
      ).id;
      const res = await put(`/admin/catalog/objects/${otro}/annotation`, {
        expectedVersion: 0,
        submit: true,
        purpose: respuestasBuenas.purpose,
        openQuestions: [
          {
            field: 'existenceRationale',
            question: '¿Por qué existe separada de las revisiones?',
          },
          {
            field: 'rowGrain',
            question: '¿Es una fila por decisión o por revisión?',
          },
        ],
      }).expect(200);
      expect(res.body.reviewStatus).toBe('NEEDS_REVIEW');
      const detalle = await get(`/admin/catalog/objects/${otro}`).expect(200);
      expect(detalle.body.coverage.semantic).toBe('DECLARED_DEBT');
    });

    it('el autor envía a revisión; el autor no puede revisarla (403 SELF_REVIEW)', async () => {
      const enviado = await put(
        `/admin/catalog/objects/${objetoId}/annotation`,
        {
          expectedVersion: 2,
          submit: true,
          changeReason: 'Primera versión completa',
          ...respuestasBuenas,
        },
      ).expect(200);
      expect(enviado.body).toMatchObject({
        reviewStatus: 'NEEDS_REVIEW',
        version: 3,
        currentRevisionNo: 3,
      });
      const propia = await post(
        `/admin/catalog/annotations/${fichaId}/review`,
        { decision: 'APPROVED', expectedRevisionNo: 3 },
      ).expect(403);
      expect(propia.body.code).toBe('FORBIDDEN');
      expect(propia.body.details.violations[0]).toMatchObject({
        reason: 'SELF_REVIEW',
      });
    });

    it('el revisor no aprueba sin evidencia (422), ni con una revisión vieja (409), ni rechaza sin motivo (422)', async () => {
      const otroAdmin = admin(revisor);
      const sinEvidencia = await post(
        `/admin/catalog/annotations/${fichaId}/review`,
        { decision: 'APPROVED', expectedRevisionNo: 3 },
        otroAdmin,
      ).expect(422);
      expect(sinEvidencia.body.code).toBe('PRECONDITION_FAILED');
      const vieja = await post(
        `/admin/catalog/annotations/${fichaId}/review`,
        { decision: 'APPROVED', expectedRevisionNo: 2 },
        otroAdmin,
      ).expect(409);
      expect(vieja.body.code).toBe('CONCURRENCY_CONFLICT');
      const sinMotivo = await post(
        `/admin/catalog/annotations/${fichaId}/review`,
        { decision: 'REJECTED', expectedRevisionNo: 3, comment: 'no' },
        otroAdmin,
      ).expect(422);
      expect(sinMotivo.body.code).toBe('VALIDATION_FAILED');
      await post(
        `/admin/catalog/annotations/${randomUUID()}/review`,
        { decision: 'APPROVED', expectedRevisionNo: 1 },
        otroAdmin,
      ).expect(404);
    });

    it('evidencia: se enlaza (201), se lista, y se valida', async () => {
      const mala = await post(`/admin/catalog/objects/${objetoId}/evidence`, {
        kind: 'INVENTADA',
        reference: 'docs/x.md',
      }).expect(400);
      expect(mala.body.code).toBeDefined();
      await post(`/admin/catalog/objects/${objetoId}/evidence`, {
        kind: 'DOCUMENT',
        reference: 'x',
      }).expect(400);
      const ok = await post(`/admin/catalog/objects/${objetoId}/evidence`, {
        kind: 'CODE_REFERENCE',
        reference:
          'src/modules/data_catalog/repositories/catalog.repository.ts',
        excerpt: 'insert into data_catalog.catalog_evidence_items',
      }).expect(201);
      expect(ok.body).toMatchObject({
        kind: 'CODE_REFERENCE',
        addedByUserId: autor,
      });
      const lista = await get(
        `/admin/catalog/objects/${objetoId}/evidence`,
      ).expect(200);
      expect(lista.body).toHaveLength(1);
      await post(`/admin/catalog/objects/${randomUUID()}/evidence`, {
        kind: 'DOCUMENT',
        reference: 'docs/x.md',
      }).expect(404);
    });

    it('el revisor aprueba con evidencia: la aprobación es de la revisión vigente y cuenta en la cobertura', async () => {
      const antes = (await get('/admin/catalog/coverage').expect(200)).body
        .dimensions.review.covered;
      const res = await post(
        `/admin/catalog/annotations/${fichaId}/review`,
        { decision: 'APPROVED', expectedRevisionNo: 3 },
        admin(revisor),
      ).expect(200);
      expect(res.body).toMatchObject({
        reviewStatus: 'APPROVED',
        approvedRevisionNo: 3,
        approvalIsCurrent: true,
      });
      const despues = (await get('/admin/catalog/coverage').expect(200)).body
        .dimensions.review.covered;
      expect(despues).toBe(antes + 1);
      const detalle = await get(`/admin/catalog/objects/${objetoId}`).expect(
        200,
      );
      expect(detalle.body.coverage).toMatchObject({
        semantic: 'COMPLETE',
        ownership: 'COMPLETE',
        sensitivity: 'KNOWN',
        review: 'APPROVED_CURRENT',
      });
      expect(detalle.body.evidenceCount).toBe(1);
      // decidir dos veces la misma revisión no es posible: ya no está en revisión
      await post(
        `/admin/catalog/annotations/${fichaId}/review`,
        { decision: 'APPROVED', expectedRevisionNo: 3 },
        admin(revisor),
      ).expect(422);
    });

    it('editar una ficha aprobada la devuelve a borrador y la aprobación deja de ser vigente', async () => {
      const ficha = (
        await get(`/admin/catalog/objects/${objetoId}`).expect(200)
      ).body.annotation;
      const res = await put(`/admin/catalog/objects/${objetoId}/annotation`, {
        expectedVersion: ficha.version,
        unit: 'filas',
        changeReason: 'Se agrega la unidad',
      }).expect(200);
      expect(res.body).toMatchObject({
        reviewStatus: 'DRAFT',
        approvedRevisionNo: 3,
        approvalIsCurrent: false,
        currentRevisionNo: 4,
      });
      const detalle = await get(`/admin/catalog/objects/${objetoId}`).expect(
        200,
      );
      expect(detalle.body.coverage.review).toBe('NOT_APPROVED');
    });

    it('el historial deja cada revisión y la decisión, de la más reciente a la más antigua', async () => {
      const res = await get(
        `/admin/catalog/objects/${objetoId}/history`,
      ).expect(200);
      expect(res.body.revisions[0].createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/,
      );
      expect(res.body.decisions[0].decidedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/,
      );
      expect(res.body.annotation.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/,
      );
      expect(
        res.body.revisions.map((r: { revisionNo: number }) => r.revisionNo),
      ).toEqual([4, 3, 2, 1]);
      expect(
        res.body.revisions.find(
          (r: { revisionNo: number }) => r.revisionNo === 3,
        ),
      ).toMatchObject({
        authorUserId: autor,
        changeReason: 'Primera versión completa',
        submittedStatus: 'NEEDS_REVIEW',
      });
      expect(res.body.decisions).toEqual([
        expect.objectContaining({
          revisionNo: 3,
          decision: 'APPROVED',
          reviewerUserId: revisor,
        }),
      ]);
    });
  });
});
