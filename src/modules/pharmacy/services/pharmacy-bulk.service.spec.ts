import { jest } from '@jest/globals';
import { IsNotEmpty, IsString } from 'class-validator';
import { ConflictException, runWithTenant } from '../../../common';
import { PHARM } from '../pharmacy.concepts';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { rejectRow, type BulkHandler } from './bulk/bulk-handler';
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

  it('the second row with the same key is DUPLICATE_IN_FILE', async () => {
    const d = build();
    const response = await run(d, 'UPSERT', [{ code: 'a' }, { code: 'A ' }]);
    expect(response.results[1]).toEqual({
      row: 2,
      outcome: 'REJECTED',
      errors: [
        expect.objectContaining({
          reason: PharmacyErrorReason.DUPLICATE_IN_FILE,
        }),
      ],
    });
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
