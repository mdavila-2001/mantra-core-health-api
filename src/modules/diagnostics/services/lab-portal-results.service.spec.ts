import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { LabPortalResultsService } from './lab-portal-results.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';

const file = (fileId: string, over: Partial<any> = {}): any => ({
  fileId,
  reportId: 'r1',
  orderId: 'sr-1',
  status: 'AVAILABLE',
  uploadedAt: new Date('2026-11-02T10:00:00Z'),
  meta: {
    fileName: `${fileId}.pdf`,
    contentType: 'application/pdf',
    sizeBytes: 10,
  },
  kind: 'PDF',
  uploadedBy: 'Téc.',
  orderLabel: 'Hemograma · pedido por Dra. Rojas',
  patientName: 'Ana Peñaranda',
  note: null,
  withdrawnReason: null,
  ...over,
});

const view = (status: string, files: any[] = []): any => ({
  order: { id: 'sr-1', createdAt: new Date('2026-11-01T10:00:00Z') },
  status,
  studyName: 'Hemograma',
  patientName: 'Ana Peñaranda',
  requesterName: 'Dra. Rojas',
  files,
});

function build(snap: { orders: any[]; files: any[] }, em: any = {}) {
  const repo = {
    findOrders: mockFn(async () => [{ id: 'sr-1' }]),
    findOrder: mockFn(async () => ({ id: 'sr-1' })),
    findReportsByIds: mockFn(async () => [
      { id: 'r1', serviceRequestId: 'sr-1' },
    ]),
  };
  const snapshot = {
    load: mockFn(async () => snap),
    loadAll: mockFn(async function* () {
      yield snap;
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const fileUpload = {
    downloadForAuthorizedContext: mockFn(async () => ({
      buffer: Buffer.from('x'),
    })),
  };
  const service = new LabPortalResultsService(
    { fork: () => em } as any,
    repo as any,
    snapshot as any,
    logger as any,
    fileUpload as any,
  );
  return { service, repo, fileUpload, snapshot };
}

describe('LabPortalResultsService', () => {
  const files = [
    file('a', { uploadedAt: new Date('2026-11-01T10:00:00Z') }),
    file('b', {
      kind: 'IMAGE',
      meta: { fileName: 'rx.png', contentType: 'image/png', sizeBytes: 5 },
    }),
    file('c', { status: 'WITHDRAWN', withdrawnReason: 'error' }),
  ];

  it('lists the available files, newest first, with the total bytes', async () => {
    const t = build({ orders: [], files });
    const page = await t.service.list(LAB, {});
    expect(t.snapshot.loadAll).toHaveBeenCalledWith(expect.anything(), LAB);
    expect(page.items.map((i) => i.id)).toEqual(['b', 'a']);
    expect(page.totalBytes).toBe(15);
    expect(page.items[0]).toMatchObject({ notified: false, orderId: 'sr-1' });
  });

  it('filters by kind, withdrawn and accent-insensitive text', async () => {
    const t = build({ orders: [], files });
    expect((await t.service.list(LAB, { kind: 'IMAGE' })).count).toBe(1);
    expect((await t.service.list(LAB, { includeWithdrawn: true })).count).toBe(
      3,
    );
    expect((await t.service.list(LAB, { q: 'PENARANDA' })).count).toBe(2);
    expect((await t.service.list(LAB, { q: 'rx.png' })).items[0].id).toBe('b');
  });

  it('targets are the processed orders, with their available file count', async () => {
    const t = build({
      orders: [
        view('PROCESSED'),
        view('UPLOADED', [file('a'), file('c', { status: 'WITHDRAWN' })]),
        view('DRAFT'),
      ],
      files: [],
    });
    const page = await t.service.targets(LAB);
    expect(page.items.map((i) => i.fileCount)).toEqual([0, 1]);
  });

  it('assertUploadable: 409 before PROCESSED, 404 for a foreign order', async () => {
    const t = build({ orders: [view('RECEIVED')], files: [] });
    await expect(
      t.service.assertUploadable({} as any, LAB, 'sr-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    t.repo.findOrder.mockResolvedValueOnce(null);
    await expect(
      t.service.assertUploadable({} as any, 'other', 'sr-1'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('content: only a file of a report the tenant keeps is served', async () => {
    const em = {
      find: mockFn(async (_e: any, where: any) =>
        where.fileId
          ? [{ diagnosticReportVersionId: 'v1' }]
          : [{ id: 'v1', diagnosticReportId: 'r1', custodianTenantId: LAB }],
      ),
    };
    const ok = build(
      { orders: [view('UPLOADED', [file('a')])], files: [] },
      em,
    );
    await ok.service.content(LAB, 'a');
    expect(ok.fileUpload.downloadForAuthorizedContext).toHaveBeenCalledWith(
      'a',
      'diagnostics.lab-portal.result.content',
    );

    const foreign = build(
      { orders: [view('UPLOADED', [file('a')])], files: [] },
      em,
    );
    await expect(
      foreign.service.content('other-lab', 'a'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(foreign.repo.findReportsByIds).not.toHaveBeenCalled();
    expect(
      foreign.fileUpload.downloadForAuthorizedContext,
    ).not.toHaveBeenCalled();
  });

  it('lists the files and targets of every batch of orders', async () => {
    const t = build({ orders: [], files: [] });
    t.snapshot.loadAll.mockImplementation(async function* () {
      yield { orders: [view('PROCESSED')], files: [file('new')] };
      yield {
        orders: [view('UPLOADED', [file('old')])],
        files: [file('old', { uploadedAt: new Date('2025-01-01T00:00:00Z') })],
      };
    });
    const page = await t.service.list(LAB, {});
    expect(page.items.map((i) => i.id)).toEqual(['new', 'old']);
    expect((await t.service.targets(LAB)).count).toBe(2);
  });
});
