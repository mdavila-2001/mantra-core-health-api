import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QuotationInstallments } from '../../billing/entities';
import { QuotationInstallmentsRepository } from './quotation-installments.repository';

/**
 * M4 · H3.S1.M3 — la lectura en lote que reemplaza al N+1 del listado.
 * Se aserta sobre lo que sale hacia el ORM: UNA consulta con `$in`.
 */
describe('QuotationInstallmentsRepository.findByQuotationIds', () => {
  it('pide las cuotas de todas las cotizaciones en una sola consulta, ordenadas', async () => {
    const em = { find: mockFn().mockResolvedValue([]) };

    await new QuotationInstallmentsRepository().findByQuotationIds(em as any, [
      'q-1',
      'q-2',
    ]);

    expect(em.find).toHaveBeenCalledTimes(1);
    expect(em.find).toHaveBeenCalledWith(
      QuotationInstallments,
      { quotationId: { $in: ['q-1', 'q-2'] } },
      { orderBy: { quotationId: 'ASC', installmentNumber: 'ASC' } },
    );
  });

  it('sin cotizaciones no va a la base', async () => {
    const em = { find: mockFn() };

    const res = await new QuotationInstallmentsRepository().findByQuotationIds(
      em as any,
      [],
    );

    expect(res).toEqual([]);
    expect(em.find).not.toHaveBeenCalled();
  });
});
