import { describe, expect, it, jest } from '@jest/globals';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { LabPortalSummaryService } from './lab-portal-summary.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';
const day = (n: number) => new Date(`2026-11-0${n}T10:00:00Z`);

describe('LabPortalSummaryService', () => {
  it('counts offerings, orders and files from real rows of the tenant', async () => {
    const offering = (
      id: string,
      status: string,
      updated = day(1),
      extra: Record<string, unknown> = {},
    ) => ({
      id,
      statusConceptId: status,
      displayName: `Estudio ${id}`,
      available: true,
      createdAt: day(1),
      updatedAt: updated,
      ...extra,
    });
    const repo = {
      findOfferings: mockFn(async () => [
        offering('o1', DUNIT.OFFERING_ACTIVE, day(1), {
          serviceCategoryId: 'c1',
        }),
        offering('o2', DUNIT.OFFERING_ACTIVE, day(3), {
          serviceCategoryId: 'c1',
          available: false,
        }),
        offering('o3', DUNIT.OFFERING_DRAFT, day(1), { available: false }),
        offering('o4', DUNIT.OFFERING_RETIRED, day(1), {
          serviceCategoryId: 'c1',
          available: false,
        }),
      ]),
      findCategories: mockFn(async () => [{ id: 'c1', name: 'Hematología' }]),
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
    expect(repo.findCategories).toHaveBeenCalledWith(expect.anything(), LAB);
    expect(summary).toMatchObject({
      labName: 'Lab Central',
      published: 2,
      drafts: 1,
      withdrawn: 1,
      // o2 and o3 are switched off; the withdrawn o4 no longer counts.
      unavailable: 2,
      ordersWithoutResults: 2,
      resultFiles: 1,
      resultBytes: 2048,
      byCategory: [
        { categoryId: 'c1', category: 'Hematología', count: 2 },
        { categoryId: null, category: 'Sin categoría', count: 1 },
      ],
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
      {
        findOfferings: mockFn(async () => []),
        findCategories: mockFn(async () => []),
      } as any,
      { findTenantNames: mockFn(async () => new Map()) } as any,
      snapshot as any,
    );
    const summary = await service.summary(LAB);
    expect(summary).toMatchObject({
      ordersWithoutResults: 3,
      resultFiles: 3,
      resultBytes: 60,
      unavailable: 0,
      byCategory: [],
    });
  });
});
