import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DIAG } from '../diagnostics.concepts';
import { LabPortalResultWritesService } from './lab-portal-result-writes.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';
const actor = { id: 'user-1' } as any;

const file = (fileId: string, reportId: string, status = 'AVAILABLE'): any => ({
  fileId,
  reportId,
  status,
  orderId: 'sr-1',
  uploadedAt: new Date('2026-11-02T10:00:00Z'),
  meta: {
    fileName: `${fileId}.pdf`,
    contentType: 'application/pdf',
    sizeBytes: 3,
  },
  kind: 'PDF',
  uploadedBy: 'Téc.',
  orderLabel: 'Hemograma · pedido por Dra. Rojas',
  patientName: 'Ana',
  note: null,
  withdrawnReason: status === 'WITHDRAWN' ? 'error' : null,
});

function build(view: any) {
  const tx = {
    flush: mockFn(async () => undefined),
    nativeUpdate: mockFn(async () => 1),
  };
  const em = {
    transactional: mockFn(async (cb: any) => cb(tx)),
    fork: () => tx,
  };
  const repo = { findWorkOrders: mockFn(async () => [{ id: 'wo-1' }]) };
  const version: any = { id: 'v-new' };
  const reports = {
    maxVersionNumber: mockFn(async () => 1),
    createVersion: mockFn(() => version),
    addFile: mockFn(),
    recordReleaseEvent: mockFn(),
  };
  const newReport: any = { id: 'r-new' };
  const clinicalReports = { create: mockFn(() => newReport) };
  const orders = { markReportReleased: mockFn() };
  const reads = {
    assertUploadable: mockFn(async () => view),
    locate: mockFn(async (_em: any, _t: string, fileId: string) => ({
      view,
      file:
        view.files.find((f: any) => f.fileId === fileId) ?? file(fileId, 'r1'),
    })),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new LabPortalResultWritesService(
    em as any,
    repo as any,
    reports as any,
    clinicalReports as any,
    orders as any,
    reads as any,
    logger as any,
  );
  return {
    service,
    tx,
    reports,
    clinicalReports,
    orders,
    reads,
    version,
    newReport,
  };
}

const baseView = (over: Partial<any> = {}): any => ({
  order: {
    id: 'sr-1',
    patientProfileId: 'pat-1',
    codeConceptId: 'hemograma',
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  },
  accession: { id: 'acc-1' },
  reports: [],
  files: [],
  ...over,
});

describe('LabPortalResultWritesService', () => {
  it('attach: first result creates the performer report and releases a visible version', async () => {
    const t = build(baseView());
    const dto = await t.service.attach(
      LAB,
      'sr-1',
      'f-new',
      'Ver página 2',
      actor,
    );
    expect(t.reads.assertUploadable).toHaveBeenCalledWith(
      expect.anything(),
      LAB,
      'sr-1',
    );
    expect(t.clinicalReports.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        custodianTenantId: LAB,
        patientProfileId: 'pat-1',
        serviceRequestId: 'sr-1',
        codeConceptId: 'hemograma',
      }),
    );
    expect(t.reports.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        diagnosticReportId: 'r-new',
        versionNumber: 2,
        custodianTenantId: LAB,
        clinicalStatusConceptId: DIAG.REPORT_FINAL,
        conclusionText: 'Ver página 2',
      }),
    );
    expect(t.reports.addFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        diagnosticReportVersionId: 'v-new',
        fileId: 'f-new',
      }),
    );
    expect(t.reports.recordReleaseEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        diagnosticReportVersionId: 'v-new',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
      }),
    );
    expect(t.orders.markReportReleased).toHaveBeenCalledWith(
      expect.anything(),
      t.newReport,
      'v-new',
      DIAG.VISIBILITY_PATIENT_VISIBLE,
      'user-1',
    );
    expect(t.tx.nativeUpdate).toHaveBeenCalled();
    expect(dto).toMatchObject({ id: 'f-new', notified: false });
  });

  it('attach: a later result keeps the available files of the existing report', async () => {
    const report = { id: 'r1', currentVersionId: 'v1' };
    const t = build(
      baseView({
        reports: [report],
        files: [file('f1', 'r1'), file('f0', 'r1', 'WITHDRAWN')],
      }),
    );
    await t.service.attach(LAB, 'sr-1', 'f2', null, actor);
    expect(t.clinicalReports.create).not.toHaveBeenCalled();
    expect(t.reports.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ supersedesVersionId: 'v1' }),
    );
    const attached = t.reports.addFile.mock.calls.map(
      (c: any[]) => c[1].fileId,
    );
    expect(attached).toEqual(['f1', 'f2']);
  });

  it('withdraw: publishes a version without the file, with the reason', async () => {
    const report = { id: 'r1', currentVersionId: 'v2' };
    const t = build(
      baseView({
        reports: [report],
        files: [file('f1', 'r1'), file('f2', 'r1')],
      }),
    );
    await t.service.withdraw(LAB, 'f1', 'Paciente equivocado', actor);
    expect(t.reads.locate).toHaveBeenCalledWith(expect.anything(), LAB, 'f1');
    expect(t.reports.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amendmentReasonText: 'Paciente equivocado' }),
    );
    const kept = t.reports.addFile.mock.calls.map((c: any[]) => c[1].fileId);
    expect(kept).toEqual(['f2']);
  });

  it('withdraw: an already withdrawn file is 409 and writes nothing', async () => {
    const t = build(
      baseView({
        reports: [{ id: 'r1' }],
        files: [file('f1', 'r1', 'WITHDRAWN')],
      }),
    );
    await expect(
      t.service.withdraw(LAB, 'f1', 'otra vez', actor),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(t.reports.createVersion).not.toHaveBeenCalled();
  });
});
