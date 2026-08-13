import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AccountingLedgerController } from './accounting-ledger.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const ledgerService = {
    createAccount: mockFn(),
    postJournal: mockFn(),
    createDraft: mockFn(),
    classify: mockFn(),
    submitForReview: mockFn(),
    approve: mockFn(),
    post: mockFn(),
    determineAccounts: mockFn(),
    reverseJournal: mockFn(),
    attachFile: mockFn(),
  };
  const controller = new AccountingLedgerController(
    ledgerService as any,
    ledgerReadDoble as never,
  );
  return { controller, ledgerService };
}

const ledgerReadDoble = {
  chartOfAccounts: (() =>
    Promise.resolve({ items: [], count: 0, limit: 100 })) as never,
  listJournal: (() =>
    Promise.resolve({ items: [], count: 0, limit: 100 })) as never,
  getJournalTransaction: (() => Promise.resolve({})) as never,
  trialBalance: (() => Promise.resolve({})) as never,
};

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

  it('delega el flujo de estados (REDESA C-17)', async () => {
    const d = build();
    await d.controller.createDraft(
      { practiceId: 'p', lines: [] } as any,
      actor,
    );
    expect(d.ledgerService.createDraft).toHaveBeenCalled();

    await d.controller.classify('t1', {}, actor);
    expect(d.ledgerService.classify).toHaveBeenCalledWith('t1', {}, actor);

    await d.controller.submitReview('t1', {}, actor);
    expect(d.ledgerService.submitForReview).toHaveBeenCalledWith(
      't1',
      {},
      actor,
    );

    await d.controller.approve('t1', {}, actor);
    expect(d.ledgerService.approve).toHaveBeenCalledWith('t1', {}, actor);

    await d.controller.post('t1', {}, actor);
    expect(d.ledgerService.post).toHaveBeenCalledWith('t1', {}, actor);
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
