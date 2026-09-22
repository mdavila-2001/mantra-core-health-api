import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as entities from '../../src/modules/data_catalog/entities';
import { PostgresIntrospector } from '../../src/modules/data_catalog/infrastructure/postgres-introspector';
import {
  CatalogQueryRepository,
  CatalogScanRepository,
} from '../../src/modules/data_catalog/repositories';
import {
  CatalogAnnotationsService,
  CatalogQueryService,
  CatalogScanService,
} from '../../src/modules/data_catalog/services';
import type { AuthenticatedUser } from '../../src/common';

/**
 * Catálogo de datos (módulo 67) contra PostgreSQL real, sin mocks de base.
 *
 * Opt-in: `DATA_CATALOG_IT_DB_URL` debe apuntar a una base DESECHABLE (la
 * prueba crea schemas de fixtures, aplica el patch v4.2.19 y altera tablas).
 * Nunca a una base compartida. Sin la variable la suite se omite, y una
 * omisión no es un resultado aprobado.
 *
 * No arranca `AppModule` (en máquinas donde el binario nativo de argon2 está
 * bloqueado no se puede): monta sólo lo que el módulo usa, con el patch SQL
 * real, que es justamente lo que se quiere verificar.
 *
 *   docker run -d --name dcat-it-pg -e POSTGRES_USER=dcat -e POSTGRES_PASSWORD=dcat \
 *     -e POSTGRES_DB=dcat -p 55439:5432 postgres:17-alpine
 *   DATA_CATALOG_IT_DB_URL=postgres://dcat:dcat@localhost:55439/dcat \
 *     yarn test:integration test/integration/data-catalog.int-spec.ts
 */
const DB_URL = process.env.DATA_CATALOG_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;

// La suite corre como ESM (sin __dirname) y con rootDir en la raíz del repo.
const PATCH = join(
  process.cwd(),
  'database/SQL/patches/2026-09-18_v4219_data_catalog.sql',
);

const author: AuthenticatedUser = {
  id: randomUUID(),
  roles: ['GOVERNANCE_ADMIN'],
};
const reviewer: AuthenticatedUser = { id: randomUUID(), roles: ['DPO'] };
const operator: AuthenticatedUser = {
  id: randomUUID(),
  roles: ['DATA_PLATFORM_ADMIN'],
};

const RATIONALE =
  'Sin esta tabla no se puede reconstruir qué pedido originó cada cobro cuando un cliente disputa un cargo.';
const GRAIN = 'Una fila por pedido confirmado, identificada por (id, region).';

const silentLogger = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
} as never;

/** Estado HTTP de una excepción de dominio, o de lo que sea que se lanzó. */
async function statusOf(promise: Promise<unknown>): Promise<number | string> {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    const e = error as { getStatus?: () => number; message?: string };
    return e.getStatus?.() ?? `threw: ${e.message}`;
  }
}

