import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityChecksService } from './identity-checks.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const checksRepo = { findById: mockFn() };
  const attemptsRepo = {
    countByCase: mockFn().mockResolvedValue(0),
    existsCompletedForCase: mockFn().mockResolvedValue(true),
    create: mockFn(),
  };
  const resultsRepo = {
    countByCheck: mockFn().mockResolvedValue(0),
    findLatestByCheck: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityChecksService(
    em as any,
    checksRepo as any,
    attemptsRepo,
    resultsRepo,
    logger as any,
  );
  return { service, tx, checksRepo, attemptsRepo, resultsRepo };
}

describe('IdentityChecksService', () => {
  describe('recordAttempt (UC-27-05)', () => {
    it('numbers the attempt per case and moves the check to in-progress', async () => {
      const d = build();
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        statusConceptId: IDA.CHECK_PENDING,
        updatedAt: new Date(),
      };
      d.checksRepo.findById.mockResolvedValue(check);
      d.attemptsRepo.countByCase.mockResolvedValue(2);
      d.attemptsRepo.create.mockReturnValue({
        id: 'at1',
        attemptNumber: 3,
        outcomeConceptId: IDA.ATTEMPT_SUCCESS,
      });
      const res = await d.service.recordAttempt(
        'ch1',
        { identityAuthorityEndpointId: 'ep1' },
        actor,
      );
      expect(res.attemptNumber).toBe(3);
      expect(check.statusConceptId).toBe(IDA.CHECK_IN_PROGRESS);
      expect(d.attemptsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ attemptNumber: 3 }),
      );
    });

    it('throws when the check does not exist', async () => {
      const d = build();
      d.checksRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordAttempt(
          'missing',
          { identityAuthorityEndpointId: 'ep1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordResult (UC-27-06)', () => {
    it('requires a completed attempt (precondition)', async () => {
      const d = build();
      d.checksRepo.findById.mockResolvedValue({
        id: 'ch1',
        identityVerificationCaseId: 'k1',
      });
      d.attemptsRepo.existsCompletedForCase.mockResolvedValue(false);
      await expect(
        d.service.recordResult('ch1', { result: 'MATCH' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('appends a versioned result chaining supersede and completes the check', async () => {
      const d = build();
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        statusConceptId: IDA.CHECK_IN_PROGRESS,
        updatedAt: new Date(),
      };
      d.checksRepo.findById.mockResolvedValue(check);
      d.resultsRepo.findLatestByCheck.mockResolvedValue({ id: 'r0' });
      d.resultsRepo.countByCheck.mockResolvedValue(1);
      d.resultsRepo.create.mockReturnValue({
        id: 'r1',
        resultVersion: 2,
        resultConceptId: IDA.RESULT_MATCH,
      });
      const res = await d.service.recordResult(
        'ch1',
        { result: 'MATCH' } as any,
        actor,
      );
      expect(res.resultVersion).toBe(2);
      expect(check.statusConceptId).toBe(IDA.CHECK_COMPLETED);
      expect(d.resultsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ supersedesResultId: 'r0', resultVersion: 2 }),
      );
    });
  });
});
