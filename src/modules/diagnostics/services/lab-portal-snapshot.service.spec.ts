import { describe, expect, it, jest } from '@jest/globals';
import { CLIN } from '../../clinical/clinical.concepts';
import { LabPortalSnapshotService } from './lab-portal-snapshot.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';

function order(id: string, over: Partial<any> = {}): any {
  return {
    id,
    performerTenantId: LAB,
    patientProfileId: `pat-${id}`,
    requesterProfileId: 'doc-1',
    codeConceptId: 'hemograma',
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
    createdAt: new Date('2026-11-01T10:00:00Z'),
    ...over,
  };
}

/** Repositories over in-memory rows; every read records the tenant it got. */
function rows(data: Partial<Record<string, any[]>> = {}) {
  const get = (k: string) => data[k] ?? [];
  const repo = {
    findAccessions: mockFn(async () => get('accessions')),
    findReports: mockFn(async () => get('reports')),
    findWorkOrders: mockFn(async () => get('workOrders')),
    findAccessionItems: mockFn(async () => get('items')),
    findRejections: mockFn(async () => get('rejections')),
    findFileMeta: mockFn(
      async (_em: any, ids: string[]) =>
        new Map(
          ids.map((id) => [
            id,
            {
              fileName: `${id}.pdf`,
              contentType: 'application/pdf',
              sizeBytes: 10,
            },
          ]),
        ),
    ),
    findUserNames: mockFn(async () => new Map([['u1', 'Téc. Lab']])),
  };
  const reports = {
    findVersionsByReports: mockFn(async () => get('versions')),
    findFilesByVersions: mockFn(async () => get('files')),
  };
  const labels = {
    findPatientLabels: mockFn(
      async () =>
        new Map([
          ['pat-sr-1', { displayName: 'Ana Paz', patientCode: null }],
          ['doc-1', { displayName: 'Dra. Rojas', patientCode: null }],
        ]),
    ),
    findConceptDisplays: mockFn(
      async () => new Map([['hemograma', 'Hemograma']]),
    ),
  };
  const snapshot = new LabPortalSnapshotService(
    repo as any,
    reports as any,
    labels as any,
  );
  return { snapshot, repo };
}

describe('LabPortalSnapshotService', () => {
  it('an order without performer rows is DRAFT, with names resolved', async () => {
    const { snapshot } = rows();
    const { orders } = await snapshot.load({} as any, LAB, [order('sr-1')]);
    expect(orders[0]).toMatchObject({
      status: 'DRAFT',
      studyName: 'Hemograma',
      patientName: 'Ana Paz',
      requesterName: 'Dra. Rojas',
      reason: null,
    });
  });

  it('reads every performer row scoped by the active tenant', async () => {
    const { snapshot, repo } = rows({
      accessions: [{ id: 'acc-1', serviceRequestId: 'sr-1' }],
    });
    await snapshot.load({} as any, LAB, [order('sr-1')]);
    expect(repo.findAccessions).toHaveBeenCalledWith({}, LAB, ['sr-1']);
    expect(repo.findReports).toHaveBeenCalledWith({}, LAB, ['sr-1']);
    expect(repo.findWorkOrders).toHaveBeenCalledWith({}, LAB, ['acc-1']);
  });

  it('accession → RECEIVED; completed work order → PROCESSED', async () => {
    const accessions = [{ id: 'acc-1', serviceRequestId: 'sr-1' }];
    const received = rows({ accessions });
    expect(
      (await received.snapshot.load({} as any, LAB, [order('sr-1')])).orders[0]
        .status,
    ).toBe('RECEIVED');
    const processed = rows({
      accessions,
      workOrders: [{ laboratoryAccessionId: 'acc-1', completedAt: new Date() }],
    });
    expect(
      (await processed.snapshot.load({} as any, LAB, [order('sr-1')])).orders[0]
        .status,
    ).toBe('PROCESSED');
  });

  it('a rejected specimen makes the order REJECTED with its reason', async () => {
    const { snapshot } = rows({
      accessions: [{ id: 'acc-1', serviceRequestId: 'sr-1' }],
      items: [{ laboratoryAccessionId: 'acc-1', specimenId: 'sp-1' }],
      rejections: [{ specimenId: 'sp-1', notes: 'Muestra hemolizada' }],
    });
    const [view] = (await snapshot.load({} as any, LAB, [order('sr-1')]))
      .orders;
    expect(view.status).toBe('REJECTED');
    expect(view.reason).toBe('Muestra hemolizada');
    expect(view.openSpecimenIds).toEqual([]);
  });

  it('a revoked order is CANCELLED', async () => {
    const { snapshot } = rows();
    const [view] = (
      await snapshot.load({} as any, LAB, [
        order('sr-1', { statusConceptId: CLIN.SERVICE_REQUEST_REVOKED }),
      ])
    ).orders;
    expect(view.status).toBe('CANCELLED');
  });

  it('files of the latest report version make it UPLOADED', async () => {
    const at = new Date('2026-11-02T10:00:00Z');
    const { snapshot } = rows({
      accessions: [{ id: 'acc-1', serviceRequestId: 'sr-1' }],
      workOrders: [{ laboratoryAccessionId: 'acc-1', completedAt: at }],
      reports: [{ id: 'r1', serviceRequestId: 'sr-1' }],
      versions: [
        {
          id: 'v1',
          diagnosticReportId: 'r1',
          versionNumber: 1,
          conclusionText: 'ok',
        },
      ],
      files: [
        {
          diagnosticReportVersionId: 'v1',
          fileId: 'f1',
          createdAt: at,
          createdByUserId: 'u1',
        },
      ],
    });
    const snap = await snapshot.load({} as any, LAB, [order('sr-1')]);
    expect(snap.orders[0].status).toBe('UPLOADED');
    expect(snap.files[0]).toMatchObject({
      fileId: 'f1',
      orderId: 'sr-1',
      kind: 'PDF',
      uploadedBy: 'Téc. Lab',
      orderLabel: 'Hemograma · pedido por Dra. Rojas',
      patientName: 'Ana Paz',
      note: 'ok',
      status: 'AVAILABLE',
    });
  });
});
