import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { MikroORM, EntityManager, defineConfig } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../src/common/auth/auth-token.module';
import { JwtAuthGuard } from '../../src/common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../src/common/auth/jwt.strategy';
import { RolesGuard } from '../../src/common/auth/roles.guard';
import { SessionValidator } from '../../src/common/auth/session-validator';
import { TokenService } from '../../src/common/auth/token.service';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { INVENTARIO_DIR_ENV } from '../../src/modules/data_catalog/data_catalog.constants';
import { InternalCatalogInventoryController } from '../../src/modules/data_catalog/controllers/internal-catalog.controller';
import { InventoryRepository } from '../../src/modules/data_catalog/inventory/inventory.repository';
import { CatalogInventoryRepository } from '../../src/modules/data_catalog/repositories/catalog-inventory.repository';
import { CatalogRepository } from '../../src/modules/data_catalog/repositories/catalog.repository';
import { CatalogClassificationService } from '../../src/modules/data_catalog/services/catalog-classification.service';
import { CatalogScanService } from '../../src/modules/data_catalog/services/catalog-scan.service';
import { InventoryImportService } from '../../src/modules/data_catalog/services/inventory-import.service';
import { TracingService } from '../../src/observability';

/**
 * `POST /internal/catalog/inventory/import` contra PostgreSQL real: el escaneo lee el
 * `pg_catalog` de verdad, los impactos se resuelven contra `catalog_objects`, y la idempotencia la
 * prueban los `row_version` de las filas, no un contador.
 *
 * El inventario es sintético (una carpeta temporal en `INVENTARIO_DIR`) y con claves propias de la
 * prueba, así que se limpia exactamente lo que se creó y no se toca lo que ya hubiera importado
 * un despliegue. Requiere el esquema `data_catalog` con el parche v4.2.48 aplicado.
 */
