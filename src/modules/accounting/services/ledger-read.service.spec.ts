import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LedgerReadService } from './ledger-read.service';
import { ACCT } from '../accounting.concepts';

/**
 * Las lecturas del mayor. Lo que estas pruebas fijan, y que un refactor rompería
 * dejando un informe que *parece* bien:
 *
 * 1. **El balance sólo agrega lo POSTEADO.** Un borrador no es un hecho
 *    contable; incluirlo daría un balance que no coincide con los libros.
 * 2. **El saldo lleva el signo de la naturaleza de la cuenta.** Un pasivo
 *    correcto sale positivo, no negativo.
 * 3. **El dinero no se suma en coma flotante.** `0.1 + 0.2` no da `0.3`, y un
 *    balance descuadrado por un céntimo no se distingue de uno con un error real.
 */

const PRACTICE = 'prac-1';

function build() {
  const tx = {};
  const em = { fork: mockFn(() => tx) };
  const journalRepo = {
    findTransactions: mockFn(() => Promise.resolve([])),
    findTransactionById: mockFn(() => Promise.resolve(null)),
    findEntriesByTransaction: mockFn(() => Promise.resolve([])),
    findEntriesByTransactions: mockFn(() => Promise.resolve([])),
  };
  const accountsRepo = { findByPractice: mockFn(() => Promise.resolve([])) };

  const service = new LedgerReadService(
    em as any,
    journalRepo as any,
    accountsRepo as any,
  );
  return { service, journalRepo, accountsRepo };
}

/** Una cuenta con su naturaleza: es lo que da signo al saldo. */
function cuenta(id: string, code: string, deudora = true) {
  return {
    id,
    code,
    name: `Cuenta ${code}`,
    accountTypeConceptId: 'tipo',
    normalBalanceConceptId: deudora
      ? ACCT.DIRECTION_DEBIT
      : ACCT.DIRECTION_CREDIT,
  };
}

function linea(accountId: string, debe: boolean, amountBase: string) {
  return {
    id: `l-${accountId}-${amountBase}`,
    transactionId: 't-1',
    accountId,
    directionConceptId: debe ? ACCT.DIRECTION_DEBIT : ACCT.DIRECTION_CREDIT,
    amountBase,
  };
}

