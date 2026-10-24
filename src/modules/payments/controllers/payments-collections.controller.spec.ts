import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { PaymentsCollectionsController } from './payments-collections.controller';

const handlers = PaymentsCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('PaymentsCollectionsController', () => {
  it('listCheckoutSessions exige PAYMENTS_ADMIN, CASHIER y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listCheckoutSessions),
    ).toEqual(['PAYMENTS_ADMIN', 'CASHIER']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCheckoutSessions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PaymentsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listCheckoutSessions(query)).resolves.toBe(page);
    expect(service.listCheckoutSessions).toHaveBeenCalledWith(query);
  });

  it('listFeeSchedules exige PAYMENTS_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listFeeSchedules)).toEqual([
      'PAYMENTS_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listFeeSchedules: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PaymentsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listFeeSchedules(query)).resolves.toBe(page);
    expect(service.listFeeSchedules).toHaveBeenCalledWith(query);
  });

  it('listIntents exige PAYMENTS_ADMIN, CASHIER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listIntents)).toEqual([
      'PAYMENTS_ADMIN',
      'CASHIER',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listIntents: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PaymentsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listIntents(query)).resolves.toBe(page);
    expect(service.listIntents).toHaveBeenCalledWith(query);
  });

  it('listPayouts exige PAYMENTS_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listPayouts)).toEqual([
      'PAYMENTS_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPayouts: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PaymentsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPayouts(query)).resolves.toBe(page);
    expect(service.listPayouts).toHaveBeenCalledWith(query);
  });

  it('listReconciliationRuns exige PAYMENTS_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listReconciliationRuns),
    ).toEqual(['PAYMENTS_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listReconciliationRuns: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new PaymentsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listReconciliationRuns(query)).resolves.toBe(page);
    expect(service.listReconciliationRuns).toHaveBeenCalledWith(query);
  });
});
