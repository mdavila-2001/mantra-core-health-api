import { describe, expect, it, jest } from '@jest/globals';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { LabPortalSummaryService } from './lab-portal-summary.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';
const day = (n: number) => new Date(`2026-11-0${n}T10:00:00Z`);

describe('LabPortalSummaryService', () => {
  it('counts offerings, orders and files from real rows of the tenant', async () => {
    const offering = (id: string, status: string, updated = day(1)) => ({
      id,
      statusConceptId: status,
      displayName: `Estudio ${id}`,
      createdAt: day(1),
      updatedAt: updated,
    });
    const repo = {
      findOfferings: mockFn(async () => [
        offering('o1', DUNIT.OFFERING_ACTIVE),
        offering('o2', DUNIT.OFFERING_ACTIVE, day(3)),
        offering('o3', DUNIT.OFFERING_DRAFT),
        offering('o4', DUNIT.OFFERING_RETIRED),
      ]),
    };
    const labels = {
      findTenantNames: mockFn(async () => new Map([[LAB, 'Lab Central']])),
    };
    const meta = {
      fileName: 'h.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
    };
    const batch = {
      orders: [
        { status: 'DRAFT' },
        { status: 'PROCESSED' },
        { status: 'UPLOADED' },
        { status: 'CANCELLED' },
      ],
      files: [
        {
          fileId: 'f1',
          status: 'AVAILABLE',
          uploadedAt: day(4),
          meta,
          withdrawnAt: null,
        },
        {
          fileId: 'f2',
          status: 'WITHDRAWN',
          uploadedAt: day(2),
          meta,
          withdrawnAt: day(5),
          withdrawnReason: 'error',
        },
      ],
    };
    const snapshot = {
      loadAll: mockFn(async function* () {
        yield batch;
      }),
    };
    const service = new LabPortalSummaryService(
      { fork: () => ({}) } as any,
      repo as any,
      labels as any,
      snapshot as any,
    );
    const summary = await service.summary(LAB);
    expect(snapshot.loadAll).toHaveBeenCalledWith(expect.anything(), LAB);
    expect(repo.findOfferings).toHaveBeenCalledWith(expect.anything(), LAB);
    expect(summary).toMatchObject({
      labName: 'Lab Central',
      published: 2,
      drafts: 1,
      withdrawn: 1,
      unavailable: 0,
      ordersWithoutResults: 2,
      resultFiles: 1,
      resultBytes: 2048,
      byCategory: [{ category: 'Sin categoría', count: 3 }],
    });
    expect(summary.recentActivity.slice(0, 3).map((a) => a.kind)).toEqual([
      'RESULT_WITHDRAWN',
      'RESULT_UPLOADED',
      'SERVICE_UPDATED',
    ]);
    expect(summary.recentActivity[1].text).toBe('Se subió h.pdf (2 KB).');
  });

  it('adds up every batch of orders, not just the first one', async () => {
    const file = (id: string, bytes: number) => ({
      fileId: id,
      status: 'AVAILABLE',
      uploadedAt: day(2),
      meta: { fileName: `${id}.pdf`, contentType: '', sizeBytes: bytes },
      withdrawnAt: null,
    });
    const snapshot = {
      loadAll: mockFn(async function* () {
        yield { orders: [{ status: 'RECEIVED' }], files: [file('a', 10)] };
        yield {
          orders: [{ status: 'PROCESSED' }, { status: 'REJECTED' }],
          files: [file('b', 20)],
        };
        yield { orders: [{ status: 'DRAFT' }], files: [file('c', 30)] };
      }),
    };
    const service = new LabPortalSummaryService(
      { fork: () => ({}) } as any,
      { findOfferings: mockFn(async () => []) } as any,
      { findTenantNames: mockFn(async () => new Map()) } as any,
      snapshot as any,
    );
    const summary = await service.summary(LAB);
    expect(summary).toMatchObject({
      ordersWithoutResults: 3,
      resultFiles: 3,
      resultBytes: 60,
    });
  });
});
