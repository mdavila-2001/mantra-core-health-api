import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrderSetsService } from './order-sets.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'md-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const orderSetsRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    findByCode: mockFn(),
    itemsBySet: mockFn(),
    create: mockFn(),
    createItem: mockFn(),
  };
  const serviceRequestsRepo = {
    create: mockFn((_tx: any, data: any) => ({
      id: `sr-${data.codeConceptId}`,
      ...data,
    })),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new OrderSetsService(
    em as any,
    orderSetsRepo,
    serviceRequestsRepo as any,
    logger as any,
  );
  return { service, tx, orderSetsRepo, serviceRequestsRepo };
}

describe('OrderSetsService', () => {
  describe('create', () => {
    it('creates the order set and its items, flushing parent first', async () => {
      const d = build();
      d.orderSetsRepo.findByCode.mockResolvedValue(null);
      d.orderSetsRepo.create.mockReturnValue({
        id: 'os1',
        code: 'OS1',
        version: 1,
        statusConceptId: CEXT.ORDER_SET_ACTIVE,
      });
      d.orderSetsRepo.createItem.mockImplementation((_tx: any, data: any) => ({
        id: 'i1',
        ...data,
      }));

      const res = await d.service.create(
        { code: 'OS1', name: 'Set', items: [{ codeConceptId: 'c1' }] },
        actor,
      );

      expect(res.itemCount).toBe(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('rejects a duplicated code (conflict)', async () => {
      const d = build();
      d.orderSetsRepo.findByCode.mockResolvedValue({ id: 'os0' });
      await expect(
        d.service.create(
          { code: 'OS1', name: 'Set', items: [{ codeConceptId: 'c1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('apply (UC-18-06)', () => {
    it('throws when the order set does not exist', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.apply(
          'os1',
          { encounterId: 'e1', patientProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fans out the default-selected items persisting a service request each', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue({
        id: 'os1',
        tenantId: 't1',
        statusConceptId: CEXT.ORDER_SET_ACTIVE,
      });
      d.orderSetsRepo.itemsBySet.mockResolvedValue([
        {
          id: 'i1',
          codeConceptId: 'c1',
          isSelectedDefault: true,
          defaultDoseText: '1',
          defaultFrequencyText: 'qd',
        },
        { id: 'i2', codeConceptId: 'c2', isSelectedDefault: false },
      ]);
      const res = await d.service.apply(
        'os1',
        { encounterId: 'e1', patientProfileId: 'p1' },
        actor,
      );
      expect(res.count).toBe(1);
      expect(res.appliedOrders[0].orderSetItemId).toBe('i1');
      expect(res.appliedOrders[0].serviceRequestId).toBe('sr-c1');
      expect(d.serviceRequestsRepo.create).toHaveBeenCalledTimes(1);
      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          encounterId: 'e1',
          codeConceptId: 'c1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('uses the DTO custodianTenantId over the order set tenant', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue({
        id: 'os1',
        tenantId: 't1',
        statusConceptId: CEXT.ORDER_SET_ACTIVE,
      });
      d.orderSetsRepo.itemsBySet.mockResolvedValue([
        { id: 'i1', codeConceptId: 'c1', isSelectedDefault: true },
      ]);
      await d.service.apply(
        'os1',
        { encounterId: 'e1', patientProfileId: 'p1', custodianTenantId: 't2' },
        actor,
      );
      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: 't2' }),
      );
    });

    it('rejects when no custodian tenant can be resolved (precondition)', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue({
        id: 'os1',
        statusConceptId: CEXT.ORDER_SET_ACTIVE,
      });
      d.orderSetsRepo.itemsBySet.mockResolvedValue([
        { id: 'i1', codeConceptId: 'c1', isSelectedDefault: true },
      ]);
      await expect(
        d.service.apply(
          'os1',
          { encounterId: 'e1', patientProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when no items are selected (precondition)', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue({
        id: 'os1',
        statusConceptId: CEXT.ORDER_SET_ACTIVE,
      });
      d.orderSetsRepo.itemsBySet.mockResolvedValue([
        { id: 'i1', codeConceptId: 'c1', isSelectedDefault: false },
      ]);
      await expect(
        d.service.apply(
          'os1',
          { encounterId: 'e1', patientProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
