import { describe, expect, it, jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import { DiagnosticReports, ServiceRequests } from '../../clinical/entities';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticReportVersions } from '../entities';
import { expectNotAvailable } from './diagnostics.testing';
import { ReportReleaseService } from './report-release.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const doctor = { id: 'u-doc' } as any;

function build(
  opts: { custodian?: string; lastVisibility?: string; draft?: any } = {},
) {
  const report = { id: 'r1', serviceRequestId: 'sr1', patientProfileId: 'pat' };
  const order = {
    id: 'sr1',
    custodianTenantId: opts.custodian ?? 'clinic',
    codeConceptId: 'hemo',
  };
  const version = {
    id: 'v1',
    contentHash: 'h'.repeat(64),
    issuedAt: new Date('2026-11-05T12:00:00Z'),
  };
  const tx: any = {
    findOne: mockFn(async (cls: any) =>
      cls === DiagnosticReports
        ? report
        : cls === ServiceRequests
          ? order
          : cls === DiagnosticReportVersions
            ? version
            : null,
    ),
    lock: mockFn(async () => undefined),
    flush: mockFn(async () => undefined),
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn(async (cb: any) => cb(tx)),
  };
  const draft =
    opts.draft === undefined
      ? {
          publishedVersionId: 'v1',
          custodianTenantId: 'lab',
          serviceRequestId: 'sr1',
        }
      : opts.draft;
  const drafts = {
    findPublishedByReport: mockFn(async () => draft),
    findPublishedByVersion: mockFn(async () => draft),
  };
  const reports = {
    findReleaseEventsByVersions: mockFn(async () => [
      {
        patientVisibilityConceptId:
          opts.lastVisibility ?? DIAG.VISIBILITY_PATIENT_HIDDEN,
      },
    ]),
    recordReleaseEvent: mockFn(),
  };
  const orders = { markReportReleased: mockFn() };
  const labels = {
    findConceptDisplays: mockFn(async () => new Map([['hemo', 'Hemograma']])),
    findTenantNames: mockFn(async () => new Map([['lab', 'Laboratorio Sur']])),
  };
  const notices = { releasedToPatient: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ReportReleaseService(
    em,
    drafts as any,
    reports as any,
    orders as any,
    labels as any,
    notices as any,
    logger as any,
  );
  return { service, reports, orders, notices, report };
}

describe('ReportReleaseService', () => {
  it('the issuing tenant releases a HELD report: new VISIBLE event on the same version, patient notified', async () => {
    const t = build();
    await expect(
      t.service.releaseToPatient('clinic', 'r1', doctor),
    ).resolves.toEqual({
      reportId: 'r1',
      versionId: 'v1',
      patientVisibility: 'VISIBLE',
    });
    expect(t.reports.recordReleaseEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        diagnosticReportVersionId: 'v1',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
      }),
    );
    expect(t.orders.markReportReleased).toHaveBeenCalledWith(
      expect.anything(),
      t.report,
      'v1',
      DIAG.VISIBILITY_PATIENT_VISIBLE,
      'u-doc',
    );
    expect(t.notices.releasedToPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        patientProfileId: 'pat',
        studyName: 'Hemograma',
      }),
    );
  });

  it('another tenant, or a report outside this flow, is the uniform 404', async () => {
    await expectNotAvailable(
      build({ custodian: 'other' }).service.releaseToPatient(
        'clinic',
        'r1',
        doctor,
      ),
    );
    await expectNotAvailable(
      build({ draft: null }).service.releaseToPatient('clinic', 'r1', doctor),
    );
  });

  it('an already visible report is 409 and records nothing', async () => {
    const t = build({ lastVisibility: DIAG.VISIBILITY_PATIENT_VISIBLE });
    await expect(
      t.service.releaseToPatient('clinic', 'r1', doctor),
    ).rejects.toMatchObject({ status: 409 });
    expect(t.reports.recordReleaseEvent).not.toHaveBeenCalled();
  });

  it('verify answers status, date, issuer, study and hash, and nothing about the patient', async () => {
    const result = await build().service.verify('v1');
    expect(result).toEqual({
      status: 'PUBLISHED',
      issuedAt: '2026-11-05T12:00:00.000Z',
      issuerName: 'Laboratorio Sur',
      studyName: 'Hemograma',
      contentHash: 'h'.repeat(64),
    });
    await expect(
      build({ draft: null }).service.verify('v9'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
