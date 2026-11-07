import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import pg from 'pg';
import type { PinoLogger } from 'nestjs-pino';
import {
  BulkImportStatus,
  RowOutcome,
} from '../../src/modules/bulk_import/bulk-import.constants';
import { MikroBulkImportSqlRunner } from '../../src/modules/bulk_import/repositories/bulk-import-sql.port';
import { PostgresBatchRepository } from '../../src/modules/bulk_import/repositories/postgres-batch.repository';
import { exampleRow } from '../../src/modules/bulk_import/schema/field-schema';
import { findKindSchema } from '../../src/modules/bulk_import/schema/registry';
import { BulkImportProcessor } from '../../src/modules/bulk_import/services/bulk-import.processor';
import { BulkImportService } from '../../src/modules/bulk_import/services/bulk-import.service';
import { TemplateService } from '../../src/modules/bulk_import/services/template.service';
import { BulkImportValidationService } from '../../src/modules/bulk_import/services/validation.service';
import {
  FakeAccessPolicy,
  FakeAudit,
  FakeClinicalWriter,
  FakeCodeResolver,
  FakePatientResolver,
  FakeUserProvisioner,
} from '../../src/modules/bulk_import/testing/fakes';
import {
  RecordingLogger,
  TEST_ENGINE_STATUS,
} from '../../src/modules/bulk_import/testing/harness';

import { TENANT_A, TENANT_B, USER, batch } from './bulk-import-batch.fixture';
import { createScratchDb, type ScratchDb } from './bulk-import-scratch-db';

/**
 * Batch repository against REAL PostgreSQL.
 *
 * The suite creates its OWN throwaway database (`bulk_import_test_<hex>`) on the
 * server given by `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD` (a superuser or a
 * role with CREATEDB and CREATEROLE), applies the real patch
 * `database/SQL/patches/2026-10-31_v4281_cargas_masivas.sql` there, runs the
 * repository as a non-superuser role (FORCE RLS in effect) and drops both at the
 * end. It never runs DDL on the configured `DB_NAME`. Guards live in
 * `disposable-database.ts` (`assertOwnDisposableDatabase`, `assertServerIdentity`).
 *
 * Real: tables, FKs, CHECKs, unique confirm key, RLS, MikroORM runner. Stubs:
 * id-only prerequisites of the patch and the declared user/clinical fakes.
 */
