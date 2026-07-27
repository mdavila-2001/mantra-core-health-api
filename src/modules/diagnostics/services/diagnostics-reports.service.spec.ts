import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsReportsService } from './diagnostics-reports.service';
import { DIAG } from '../diagnostics.concepts';
import {
  ResourceNotFoundException,
  ConflictException,
  PreconditionFailedException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findVersion: mockFn(),
    findVersionInReport: mockFn(),
    findCriticalNotification: mockFn(),
    maxVersionNumber: mockFn().mockResolvedValue(0),
    createVersion: mockFn(),
    addResult: mockFn(),
    addFile: mockFn(),
    recordReleaseEvent: mockFn(),
    createCriticalNotification: mockFn(),
    criticalExistsForObservation: mockFn().mockResolvedValue(false),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsReportsService(em as any, repo, logger as any);
  return { service, tx, repo };
}

describe('DiagnosticsReportsService', () => {
  describe('createReportVersion (UC-20-07)', () => {
    it('requires custodian tenant', async () => {
      const d = build();
      await expect(
        d.service.createReportVersion('r1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates version numbered next and links results', async () => {
      const d = build();
      d.repo.maxVersionNumber.mockResolvedValue(2);
      d.repo.createVersion.mockReturnValue({
        id: 'v3',
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      });

      const res = await d.service.createReportVersion(
        'r1',
        { custodianTenantId: 't1', results: [{ observationId: 'o1' }] },
        actor,
      );

      expect(res).toEqual({ id: 'v3', status: DIAG.REPORT_PRELIMINARY });
      expect(d.repo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 3,
          releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        }),
      );
      expect(d.repo.addResult).toHaveBeenCalled();
    });

    it('throws when superseded version not in report', async () => {
      const d = build();
      d.repo.findVersionInReport.mockResolvedValue(null);
      await expect(
        d.service.createReportVersion(
          'r1',
          { custodianTenantId: 't1', supersedesVersionId: 'vX' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('releaseVersion (UC-20-08)', () => {
    it('throws when version missing', async () => {
      const d = build();
      d.repo.findVersionInReport.mockResolvedValue(null);
      await expect(
        d.service.releaseVersion('r1', 'v1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('releases an eligible preliminary version', async () => {
      const d = build();
      const version = {
        id: 'v1',
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      };
      d.repo.findVersionInReport.mockResolvedValue(version);

      const res = await d.service.releaseVersion('r1', 'v1', {}, actor);

      expect(res).toEqual({ id: 'v1', status: DIAG.REPORT_FINAL });
      expect(version.clinicalStatusConceptId).toBe(DIAG.REPORT_FINAL);
      expect(d.repo.recordReleaseEvent).toHaveBeenCalled();
    });

    it('conflicts when already released', async () => {
      const d = build();
      d.repo.findVersionInReport.mockResolvedValue({
        id: 'v1',
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        clinicalStatusConceptId: DIAG.REPORT_FINAL,
      });
      await expect(
        d.service.releaseVersion('r1', 'v1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('detectCritical (UC-20-09)', () => {
    it('conflicts on duplicate critical for observation', async () => {
      const d = build();
      d.repo.criticalExistsForObservation.mockResolvedValue(true);
      await expect(
        d.service.detectCritical(
          {
            observationId: 'o1',
            patientProfileId: 'p1',
            custodianTenantId: 't1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a pending notification', async () => {
      const d = build();
      d.repo.createCriticalNotification.mockReturnValue({
        id: 'n1',
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
      });
      const res = await d.service.detectCritical(
        {
          observationId: 'o1',
          patientProfileId: 'p1',
          custodianTenantId: 't1',
        },
        actor,
      );
      expect(res).toEqual({ id: 'n1', status: DIAG.CRITICAL_PENDING });
    });
  });

  describe('acknowledgeCritical (UC-20-10)', () => {
    it('escalates when SLA elapsed', async () => {
      const d = build();
      const notification = {
        id: 'n1',
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
        escalationDueAt: new Date(Date.now() - 1000),
      };
      d.repo.findCriticalNotification.mockResolvedValue(notification);
      const res = await d.service.acknowledgeCritical(
        'n1',
        { acknowledgedByProfileId: 'p1' },
        actor,
      );
      expect(res.status).toBe(DIAG.CRITICAL_ESCALATED);
    });

    it('acknowledges within SLA', async () => {
      const d = build();
      d.repo.findCriticalNotification.mockResolvedValue({
        id: 'n1',
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
        escalationDueAt: new Date(Date.now() + 60_000),
      });
      const res = await d.service.acknowledgeCritical(
        'n1',
        { acknowledgedByProfileId: 'p1' },
        actor,
      );
      expect(res.status).toBe(DIAG.CRITICAL_ACKNOWLEDGED);
    });
  });
});
