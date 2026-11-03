import { jest } from '@jest/globals';
import { InsurancePatientSettlementAdapter } from './insurance-patient-settlement.adapter';

describe('InsurancePatientSettlementAdapter', () => {
  it('requests pharmacy order projections for the supplied actor and unit of work', async () => {
    const uow = {};
    const result = new Map();
    const insurance = {
      forOrders: jest.fn(async () => result),
      activeClaimForDispensation: jest.fn(async () => undefined),
    };
    const adapter = new InsurancePatientSettlementAdapter(insurance as any);

    await expect(
      adapter.forOrders(uow as any, 'user-1', ['order-1']),
    ).resolves.toBe(result);
    expect(insurance.forOrders).toHaveBeenCalledWith(
      uow,
      'user-1',
      'PHARMACY',
      ['order-1'],
    );
  });

  it('looks up the active claim before a pharmacy dispensation', async () => {
    const uow = {};
    const insurance = {
      forOrders: jest.fn(async () => new Map()),
      activeClaimForDispensation: jest.fn(async () => 'claim-1'),
    };
    const adapter = new InsurancePatientSettlementAdapter(insurance as any);

    await expect(
      adapter.activeClaimForDispensation(uow as any, 'order-1'),
    ).resolves.toBe('claim-1');
    expect(insurance.activeClaimForDispensation).toHaveBeenCalledWith(
      uow,
      'order-1',
    );
  });
});