describe('LedgerReadService', () => {
  describe('trialBalance (UC-16-06)', () => {
    it('un asiento balanceado deja el conjunto cuadrado', async () => {
      const d = build();
      d.journalRepo.findTransactions.mockResolvedValue([{ id: 't-1' }]);
      d.accountsRepo.findByPractice.mockResolvedValue([
        cuenta('gasto', '5.1.01', true),
        cuenta('pagar', '2.1.01', false),
      ]);
      d.journalRepo.findEntriesByTransactions.mockResolvedValue([
        linea('gasto', true, '100.00'),
        linea('pagar', false, '100.00'),
      ]);

      const res = await d.service.trialBalance({ practiceId: PRACTICE });

      expect(res.balanced).toBe(true);
      expect(res.totalDebit).toBe('100.00');
      expect(res.totalCredit).toBe('100.00');
    });

    /**
     * El caso que justifica que `balanced` exista: si el informe no lo dijera,
     * habría que sumar dos columnas a ojo para saber si sirve.
     */
    it('un conjunto descuadrado lo declara, no lo esconde', async () => {
      const d = build();
      d.journalRepo.findTransactions.mockResolvedValue([{ id: 't-1' }]);
      d.accountsRepo.findByPractice.mockResolvedValue([
        cuenta('gasto', '5.1.01', true),
        cuenta('pagar', '2.1.01', false),
      ]);
      d.journalRepo.findEntriesByTransactions.mockResolvedValue([
        linea('gasto', true, '100.00'),
        linea('pagar', false, '90.00'),
      ]);

      const res = await d.service.trialBalance({ practiceId: PRACTICE });

      expect(res.balanced).toBe(false);
      expect(res.totalDebit).toBe('100.00');
      expect(res.totalCredit).toBe('90.00');
    });

    /** Un pasivo con saldo correcto es positivo: su naturaleza es acreedora. */
    it('el saldo lleva el signo de la naturaleza de la cuenta', async () => {
      const d = build();
      d.journalRepo.findTransactions.mockResolvedValue([{ id: 't-1' }]);
      d.accountsRepo.findByPractice.mockResolvedValue([
        cuenta('banco', '1.1.01', true),
        cuenta('pagar', '2.1.01', false),
      ]);
      d.journalRepo.findEntriesByTransactions.mockResolvedValue([
        linea('banco', true, '250.00'),
        linea('pagar', false, '250.00'),
      ]);

      const res = await d.service.trialBalance({ practiceId: PRACTICE });
      const banco = res.items.find((i) => i.accountId === 'banco');
      const pagar = res.items.find((i) => i.accountId === 'pagar');

      expect(banco?.balance).toBe('250.00');
      // Acreedora: haber − debe. Si se calculara siempre debe − haber, saldría
      // «-250.00» y un pasivo correcto parecería un error.
      expect(pagar?.balance).toBe('250.00');
    });

    /**
     * `0.1 + 0.2 !== 0.3` en coma flotante. Con céntimos enteros, tres apuntes
     * de un décimo cuadran contra uno de treinta.
     */
    it('suma en céntimos enteros: no arrastra error de coma flotante', async () => {
      const d = build();
      d.journalRepo.findTransactions.mockResolvedValue([{ id: 't-1' }]);
      d.accountsRepo.findByPractice.mockResolvedValue([
        cuenta('a', '1.1.01', true),
        cuenta('b', '2.1.01', false),
      ]);
      d.journalRepo.findEntriesByTransactions.mockResolvedValue([
        linea('a', true, '0.10'),
        linea('a', true, '0.20'),
        linea('b', false, '0.30'),
      ]);

      const res = await d.service.trialBalance({ practiceId: PRACTICE });

      expect(res.totalDebit).toBe('0.30');
      expect(res.balanced).toBe(true);
    });

    /** Un borrador no es un hecho contable: el balance pide sólo POSTEADO. */
    it('agrega únicamente los asientos posteados', async () => {
      const d = build();

      await d.service.trialBalance({ practiceId: PRACTICE });

      expect(d.journalRepo.findTransactions).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statusConceptId: ACCT.TXN_POSTED }),
        expect.any(Number),
      );
    });

    /** Un balance recortado en silencio es un balance que miente. */
    it('declara el recorte cuando alcanza el tope', async () => {
      const d = build();
      d.journalRepo.findTransactions.mockResolvedValue(
        Array.from({ length: 10_000 }, (_, i) => ({ id: `t-${i}` })),
      );

      const res = await d.service.trialBalance({ practiceId: PRACTICE });

      expect(res.truncated).toBe(true);
    });
  });

  describe('listJournal (UC-16-01·L)', () => {
    it('no manda los filtros que no se pidieron', async () => {
      const d = build();

      await d.service.listJournal({ practiceId: PRACTICE });

      expect(d.journalRepo.findTransactions).toHaveBeenCalledWith(
        expect.anything(),
        { practiceId: PRACTICE },
        100,
      );
    });

    it('convierte la ventana a fechas', async () => {
      const d = build();

      await d.service.listJournal({
        practiceId: PRACTICE,
        from: '2026-01-01',
        to: '2026-01-31',
      });

      const filtros = d.journalRepo.findTransactions.mock.calls[0][1];
      expect(filtros.from).toBeInstanceOf(Date);
      expect(filtros.to).toBeInstanceOf(Date);
    });
  });

  describe('getJournalTransaction (UC-16-01·D)', () => {
    it('un asiento inexistente no se inventa', async () => {
      const d = build();

      await expect(d.service.getJournalTransaction('t-404')).rejects.toThrow();
    });

    it('devuelve el asiento con sus líneas', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't-1',
        practiceId: PRACTICE,
        transactionDate: new Date('2026-01-31'),
        statusConceptId: ACCT.TXN_POSTED,
      });
      d.journalRepo.findEntriesByTransaction.mockResolvedValue([
        linea('gasto', true, '100.00'),
        linea('pagar', false, '100.00'),
      ]);

      const res = await d.service.getJournalTransaction('t-1');

      expect(res.lines).toHaveLength(2);
      expect(res.lines[0]?.amountBase).toBe('100.00');
    });
  });
});
