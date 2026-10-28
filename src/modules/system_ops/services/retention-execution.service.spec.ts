import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { RetentionExecutionService } from './retention-execution.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { SYSOPS } from '../system_ops.concepts';
import { SystemOpsErrorReason } from '../system_ops.error-reasons';
import type { RetentionDispositionExecutor } from './retention-disposition.executor';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const systemActor = { id: 'sys-1', roles: ['SYSTEM'] } as any;
const TENANT = '99999999-9999-9999-9999-999999999999';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build(executors: RetentionDispositionExecutor[] = []) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    createExecution: mockFn(),
    createRevision: mockFn(),
    countActiveHoldsForTarget: mockFn().mockResolvedValue(0),
  };
  const governanceRepo = {
    findRetentionPolicyById: mockFn(),
    findEntityById: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new RetentionExecutionService(
    em as any,
    repo,
    governanceRepo as any,
    logger as any,
    undefined,
    executors,
  );
  return { service, repo, governanceRepo, tx };
}

describe('RetentionExecutionService (UC-11-05)', () => {
  it('throws when the policy is missing', async () => {
    const d = build();
    d.governanceRepo.findRetentionPolicyById.mockResolvedValue(null);
    await expect(
      d.service.run(
        { retentionPolicyId: 'p1', entityRegistryId: 'e1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects a non-active policy', async () => {
    const d = build();
    d.governanceRepo.findRetentionPolicyById.mockResolvedValue({
      id: 'p1',
      stateConceptId: 'other',
    });
    await expect(
      d.service.run(
        { retentionPolicyId: 'p1', entityRegistryId: 'e1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  const ACTIVE_POLICY = {
    id: 'p1',
    code: 'RET-1',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    dispositionConceptId: SYSOPS.DISPOSITION_DELETE,
    retentionPeriodDays: 30,
  };
  const ENTITY = { id: 'e1', schemaName: 's', tableName: 't' };

  /** Adaptador en memoria: `rows` son los ids vencidos; `dispose` los retira. */
  function fakeExecutor(rows: string[]) {
    const remaining = [...rows];
    const executor = {
      supports: mockFn(() => true),
      selectExpired: mockFn(async (_tx: unknown, q: any) =>
        remaining
          .filter((id) => !q.afterId || id > q.afterId)
          .sort()
          .slice(0, q.limit)
          .map((id) => ({ id })),
      ),
      dispose: mockFn(async (_tx: unknown, _d: string, r: any) => {
        remaining.splice(remaining.indexOf(r.id), 1);
      }),
    };
    return { executor, remaining };
  }

  /** Cablea política/entidad/ejecución sobre el doble del repositorio. */
  function wire(d: ReturnType<typeof build>, policy: any = ACTIVE_POLICY) {
    d.governanceRepo.findRetentionPolicyById.mockResolvedValue(policy);
    d.governanceRepo.findEntityById.mockResolvedValue(ENTITY);
    d.repo.createExecution.mockReturnValue({
      id: 'x1',
      statusConceptId: SYSOPS.EXEC_RUNNING,
    });
  }

  it('rejects an entity with no registered executor instead of reporting a hollow success', async () => {
    const d = build();
    wire(d);

    const attempt = d.service.run(
      { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
      systemActor,
    );

    await expect(attempt).rejects.toBeInstanceOf(PreconditionFailedException);
    await expect(attempt).rejects.toMatchObject({
      reason: SystemOpsErrorReason.SYSOPS_RETENTION_EXECUTOR_UNSUPPORTED,
    });
    expect(d.repo.createExecution).not.toHaveBeenCalled();
    expect(d.repo.createRevision).not.toHaveBeenCalled();
  });

  it('rejects an executable policy that has no period or disposition', async () => {
    const d = build([fakeExecutor([]).executor]);
    wire(d, { ...ACTIVE_POLICY, retentionPeriodDays: undefined });

    await expect(
      d.service.run(
        { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
        systemActor,
      ),
    ).rejects.toMatchObject({
      reason: SystemOpsErrorReason.SYSOPS_RETENTION_POLICY_INCOMPLETE,
    });
    expect(d.repo.createExecution).not.toHaveBeenCalled();
  });

  it('skips the sweep when the target is under an active legal hold', async () => {
    const fake = fakeExecutor(['r1']);
    const d = build([fake.executor]);
    wire(d);
    d.repo.countActiveHoldsForTarget.mockResolvedValue(1);

    const res = await d.service.run(
      { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
      systemActor,
    );
    expect(res.blockedByLegalHold).toBe(true);
    expect(d.repo.createRevision).not.toHaveBeenCalled();
    expect(fake.executor.dispose).not.toHaveBeenCalled();
  });

  it('disposes three expired rows, one revision each, totalDeleted 3', async () => {
    const fake = fakeExecutor(['r1', 'r2', 'r3']);
    const d = build([fake.executor]);
    wire(d);

    const res = await d.service.run(
      { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
      systemActor,
    );

    expect(res.statusConceptId).toBe(SYSOPS.EXEC_SUCCEEDED);
    expect(res).toMatchObject({
      totalScanned: 3,
      totalDeleted: 3,
      totalAnonymized: 0,
      totalArchived: 0,
      totalHeld: 0,
      hasMore: false,
      blockedByLegalHold: false,
    });
    expect(fake.remaining).toEqual([]);
    const recordIds = d.repo.createRevision.mock.calls.map(
      (call: any[]) => call[1].recordId,
    );
    expect(recordIds).toEqual(['r1', 'r2', 'r3']);
    expect(d.repo.createRevision.mock.calls[0][1]).toMatchObject({
      schemaName: 's',
      tableName: 't',
      operationConceptId: SYSOPS.OP_DELETE,
    });
  });

  it('processes only maxBatchSize rows and reports a cursor to continue; the rest is kept', async () => {
    const fake = fakeExecutor(['r1', 'r2', 'r3', 'r4', 'r5']);
    const d = build([fake.executor]);
    wire(d);

    const first = await d.service.run(
      { retentionPolicyId: 'p1', entityRegistryId: 'e1', maxBatchSize: 2 },
      systemActor,
    );

    expect(first).toMatchObject({
      totalScanned: 2,
      totalDeleted: 2,
      hasMore: true,
      nextCursor: 'r2',
    });
    expect(fake.remaining).toEqual(['r3', 'r4', 'r5']);

    const second = await d.service.run(
      {
        retentionPolicyId: 'p1',
        entityRegistryId: 'e1',
        maxBatchSize: 2,
        cursor: first.nextCursor,
      },
      systemActor,
    );
    expect(second).toMatchObject({ totalScanned: 2, nextCursor: 'r4' });
    expect(fake.remaining).toEqual(['r5']);
  });

  it('keeps a row under legal hold and disposes the free one, reporting both decisions', async () => {
    const fake = fakeExecutor(['held', 'free']);
    const d = build([fake.executor]);
    wire(d);
    d.repo.countActiveHoldsForTarget.mockImplementation(
      async (_tx: unknown, targetId: string) => (targetId === 'held' ? 1 : 0),
    );

    const res = await d.service.run(
      { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
      systemActor,
    );

    expect(res).toMatchObject({
      totalScanned: 2,
      totalDeleted: 1,
      totalHeld: 1,
    });
    expect(fake.remaining).toEqual(['held']);
    expect(
      d.repo.createRevision.mock.calls.map((c: any[]) => c[1].recordId),
    ).toEqual(['free']);
  });

  it('counts anonymized and archived dispositions in their own totals', async () => {
    const anon = fakeExecutor(['r1']);
    const d1 = build([anon.executor]);
    wire(d1, {
      ...ACTIVE_POLICY,
      dispositionConceptId: SYSOPS.DISPOSITION_ANONYMIZE,
    });
    expect(
      await d1.service.run(
        { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
        systemActor,
      ),
    ).toMatchObject({ totalAnonymized: 1, totalDeleted: 0, totalArchived: 0 });
    expect(anon.executor.dispose.mock.calls[0][1]).toBe('ANONYMIZE');

    const arch = fakeExecutor(['r1']);
    const d2 = build([arch.executor]);
    wire(d2, {
      ...ACTIVE_POLICY,
      dispositionConceptId: SYSOPS.DISPOSITION_ARCHIVE,
    });
    expect(
      await d2.service.run(
        { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
        systemActor,
      ),
    ).toMatchObject({ totalArchived: 1, totalDeleted: 0, totalAnonymized: 0 });
  });

  it('scopes the sweep to the active tenant (a tenant admin never sweeps other tenants)', async () => {
    const fake = fakeExecutor([]);
    const d = build([fake.executor]);
    wire(d);

    await runWithTenant(TENANT, () =>
      d.service.run(
        { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
        systemActor,
      ),
    );

    expect(fake.executor.selectExpired.mock.calls[0][1]).toMatchObject({
      tenantId: TENANT,
    });
  });

  it('refuses a global sweep to an actor without a tenant who is not global SYSTEM', async () => {
    const fake = fakeExecutor([]);
    const d = build([fake.executor]);
    wire(d);

    await expect(
      d.service.run({ retentionPolicyId: 'p1', entityRegistryId: 'e1' }, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(fake.executor.selectExpired).not.toHaveBeenCalled();
  });

  it('lets a global SYSTEM actor sweep every tenant (tenantId undefined)', async () => {
    const fake = fakeExecutor([]);
    const d = build([fake.executor]);
    wire(d);

    await d.service.run({ retentionPolicyId: 'p1', entityRegistryId: 'e1' }, {
      id: 'sys',
      roles: ['SYSTEM'],
    } as any);

    expect(
      fake.executor.selectExpired.mock.calls[0][1].tenantId,
    ).toBeUndefined();
  });
});
