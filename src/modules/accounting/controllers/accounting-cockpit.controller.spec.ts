import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AccountingCockpitController } from './accounting-cockpit.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const accountingReadService = {
    fiscalYear: mockFn(() => Promise.resolve({ fiscalYearId: 'fy1' })),
    openItems: mockFn(() => Promise.resolve({ items: [] })),
    dimensions: mockFn(() => Promise.resolve({ items: [] })),
    documentFlow: mockFn(() => Promise.resolve({ items: [] })),
    fixedAssets: mockFn(() => Promise.resolve({ items: [] })),
    accrualObjects: mockFn(() => Promise.resolve({ items: [] })),
  };
  const controller = new AccountingCockpitController(
    accountingReadService as any,
  );
  return { controller, accountingReadService };
}

describe('AccountingCockpitController', () => {
  it('delega fiscalYear con la práctica y el actor', async () => {
    const { controller, accountingReadService } = build();
    await controller.fiscalYear('prac-1', actor);
    expect(accountingReadService.fiscalYear).toHaveBeenCalledWith(
      'prac-1',
      actor,
    );
  });

  it('delega openItems con el query y el actor', async () => {
    const { controller, accountingReadService } = build();
    const query = { practiceId: 'prac-1', side: 'RECEIVABLE' as const };
    await controller.openItems(query, actor);
    expect(accountingReadService.openItems).toHaveBeenCalledWith(query, actor);
  });

  it('delega dimensions con la práctica y el actor', async () => {
    const { controller, accountingReadService } = build();
    await controller.dimensions('prac-1', actor);
    expect(accountingReadService.dimensions).toHaveBeenCalledWith(
      'prac-1',
      actor,
    );
  });

  it('delega documentFlow con el id del asiento, sin actor', async () => {
    const { controller, accountingReadService } = build();
    await controller.documentFlow('tx-1');
    expect(accountingReadService.documentFlow).toHaveBeenCalledWith('tx-1');
  });

  it('delega fixedAssets con la práctica y el actor', async () => {
    const { controller, accountingReadService } = build();
    await controller.fixedAssets('prac-1', actor);
    expect(accountingReadService.fixedAssets).toHaveBeenCalledWith(
      'prac-1',
      actor,
    );
  });

  it('delega accrualObjects con la práctica y el actor', async () => {
    const { controller, accountingReadService } = build();
    await controller.accrualObjects('prac-1', actor);
    expect(accountingReadService.accrualObjects).toHaveBeenCalledWith(
      'prac-1',
      actor,
    );
  });
});
