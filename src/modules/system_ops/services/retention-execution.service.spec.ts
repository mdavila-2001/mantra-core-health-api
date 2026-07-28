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
} from '../../../common';
import { SYSOPS } from '../system_ops.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
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
  );
  return { service, repo, governanceRepo };
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

  it('skips the sweep when the target is under an active legal hold', async () => {
    const d = build();
    d.governanceRepo.findRetentionPolicyById.mockResolvedValue({
      id: 'p1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    d.governanceRepo.findEntityById.mockResolvedValue({
      id: 'e1',
      schemaName: 's',
      tableName: 't',
    });
    d.repo.createExecution.mockReturnValue({
      id: 'x1',
      statusConceptId: SYSOPS.EXEC_RUNNING,
    });
    d.repo.countActiveHoldsForTarget.mockResolvedValue(1);

    const res = await d.service.run(
      { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
      actor,
    );
    expect(res.blockedByLegalHold).toBe(true);
    expect(d.repo.createRevision).not.toHaveBeenCalled();
  });

  it('runs the sweep and records a revision when no hold is present', async () => {
    const d = build();
    d.governanceRepo.findRetentionPolicyById.mockResolvedValue({
      id: 'p1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      dispositionConceptId: SYSOPS.DISPOSITION_DELETE,
    });
    d.governanceRepo.findEntityById.mockResolvedValue({
      id: 'e1',
      schemaName: 's',
      tableName: 't',
    });
    d.repo.createExecution.mockReturnValue({
      id: 'x1',
      statusConceptId: SYSOPS.EXEC_RUNNING,
    });

    const res = await d.service.run(
      { retentionPolicyId: 'p1', entityRegistryId: 'e1' },
      actor,
    );
    expect(res.blockedByLegalHold).toBe(false);
    expect(res.statusConceptId).toBe(SYSOPS.EXEC_SUCCEEDED);
    expect(d.repo.createRevision).toHaveBeenCalled();
  });
});
