import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { ErpCollectionsController } from './erp-collections.controller';

const handlers = ErpCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('ErpCollectionsController', () => {
  it('listBusinessPartners exige ERP_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listBusinessPartners),
    ).toEqual(['ERP_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listBusinessPartners: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ErpCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listBusinessPartners(query)).resolves.toBe(page);
    expect(service.listBusinessPartners).toHaveBeenCalledWith(query);
  });

  it('listContracts exige ERP_ADMIN, CONTRACT_MANAGER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listContracts)).toEqual([
      'ERP_ADMIN',
      'CONTRACT_MANAGER',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listContracts: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ErpCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listContracts(query)).resolves.toBe(page);
    expect(service.listContracts).toHaveBeenCalledWith(query);
  });

  it('listPurchaseOrders exige ERP_ADMIN, BUYER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listPurchaseOrders)).toEqual(
      ['ERP_ADMIN', 'BUYER'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPurchaseOrders: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ErpCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPurchaseOrders(query)).resolves.toBe(page);
    expect(service.listPurchaseOrders).toHaveBeenCalledWith(query);
  });

  it('listGoodsReceipts exige ERP_ADMIN, BUYER, WAREHOUSE y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listGoodsReceipts)).toEqual([
      'ERP_ADMIN',
      'BUYER',
      'WAREHOUSE',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listGoodsReceipts: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ErpCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listGoodsReceipts('id-1', query)).resolves.toBe(
      page,
    );
    expect(service.listGoodsReceipts).toHaveBeenCalledWith('id-1', query);
  });

  it('listServiceEntrySheets exige ERP_ADMIN, BUYER y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listServiceEntrySheets),
    ).toEqual(['ERP_ADMIN', 'BUYER']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listServiceEntrySheets: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ErpCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listServiceEntrySheets('id-1', query),
    ).resolves.toBe(page);
    expect(service.listServiceEntrySheets).toHaveBeenCalledWith('id-1', query);
  });

  it('listSalesOrders exige ERP_ADMIN, SALES y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listSalesOrders)).toEqual([
      'ERP_ADMIN',
      'SALES',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listSalesOrders: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ErpCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listSalesOrders(query)).resolves.toBe(page);
    expect(service.listSalesOrders).toHaveBeenCalledWith(query);
  });
});