describeIfDb('Catálogo de datos (integración, PostgreSQL real)', () => {
  let orm: MikroORM;
  let client: pg.Client;
  let scans: CatalogScanService;
  let annotations: CatalogAnnotationsService;
  let query: CatalogQueryService;
  let scanRepo: CatalogScanRepository;

  const sql = (text: string) => client.query(text);

  async function runScan(): Promise<string> {
    const { scan } = await scans.request(operator, undefined);
    const result = await scans.runNext('it-worker');
    expect(result).toMatchObject({
      claimed: 1,
      scanId: scan.id,
      status: 'SUCCEEDED',
    });
    return scan.id;
  }

  async function objectId(schema: string, name: string): Promise<string> {
    const page = await query.listObjects({ schema, q: name, limit: 100 });
    const found = page.items.find((item) => item.objectName === name);
    if (!found) throw new Error(`${schema}.${name} no está en el catálogo`);
    return found.id;
  }

  beforeAll(async () => {
    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    // Base desechable: se reconstruye todo lo que la prueba toca.
    await sql(`
      DROP SCHEMA IF EXISTS data_catalog, fx_sales, fx_archive, iam, system_ops CASCADE;
      CREATE SCHEMA iam;
      CREATE TABLE iam.users (id uuid PRIMARY KEY);
      CREATE SCHEMA system_ops;
      CREATE TABLE system_ops.entity_registry (
        id uuid PRIMARY KEY, schema_name varchar NOT NULL, table_name varchar NOT NULL,
        owner_team varchar, contains_pii boolean, contains_phi boolean,
        is_append_only boolean NOT NULL DEFAULT false, is_soft_delete boolean NOT NULL DEFAULT false,
        has_history boolean NOT NULL DEFAULT false, retention_policy_id uuid, write_policy_id uuid);
    `);
    await sql(readFileSync(PATCH, 'utf8'));
    await sql(`
      INSERT INTO iam.users (id) VALUES ('${author.id}'), ('${reviewer.id}'), ('${operator.id}');
      INSERT INTO system_ops.entity_registry (id, schema_name, table_name, owner_team, contains_pii)
        VALUES ('${randomUUID()}', 'fx_sales', 'orders', 'Ventas', true);

      CREATE SCHEMA fx_sales;
      CREATE TABLE fx_sales.orders (
        id uuid NOT NULL, region varchar(8) NOT NULL, total numeric(12,2),
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (id, region));
      COMMENT ON TABLE fx_sales.orders IS 'Pedidos confirmados';
      CREATE TABLE fx_sales.order_lines (
        id uuid PRIMARY KEY, order_id uuid NOT NULL, order_region varchar(8) NOT NULL,
        sku varchar NOT NULL,
        CONSTRAINT fk_lines_order FOREIGN KEY (order_id, order_region)
          REFERENCES fx_sales.orders (id, region));
      CREATE UNIQUE INDEX ux_lines_sku_partial ON fx_sales.order_lines (sku) WHERE sku <> '';
      CREATE VIEW fx_sales.v_open_orders AS SELECT id, region FROM fx_sales.orders;
      CREATE TABLE fx_sales.events (id bigint, at date NOT NULL) PARTITION BY RANGE (at);
      CREATE TABLE fx_sales.events_2026 PARTITION OF fx_sales.events
        FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

      CREATE SCHEMA fx_archive;
      CREATE TABLE fx_archive.orders (id uuid PRIMARY KEY);
    `);

    orm = await MikroORM.init({
      clientUrl: DB_URL,
      entities: Object.values(entities),
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      forceUtcTimezone: true,
      allowGlobalContext: true,
      debug: false,
    });
    const em = orm.em.fork();
    scanRepo = new CatalogScanRepository();
    const queryRepo = new CatalogQueryRepository(em);
    scans = new CatalogScanService(
      em,
      scanRepo,
      new PostgresIntrospector(em),
      silentLogger,
    );
    annotations = new CatalogAnnotationsService(em, silentLogger);
    query = new CatalogQueryService(em, queryRepo);
  }, 120_000);

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
  });

  describe('descubrimiento técnico', () => {
    it('sin ningún escaneo, la cobertura es UNKNOWN y no 0%', async () => {
      const coverage = await query.coverage();
      expect(coverage.lastScan).toBeNull();
      expect(coverage.dimensions.semantic).toMatchObject({
        status: 'UNKNOWN',
        ratio: null,
      });
    });

    it('acepta un escaneo, rechaza uno paralelo y respeta la idempotencia', async () => {
      const first = await scans.request(operator, 'key-1');
      expect(first).toMatchObject({
        created: true,
        scan: { status: 'QUEUED' },
      });
      expect(await statusOf(scans.request(operator, undefined))).toBe(409);
      const again = await scans.request(operator, 'key-1');
      expect(again).toMatchObject({
        created: false,
        scan: { id: first.scan.id },
      });
    });

    it('el worker lo ejecuta y cataloga la estructura real', async () => {
      const result = await scans.runNext('it-worker');
      expect(result).toMatchObject({ claimed: 1, status: 'SUCCEEDED' });
      const scan = await query.getScan(result.scanId!);
      expect(scan.counters!.objectsAdded).toBe(scan.counters!.objectsObserved);
      expect(scan.snapshotHash).toMatch(/^[0-9a-f]{64}$/);
      expect(scan.limitations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'PARTITIONS_FOLDED', count: 1 }),
        ]),
      );
    });

    it('distingue el mismo nombre en dos schemas, vistas y tablas particionadas', async () => {
      const sales = await query.listObjects({ schema: 'fx_sales', limit: 100 });
      const byName = new Map(
        sales.items.map((item) => [item.objectName, item]),
      );
      expect([...byName.keys()].sort()).toEqual([
        'events',
        'order_lines',
        'orders',
        'v_open_orders',
      ]);
      expect(byName.get('v_open_orders')!.objectKind).toBe('VIEW');
      expect(byName.get('events')!.objectKind).toBe('PARTITIONED_TABLE');
      expect(await objectId('fx_archive', 'orders')).not.toBe(
        byName.get('orders')!.id,
      );
    });

    it('registra PK compuesta, FK compuesta, comentario y nulabilidad', async () => {
      const orders = await query.getObject(
        await objectId('fx_sales', 'orders'),
      );
      expect(orders.technical).toMatchObject({
        comment: 'Pedidos confirmados',
        primaryKey: ['id', 'region'],
      });
      expect(orders.governance).toMatchObject({
        ownerTeam: 'Ventas',
        containsPii: true,
      });

      const lines = await query.listColumns(
        await objectId('fx_sales', 'order_lines'),
      );
      const orderId = lines.items.find((c) => c.columnName === 'order_id')!;
      expect(orderId.foreignKey).toEqual({
        constraintName: 'fk_lines_order',
        sourceColumns: ['order_id', 'order_region'],
        targetSchema: 'fx_sales',
        targetTable: 'orders',
        targetColumns: ['id', 'region'],
      });
      // Un índice único PARCIAL no hace única a la columna.
      expect(lines.items.find((c) => c.columnName === 'sku')!.isUnique).toBe(
        false,
      );
      const total = (await query.listColumns(orders.id)).items.find(
        (c) => c.columnName === 'total',
      )!;
      expect(total).toMatchObject({
        nativeType: 'numeric(12,2)',
        isNullable: true,
      });
    });

    it('el impacto sigue la FK compuesta en las dos direcciones', async () => {
      const orders = await objectId('fx_sales', 'orders');
      const lines = await objectId('fx_sales', 'order_lines');
      const downstream = await query.impact(orders, 'downstream', 2);
      expect(downstream.nodes.map((n) => [n.objectName, n.depth])).toEqual([
        ['orders', 0],
        ['order_lines', 1],
      ]);
      expect(downstream.edges).toEqual([
        expect.objectContaining({
          constraintName: 'fk_lines_order',
          fromColumns: ['order_id', 'order_region'],
          toColumns: ['id', 'region'],
          provenance: 'STRUCTURAL_FK_OBSERVED',
        }),
      ]);
      const upstream = await query.impact(lines, 'upstream', 2);
      expect(upstream.nodes.map((n) => n.objectName).sort()).toEqual([
        'order_lines',
        'orders',
      ]);
      expect((await query.impact(lines, 'downstream', 2)).nodes).toHaveLength(
        1,
      );
    });

    it('un segundo escaneo idéntico no produce cambios ni duplicados', async () => {
      const before = await client.query(
        'SELECT count(*)::int AS n FROM data_catalog.catalog_objects',
      );
      const firstHash = (await query.listScans()).items[0].snapshotHash;
      const scanId = await runScan();
      const scan = await query.getScan(scanId);
      expect(scan.counters).toMatchObject({
        objectsAdded: 0,
        objectsChanged: 0,
        objectsNotObserved: 0,
        columnsAdded: 0,
        columnsChanged: 0,
      });
      expect(scan.snapshotHash).toBe(firstHash);
      const after = await client.query(
        'SELECT count(*)::int AS n FROM data_catalog.catalog_objects',
      );
      expect(after.rows[0].n).toBe(before.rows[0].n);
      expect((await query.listScanChanges(scanId)).items).toEqual([]);
    });
  });

  describe('ficha de justificación', () => {
    let ordersId: string;
    let annotationId: string;

    beforeAll(async () => {
      ordersId = await objectId('fx_sales', 'orders');
    });

    it('crea un borrador y protege contra el segundo escritor', async () => {
      const draft = await annotations.upsertForObject(
        ordersId,
        {
          expectedVersion: 0,
          purpose: 'Registrar el pedido que dispara el cobro y la entrega.',
        },
        author,
      );
      expect(draft).toMatchObject({
        reviewStatus: 'DRAFT',
        currentRevisionNo: 1,
        version: 1,
      });
      annotationId = draft.id;
      expect(
        await statusOf(
          annotations.upsertForObject(
            ordersId,
            { expectedVersion: 0, businessOwner: 'x' },
            author,
          ),
        ),
      ).toBe(409);
    });

    it('no deja enviar texto de relleno a revisión', async () => {
      expect(
        await statusOf(
          annotations.upsertForObject(
            ordersId,
            {
              expectedVersion: 1,
              submit: true,
              existenceRationale:
                'Almacena los datos de los pedidos del sistema',
              rowGrain: GRAIN,
            },
            author,
          ),
        ),
      ).toBe(422);
    });

    it('envía a revisión, y reenviar lo mismo no crea otra revisión', async () => {
      const submitted = await annotations.upsertForObject(
        ordersId,
        {
          expectedVersion: 1,
          submit: true,
          existenceRationale: RATIONALE,
          rowGrain: GRAIN,
          businessOwner: 'Gerencia comercial',
          sensitivity: 'PII',
        },
        author,
      );
      expect(submitted).toMatchObject({
        reviewStatus: 'NEEDS_REVIEW',
        currentRevisionNo: 2,
      });
      const again = await annotations.upsertForObject(
        ordersId,
        { expectedVersion: submitted.version, submit: true },
        author,
      );
      expect(again).toMatchObject({
        currentRevisionNo: 2,
        version: submitted.version,
      });
    });

    it('quien escribió la revisión no puede aprobarla', async () => {
      expect(
        await statusOf(
          annotations.review(
            annotationId,
            { decision: 'APPROVED', expectedRevisionNo: 2 },
            author,
          ),
        ),
      ).toBe(403);
    });

    it('no se aprueba sin evidencia; con evidencia sí', async () => {
      expect(
        await statusOf(
          annotations.review(
            annotationId,
            { decision: 'APPROVED', expectedRevisionNo: 2 },
            reviewer,
          ),
        ),
      ).toBe(422);
      await annotations.addEvidenceToObject(
        ordersId,
        {
          kind: 'MIGRATION',
          reference: 'database/SQL/patches/fx_sales_orders.sql',
          sourceRevision: 'abc123',
        },
        author,
      );
      const approved = await annotations.review(
        annotationId,
        { decision: 'APPROVED', expectedRevisionNo: 2 },
        reviewer,
      );
      expect(approved).toMatchObject({
        reviewStatus: 'APPROVED',
        approvedRevisionNo: 2,
        approvedByUserId: reviewer.id,
        approvalIsCurrent: true,
      });
    });

    it('editar lo aprobado abre una revisión nueva sin heredar la aprobación', async () => {
      const current = (await query.getObject(ordersId)).annotation!;
      const edited = await annotations.upsertForObject(
        ordersId,
        {
          expectedVersion: current.version,
          submit: true,
          technicalOwner: 'Equipo plataforma',
        },
        author,
      );
      expect(edited).toMatchObject({
        reviewStatus: 'NEEDS_REVIEW',
        currentRevisionNo: 3,
        approvedRevisionNo: 2,
        approvalIsCurrent: false,
      });
      // Decidir sobre la revisión vieja es un conflicto, no una aprobación.
      expect(
        await statusOf(
          annotations.review(
            annotationId,
            { decision: 'APPROVED', expectedRevisionNo: 2 },
            reviewer,
          ),
        ),
      ).toBe(409);
      expect(
        await statusOf(
          annotations.review(
            annotationId,
            { decision: 'REJECTED', expectedRevisionNo: 3 },
            reviewer,
          ),
        ),
      ).toBe(422);
      const history = await annotations.historyForObject(ordersId);
      expect(history.revisions.map((r) => r.revisionNo)).toEqual([3, 2, 1]);
      expect(history.decisions).toHaveLength(1);
    });

    it('la cobertura cuenta sobre los objetos observados, con denominador explícito', async () => {
      const coverage = await query.coverage('fx_sales');
      expect(coverage.denominator).toBe(4);
      expect(coverage.dimensions.semantic).toMatchObject({
        status: 'MEASURED',
        covered: 1,
        denominator: 4,
      });
      // Aprobada en rev 2 pero vigente la 3: no cuenta como revisada.
      expect(coverage.dimensions.review.covered).toBe(0);
    });
  });

  describe('cambios de estructura', () => {
    it('detecta altas, cambios, renombres y retiros sin borrar ni tocar la ficha', async () => {
      const ordersId = await objectId('fx_sales', 'orders');
      const annotationBefore = (await query.getObject(ordersId)).annotation;
      await sql(`
        ALTER TABLE fx_sales.orders ADD COLUMN currency char(3);
        ALTER TABLE fx_sales.orders ALTER COLUMN total TYPE numeric(14,2);
        ALTER TABLE fx_archive.orders RENAME TO orders_2019;
        DROP VIEW fx_sales.v_open_orders;
      `);
      const scanId = await runScan();
      const changes = (
        await query.listScanChanges(scanId, undefined, 100)
      ).items.map(
        (c) => `${c.changeKind} ${c.object}${c.column ? `.${c.column}` : ''}`,
      );
      expect(changes.sort()).toEqual(
        [
          'ADDED fx_archive.orders_2019',
          'ADDED fx_sales.orders.currency',
          'CHANGED fx_sales.orders',
          'CHANGED fx_sales.orders.total',
          'NOT_OBSERVED fx_archive.orders',
          'NOT_OBSERVED fx_sales.v_open_orders',
        ].sort(),
      );
      const archived = await query.listObjects({
        schema: 'fx_archive',
        observationStatus: 'NOT_OBSERVED',
        limit: 10,
      });
      expect(archived.items.map((item) => item.objectName)).toEqual(['orders']);
      expect((await query.getObject(ordersId)).annotation).toEqual(
        annotationBefore,
      );
    });

    it('lo que vuelve a aparecer se registra como REAPPEARED', async () => {
      await sql(
        'CREATE VIEW fx_sales.v_open_orders AS SELECT id, region FROM fx_sales.orders',
      );
      const scanId = await runScan();
      const changes = (await query.listScanChanges(scanId)).items;
      expect(changes).toEqual([
        expect.objectContaining({
          changeKind: 'REAPPEARED',
          object: 'fx_sales.v_open_orders',
        }),
      ]);
    });
  });

  describe('job durable', () => {
    it('cancelar en cola lo cierra y el worker ya no lo toma', async () => {
      const { scan } = await scans.request(operator, undefined);
      const cancelled = await scans.cancel(scan.id, operator);
      expect(cancelled.status).toBe('CANCELLED');
      expect(await scans.runNext('it-worker')).toEqual({ claimed: 0 });
      expect(await statusOf(scans.cancel(scan.id, operator))).toBe(409);
    });

    it('un lease vencido se recupera y el worker viejo queda fuera (fencing)', async () => {
      const { scan } = await scans.request(operator, undefined);
      const em = orm.em.fork();
      const claimed = await em.transactional((tx) =>
        scanRepo.claimNext(tx, 'dead-worker', 60_000),
      );
      expect(claimed).toMatchObject({ id: scan.id, attempt: 1 });
      // Con el lease vigente nadie más lo toma.
      expect(await scans.runNext('it-worker')).toEqual({ claimed: 0 });
      await sql(
        `UPDATE data_catalog.catalog_scan_runs SET lease_expires_at = now() - interval '1 second' WHERE id = '${scan.id}'`,
      );
      const recovered = await scans.runNext('it-worker');
      expect(recovered).toMatchObject({
        claimed: 1,
        scanId: scan.id,
        status: 'SUCCEEDED',
      });
      expect((await query.getScan(scan.id)).attempt).toBe(2);
      // El worker muerto intenta cerrar su corrida: su lease ya no vale.
      const stale = await (
        scans as unknown as {
          finish: (
            id: string,
            owner: string,
            status: string,
            error: object,
          ) => Promise<unknown>;
        }
      ).finish(scan.id, 'dead-worker', 'FAILED', {
        errorCode: 'X',
        errorMessage: 'x',
      });
      expect(stale).toBeNull();
      expect((await query.getScan(scan.id)).status).toBe('SUCCEEDED');
    });
  });

  describe('lecturas del portal', () => {
    it('pagina con cursor estable sin repetir ni saltar filas', async () => {
      const first = await query.listObjects({ schema: 'fx_sales', limit: 2 });
      expect(first.items).toHaveLength(2);
      expect(first.nextCursor).not.toBeNull();
      const second = await query.listObjects({
        schema: 'fx_sales',
        limit: 2,
        cursor: first.nextCursor!,
      });
      const all = [...first.items, ...second.items].map(
        (item) => item.objectName,
      );
      expect(new Set(all).size).toBe(all.length);
      expect(all).toEqual(['events', 'order_lines', 'orders', 'v_open_orders']);
    });

    it('un comodín del usuario se busca literal y una búsqueda vacía no es un error', async () => {
      const page = await query.listObjects({ q: '%', limit: 10 });
      expect(page).toEqual({ items: [], nextCursor: null, limit: 10 });
    });

    it('filtra lo que no tiene justificación', async () => {
      const missing = await query.listObjects({
        schema: 'fx_sales',
        missing: 'existenceRationale',
        limit: 10,
      });
      expect(missing.items.map((item) => item.objectName)).not.toContain(
        'orders',
      );
      expect(missing.items.length).toBe(3);
    });
  });
});
