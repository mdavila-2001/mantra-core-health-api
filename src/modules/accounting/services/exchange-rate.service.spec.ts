import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ExchangeRateService } from './exchange-rate.service';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const ratesRepo = {
    findForPair: mockFn(),
    create: mockFn((_em: any, d: any) => ({
      id: 'fx1',
      rate: d.rate,
      validOn: d.validOn,
    })),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ExchangeRateService(em as any, ratesRepo, logger as any);
  return { service, tx, ratesRepo };
}

const dto = {
  fromCurrencyConceptId: 'usd',
  toCurrencyConceptId: 'pen',
  rate: '3.75',
  validOn: '2026-01-31',
};

describe('ExchangeRateService (UC-16-14)', () => {
  it('crea una tasa nueva cuando no existe', async () => {
    const d = build();
    d.ratesRepo.findForPair.mockResolvedValue(null);
    const res = await d.service.registerRate(dto, actor);
    expect(res.created).toBe(true);
    expect(res.rate).toBe('3.75');
  });

  it('actualiza la tasa existente (upsert)', async () => {
    const d = build();
    const existing = {
      id: 'fx1',
      rate: '3.50',
      validOn: new Date('2026-01-31'),
      updatedAt: new Date(),
    };
    d.ratesRepo.findForPair.mockResolvedValue(existing);
    const res = await d.service.registerRate(dto, actor);
    expect(res.created).toBe(false);
    expect(existing.rate).toBe('3.75');
    expect(d.ratesRepo.create).not.toHaveBeenCalled();
  });
});
