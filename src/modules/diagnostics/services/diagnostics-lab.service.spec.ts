import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsLabService } from './diagnostics-lab.service';
import { DIAG } from '../diagnostics.concepts';
import {
  ResourceNotFoundException,
  ConflictException,
  PreconditionFailedException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findWorkOrder: mockFn(),
    findWorkOrderTest: mockFn(),
    findAnalyzerRun: mockFn(),
    createWorkOrder: mockFn(),
    createWorkOrderTest: mockFn(),
    createAnalyzerRun: mockFn(),
    findMessageByControlId: mockFn(),
    recordMessage: mockFn(),
    recordVerification: mockFn(),
    markTestsVerifiedForObservation: mockFn().mockResolvedValue(0),
  };
  const specimensRepo = { findAccession: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsLabService(
    em as any,
    repo,
    specimensRepo as any,
    logger as any,
  );
  return { service, tx, repo, specimensRepo };
}

describe('DiagnosticsLabService', () => {
  describe('createWorkOrder (UC-20-04)', () => {
    it('throws when accession missing', async () => {
      const d = build();
      d.specimensRepo.findAccession.mockResolvedValue(null);
      await expect(
        d.service.createWorkOrder(
          { laboratoryAccessionId: 'x', tests: [] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('opens order, creates tests and moves accession to in-process', async () => {
      const d = build();
      const accession = {
        id: 'a1',
        custodianTenantId: 't1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      };
      d.specimensRepo.findAccession.mockResolvedValue(accession);
      d.repo.createWorkOrder.mockReturnValue({
        id: 'wo1',
        statusConceptId: DIAG.WORK_ORDER_OPEN,
      });
      d.repo.createWorkOrderTest.mockReturnValue({ id: 'wt1' });

      const res = await d.service.createWorkOrder(
        {
          laboratoryAccessionId: 'a1',
          tests: [{ serviceRequestId: 'sr1', testCodeConceptId: 'tc1' }],
        },
        actor,
      );

      expect(res).toEqual({
        id: 'wo1',
        status: DIAG.WORK_ORDER_OPEN,
        testIds: ['wt1'],
      });
      expect(accession.statusConceptId).toBe(DIAG.ACCESSION_IN_PROCESS);
    });
  });

  describe('createAnalyzerRun (soporte)', () => {
    it('requires a custodian tenant', async () => {
      const d = build();
      await expect(
        d.service.createAnalyzerRun(
          { analyzerDeviceId: 'dev1', runIdentifier: 'r1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('opens a run', async () => {
      const d = build();
      d.repo.createAnalyzerRun.mockReturnValue({
        id: 'run1',
        statusConceptId: DIAG.ANALYZER_RUN_OPEN,
      });
      const res = await d.service.createAnalyzerRun(
        {
          analyzerDeviceId: 'dev1',
          runIdentifier: 'r1',
          custodianTenantId: 't1',
        },
        actor,
      );
      expect(res).toEqual({ id: 'run1', status: DIAG.ANALYZER_RUN_OPEN });
    });
  });

  describe('ingestMessage (UC-20-05)', () => {
    it('throws when run missing', async () => {
      const d = build();
      d.repo.findAnalyzerRun.mockResolvedValue(null);
      await expect(
        d.service.ingestMessage('missing', { payloadHash: 'h' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects duplicate message control id (idempotency)', async () => {
      const d = build();
      d.repo.findAnalyzerRun.mockResolvedValue({ id: 'run1' });
      d.repo.findMessageByControlId.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.ingestMessage(
          'run1',
          { payloadHash: 'h', messageControlId: 'mc1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('ingests and marks the linked test preliminary', async () => {
      const d = build();
      d.repo.findAnalyzerRun.mockResolvedValue({ id: 'run1' });
      d.repo.findMessageByControlId.mockResolvedValue(null);
      d.repo.recordMessage.mockReturnValue({
        id: 'msg1',
        validationStatusConceptId: DIAG.MESSAGE_VALIDATED,
      });
      const test = { id: 'wt1', statusConceptId: DIAG.TEST_PENDING };
      d.repo.findWorkOrderTest.mockResolvedValue(test);

      const res = await d.service.ingestMessage(
        'run1',
        {
          payloadHash: 'h',
          laboratoryWorkOrderTestId: 'wt1',
          mappedObservationId: 'o1',
        },
        actor,
      );

      expect(res).toEqual({ id: 'msg1', status: DIAG.MESSAGE_VALIDATED });
      expect(test.statusConceptId).toBe(DIAG.TEST_PRELIMINARY);
    });
  });

  describe('verifyResult (UC-20-06)', () => {
    it('requires a custodian tenant', async () => {
      const d = build();
      await expect(
        d.service.verifyResult(
          'o1',
          { level: 'TECHNICAL', verifiedByProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('records a verification and marks tests verified', async () => {
      const d = build();
      d.repo.recordVerification.mockReturnValue({
        id: 'v1',
        resultConceptId: DIAG.VERIFICATION_ACCEPTED,
      });
      const res = await d.service.verifyResult(
        'o1',
        {
          level: 'MEDICAL',
          verifiedByProfileId: 'p1',
          custodianTenantId: 't1',
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'v1', status: DIAG.VERIFICATION_ACCEPTED });
      expect(d.repo.markTestsVerifiedForObservation).toHaveBeenCalledWith(
        expect.anything(),
        'o1',
        DIAG.TEST_VERIFIED,
      );
    });
  });
});
