import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import { PaymentFlowRepository } from './payment-flow.repository';
import { PaymentDebts, PaymentIntents } from '../entities';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const scope = {
  id: '33333333-3333-3333-3333-333333333333',
  tenantId: '11111111-1111-1111-1111-111111111111',
  gatewayConnectionId: '22222222-2222-2222-2222-222222222222',
};

describe('PaymentFlowRepository · alcance de checkout (PAY-02)', () => {
  it('findDebtForUpdate bloquea filtrando por id, tenant y conexión, nunca sólo por UUID', async () => {
    const em = { findOne: mockFn(() => Promise.resolve(null)) };

    await new PaymentFlowRepository().findDebtForUpdate(em as any, scope);

    expect(em.findOne).toHaveBeenCalledWith(PaymentDebts, scope, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
  });

  it('findIntentForCheckout acota al tenant y a la conexión declarada (o a ninguna)', async () => {
    const em = { findOne: mockFn(() => Promise.resolve(null)) };

    await new PaymentFlowRepository().findIntentForCheckout(em as any, scope);

    expect(em.findOne).toHaveBeenCalledWith(PaymentIntents, {
      id: scope.id,
      tenantId: scope.tenantId,
      $or: [
        { gatewayConnectionId: null },
        { gatewayConnectionId: scope.gatewayConnectionId },
      ],
    });
  });
});
