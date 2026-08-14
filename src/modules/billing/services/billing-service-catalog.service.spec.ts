import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BillingServiceCatalogService } from './billing-service-catalog.service';
import { ConflictException, encodeKeysetCursor } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: mockFn().mockReturnValue({}),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const serviceCatalogRepo = {
    findByCode: mockFn(),
    create: mockFn(),
    searchPage: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new BillingServiceCatalogService(
    em as any,
    serviceCatalogRepo as any,
    logger as any,
  );
  return { service, tx, em, serviceCatalogRepo };
}

const item = {
  id: 's1',
  practiceId: 'pr1',
  code: 'CONS-01',
  name: 'Consulta general',
  defaultPrice: '100.00',
  isActive: true,
};

describe('BillingServiceCatalogService', () => {
  describe('search', () => {
    it('returns a page with nextCursor null when there is no extra row', async () => {
      const d = build();
      d.serviceCatalogRepo.searchPage.mockResolvedValue([item]);

      const res = await d.service.search({ practiceId: 'pr1', limit: 50 });

      expect(res).toEqual({
        items: [item],
        count: 1,
        limit: 50,
        nextCursor: null,
      });
      expect(d.serviceCatalogRepo.searchPage).toHaveBeenCalledWith(
        expect.anything(),
        {
          practiceId: 'pr1',
          query: undefined,
          isActive: undefined,
          afterCode: undefined,
        },
        51,
      );
    });

    it('returns an encoded nextCursor when there is an extra row', async () => {
      const d = build();
      const second = { ...item, id: 's2', code: 'CONS-02' };
      d.serviceCatalogRepo.searchPage.mockResolvedValue([item, second]);

      const res = await d.service.search({ practiceId: 'pr1', limit: 1 });

      expect(res.items).toEqual([item]);
      expect(res.nextCursor).toBe(encodeKeysetCursor({ code: item.code }));
    });

    it('decodes the cursor into afterCode', async () => {
      const d = build();
      d.serviceCatalogRepo.searchPage.mockResolvedValue([]);
      const cursor = encodeKeysetCursor({ code: 'CONS-01' });

      await d.service.search({ practiceId: 'pr1', cursor, limit: 50 });

      expect(d.serviceCatalogRepo.searchPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ afterCode: 'CONS-01' }),
        51,
      );
    });
  });

  describe('create', () => {
    it('creates the item when the code is free', async () => {
      const d = build();
      d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
      d.serviceCatalogRepo.create.mockReturnValue(item);

      const res = await d.service.create(
        {
          practiceId: 'pr1',
          code: 'CONS-01',
          name: 'Consulta general',
          defaultPrice: '100.00',
        },
        actor,
      );

      expect(res).toEqual(item);
      expect(d.serviceCatalogRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'pr1',
          code: 'CONS-01',
          isActive: true,
          actorUserId: actor.id,
        }),
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects a duplicate code within the same practice', async () => {
      const d = build();
      d.serviceCatalogRepo.findByCode.mockResolvedValue(item);

      await expect(
        d.service.create(
          {
            practiceId: 'pr1',
            code: 'CONS-01',
            name: 'Consulta general',
            defaultPrice: '100.00',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
    });
  });
});
