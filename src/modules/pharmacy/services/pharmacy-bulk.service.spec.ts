import { jest } from '@jest/globals';
import { IsNotEmpty, IsString } from 'class-validator';
import { ConflictException, runWithTenant } from '../../../common';
import { PHARM } from '../pharmacy.concepts';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { rejectRow, type BulkHandler } from './bulk/bulk-handler';
import { CategoriesBulkHandler } from './bulk/categories.bulk-handler';
import { PharmacyBulkService } from './pharmacy-bulk.service';

class Row {
  @IsString()
  @IsNotEmpty()
  code!: string;
}

const ACTOR = { id: 'user-1', tenantIds: ['tenant-1'] } as any;
const PHARMACY = {
  id: 'pharmacy-1',
  tenantId: 'tenant-1',
  statusConceptId: PHARM.PHARMACY_ACTIVE,
};

function build(pharmacy: Record<string, unknown> = PHARMACY) {
  const tx = {
    execute: jest.fn(async () => []),
    flush: jest.fn(async () => undefined),
  };
  const em = {
    fork: jest.fn(() => ({})),
    transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
  };
  const pharmaciesRepo = { findByIdInTenant: jest.fn(async () => pharmacy) };
  const logger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };
  const service = new PharmacyBulkService(
    em as any,
    pharmaciesRepo as any,
    logger as any,
  );
  const store = new Map<string, { id: string; code: string }>([
    ['OLD', { id: 'id-old', code: 'OLD' }],
  ]);
  const handler: jest.Mocked<BulkHandler<{ id: string }, Row, Row>> = {
    keyField: 'code',
    createRow: Row,
    updateRow: Row,
    keyOf: jest.fn((raw: Record<string, unknown>) =>
      typeof raw.code === 'string' && raw.code.trim() !== ''
        ? raw.code.trim().toUpperCase()
        : null,
    ),
    findExisting: jest.fn(
      async (_tx: unknown, _ctx: unknown, key: string) =>
        store.get(key) ?? null,
    ),
    create: jest.fn(async (_tx: unknown, _ctx: unknown, row: Row) => {
      if (row.code === 'BOOM') {
        throw new ConflictException('Ya existe', { field: 'code' });
      }
      if (row.code === 'NOPE') throw rejectRow('code', 'CUSTOM', 'No');
      return `id-${row.code}`;
    }),
    update: jest.fn(
      async (_tx: unknown, _ctx: unknown, existing: any, row: Row) => ({
        id: existing.id,
        changed: row.code !== 'OLD',
      }),
    ),
  } as any;
  return { service, handler, tx, em };
}

function run(
  d: ReturnType<typeof build>,
  mode: 'CREATE' | 'UPDATE' | 'UPSERT',
  rows: Record<string, unknown>[],
  dryRun?: boolean,
) {
  return runWithTenant('tenant-1', () =>
    d.service.run(
      'things',
      'pharmacy-1',
      { mode, rows, dryRun },
      d.handler,
      ACTOR,
    ),
  );
}

