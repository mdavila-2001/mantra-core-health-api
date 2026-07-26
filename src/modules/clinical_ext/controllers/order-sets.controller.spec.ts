import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrderSetsController } from './order-sets.controller';

const actor = { id: 'md-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const orderSetsService = { create: mockFn(), apply: mockFn() };
  const controller = new OrderSetsController(orderSetsService as any);
  return { controller, orderSetsService };
}

describe('OrderSetsController', () => {
  it('delegates create', async () => {
    const d = build();
    const dto = { code: 'OS1', name: 'S', items: [] };
    await d.controller.create(dto as any, actor);
    expect(d.orderSetsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates apply (UC-18-06)', async () => {
    const d = build();
    const dto = { encounterId: 'e1', patientProfileId: 'p1' };
    await d.controller.apply('os1', dto as any, actor);
    expect(d.orderSetsService.apply).toHaveBeenCalledWith('os1', dto, actor);
  });
});
