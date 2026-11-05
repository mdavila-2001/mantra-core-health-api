import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ConflictException, ErrorCode } from '../../../common';
import { AccountingErrorReason } from '../accounting.error-reasons';
import { ACCT } from '../accounting.concepts';
import { flushJournalHeader } from './journal-number-conflict';
import { LedgerService } from './ledger.service';
import { buildScope, inTenant } from './accounting-scope.testing';

const NUMBER_INDEX = 'uq_journal_transactions_practice_id_transaction_number';
/** Índice global que el patch 2026-10-24 retira: ya no respalda el número. */
const RETIRED_GLOBAL_INDEX = 'uq_journal_transactions_transaction_number';

/**
 * Error de base como lo entrega el driver: SQLSTATE y restricción en el error,
 * con el SQL y el detalle que nunca deben llegar al cliente.
 *
 * @param code - SQLSTATE.
 * @param constraint - Nombre de la restricción.
 * @returns El error simulado.
 */
function dbError(code: string, constraint: string): Error {
  return Object.assign(
    new Error(
      'insert into "accounting"."journal_transactions" ... duplicate key value',
    ),
    {
      code,
      constraint,
      detail:
        'Key (practice_id, transaction_number)=(p1, JT-1) already exists.',
    },
  );
}

/**
 * Captura el rechazo para inspeccionarlo.
 *
 * @param promise - Operación que debe fallar.
 * @returns La excepción lanzada.
 */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un rechazo');
}

describe('flushJournalHeader (ACC-02)', () => {
  it('persiste sin más cuando no hay choque', async () => {
    const tx = { flush: mockFn().mockResolvedValue(undefined) };

    await expect(
      flushJournalHeader(tx as any, 'JT-1'),
    ).resolves.toBeUndefined();
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });

  it('traduce la violación del índice del número a 409 catalogado, sin SQL ni índice', async () => {
    const tx = {
      flush: mockFn().mockRejectedValue(dbError('23505', NUMBER_INDEX)),
    };

    const error = await rejection(flushJournalHeader(tx as any, 'JT-1'));

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getStatus()).toBe(409);
    expect(error.code).toBe(ErrorCode.CONFLICT);
    expect(error.reason).toBe(
      AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
    );
    expect(error.details).toEqual({ transactionNumber: 'JT-1' });
    expect(JSON.stringify(error.getResponse())).not.toMatch(
      /insert into|uq_journal|duplicate key|Key \(/,
    );
  });

  it('encuentra la violación aunque venga envuelta en la causa del error', async () => {
    const wrapped = Object.assign(new Error('driver'), {
      cause: dbError('23505', NUMBER_INDEX),
    });
    const tx = { flush: mockFn().mockRejectedValue(wrapped) };

    await expect(flushJournalHeader(tx as any, 'JT-1')).rejects.toMatchObject({
      reason: AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
    });
  });

  it('otra violación de unicidad no se disfraza de choque de número', async () => {
    const other = dbError('23505', 'uq_otro_indice');
    const tx = { flush: mockFn().mockRejectedValue(other) };

    await expect(flushJournalHeader(tx as any, 'JT-1')).rejects.toBe(other);
  });

  it('el índice global retirado ya no se traduce: el número es único por práctica', async () => {
    const retired = dbError('23505', RETIRED_GLOBAL_INDEX);
    const tx = { flush: mockFn().mockRejectedValue(retired) };

    await expect(flushJournalHeader(tx as any, 'JT-1')).rejects.toBe(retired);
  });

  it('un fallo de base que no es de unicidad se propaga intacto', async () => {
    const other = dbError('40001', NUMBER_INDEX);
    const tx = { flush: mockFn().mockRejectedValue(other) };

    await expect(flushJournalHeader(tx as any, 'JT-1')).rejects.toBe(other);
  });
});

describe('LedgerService · número de asiento duplicado en la base (ACC-02)', () => {
  const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
  const body = {
    practiceId: 'p1',
    transactionNumber: 'JT-1',
    transactionDate: '2026-01-31',
    lines: [
      { accountId: 'acc-d', direction: 'DEBIT', amount: '100.00' },
      { accountId: 'acc-c', direction: 'CREDIT', amount: '100.00' },
    ],
  } as any;

  /**
   * Servicio con un `flush` que choca con el índice del número, como pasa en la
   * carrera entre dos altas del mismo número en la misma práctica.
   *
   * @returns El servicio y los dobles que importan.
   */
  function build() {
    const tx = {
      flush: mockFn().mockRejectedValue(dbError('23505', NUMBER_INDEX)),
    };
    const em = {
      transactional: mockFn((cb: any) => cb(tx)),
      fork: mockFn(() => tx),
    };
    const journalRepo = {
      // La lectura previa no ve el alta concurrente que aún no se confirmó.
      findByTransactionNumber: mockFn().mockResolvedValue(null),
      createTransaction: mockFn((_em: any, d: any) => ({ id: 't1', ...d })),
      createLedgerEntry: mockFn(),
      createAssignment: mockFn(),
    };
    const fiscalRepo = {
      findPeriodById: mockFn().mockResolvedValue({
        id: 'fp1',
        fiscalYearId: 'fy1',
        statusConceptId: ACCT.PERIOD_OPEN,
      }),
      findYearById: mockFn().mockResolvedValue({
        id: 'fy1',
        practiceId: 'p1',
      }),
    };
    const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
    const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
    const { scope } = buildScope({ journalRepo, fiscalRepo });
    const service = inTenant(
      new LedgerService(
        em as any,
        journalRepo as any,
        {} as any,
        auditTrail as any,
        { findActivePracticeIdsForPractitioner: mockFn() } as any,
        scope,
        logger as any,
      ),
    );
    return { service, journalRepo, auditTrail };
  }

  it('postJournal: la carrera sobre el mismo número en la práctica responde 409 catalogado, no error de base', async () => {
    const d = build();

    const error = await rejection(d.service.postJournal(body, actor));

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.reason).toBe(
      AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
    );
    expect(d.journalRepo.createLedgerEntry).not.toHaveBeenCalled();
    expect(d.auditTrail.record).not.toHaveBeenCalled();
  });

  it('postJournal: responde igual que el choque detectado por la lectura previa', async () => {
    const byRead = build();
    byRead.journalRepo.findByTransactionNumber.mockResolvedValue({ id: 'dup' });
    const byDatabase = build();

    const a = await rejection(byRead.service.postJournal(body, actor));
    const b = await rejection(byDatabase.service.postJournal(body, actor));

    expect(b.getResponse()).toEqual(a.getResponse());
  });

  it('la lectura previa busca el número dentro de la práctica del asiento', async () => {
    const d = build();

    await rejection(d.service.postJournal(body, actor));

    expect(d.journalRepo.findByTransactionNumber).toHaveBeenCalledWith(
      expect.anything(),
      'p1',
      'JT-1',
    );
  });

  it('createDraft: la carrera sobre el mismo número responde 409 catalogado', async () => {
    const d = build();

    const error = await rejection(d.service.createDraft(body, actor));

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.reason).toBe(
      AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
    );
    expect(d.journalRepo.createLedgerEntry).not.toHaveBeenCalled();
  });
});