describe('PharmacyBulkService', () => {
  it('answers one result per row, in order, counting from 1', async () => {
    const d = build();
    const response = await run(d, 'UPSERT', [{ code: 'A' }, { code: 'B' }]);
    expect(response).toEqual({
      dryRun: false,
      results: [
        { row: 1, outcome: 'CREATED', id: 'id-A' },
        { row: 2, outcome: 'CREATED', id: 'id-B' },
      ],
    });
  });

  it('a row that fails validation is rejected with field and reason, and the others go on', async () => {
    const d = build();
    const response = await run(d, 'UPSERT', [
      { code: 'A' },
      { code: 'B', extra: 1 },
      { code: 'C' },
    ]);
    expect(response.results.map((r) => r.outcome)).toEqual([
      'CREATED',
      'REJECTED',
      'CREATED',
    ]);
    expect(response.results[1].errors).toEqual([
      expect.objectContaining({ field: 'extra', reason: 'UNKNOWN_FIELD' }),
    ]);
  });

  it('a row without a key is rejected as REQUIRED without touching the database', async () => {
    const d = build();
    const response = await run(d, 'UPSERT', [{ code: '' }]);
    expect(response.results[0]).toEqual({
      row: 1,
      outcome: 'REJECTED',
      errors: [expect.objectContaining({ field: 'code', reason: 'REQUIRED' })],
    });
    expect(d.em.transactional).not.toHaveBeenCalled();
  });

  it('every row that shares a key is DUPLICATE_IN_FILE, the first one too, and none runs', async () => {
    const d = build();
    const response = await run(d, 'UPSERT', [
      { code: 'a' },
      { code: 'B' },
      { code: 'A ' },
    ]);
    expect(response.results.map((r) => r.outcome)).toEqual([
      'REJECTED',
      'CREATED',
      'REJECTED',
    ]);
    for (const index of [0, 2]) {
      expect(response.results[index].errors).toEqual([
        expect.objectContaining({
          field: 'code',
          reason: PharmacyErrorReason.DUPLICATE_IN_FILE,
          message: expect.stringContaining('filas 1, 3'),
        }),
      ]);
    }
    expect(d.handler.findExisting.mock.calls).toHaveLength(1);
  });

  it('a repeated key gives the same answer in the preview and in the real load', async () => {
    const rows = [{ code: 'OLD' }, { code: 'X' }, { code: 'old' }];
    const preview = await run(build(), 'UPSERT', rows, true);
    const real = await run(build(), 'UPSERT', rows);
    const strip = (r: { results: { outcome: string; errors?: unknown }[] }) =>
      r.results.map(({ outcome, errors }) => ({ outcome, errors }));
    expect(strip(preview)).toEqual(strip(real));
    expect(real.results.map((r) => r.outcome)).toEqual([
      'REJECTED',
      'CREATED',
      'REJECTED',
    ]);
  });

  it('two rows that share another key of the handler are both rejected with that field', async () => {
    const d = build();
    // La otra clave es la letra del código: «A1» y «A2» la comparten.
    d.handler.otherKeysOf = jest.fn((raw: Record<string, unknown>) => [
      { field: 'ref', key: String(raw.code).charAt(0) },
    ]);
    const response = await run(d, 'UPSERT', [
      { code: 'A1' },
      { code: 'A2' },
      { code: 'B1' },
    ]);
    expect(response.results.map((r) => r.outcome)).toEqual([
      'REJECTED',
      'REJECTED',
      'CREATED',
    ]);
    expect(response.results[1].errors).toEqual([
      expect.objectContaining({
        field: 'ref',
        reason: PharmacyErrorReason.DUPLICATE_IN_FILE,
      }),
    ]);
  });

  it('a key that came but does not serve gives the reason of its DTO, not REQUIRED', async () => {
    const d = build();
    const response = await run(d, 'UPSERT', [{ code: 12 }, {}]);
    expect(response.results[0].errors).toEqual([
      expect.objectContaining({ field: 'code', reason: 'INVALID_IS_STRING' }),
    ]);
    expect(response.results[1].errors).toEqual([
      expect.objectContaining({ field: 'code', reason: 'REQUIRED' }),
    ]);
    expect(d.em.transactional).not.toHaveBeenCalled();
  });

  it('a category name that is too long or not a text gives that reason, not REQUIRED', async () => {
    const d = build();
    const categories = new CategoriesBulkHandler({} as any, {} as any);
    const response = await runWithTenant('tenant-1', () =>
      d.service.run(
        'categories',
        'pharmacy-1',
        {
          mode: 'UPSERT',
          rows: [{ name: 'x'.repeat(61) }, { name: 5 }, { name: '  ' }],
        },
        categories,
        ACTOR,
      ),
    );
    expect(response.results.map((r) => r.errors?.map((e) => e.reason))).toEqual(
      [
        ['INVALID_MAX_LENGTH'],
        ['INVALID_MAX_LENGTH', 'INVALID_IS_STRING'],
        ['REQUIRED'],
      ],
    );
  });

  it('the warnings of the handler travel with the row, in the preview and in the real load', async () => {
    const warning = {
      field: 'medicationName',
      reason: PharmacyErrorReason.MEDICATION_NOT_LINKED,
      message: 'Sin medicamento',
    };
    const withWarning = () => {
      const d = build();
      d.handler.warningsFor = jest.fn(
        async (_tx: unknown, _ctx: unknown, id: string) =>
          id === 'id-A' || id === 'id-old' ? [warning] : [],
      );
      return d;
    };
    const rows = [{ code: 'A' }, { code: 'B' }, { code: 'OLD' }];
    const real = await run(withWarning(), 'UPSERT', rows);
    expect(real.results).toEqual([
      { row: 1, outcome: 'CREATED', id: 'id-A', warnings: [warning] },
      { row: 2, outcome: 'CREATED', id: 'id-B' },
      { row: 3, outcome: 'UNCHANGED', id: 'id-old', warnings: [warning] },
    ]);
    const preview = await run(withWarning(), 'UPSERT', rows, true);
    expect(preview.results).toEqual([
      { row: 1, outcome: 'CREATED', warnings: [warning] },
      { row: 2, outcome: 'CREATED' },
      { row: 3, outcome: 'UNCHANGED', warnings: [warning] },
    ]);
  });

  it('CREATE rejects an existing key; UPDATE rejects a missing one; UPSERT takes both', async () => {
    const d = build();
    const create = await run(d, 'CREATE', [{ code: 'OLD' }, { code: 'NEW' }]);
    expect(create.results[0].errors?.[0].reason).toBe(
      PharmacyErrorReason.ALREADY_EXISTS,
    );
    expect(create.results[1].outcome).toBe('CREATED');

    const update = await run(d, 'UPDATE', [{ code: 'OLD' }, { code: 'NEW' }]);
    expect(update.results[0].outcome).toBe('UNCHANGED');
    expect(update.results[1].errors?.[0].reason).toBe(
      PharmacyErrorReason.NOT_FOUND,
    );

    const upsert = await run(d, 'UPSERT', [{ code: 'OLD' }, { code: 'NEW' }]);
    expect(upsert.results.map((r) => r.outcome)).toEqual([
      'UNCHANGED',
      'CREATED',
    ]);
  });

  it('takes the per-pharmacy lock before looking up the key, in each row transaction', async () => {
    const d = build();
    await run(d, 'UPSERT', [{ code: 'A' }, { code: 'B' }]);
    expect(d.em.transactional).toHaveBeenCalledTimes(2);
    expect(d.tx.execute).toHaveBeenCalledWith(
      'select pg_advisory_xact_lock(hashtext(?))',
      ['pharmacy.bulk:pharmacy-1'],
    );
    expect(d.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
      d.handler.findExisting.mock.invocationCallOrder[0],
    );
  });

  it('dryRun answers the same outcomes without ids and rolls each row back', async () => {
    const d = build();
    const rows = [{ code: 'OLD' }, { code: 'NEW' }, { code: 'NEW' }];
    const real = await run(build(), 'UPSERT', rows);
    const preview = await run(d, 'UPSERT', rows, true);
    expect(preview.dryRun).toBe(true);
    expect(preview.results.map((r) => r.outcome)).toEqual(
      real.results.map((r) => r.outcome),
    );
    expect(preview.results.every((r) => r.id === undefined)).toBe(true);
    // Cada transacción de fila termina en excepción: la base la deshace.
    for (const call of d.em.transactional.mock.results) {
      await expect(call.value).rejects.toThrow('dry run');
    }
  });

  it('a dryRun that is not a boolean never writes: 400 before any row runs', async () => {
    for (const bad of [0, null, '', 'false', 1, [], {}]) {
      const d = build();
      await expect(
        run(d, 'UPSERT', [{ code: 'A' }], bad as unknown as boolean),
      ).rejects.toMatchObject({ status: 400 });
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.handler.findExisting.mock.calls).toHaveLength(0);
    }
  });

  it('translates a domain exception of the usual services into the row reason', async () => {
    const d = build();
    const response = await run(d, 'UPSERT', [
      { code: 'BOOM' },
      { code: 'NOPE' },
    ]);
    expect(response.results[0]).toEqual({
      row: 1,
      outcome: 'REJECTED',
      errors: [{ field: 'code', reason: 'CONFLICT', message: 'Ya existe' }],
    });
    expect(response.results[1].errors).toEqual([
      { field: 'code', reason: 'CUSTOM', message: 'No' },
    ]);
  });

  it('a pharmacy that is not active answers 422 for the whole request', async () => {
    const d = build({ ...PHARMACY, statusConceptId: PHARM.PHARMACY_DRAFT });
    await expect(run(d, 'UPSERT', [{ code: 'A' }])).rejects.toMatchObject({
      status: 422,
    });
  });
});
