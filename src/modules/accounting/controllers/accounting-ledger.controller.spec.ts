import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AccountingLedgerController } from './accounting-ledger.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const ledgerService = {
    createAccount: mockFn(),
    postJournal: mockFn(),
    determineAccounts: mockFn(),
    reverseJournal: mockFn(),
    attachFile: mockFn(),
  };
  const controller = new AccountingLedgerController(ledgerService as any);
  return { controller, ledgerService };
}

describe('AccountingLedgerController', () => {
  it('delega createAccount', async () => {
    const d = build();
    const dto = { practiceId: 'p', code: 'C' };
    await d.controller.createAccount(dto as any, actor);
    expect(d.ledgerService.createAccount).toHaveBeenCalledWith(dto, actor);
  });

  it('delega postJournal (UC-16-01)', async () => {
    const d = build();
    const dto = { practiceId: 'p', lines: [] };
    await d.controller.postJournal(dto as any, actor);
    expect(d.ledgerService.postJournal).toHaveBeenCalledWith(dto, actor);
  });

  it('delega determineAccounts (UC-16-02)', async () => {
    const d = build();
    const dto = { tenantId: 't', postingScenarioConceptId: 's' };
    await d.controller.determineAccounts(dto);
    expect(d.ledgerService.determineAccounts).toHaveBeenCalledWith(dto);
  });

  it('delega reverse (UC-16-03)', async () => {
    const d = build();
    await d.controller.reverse('t1', { reason: 'x' }, actor);
    expect(d.ledgerService.reverseJournal).toHaveBeenCalledWith(
      't1',
      { reason: 'x' },
      actor,
    );
  });

  it('delega attachFile (UC-16-13)', async () => {
    const d = build();
    await d.controller.attachFile('t1', { fileId: 'f' }, actor);
    expect(d.ledgerService.attachFile).toHaveBeenCalledWith(
      't1',
      { fileId: 'f' },
      actor,
    );
  });
});
