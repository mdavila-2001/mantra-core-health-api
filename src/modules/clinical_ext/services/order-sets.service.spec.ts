import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { OrderSetsService } from './order-sets.service';
import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { ACTIVE_TENANT, inTenant, thrown } from './clinical-ext-tenant.testing';

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
  const encountersRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'e1',
      patientProfileId: 'p1',
      tenantId: ACTIVE_TENANT,
    }),
  };
  const clinicalRead = {
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const raw = new OrderSetsService(
    em as any,
    orderSetsRepo,
    serviceRequestsRepo as any,
    encountersRepo as any,
    clinicalRead as any,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    tx,
    orderSetsRepo,
    serviceRequestsRepo,
    encountersRepo,
    clinicalRead,
  };
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
    const body = { encounterId: 'e1', patientProfileId: 'p1' } as any;
    const activeSet = (extra: object = {}) => ({
      id: 'os1',
      tenantId: ACTIVE_TENANT,
      statusConceptId: CEXT.ORDER_SET_ACTIVE,
      ...extra,
    });
    const oneDefaultItem = [
      {
        id: 'i1',
        codeConceptId: 'c1',
        isSelectedDefault: true,
        defaultDoseText: '1',
        defaultFrequencyText: 'qd',
      },
      { id: 'i2', codeConceptId: 'c2', isSelectedDefault: false },
    ];

    it('throws when the order set does not exist', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue(null);
      await expect(d.service.apply('os1', body, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('fans out the default-selected items persisting a service request each', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue(activeSet());
      d.orderSetsRepo.itemsBySet.mockResolvedValue(oneDefaultItem);
      const res = await d.service.apply('os1', body, actor);
      expect(res.count).toBe(1);
      expect(res.appliedOrders[0].orderSetItemId).toBe('i1');
      expect(res.appliedOrders[0].serviceRequestId).toBe('sr-c1');
      expect(d.serviceRequestsRepo.create).toHaveBeenCalledTimes(1);
      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          custodianTenantId: ACTIVE_TENANT,
          patientProfileId: 'p1',
          encounterId: 'e1',
          codeConceptId: 'c1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('el tenant custodio sale del encuentro autorizado, no de la plantilla', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue(
        activeSet({ tenantId: undefined }),
      );
      d.orderSetsRepo.itemsBySet.mockResolvedValue(oneDefaultItem);
      await d.service.apply('os1', body, actor);
      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: ACTIVE_TENANT }),
      );
    });

    it('rejects when no items are selected (precondition)', async () => {
      const d = build();
      d.orderSetsRepo.findById.mockResolvedValue(activeSet());
      d.orderSetsRepo.itemsBySet.mockResolvedValue([
        { id: 'i1', codeConceptId: 'c1', isSelectedDefault: false },
      ]);
      await expect(d.service.apply('os1', body, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    describe('autorización (AUTHZ-T02)', () => {
      it('paciente ajeno: 403 antes de leer encuentro, plantilla o ítems, y sin órdenes', async () => {
        const d = build();
        d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
          new ForbiddenException('sin acceso'),
        );
        await expect(
          d.service.apply('os1', body, actor),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
          'p1',
          actor,
        );
        expect(d.encountersRepo.findById).not.toHaveBeenCalled();
        expect(d.orderSetsRepo.itemsBySet).not.toHaveBeenCalled();
        expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
      });

      it.each([
        [
          'encuentro de otro paciente',
          { id: 'e1', patientProfileId: 'p-otro', tenantId: ACTIVE_TENANT },
        ],
        [
          'encuentro de otro tenant',
          { id: 'e1', patientProfileId: 'p1', tenantId: 'ten-otro' },
        ],
      ])(
        '%s: 404 idéntico al de encuentro inexistente y sin órdenes',
        async (_label, encounter) => {
          const d = build();
          d.encountersRepo.findById.mockResolvedValue(null);
          const missing = await thrown(d.service.apply('os1', body, actor));
          d.encountersRepo.findById.mockResolvedValue(encounter);
          const crossed = await thrown(d.service.apply('os1', body, actor));
          expect(crossed).toBeInstanceOf(ResourceNotFoundException);
          expect(crossed.getResponse()).toEqual(missing.getResponse());
          expect(crossed.reason).toBe(
            ClinicalExtErrorReason.ENCOUNTER_NOT_FOUND,
          );
          expect(crossed.details).toBeUndefined();
          expect(d.orderSetsRepo.itemsBySet).not.toHaveBeenCalled();
          expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
        },
      );

      it('plantilla de otro tenant: 404 idéntico al de plantilla inexistente', async () => {
        const d = build();
        d.orderSetsRepo.findById.mockResolvedValue(null);
        const missing = await thrown(d.service.apply('os1', body, actor));
        d.orderSetsRepo.findById.mockResolvedValue(
          activeSet({ tenantId: 'ten-otro' }),
        );
        const foreign = await thrown(d.service.apply('os1', body, actor));
        expect(foreign).toBeInstanceOf(ResourceNotFoundException);
        expect(foreign.getResponse()).toEqual(missing.getResponse());
        expect(foreign.reason).toBe(ClinicalExtErrorReason.ORDER_SET_NOT_FOUND);
        expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
      });

      it('custodianTenantId del cuerpo distinto del activo: 403 y sin órdenes', async () => {
        const d = build();
        const err = await thrown(
          d.service.apply(
            'os1',
            { ...body, custodianTenantId: 'ten-otro' },
            actor,
          ),
        );
        expect(err.getStatus()).toBe(403);
        expect(err.reason).toBe(
          ClinicalExtErrorReason.CLINICAL_EXT_TENANT_SCOPE_REQUIRED,
        );
        expect(d.clinicalRead.assertCanWriteHistory).not.toHaveBeenCalled();
        expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
      });

      it('custodianTenantId del cuerpo igual al activo se acepta', async () => {
        const d = build();
        d.orderSetsRepo.findById.mockResolvedValue(activeSet());
        d.orderSetsRepo.itemsBySet.mockResolvedValue(oneDefaultItem);
        const res = await d.service.apply(
          'os1',
          { ...body, custodianTenantId: ACTIVE_TENANT },
          actor,
        );
        expect(res.count).toBe(1);
      });

      it('sin tenant en el contexto falla antes de tocar nada', async () => {
        const d = build();
        await expect(d.raw.apply('os1', body, actor)).rejects.toBeInstanceOf(
          PreconditionFailedException,
        );
        expect(d.clinicalRead.assertCanWriteHistory).not.toHaveBeenCalled();
      });
    });
  });
});
