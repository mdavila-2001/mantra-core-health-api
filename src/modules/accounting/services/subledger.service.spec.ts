import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SubledgerService } from './subledger.service';
import { ACCT } from '../accounting.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const subledgerRepo = {
    findSubledgerById: mockFn(),
    findOpenItemById: mockFn(),
    createOpenItem: mockFn((_em: any, d: any) => ({
      id: 'oi1',
      statusConceptId: d.statusConceptId,
      outstandingAmount: d.outstandingAmount,
    })),
    findClearingByNumber: mockFn().mockResolvedValue(null),
    createClearingDocument: mockFn((_em: any, d: any) => ({
      id: 'cd1',
      clearingNumber: d.clearingNumber,
    })),
    createClearingItem: mockFn(),
  };
  const posting = {
    post: mockFn().mockResolvedValue({
      transactionId: 'tx1',
      entryIds: ['e1', 'e2'],
    }),
    generateNumber: mockFn(() => 'CLR-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new SubledgerService(
    em as any,
    subledgerRepo,
    posting as any,
    logger as any,
  );
  return { service, tx, subledgerRepo, posting };
}

describe('SubledgerService', () => {
  describe('createOpenItem (UC-16-08)', () => {
    it('lanza 404 si el subledger no existe', async () => {
      const d = build();
      d.subledgerRepo.findSubledgerById.mockResolvedValue(null);
      await expect(
        d.service.createOpenItem(
          {
            tenantId: 't',
            subledgerAccountId: 's',
            ledgerEntryId: 'e',
            documentType: 'INVOICE',
            originalAmount: '100.00',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('crea la partida abierta con estado ABIERTO', async () => {
      const d = build();
      d.subledgerRepo.findSubledgerById.mockResolvedValue({
        id: 's',
        reconciliationAccountId: 'rec',
      });
      const res = await d.service.createOpenItem(
        {
          tenantId: 't',
          subledgerAccountId: 's',
          ledgerEntryId: 'e',
          documentType: 'INVOICE',
          originalAmount: '100.00',
        } as any,
        actor,
      );
      expect(res.status).toBe(ACCT.OPEN_ITEM_OPEN);
      expect(res.outstandingAmount).toBe('100.00');
    });
  });

  describe('clearOpenItems (UC-16-09)', () => {
    const dto = {
      tenantId: 't',
      practiceId: 'p1',
      bankAccountId: 'bank',
      clearingDate: '2026-02-01',
      items: [{ openItemId: 'oi1', clearedAmount: '100.00' }],
    };

    it('lanza 404 si la partida no existe', async () => {
      const d = build();
      d.subledgerRepo.findOpenItemById.mockResolvedValue(null);
      await expect(
        d.service.clearOpenItems(dto as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza si el importe compensado excede lo pendiente', async () => {
      const d = build();
      d.subledgerRepo.findOpenItemById.mockResolvedValue({
        id: 'oi1',
        statusConceptId: ACCT.OPEN_ITEM_OPEN,
        subledgerAccountId: 's',
        outstandingAmount: '50.00',
      });
      await expect(
        d.service.clearOpenItems(dto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('compensa la partida y postea el asiento de banco', async () => {
      const d = build();
      const openItem = {
        id: 'oi1',
        statusConceptId: ACCT.OPEN_ITEM_OPEN,
        subledgerAccountId: 's',
        outstandingAmount: '100.00',
        updatedAt: new Date(),
      };
      d.subledgerRepo.findOpenItemById.mockResolvedValue(openItem);
      d.subledgerRepo.findSubledgerById.mockResolvedValue({
        id: 's',
        reconciliationAccountId: 'rec',
      });
      const res = await d.service.clearOpenItems(dto, actor);
      expect(res.clearedItems).toBe(1);
      expect(res.transactionId).toBe('tx1');
      expect(openItem.statusConceptId).toBe(ACCT.OPEN_ITEM_CLEARED);
    });
  });
});
