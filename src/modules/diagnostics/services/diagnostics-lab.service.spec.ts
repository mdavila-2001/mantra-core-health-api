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
import { DiagnosticsScopeService } from './diagnostics-scope.service';
import { T1, T2, expectNotAvailable, inTenant } from './diagnostics.testing';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findWorkOrders: mockFn().mockResolvedValue([]),
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
  const specimensRepo = { findAccession: mockFn(), findSpecimen: mockFn() };
  const refsRepo = {
    findServiceRequest: mockFn(),
    findObservation: mockFn().mockResolvedValue({
      id: 'o1',
      custodianTenantId: T1,
      patientProfileId: 'p1',
    }),
    findFile: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = new DiagnosticsScopeService(
    specimensRepo as any,
    {} as any,
    {} as any,
    {} as any,
    refsRepo as any,
  );
  const raw = new DiagnosticsLabService(
    em as any,
    repo,
    specimensRepo as any,
    scope,
    logger as any,
  );
  return {
    raw,
    service: inTenant(raw),
    tx,
    repo,
    specimensRepo,
    refsRepo,
  };
}

describe('DiagnosticsLabService', () => {
  describe('createWorkOrder (UC-20-04)', () => {
    it('throws when accession missing', async () => {
      const d = build();
      d.specimensRepo.findAccession.mockResolvedValue(null);
      await expectNotAvailable(
        d.service.createWorkOrder(
          { laboratoryAccessionId: 'x', tests: [] } as any,
          actor,
        ),
      );
    });

    it('opens order, creates tests and moves accession to in-process', async () => {
      const d = build();
      const accession = {
        id: 'a1',
        custodianTenantId: T1,
        patientProfileId: 'p1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      };
      d.refsRepo.findServiceRequest.mockResolvedValue({
        id: 'sr1',
        custodianTenantId: T1,
        patientProfileId: 'p1',
      });
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
    it('requires an active tenant in the context', async () => {
      const d = build();
      await expect(
        d.raw.createAnalyzerRun(
          { analyzerDeviceId: 'dev1', runIdentifier: 'r1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.createAnalyzerRun).not.toHaveBeenCalled();
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
          custodianTenantId: T1,
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
      await expectNotAvailable(
        d.service.ingestMessage('missing', { payloadHash: 'h' } as any, actor),
      );
    });

    it('rejects duplicate message control id (idempotency)', async () => {
      const d = build();
      d.repo.findAnalyzerRun.mockResolvedValue({
        id: 'run1',
        custodianTenantId: T1,
      });
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
      d.repo.findAnalyzerRun.mockResolvedValue({
        id: 'run1',
        custodianTenantId: T1,
      });
      d.repo.findMessageByControlId.mockResolvedValue(null);
      d.repo.recordMessage.mockReturnValue({
        id: 'msg1',
        validationStatusConceptId: DIAG.MESSAGE_VALIDATED,
      });
      const test = {
        id: 'wt1',
        laboratoryWorkOrderId: 'wo1',
        statusConceptId: DIAG.TEST_PENDING,
      };
      d.repo.findWorkOrderTest.mockResolvedValue(test);
      d.repo.findWorkOrder.mockResolvedValue({
        id: 'wo1',
        custodianTenantId: T1,
      });

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
    it('requires an active tenant in the context', async () => {
      const d = build();
      await expect(
        d.raw.verifyResult(
          'o1',
          { level: 'TECHNICAL', verifiedByProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.recordVerification).not.toHaveBeenCalled();
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
          custodianTenantId: T1,
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

  describe('alcance de tenant (DIAG-01)', () => {
    const run = (tenantId: string) => ({
      id: 'run1',
      custodianTenantId: tenantId,
    });

    it('crear la corrida toma el tenant del contexto y rechaza uno distinto del cuerpo', async () => {
      const d = build();
      d.repo.createAnalyzerRun.mockReturnValue({
        id: 'run1',
        statusConceptId: DIAG.ANALYZER_RUN_OPEN,
      });
      await d.service.createAnalyzerRun(
        { analyzerDeviceId: 'dev1', runIdentifier: 'r1' } as any,
        actor,
      );
      expect(d.repo.createAnalyzerRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: T1 }),
      );
      await expectNotAvailable(
        d.service.createAnalyzerRun(
          {
            analyzerDeviceId: 'dev1',
            runIdentifier: 'r1',
            custodianTenantId: T2,
          } as any,
          actor,
        ),
      );
      expect(d.repo.createAnalyzerRun).toHaveBeenCalledTimes(1);
    });

    it('abrir una orden de trabajo sobre una acesión de T2 no escribe', async () => {
      const d = build();
      d.specimensRepo.findAccession.mockResolvedValue({
        id: 'aB',
        custodianTenantId: T2,
        patientProfileId: 'p1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      });
      await expectNotAvailable(
        d.service.createWorkOrder(
          { laboratoryAccessionId: 'aB', tests: [] } as any,
          actor,
        ),
      );
      expect(d.repo.createWorkOrder).not.toHaveBeenCalled();
    });

    it('una orden de otro tenant o un espécimen de otro paciente no entran en la orden de trabajo', async () => {
      const d = build();
      const accession = {
        id: 'a1',
        custodianTenantId: T1,
        patientProfileId: 'p1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      };
      d.specimensRepo.findAccession.mockResolvedValue(accession);
      d.refsRepo.findServiceRequest.mockResolvedValue({
        id: 'srB',
        custodianTenantId: T2,
        patientProfileId: 'p1',
      });
      await expectNotAvailable(
        d.service.createWorkOrder(
          {
            laboratoryAccessionId: 'a1',
            tests: [{ serviceRequestId: 'srB', testCodeConceptId: 'tc1' }],
          } as any,
          actor,
        ),
      );
      d.specimensRepo.findSpecimen.mockResolvedValue({
        id: 's9',
        custodianTenantId: T1,
        patientProfileId: 'otro-paciente',
      });
      await expectNotAvailable(
        d.service.createWorkOrder(
          {
            laboratoryAccessionId: 'a1',
            tests: [{ specimenId: 's9', testCodeConceptId: 'tc1' }],
          } as any,
          actor,
        ),
      );
      expect(d.repo.createWorkOrder).not.toHaveBeenCalled();
      expect(accession.statusConceptId).toBe(DIAG.ACCESSION_RECEIVED);
    });

    it('ingerir un mensaje en la corrida de T2 no lo registra', async () => {
      const d = build();
      d.repo.findAnalyzerRun.mockResolvedValue(run(T2));
      await expectNotAvailable(
        d.service.ingestMessage('run1', { payloadHash: 'h' } as any, actor),
      );
      expect(d.repo.recordMessage).not.toHaveBeenCalled();
    });

    it('una prueba de la orden de trabajo de T2 no se marca como preliminar', async () => {
      const d = build();
      d.repo.findAnalyzerRun.mockResolvedValue(run(T1));
      const test: any = {
        id: 'wtB',
        laboratoryWorkOrderId: 'woB',
        statusConceptId: DIAG.TEST_PENDING,
      };
      d.repo.findWorkOrderTest.mockResolvedValue(test);
      d.repo.findWorkOrder.mockResolvedValue({
        id: 'woB',
        custodianTenantId: T2,
      });
      await expectNotAvailable(
        d.service.ingestMessage(
          'run1',
          { payloadHash: 'h', laboratoryWorkOrderTestId: 'wtB' } as any,
          actor,
        ),
      );
      expect(test.statusConceptId).toBe(DIAG.TEST_PENDING);
      expect(d.repo.recordMessage).not.toHaveBeenCalled();
    });

    it('una observación o un archivo de T2 no se enlazan al mensaje', async () => {
      const d = build();
      d.repo.findAnalyzerRun.mockResolvedValue(run(T1));
      d.refsRepo.findObservation.mockResolvedValue({
        id: 'oB',
        custodianTenantId: T2,
        patientProfileId: 'p1',
      });
      await expectNotAvailable(
        d.service.ingestMessage(
          'run1',
          { payloadHash: 'h', mappedObservationId: 'oB' } as any,
          actor,
        ),
      );
      d.refsRepo.findFile.mockResolvedValue({ id: 'fB', tenantId: T2 });
      await expectNotAvailable(
        d.service.ingestMessage(
          'run1',
          { payloadHash: 'h', rawMessageFileId: 'fB' } as any,
          actor,
        ),
      );
      expect(d.repo.recordMessage).not.toHaveBeenCalled();
    });

    it('verificar una observación de T2 no registra la verificación ni cierra pruebas', async () => {
      const d = build();
      d.refsRepo.findObservation.mockResolvedValue({
        id: 'oB',
        custodianTenantId: T2,
        patientProfileId: 'p1',
      });
      await expectNotAvailable(
        d.service.verifyResult(
          'oB',
          { level: 'MEDICAL', verifiedByProfileId: 'p1' } as any,
          actor,
        ),
      );
      expect(d.repo.recordVerification).not.toHaveBeenCalled();
      expect(d.repo.markTestsVerifiedForObservation).not.toHaveBeenCalled();
    });

    it('el verificador declarado debe ser el profesional que firma', async () => {
      const d = build();
      await expect(
        d.service.verifyResult(
          'o1',
          { level: 'MEDICAL', verifiedByProfileId: 'otro' } as any,
          {
            id: 'u1',
            roles: ['CLINICIAN'],
            practitionerProfileId: 'hp1',
          } as any,
        ),
      ).rejects.toMatchObject({ status: 403 });
      expect(d.repo.recordVerification).not.toHaveBeenCalled();
    });
  });
});