describe('PostgresBatchRepository · PostgreSQL real', () => {
  let scratch: ScratchDb;
  let admin: pg.Pool;
  const orms: MikroORM[] = [];
  let repo: PostgresBatchRepository;

  async function newRepo(): Promise<PostgresBatchRepository> {
    const orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      clientUrl: scratch.appUrl,
      entities: [],
      discovery: { warnWhenNoEntities: false },
    });
    orms.push(orm);
    return new PostgresBatchRepository(
      new MikroBulkImportSqlRunner(orm.em as never),
    );
  }

  beforeAll(async () => {
    scratch = await createScratchDb();
    admin = scratch.admin;
    await admin.query('INSERT INTO directory.tenants VALUES ($1), ($2)', [
      TENANT_A,
      TENANT_B,
    ]);
    await admin.query('INSERT INTO iam.users VALUES ($1)', [USER]);
    repo = await newRepo();
  });

  afterAll(async () => {
    await Promise.all(orms.map((o) => o.close(true)));
    await scratch?.dispose();
  });

  const personalDataRows = async () =>
    Number(
      (
        await admin.query(
          `SELECT count(*)::int AS n FROM system_ops.bulk_import_batch_rows r
           JOIN system_ops.bulk_import_batches b ON b.id = r.batch_id
           WHERE b.status IN ('COMPLETADO','FALLIDO','RECHAZADO')
             AND (r.row_data_json IS NOT NULL OR r.row_key IS NOT NULL)`,
        )
      ).rows[0].n,
    );

  it('guarda y devuelve el lote completo, también desde otra instancia', async () => {
    const record = batch(TENANT_A);
    await repo.create(record);
    const other = await newRepo();
    const read = await other.findById(TENANT_A, record.id);
    expect(read).toMatchObject({
      id: record.id,
      status: 'VALIDADO',
      counts: record.counts,
      rows: record.rows,
      rejectedRows: record.rejectedRows,
      previewIssues: record.previewIssues,
      declaration: { reason: 'prueba' },
      source: record.source,
    });
    expect(read?.createdAt).toBe(record.createdAt);
    expect((await repo.list(TENANT_A, 10)).map((b) => b.id)).toContain(
      record.id,
    );
  });

  it('aísla por organización: el lote ajeno es indistinguible de uno inexistente', async () => {
    const record = batch(TENANT_A);
    await repo.create(record);
    expect(await repo.findById(TENANT_B, record.id)).toBeNull();
    expect((await repo.list(TENANT_B, 10)).length).toBe(0);
    expect(
      await repo.transition(
        TENANT_B,
        record.id,
        ['VALIDADO' as never],
        BulkImportStatus.QUEUED,
      ),
    ).toBeNull();
  });

  it('RLS: sin organización fijada el rol de la aplicación no ve filas', async () => {
    const app = new pg.Pool({ connectionString: scratch.appUrl });
    try {
      const { rows } = await app.query(
        'SELECT count(*)::int AS n FROM system_ops.bulk_import_batches',
      );
      expect(rows[0].n).toBe(0);
    } finally {
      await app.end();
    }
  });

  it('transition: de dos confirmaciones simultáneas sólo una gana', async () => {
    const record = batch(TENANT_A);
    await repo.create(record);
    const attempt = (key: string) =>
      repo.transition(
        TENANT_A,
        record.id,
        [BulkImportStatus.VALIDATED],
        BulkImportStatus.QUEUED,
        {
          confirmKey: key,
          confirmedAt: new Date().toISOString(),
          confirmedByUserId: USER,
        },
      );
    const results = await Promise.all([attempt('k-1'), attempt('k-2')]);
    expect(results.filter((r) => r !== null)).toHaveLength(1);
    const final = await repo.findById(TENANT_A, record.id);
    expect(final?.status).toBe('EN_COLA');
    expect(final?.confirmedByUserId).toBe(USER);
  });

  it('la clave de confirmación es única por organización, no global', async () => {
    const a1 = batch(TENANT_A);
    const a2 = batch(TENANT_A);
    const b1 = batch(TENANT_B);
    await Promise.all([repo.create(a1), repo.create(a2), repo.create(b1)]);
    const confirm = (t: string, id: string) =>
      repo.transition(
        t,
        id,
        [BulkImportStatus.VALIDATED],
        BulkImportStatus.QUEUED,
        {
          confirmKey: 'shared-key',
        },
      );
    expect(await confirm(TENANT_A, a1.id)).not.toBeNull();
    expect(await confirm(TENANT_A, a2.id)).toBeNull();
    expect((await repo.findById(TENANT_A, a2.id))?.status).toBe('VALIDADO');
    expect(await confirm(TENANT_B, b1.id)).not.toBeNull();
    expect((await repo.findByConfirmKey(TENANT_A, 'shared-key'))?.id).toBe(
      a1.id,
    );
  });

  it('recordProgress sólo cuenta mientras el lote está PROCESANDO', async () => {
    const record = batch(TENANT_A);
    await repo.create(record);
    await repo.recordProgress(TENANT_A, record.id, 1);
    expect((await repo.findById(TENANT_A, record.id))?.processedRows).toBe(0);
    await repo.transition(
      TENANT_A,
      record.id,
      [BulkImportStatus.VALIDATED],
      BulkImportStatus.PROCESSING,
    );
    await repo.recordProgress(TENANT_A, record.id, 1);
    expect((await repo.findById(TENANT_A, record.id))?.processedRows).toBe(1);
  });

  it('el cierre guarda el informe y no deja datos personales', async () => {
    const record = batch(TENANT_A);
    await repo.create(record);
    await repo.transition(
      TENANT_A,
      record.id,
      [BulkImportStatus.VALIDATED],
      BulkImportStatus.PROCESSING,
    );
    const report = {
      batchId: record.id,
      kind: record.kind,
      status: BulkImportStatus.COMPLETED,
      generatedAt: new Date().toISOString(),
      totals: { total: 3 } as never,
      rows: [
        { row: 1, outcome: RowOutcome.CREATED },
        { row: 2, outcome: RowOutcome.FAILED, reason: 'WRITE_FAILED' as never },
        ...record.rejectedRows,
      ],
    };
    const closed = await repo.transition(
      TENANT_A,
      record.id,
      [BulkImportStatus.PROCESSING],
      BulkImportStatus.COMPLETED,
      {
        report,
        rows: [],
        processedRows: 2,
        finishedAt: new Date().toISOString(),
      },
    );
    expect(closed).toMatchObject({
      status: 'COMPLETADO',
      rows: [],
      processedRows: 2,
    });
    expect(closed?.report?.rows).toHaveLength(3);
    expect(await personalDataRows()).toBe(0);
    expect(
      (
        await admin.query(
          `SELECT outcome FROM system_ops.bulk_import_batch_rows WHERE batch_id = $1 ORDER BY row_no`,
          [record.id],
        )
      ).rows.map((r) => r.outcome),
    ).toEqual(['CREADA', 'FALLIDA', 'RECHAZADA']);
  });

  it('motor completo sobre Postgres: crea, confirma, procesa e informa', async () => {
    const schema = findKindSchema('usuario-personal-organizacion');
    if (!schema) throw new Error('missing kind');
    const logger = new RecordingLogger() as unknown as PinoLogger;
    const policy = new FakeAccessPolicy();
    const audit = new FakeAudit();
    const validation = new BulkImportValidationService(
      new FakePatientResolver(),
      new FakeCodeResolver(),
    );
    const processor = new BulkImportProcessor(
      repo,
      new FakeUserProvisioner(),
      new FakeClinicalWriter(),
      audit,
      validation,
      logger,
      { rowMs: 5_000, batchMs: 30_000, rowAttempts: 2 },
    );
    const service = new BulkImportService(
      repo,
      policy,
      audit,
      {
        ...TEST_ENGINE_STATUS,
        persistence: { durable: true, adapter: 'postgres' },
      },
      new TemplateService(),
      validation,
      processor,
      logger,
    );
    const admin1 = {
      id: USER,
      roles: ['SECURITY_ADMIN'],
      tenantIds: [TENANT_A],
    };
    policy.grant(USER, 'bulk_import.users');
    const view = await service.create(admin1, TENANT_A, {
      kind: schema.kind,
      declaration: { reason: 'prueba' },
      source: { rows: [exampleRow(schema)] },
    });
    await service.confirm(admin1, TENANT_A, view.id, 'engine-1');
    await processor.drain();
    const report = await service.report(admin1, TENANT_A, view.id);
    expect(report.status).toBe('COMPLETADO');
    expect(report.totals.total).toBe(1);
    expect(await personalDataRows()).toBe(0);
  });
});
