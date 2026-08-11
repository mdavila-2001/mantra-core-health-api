import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingCatalogService } from './scheduling-catalog.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SCHEDULING_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const RESOURCE = '22222222-2222-2222-2222-222222222222';

/**
 * Crea build catalog.
 * @returns Resultado de build catalog.
 */
function buildCatalog() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const catalogRepo = {
    createResource: mockFn(),
    findResourceById: mockFn(),
    createPolicy: mockFn(),
    findPolicyByCode: mockFn(),
    findPolicyById: mockFn(),
    createTemplate: mockFn(),
    findTemplateById: mockFn(),
    createRule: mockFn(),
    findRulesByTemplate: mockFn(),
    createException: mockFn(),
    createSlot: mockFn(),
    findSlotsByTemplateInRange: mockFn(),
    findSlotsByResourceInRange: mockFn().mockResolvedValue([]),
    findOpenSlotsInWindow: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SchedulingCatalogService(
    em as any,
    catalogRepo,
    logger as any,
  );
  return { service, tx, catalogRepo };
}

describe('SchedulingCatalogService', () => {
  /**
   * `resourceRefType` es texto libre, y dos clientes escribieron dos nombres
   * para la misma tabla. Quien cruza el recurso con un perfil profesional
   * —saber cuál agenda es la del médico que entró, poner el profesional en la
   * cita clínica— compara tabla e identificador, y con dos nombres en
   * circulación la mitad de los recursos no coincidía con ninguno.
   */
  describe('createResource · nombre canónico de la tabla', () => {
    const base = {
      tenantId: TENANT,
      resourceType: 'PRACTITIONER' as const,
      resourceRefId: 'hp-1',
      name: 'Consultorio 1',
    };

    it('colapsa el alias `practitioner_profiles` al nombre real de la tabla', async () => {
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...base, resourceRefType: 'practitioner_profiles' } as never,
        { id: 'u-1' } as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          resourceRefType: 'health_practitioner_profiles',
        }),
      );
    });

    it('el nombre canónico pasa tal cual', async () => {
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...base, resourceRefType: 'health_practitioner_profiles' } as never,
        { id: 'u-1' } as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          resourceRefType: 'health_practitioner_profiles',
        }),
      );
    });

    /** Una sala no es un alias de nada: lo que no está en la tabla no se toca. */
    it('deja intactos los tipos que no son alias', async () => {
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...base, resourceType: 'ROOM', resourceRefType: 'care_spaces' } as never,
        { id: 'u-1' } as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ resourceRefType: 'care_spaces' }),
      );
    });
  });

  describe('createPolicy (UC-41-01)', () => {
    const dto = { tenantId: TENANT, code: 'STD', name: 'Estándar' };

    it('creates the policy when the code is free', async () => {
      const d = buildCatalog();
      d.catalogRepo.findPolicyByCode.mockResolvedValue(null);
      d.catalogRepo.createPolicy.mockReturnValue({ id: 'pol-1' });

      const res = await d.service.createPolicy(dto, actor);

      expect(res.code).toBe('STD');
    });

    it('rejects a duplicate policy code within the tenant', async () => {
      const d = buildCatalog();
      d.catalogRepo.findPolicyByCode.mockResolvedValue({ id: 'pol-existing' });

      await expect(
        d.service.createPolicy(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createTemplate (UC-41-02)', () => {
    const dto = {
      name: 'Mañanas',
      rules: [{ dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00' }],
    };

    it('publishes the template with its rules', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createTemplate.mockReturnValue({ id: 'tpl-1' });

      const res = await d.service.createTemplate(RESOURCE, dto, actor);

      expect(res.ruleCount).toBe(1);
      expect(res.statusConceptId).toBe(CONCEPTS.TEMPLATE_PUBLISHED);
      expect(d.catalogRepo.createRule).toHaveBeenCalledTimes(1);
    });

    it('rejects a rule that ends before it starts', async () => {
      const d = buildCatalog();

      await expect(
        d.service.createTemplate(
          RESOURCE,
          {
            ...dto,
            rules: [
              { dayOfWeek: 1, startTime: '12:00:00', endTime: '08:00:00' },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the resource does not exist', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue(null);

      await expect(
        d.service.createTemplate(RESOURCE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('generateSlots (UC-41-03)', () => {
    it('materialises one slot per interval of the rule', async () => {
      const d = buildCatalog();
      // Lunes 2026-06-01, franja 08:00–10:00 en tramos de 30' => 4 slots.
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 30,
      });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([
        {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '10:00:00',
          slotMinutes: 30,
          capacityPerSlot: 1,
        },
      ]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

      const res = await d.service.generateSlots(
        'tpl-1',
        { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
        actor,
      );

      expect(res.created).toBe(4);
      expect(res.skipped).toBe(0);
    });

    it('is idempotent: existing slots are skipped, not duplicated', async () => {
      const d = buildCatalog();
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 60,
      });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([
        {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '10:00:00',
          slotMinutes: 60,
          capacityPerSlot: 1,
        },
      ]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([
        { startAt: new Date('2026-06-01T08:00:00Z') },
      ]);

      const res = await d.service.generateSlots(
        'tpl-1',
        { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
        actor,
      );

      expect(res.created).toBe(1);
      expect(res.skipped).toBe(1);
    });

    it('rejects an inverted window', async () => {
      const d = buildCatalog();

      await expect(
        d.service.generateSlots(
          'tpl-1',
          { from: '2026-06-02T00:00:00Z', to: '2026-06-01T00:00:00Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createException (UC-41-04)', () => {
    const dto = {
      exceptionType: 'ABSENCE' as const,
      startAt: '2026-06-01T08:00:00Z',
      endAt: '2026-06-01T12:00:00Z',
    };

    it('blocks the untouched free slots that overlap the absence', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });
      const free = {
        capacity: 1,
        remainingCapacity: 1,
        statusConceptId: CONCEPTS.SLOT_OPEN,
      };
      d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([free]);

      const res = await d.service.createException(RESOURCE, dto, actor);

      expect(res.blockedSlots).toBe(1);
      expect(free.statusConceptId).toBe(CONCEPTS.SLOT_BLOCKED);
    });

    it('leaves slots that already have bookings untouched', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });
      const taken = {
        capacity: 2,
        remainingCapacity: 1,
        statusConceptId: CONCEPTS.SLOT_OPEN,
      };
      d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([taken]);

      const res = await d.service.createException(RESOURCE, dto, actor);

      expect(res.blockedSlots).toBe(0);
      expect(taken.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
    });

    it('does not block anything when the exception adds availability', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });

      const res = await d.service.createException(
        RESOURCE,
        { ...dto, exceptionType: 'EXTRA', isAvailable: true },
        actor,
      );

      expect(res.blockedSlots).toBe(0);
      expect(d.catalogRepo.findOpenSlotsInWindow).not.toHaveBeenCalled();
    });
  });
});
