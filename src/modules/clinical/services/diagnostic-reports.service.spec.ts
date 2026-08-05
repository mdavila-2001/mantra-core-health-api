import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticReportsService } from './diagnostic-reports.service';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const reportsRepo = { findById: mockFn(), create: mockFn() };
  const serviceRequestsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticReportsService(
    em as any,
    reportsRepo,
    serviceRequestsRepo as any,
    logger as any,
  );
  return { service, reportsRepo, serviceRequestsRepo };
}

/**
 * Ejecuta la operación report.
 * @returns Resultado de report.
 */
const report = () => ({
  id: 'dr1',
  patientProfileId: 'p1',
  lifecycleStatusConceptId: CLIN.REPORT_PARTIAL,
  resultReleaseStatusConceptId: CLIN.RELEASE_HELD,
  currentVersionId: 'v1',
  serviceRequestId: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  rowVersion: 1,
});

describe('DiagnosticReportsService', () => {
  describe('create (UC-08-06)', () => {
    it('creates a held report and completes the source service request', async () => {
      const d = build();
      const sr = {
        id: 'sr1',
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
        updatedAt: new Date(),
      };
      d.serviceRequestsRepo.findById.mockResolvedValue(sr);
      d.reportsRepo.create.mockReturnValue(report());

      const res = await d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          serviceRequestId: 'sr1',
        },
        actor,
      );

      expect(sr.statusConceptId).toBe(CLIN.SERVICE_REQUEST_COMPLETED);
      expect(res.lifecycleStatus).toBe(CLIN.REPORT_PARTIAL);
      expect(res.resultReleaseStatus).toBe(CLIN.RELEASE_HELD);
    });

    it('rejects when the referenced service request is missing', async () => {
      const d = build();
      d.serviceRequestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            serviceRequestId: 'missing',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('release (UC-08-07)', () => {
    it('releases a report (partial -> final, held -> released)', async () => {
      const d = build();
      const r = report();
      d.reportsRepo.findById.mockResolvedValue(r);
      const res = await d.service.release('dr1', {}, actor);
      expect(r.lifecycleStatusConceptId).toBe(CLIN.REPORT_FINAL);
      expect(r.resultReleaseStatusConceptId).toBe(CLIN.RELEASE_RELEASED);
      expect((r as any).currentReleasedVersionId).toBe('v1');
      expect(res.lifecycleStatus).toBe(CLIN.REPORT_FINAL);
    });

    it('throws when the report does not exist', async () => {
      const d = build();
      d.reportsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.release('missing', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects releasing a report in a non-releasable status', async () => {
      const d = build();
      d.reportsRepo.findById.mockResolvedValue({
        ...report(),
        lifecycleStatusConceptId: CLIN.REPORT_FINAL,
      });
      await expect(d.service.release('dr1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('rejects on optimistic version mismatch', async () => {
      const d = build();
      d.reportsRepo.findById.mockResolvedValue({ ...report(), rowVersion: 5 });
      await expect(
        d.service.release('dr1', { expectedRowVersion: 1 }, actor),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });
  });
});
