import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import pg from 'pg';
import type { PinoLogger } from 'nestjs-pino';
import {
  BulkImportStatus,
  RowOutcome,
} from '../../src/modules/bulk_import/bulk-import.constants';
import type { BatchRecord } from '../../src/modules/bulk_import/ports/bulk-import.ports';
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

/**
 * Batch repository against REAL PostgreSQL.
 *
 * Opt-in: `BULK_IMPORT_IT_DB_URL` must be a SUPERUSER url of a DISPOSABLE
 * database (the suite recreates `system_ops`, `directory`, `iam` and
 * `delegated_access` stubs). It applies the real patch
 * `database/SQL/patches/2026-10-31_v4281_cargas_masivas.sql` and then runs the
 * repository as the non-superuser role `mantra_app`, so FORCE RLS is in effect.
 *
 * Real here: tables, FKs, CHECKs, unique confirm key, RLS, MikroORM runner.
 * Stubs: `directory.tenants`, `iam.users`, `delegated_access.four_eyes_requests`
 * (id-only prerequisites of the patch). The engine test uses declared fakes for
 * the user/clinical writers; persistence is the real repository.
 */
const ADMIN_URL = process.env.BULK_IMPORT_IT_DB_URL;
const describeIfDb = ADMIN_URL ? describe : describe.skip;

const TENANT_A = randomUUID();
const TENANT_B = randomUUID();
const USER = randomUUID();
const APP_PASSWORD = 'bulk_it_app';

function appUrl(): string {
  const u = new URL(ADMIN_URL as string);
  u.username = 'mantra_app';
  u.password = APP_PASSWORD;
  return u.toString();
}

function batch(tenantId: string, over: Partial<BatchRecord> = {}): BatchRecord {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    tenantId,
    kind: 'usuario-personal-organizacion',
    kindVersion: '1',
    group: 'USERS',
    status: BulkImportStatus.VALIDATED,
    createdByUserId: USER,
    createdAt: now,
    updatedAt: now,
    declaration: { reason: 'prueba' },
    source: { format: 'csv', byteSize: 120 },
    counts: { total: 3, valid: 2, rejected: 1 },
    fileIssues: [],
    previewIssues: [{ row: 3, field: 'email', code: 'INVALID' } as never],
    issuesTotal: 1,
    rejectedRows: [
      {
        row: 3,
        outcome: RowOutcome.REJECTED,
        reason: 'X' as never,
        field: 'email',
      },
    ],
    rows: [
      {
        row: 1,
        data: { email: 'a@example.test' } as never,
        rowKey: 'a'.repeat(64),
      },
      {
        row: 2,
        data: { email: 'b@example.test' } as never,
        rowKey: 'b'.repeat(64),
      },
    ],
    processedRows: 0,
    ...over,
  };
}

describeIfDb('PostgresBatchRepository · PostgreSQL real', () => {
  let admin: pg.Pool;
  const orms: MikroORM[] = [];
  let repo: PostgresBatchRepository;

  async function newRepo(): Promise<PostgresBatchRepository> {
    const orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      clientUrl: appUrl(),
      entities: [],
      discovery: { warnWhenNoEntities: false },
    });
    orms.push(orm);
    return new PostgresBatchRepository(
      new MikroBulkImportSqlRunner(orm.em as never),
    );
  }

  beforeAll(async () => {
    admin = new pg.Pool({ connectionString: ADMIN_URL });
    await admin.query(`
      DROP SCHEMA IF EXISTS system_ops, delegated_access, iam, directory CASCADE;
      CREATE SCHEMA directory; CREATE SCHEMA iam; CREATE SCHEMA delegated_access;
      CREATE SCHEMA system_ops;
      CREATE TABLE directory.tenants (id uuid PRIMARY KEY);
      CREATE TABLE iam.users (id uuid PRIMARY KEY);
      CREATE TABLE delegated_access.four_eyes_requests (id uuid PRIMARY KEY, tenant_id uuid NOT NULL);
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mantra_app') THEN
          CREATE ROLE mantra_app LOGIN PASSWORD '${APP_PASSWORD}';
        END IF;
      END $$;
      GRANT USAGE ON SCHEMA system_ops TO mantra_app;
    `);
    await admin.query(
      readFileSync(
        join(
          process.cwd(),
          'database/SQL/patches/2026-10-31_v4281_cargas_masivas.sql',
        ),
        'utf8',
      ),
    );
    await admin.query('INSERT INTO directory.tenants VALUES ($1), ($2)', [
      TENANT_A,
      TENANT_B,
    ]);
    await admin.query('INSERT INTO iam.users VALUES ($1)', [USER]);
    repo = await newRepo();
  });

  afterAll(async () => {
    await Promise.all(orms.map((o) => o.close(true)));
    await admin?.end();
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
    const app = new pg.Pool({ connectionString: appUrl() });
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