describe('Importación del inventario /internal/catalog/inventory/import (DB real)', () => {
  let orm: MikroORM;
  let app: INestApplication;
  let tokens: TokenService;
  let scans: CatalogScanService;
  let inventario: InventoryRepository;
  let dir: string;
  const previoDir = process.env[INVENTARIO_DIR_ENV];
  const sistema = randomUUID();
  const sufijo = randomUUID().slice(0, 8);
  const tabla = `zz_inv_it_${sufijo}`;
  const clave = (n: string): string => `zz_it_${sufijo}_${n}`;
  const proceso = `zz_it_${sufijo}_proc`;

  const as = (roles: string[]): Record<string, string> => ({
    Authorization: `Bearer ${tokens.signAccessToken(sistema, `s-${sistema}`, roles)}`,
  });
  const importar = (roles = ['SYSTEM']) =>
    request(app.getHttpServer())
      .post('/internal/catalog/inventory/import')
      .set(as(roles))
      .send({});
  const sql = <T = unknown>(consulta: string, params: unknown[] = []) =>
    orm.em
      .getConnection()
      .execute(consulta, params as never[], 'all') as Promise<T>;

  const operacion = (n: string, tablas: object[], extra: object = {}) => ({
    id: clave(n),
    origen: 'CONTRATO',
    metodo: 'GET',
    ruta: `/zz/${sufijo}/${n}`,
    modulo: 'zz',
    codigo: {
      controlador: 'ZzController',
      handler: n,
      fuente: `src/zz.ts:${n}`,
    },
    autenticacion: {
      publica: false,
      roles: ['ADMIN'],
      identidadVerificada: true,
    },
    riesgo: { nivel: 'BAJO', razones: [] },
    tablas,
    ...extra,
  });
  const toca = (t: string, schema = 'public', catalogada = true) => ({
    schema,
    tabla: t,
    catalogada,
    operacion: 'LEE',
    detalle: 'lee',
    confianza: 'DIRECTA',
    via: ['Zz.lee'],
    fuente: 'src/zz.ts:1',
  });

  /** Escribe el inventario sintético; `ops` y `procesos` reemplazan lo anterior. */
  function escribirInventario(ops: object[], procesos: object[]): void {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(join(dir, 'endpoints'), { recursive: true });
    mkdirSync(join(dir, 'catalogo'), { recursive: true });
    mkdirSync(join(dir, 'flujos'), { recursive: true });
    writeFileSync(
      join(dir, 'endpoints', 'indice.json'),
      JSON.stringify({ resumen: { total: ops.length }, endpoints: [] }),
    );
    writeFileSync(join(dir, 'endpoints', 'zz.json'), JSON.stringify(ops));
    writeFileSync(
      join(dir, 'catalogo', 'indice.json'),
      JSON.stringify({ resumen: { tablas: 0, columnas: 0 }, tablas: [] }),
    );
    writeFileSync(join(dir, 'flujos', 'hallazgos.json'), '[]');
    writeFileSync(
      join(dir, 'flujos', 'procesos.json'),
      JSON.stringify(procesos),
    );
    // el repositorio guarda lo que lee; sin esto la corrida siguiente vería el inventario anterior
    inventario?.reset();
  }

  const etapa = (
    codigo: string,
    ops: string[],
    nombre = `Etapa ${codigo}`,
  ) => ({
    codigo,
    nombre,
    fuente: null,
    operaciones: ops.map((operacionId) => ({ operacionId })),
  });
  const procesoCon = (etapas: object[]) => ({
    codigo: proceso,
    tipo: 'CRITICO',
    nombre: 'Proceso de prueba',
    modulo: 'zz',
    paraQueSirve: { texto: 'probar la importación', fuente: null },
    etapas,
  });

  const filas = async (nombre: string): Promise<number> =>
    Number(
      (
        await sql<{ n: string }[]>(
          `select count(*)::text as n from data_catalog.${nombre} ${DE_LA_PRUEBA[nombre]}`,
          [],
        )
      )[0].n,
    );
  // cada tabla se filtra por lo que la prueba creó, sin mirar lo que ya hubiera
  const DE_LA_PRUEBA: Record<string, string> = {};

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'inventario-it-'));
    process.env[INVENTARIO_DIR_ENV] = dir;
    DE_LA_PRUEBA.catalog_operations = `where operation_key like 'zz_it_${sufijo}_%'`;
    DE_LA_PRUEBA.catalog_operation_impacts = `where operation_id in (select id from data_catalog.catalog_operations where operation_key like 'zz_it_${sufijo}_%')`;
    DE_LA_PRUEBA.catalog_processes = `where process_code = '${proceso}'`;
    DE_LA_PRUEBA.catalog_process_steps = `where process_id in (select id from data_catalog.catalog_processes where process_code = '${proceso}')`;
    DE_LA_PRUEBA.catalog_process_step_operations = `where step_id in (select s.id from data_catalog.catalog_process_steps s join data_catalog.catalog_processes p on p.id = s.process_id where p.process_code = '${proceso}')`;

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
      await tx.getConnection().execute(
        `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at, row_version)
         values (?, ?, ?, now(), now(), 1)`,
        [sistema, concepto?.id ?? randomUUID(), `it-${sistema.slice(0, 8)}`],
        'run',
        ctx,
      );
    });
    await sql(`create table public.${tabla} (id int primary key)`);

    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [InternalCatalogInventoryController],
      providers: [
        { provide: EntityManager, useValue: orm.em },
        InventoryRepository,
        CatalogRepository,
        CatalogInventoryRepository,
        CatalogClassificationService,
        CatalogScanService,
        InventoryImportService,
        JwtStrategy,
        {
          provide: SessionValidator,
          useValue: { assertActive: async () => undefined },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
        {
          provide: PinoLogger,
          useValue: {
            setContext: () => undefined,
            warn: () => undefined,
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
    inventario = modulo.get(InventoryRepository);
  });

  afterAll(async () => {
    await scans?.drain();
    await app?.close();
    // en orden de dependencias, sólo lo de la prueba
    for (const nombre of [
      'catalog_process_step_operations',
      'catalog_process_steps',
      'catalog_operation_impacts',
    ])
      await sql(
        `delete from data_catalog.${nombre} ${DE_LA_PRUEBA[nombre]}`,
      ).catch(() => undefined);
    await sql(
      `delete from data_catalog.catalog_processes ${DE_LA_PRUEBA.catalog_processes}`,
    ).catch(() => undefined);
    await sql(
      `delete from data_catalog.catalog_operations ${DE_LA_PRUEBA.catalog_operations}`,
    ).catch(() => undefined);
    // lo observado queda, sin apuntar al usuario que se va
    for (const [t, c] of [
      ['catalog_objects', 'created_by_user_id'],
      ['catalog_objects', 'updated_by_user_id'],
      ['catalog_columns', 'created_by_user_id'],
      ['catalog_columns', 'updated_by_user_id'],
      ['catalog_scan_runs', 'requested_by_user_id'],
      ['catalog_scan_runs', 'created_by_user_id'],
      ['catalog_scan_runs', 'updated_by_user_id'],
    ])
      await sql(
        `update data_catalog.${t} set ${c} = null where ${c} = '${sistema}'`,
      ).catch(() => undefined);
    await sql(`drop table if exists public.${tabla}`);
    await sql(`delete from iam.users where id = '${sistema}'`);
    await orm?.close(true);
    rmSync(dir, { recursive: true, force: true });
    if (previoDir === undefined) delete process.env[INVENTARIO_DIR_ENV];
    else process.env[INVENTARIO_DIR_ENV] = previoDir;
  });

  describe('autorización', () => {
    it('sin token responde 401', async () => {
      await request(app.getHttpServer())
        .post('/internal/catalog/inventory/import')
        .send({})
        .expect(401);
    });

    it.each([['GOVERNANCE_ADMIN'], ['PLATFORM_ADMIN'], ['SECURITY_ADMIN']])(
      'el rol humano %s recibe 403: es plomería del worker',
      async (rol) => {
        await importar([rol]).expect(403);
      },
    );
  });

  describe('sin inventario', () => {
    it('responde 503 con lo que falta y no escribe nada', async () => {
      rmSync(dir, { recursive: true, force: true });
      inventario.reset();
      const res = await importar().expect(503);
      expect(JSON.stringify(res.body)).toContain('inventario');
      expect(await filas('catalog_operations')).toBe(0);
    });
  });

  describe('antes del primer escaneo de la tabla', () => {
    it('importa operaciones y procesos, salta los impactos sin objeto y no falla', async () => {
      escribirInventario(
        [
          operacion('a', [toca(tabla), toca('no_catalogada', 'public', false)]),
          operacion('b', [toca(tabla)]),
        ],
        [procesoCon([etapa('e1', [clave('a'), clave('b')])])],
      );
      const res = await importar().expect(200);
      expect(res.body.operations).toEqual(
        expect.objectContaining({ added: 2, unchanged: 0 }),
      );
      expect(res.body.impacts).toEqual({
        written: 0,
        skippedNotCataloged: 1,
        skippedUnresolved: 2,
      });
      expect(await filas('catalog_operations')).toBe(2);
      expect(await filas('catalog_operation_impacts')).toBe(0);
      expect(await filas('catalog_processes')).toBe(1);
      expect(await filas('catalog_process_steps')).toBe(1);
      expect(await filas('catalog_process_step_operations')).toBe(2);
    });
  });

  describe('después de un escaneo', () => {
    it('recupera los impactos que se habían saltado', async () => {
      const idem = `it-${randomUUID()}`;
      await scans.request(sistema, idem);
      await scans.drain();
      const res = await importar().expect(200);
      expect(res.body.operations).toEqual(
        expect.objectContaining({ changed: 2, unchanged: 0, added: 0 }),
      );
      expect(res.body.impacts.written).toBe(2);
      expect(res.body.impacts.skippedUnresolved).toBe(0);
      expect(await filas('catalog_operation_impacts')).toBe(2);
      // cada impacto apunta al objeto que la sonda observó para la tabla de la prueba
      const apuntan = await sql<{ n: string }[]>(
        `select count(*)::text as n
           from data_catalog.catalog_operation_impacts i
           join data_catalog.catalog_objects o on o.id = i.object_id
          where o.schema_name = 'public' and o.object_name = '${tabla}'
            and i.operation_id in (select id from data_catalog.catalog_operations where operation_key like 'zz_it_${sufijo}_%')`,
      );
      expect(Number(apuntan[0].n)).toBe(2);
    });

    it('una segunda corrida con el mismo inventario no toca ninguna fila', async () => {
      const antes = await sql<{ row_version: number; updated_at: string }[]>(
        `select row_version, updated_at from data_catalog.catalog_operations ${DE_LA_PRUEBA.catalog_operations} order by operation_key`,
      );
      const res = await importar().expect(200);
      expect(res.body.operations).toEqual({
        added: 0,
        changed: 0,
        reappeared: 0,
        unchanged: 2,
        notObserved: 0,
      });
      expect(res.body.impacts.written).toBe(0);
      expect(res.body.steps.written).toBe(0);
      expect(res.body.processes).toEqual({
        added: 0,
        changed: 0,
        unchanged: 1,
      });
      const despues = await sql<{ row_version: number; updated_at: string }[]>(
        `select row_version, updated_at from data_catalog.catalog_operations ${DE_LA_PRUEBA.catalog_operations} order by operation_key`,
      );
      expect(despues).toEqual(antes);
    });

    it('dos importaciones a la vez dejan las mismas filas (las serializa el candado)', async () => {
      const [a, b] = await Promise.all([importar(), importar()]);
      expect([a.status, b.status]).toEqual([200, 200]);
      expect(await filas('catalog_operations')).toBe(2);
      expect(await filas('catalog_operation_impacts')).toBe(2);
      expect(await filas('catalog_process_step_operations')).toBe(2);
    });

    it('una operación que cambia se actualiza y sube su row_version; la otra no', async () => {
      const [{ v: antes }] = await sql<{ v: number }[]>(
        `select row_version as v from data_catalog.catalog_operations where operation_key = '${clave('b')}'`,
      );
      escribirInventario(
        [
          operacion('a', [toca(tabla)], {
            riesgo: { nivel: 'ALTO', razones: [] },
          }),
          operacion('b', [toca(tabla)]),
        ],
        [procesoCon([etapa('e1', [clave('a'), clave('b')])])],
      );
      const res = await importar().expect(200);
      expect(res.body.operations).toEqual(
        expect.objectContaining({ changed: 1, unchanged: 1 }),
      );
      const [a] = await sql<{ risk_level: string; row_version: number }[]>(
        `select risk_level, row_version from data_catalog.catalog_operations where operation_key = '${clave('a')}'`,
      );
      expect(a.risk_level).toBe('ALTO');
      const [{ v: despues }] = await sql<{ v: number }[]>(
        `select row_version as v from data_catalog.catalog_operations where operation_key = '${clave('b')}'`,
      );
      expect(despues).toBe(antes);
      // los impactos de la operación cambiada se reemplazaron, no se duplicaron
      expect(await filas('catalog_operation_impacts')).toBe(2);
    });

    it('una operación que deja de aparecer queda NOT_OBSERVED y no se borra', async () => {
      escribirInventario(
        [
          operacion('a', [toca(tabla)], {
            riesgo: { nivel: 'ALTO', razones: [] },
          }),
        ],
        [procesoCon([etapa('e1', [clave('a')])])],
      );
      const res = await importar().expect(200);
      expect(res.body.operations.notObserved).toBe(1);
      const [b] = await sql<{ observation_status: string }[]>(
        `select observation_status from data_catalog.catalog_operations where operation_key = '${clave('b')}'`,
      );
      expect(b.observation_status).toBe('NOT_OBSERVED');
      expect(await filas('catalog_operations')).toBe(2);
      // el puente de la etapa rehecha ya no apunta a la que dejó de aparecer
      expect(await filas('catalog_process_step_operations')).toBe(1);
    });

    it('cuando vuelve a aparecer, vuelve a OBSERVED', async () => {
      escribirInventario(
        [
          operacion('a', [toca(tabla)], {
            riesgo: { nivel: 'ALTO', razones: [] },
          }),
          operacion('b', [toca(tabla)]),
        ],
        [procesoCon([etapa('e1', [clave('a'), clave('b')])])],
      );
      const res = await importar().expect(200);
      expect(res.body.operations.reappeared).toBe(1);
      const [b] = await sql<{ observation_status: string }[]>(
        `select observation_status from data_catalog.catalog_operations where operation_key = '${clave('b')}'`,
      );
      expect(b.observation_status).toBe('OBSERVED');
    });
  });

  describe('atomicidad', () => {
    it('una clave de operación repetida choca con el índice único y responde 409', async () => {
      const antes = await filas('catalog_operations');
      escribirInventario(
        [operacion('c', [toca(tabla)]), operacion('c', [toca(tabla)])],
        [],
      );
      await importar().expect(409);
      expect(await filas('catalog_operations')).toBe(antes);
    });

    it('un fallo tardío revierte lo ya escrito en las sentencias anteriores', async () => {
      const antes = {
        operaciones: await filas('catalog_operations'),
        etapas: await filas('catalog_process_steps'),
        puentes: await filas('catalog_process_step_operations'),
      };
      // CHECK temporal y específico de esta prueba: hace fallar `insertSteps`, que corre después de
      // haber insertado la operación nueva y borrado las etapas viejas. NOT VALID: no recorre la tabla.
      const boom = `zz_it_${sufijo}_boom`;
      await sql(
        `alter table data_catalog.catalog_process_steps add constraint ${boom} check (name <> 'BOOM-${sufijo}') not valid`,
      );
      try {
        escribirInventario(
          [
            operacion('a', [toca(tabla)], {
              riesgo: { nivel: 'ALTO', razones: [] },
            }),
            operacion('b', [toca(tabla)]),
            operacion('d', [toca(tabla)]),
          ],
          [
            procesoCon([
              etapa('e1', [clave('a'), clave('b')]),
              etapa('e2', [clave('d')], `BOOM-${sufijo}`),
            ]),
          ],
        );
        const res = await importar();
        expect(res.status).toBeGreaterThanOrEqual(400);
      } finally {
        await sql(
          `alter table data_catalog.catalog_process_steps drop constraint if exists ${boom}`,
        );
      }
      // la operación nueva se insertó antes de que fallara la importación: no puede haber quedado
      const [d] = await sql<{ n: string }[]>(
        `select count(*)::text as n from data_catalog.catalog_operations where operation_key = '${clave('d')}'`,
      );
      expect(Number(d.n)).toBe(0);
      expect({
        operaciones: await filas('catalog_operations'),
        etapas: await filas('catalog_process_steps'),
        puentes: await filas('catalog_process_step_operations'),
      }).toEqual(antes);
    });
  });
});
